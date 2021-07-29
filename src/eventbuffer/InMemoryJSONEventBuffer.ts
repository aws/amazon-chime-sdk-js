// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Destroyable from '../destroyable/Destroyable';
import EventBufferConfiguration from '../eventbufferconfiguration/EventBufferConfiguration';
import MeetingHistoryState from '../eventcontroller/MeetingHistoryState';
import EventData from '../eventreporter/EventData';
import EventsIngestionMetadata from '../eventreporter/EventsIngestionMetadata';
import EventsClientConfiguration from '../eventsclientconfiguration/EventsClientConfiguration';
import Logger from '../logger/Logger';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import DefaultUserAgentParser from '../useragentparser/DefaultUserAgentParser';
import EventBuffer from './EventBuffer';
import JSONIngestionEvent from './JSONIngestionEvent';
import JSONIngestionPayloadItem from './JSONIngestionPayloadItem';
import JSONIngestionRecord from './JSONIngestionRecord';

/**
 * [[InMemoryJSONEventBuffer]] is an in-memory implementation for buffering and
 * sending events. It buffers events based on number of events and its size whichever reaches
 * first. Events are sent out at an scheduled interval where important events are sent immediately.
 * It also retries sending events if failed upto the retry count limit. It implements
 * beaconing mechanism based on 'pagehide' and 'visilitychange' to beacon all events as a last attempt.
 */
export default class InMemoryJSONEventBuffer implements EventBuffer<EventData>, Destroyable {
  private static readonly SENDING_FAILURE_CODES = new Set([
    408, // Request timeout.
    429, // Too many requests.
    500, // Internal server error.
    502, // Bad Gateway.
    503, // Service Unavailable.
    504, // Gateway Timeout.
  ]);
  private static readonly RETRY_SHORT_BACKOFF_MS = 1000;
  private static readonly RETRY_LONG_BACKOFF_MS = 5000;
  private static readonly MAX_PAYLOAD_ITEMS = 2;
  private static readonly MAX_ITEM_SIZE_BYTES_ALLOWED = 3000;
  private maxBufferCapacityBytes: number;
  private totalBufferItems: number;
  private buffer: JSONIngestionEvent[] = [];
  private bufferSize = 0;
  private maxBufferItemCapacityBytes = 0;
  private currentIngestionEvent: JSONIngestionEvent;
  private ingestionEventSize = 0;
  private logger: Logger;
  private flushIntervalMs: number = 0;
  private flushSize: number = 0;
  private intervalScheduler: IntervalScheduler;
  private failedIngestionEvents: JSONIngestionEvent[] = [];
  private retryCountLimit = 15;
  private ingestionURL: string;
  private lock: boolean = false;
  private metadata: EventsIngestionMetadata;
  private type: string;
  private v: number;
  private beaconEventListener: undefined | ((e: Event) => void);
  private cancellableEvents = new Map<number, JSONIngestionEvent[]>();
  private importantEvents: Set<MeetingHistoryState>;
  private authenticationToken: string;
  private attributesToFilter = ['externalUserId', 'externalMeetingId', 'timestampMs'];

  constructor(
    eventBufferConfiguration: EventBufferConfiguration,
    eventsClientConfiguration: EventsClientConfiguration,
    ingestionURL: string,
    importantEvents: MeetingHistoryState[],
    logger: Logger
  ) {
    const userAgentParserResult = new DefaultUserAgentParser(logger).getParserResult();
    const { browserMajorVersion: _browserMajorVersion, ...clientMetadata } = userAgentParserResult;
    const { type, v, ...rest } = eventsClientConfiguration.toJSON();
    this.authenticationToken = eventsClientConfiguration.getAuthenticationToken();
    this.metadata = { ...clientMetadata, ...rest };
    Object.keys(this.metadata).forEach(key => this.attributesToFilter.push(key));
    this.type = type;
    this.v = v;
    this.ingestionURL = ingestionURL;
    this.logger = logger;
    this.importantEvents = new Set<MeetingHistoryState>(importantEvents);
    const {
      maxBufferCapacityKb,
      totalBufferItems,
      flushSize,
      flushIntervalMs,
      retryCountLimit,
    } = eventBufferConfiguration;
    this.maxBufferCapacityBytes = maxBufferCapacityKb * 1024;
    this.totalBufferItems = totalBufferItems;
    this.maxBufferItemCapacityBytes = Math.round(this.maxBufferCapacityBytes / totalBufferItems);
    this.flushIntervalMs = flushIntervalMs;
    this.flushSize = flushSize;
    this.retryCountLimit = retryCountLimit;
    this.currentIngestionEvent = this.initializeAndGetCurrentIngestionEvent();
    this.beaconEventListener = (e: Event) => this.beaconEventHandler(e);
    this.addEventListeners();
  }

  private addEventListeners(): void {
    if (
      !this.beaconEventListener ||
      !('window' in global) ||
      !window.addEventListener ||
      !('document' in global) ||
      !document.addEventListener
    ) {
      return;
    }
    this.logger.debug(
      `Event Reporting - InMemoryJSONEventBuffer - addEventListeners - adding pagehide and visibility change event listeners`
    );
    window.addEventListener('pagehide', this.beaconEventListener);
    document.addEventListener('visibilitychange', this.beaconEventListener);
  }

  private beaconEventHandler(e: Event): void {
    /* istanbul ignore else */
    if (
      (e.type === 'visibilitychange' && document.visibilityState === 'hidden') ||
      e.type === 'pagehide'
    ) {
      this.logger.debug(
        `Event Reporting - InMemoryJSONEventBuffer - beaconEventHandler is triggered calling sendBeacon`
      );
      this.sendBeacon();
    }
  }

  private removeEventListeners(): void {
    if (
      !this.beaconEventListener ||
      !('window' in global) ||
      !window.removeEventListener ||
      !('document' in global) ||
      !document.removeEventListener
    ) {
      return;
    }
    window.removeEventListener('pagehide', this.beaconEventListener);
    document.removeEventListener('visibilitychange', this.beaconEventListener);
    this.logger.debug(
      `Event Reporting - InMemoryJSONEventBuffer - removeEventListeners - removing pagehide and visibility change event listeners`
    );
  }

  start(): void {
    this.removeEventListeners();
    this.addEventListeners();
    this.intervalScheduler?.stop();
    this.intervalScheduler = new IntervalScheduler(this.flushIntervalMs);
    this.intervalScheduler.start(() => this.sendEvents());
  }

  stop(): void {
    this.intervalScheduler?.stop();
    this.intervalScheduler = undefined;
    this.sendBeacon();
    this.removeEventListeners();
  }

  async addItem(item: EventData): Promise<void> {
    this.logger.debug(
      `Event Reporting - InMemoryJSONEventBuffer - addItem - received event ${JSON.stringify(item)}`
    );
    const { name, ts, attributes } = item;
    // Filter out PII and redundant attributes.
    const filteredAttributes =
      attributes && this.filterAttributes(attributes, this.attributesToFilter);

    const event = { name, ts, ...filteredAttributes };
    this.logger.debug(
      `Event Reporting - InMemoryJSONEventBuffer - addItem - event after filtering attributes ${JSON.stringify(
        event
      )}`
    );
    const size = this.getSize(event);
    if (size > InMemoryJSONEventBuffer.MAX_ITEM_SIZE_BYTES_ALLOWED) {
      throw new Error(
        `Event Reporting - Item to be added has size ${size} bytes. Item cannot exceed max item size allowed of ${InMemoryJSONEventBuffer.MAX_ITEM_SIZE_BYTES_ALLOWED} bytes.`
      );
    }
    if (this.importantEvents.has(name)) {
      // Send immediate events and asyncly retry.
      this.logger.debug(
        `Event Reporting - InMemoryJSONEventBuffer - addItem - sending important event ${JSON.stringify(
          event
        )}`
      );
      this.sendEventImmediately({ name, ts, attributes: filteredAttributes });
      return;
    }

    if (this.isFull()) {
      this.logger.warn('Event Reporting - Event buffer is full');
      throw new Error('Buffer full');
    }
    this.currentIngestionEvent.payloads.push(event);
    this.ingestionEventSize += size;
    if (this.bufferItemThresholdReached(size)) {
      const currentEvent = this.deepCopyCurrentIngestionEvent(this.currentIngestionEvent);
      this.buffer.push(currentEvent);
      this.bufferSize += this.ingestionEventSize;
      this.currentIngestionEvent = this.initializeAndGetCurrentIngestionEvent();
      this.logger.debug(
        `Event Reporting - InMemoryJSONEventBuffer - addItem - buffer item threshold reached updated buffer ${JSON.stringify(
          this.buffer
        )}`
      );
    }
  }

  private filterAttributes(
    attributes: { [key: string]: string | number },
    attributesToFilter: string[]
  ): { [key: string]: string | number } {
    const attributesToFilterSet = new Set<string>(attributesToFilter);
    const keysToFilterOut = Object.keys(attributes).filter(key => attributesToFilterSet.has(key));
    keysToFilterOut.forEach(key => delete attributes[key]);
    return attributes;
  }

  private initializeAndGetCurrentIngestionEvent(): JSONIngestionEvent {
    const bufferItem = {
      type: this.type,
      v: this.v,
      payloads: [] as JSONIngestionPayloadItem[],
    };
    this.ingestionEventSize = this.getSize(bufferItem);
    return bufferItem;
  }

  private deepCopyCurrentIngestionEvent = (event: JSONIngestionEvent): JSONIngestionEvent => {
    const newEvent: JSONIngestionEvent = {
      type: event.type,
      v: event.v,
      payloads: [...event.payloads],
    };
    return newEvent;
  };

  private bufferItemThresholdReached(size: number): boolean {
    return (
      size + this.ingestionEventSize >= this.maxBufferItemCapacityBytes ||
      this.currentIngestionEvent.payloads.length === InMemoryJSONEventBuffer.MAX_PAYLOAD_ITEMS
    );
  }

  private getSize(item: object | string | number): number {
    let bytes = 0;
    if (typeof item === 'object') {
      for (const [key, value] of Object.entries(item)) {
        bytes += this.getPrimitiveSize(key);
        bytes += this.getSize(value);
      }
    } else {
      bytes += this.getPrimitiveSize(item);
    }
    return bytes;
  }

  private getPrimitiveSize(item: string | number): number {
    let bytes = 0;
    /* istanbul ignore else */
    if (typeof item === 'string') {
      bytes += item.length * 2;
    } else if (typeof item === 'number') {
      bytes += 8;
    }
    return bytes;
  }

  private isFull(): boolean {
    return (
      this.bufferSize === this.maxBufferCapacityBytes ||
      this.buffer.length === this.totalBufferItems
    );
  }

  private isEmpty(): boolean {
    return this.buffer.length === 0 || this.bufferSize === 0;
  }

  private getItems(end: number, start: number = 0): JSONIngestionEvent[] {
    if (this.isEmpty()) {
      return [];
    }
    end = Math.min(this.buffer.length, end + 1);
    const items = this.buffer.splice(start, end);
    return items;
  }

  private sendEvents = async (): Promise<void> => {
    if (this.lock) {
      return;
    }
    const batch: JSONIngestionEvent[] = this.getItems(this.flushSize);
    if (batch.length === 0) {
      return;
    }
    this.lock = true;
    const body = this.makeRequestBody(batch);
    let failed = false;

    // If a page re-directs, in Safari and Chrome, the network
    // request shows cancelled but the data reaches the ingestion endpoint.
    // In Firefox, the request errors out with 'NS_BINDING_ABORT' state. Hence, add the event
    // to cancellable events to try with `sendBeacon` lastly.
    const timestamp = Date.now();
    if (this.metadata.browserName.toLowerCase() === 'firefox') {
      this.cancellableEvents.set(timestamp, batch);
    }

    try {
      this.logger.debug(
        `Event Reporting - InMemoryJSONEventBuffer - sendEvents - sending body ${body}`
      );
      const response = await this.send(body);
      this.cancellableEvents.delete(timestamp);
      if (!response.ok) {
        this.logger.error(
          `Event Reporting - InMemoryJSONEventBuffer - sendEvents - Failed to send events ${body} with response status ${response.status}`
        );
        failed = true;
      } else {
        try {
          const data = await response.json();
          this.logger.debug(
            `Event Reporting - InMemoryJSONEventBuffer - sendEvents - send successful events: ${body} message: ${JSON.stringify(
              data
            )}`
          );
        } catch (err) {
          /* istanbul ignore next */
          this.logger.warn(
            `Event Reporting - InMemoryJSONEventBuffer - sendEvents error reading OK response ${err} for events ${body}`
          );
        }
      }
    } catch (error) {
      failed = true;
      this.logger.warn(
        `Event Reporting - InMemoryJSONEventBuffer - sendEvents - Error in sending events ${body} to the ingestion endpoint ${error}`
      );
    } finally {
      this.lock = false;
    }

    if (failed) {
      this.cancellableEvents.delete(timestamp);
      this.failedIngestionEvents.push(...batch);
    }
  };

  private makeBeaconRequestBody(batchEvents: JSONIngestionEvent[]): string {
    const ingestionRecord: JSONIngestionRecord = {
      metadata: this.metadata,
      events: batchEvents,
      authorization: this.authenticationToken,
    };
    return JSON.stringify(ingestionRecord);
  }

  private makeRequestBody(batchEvents: JSONIngestionEvent[]): string {
    const ingestionRecord: JSONIngestionRecord = {
      metadata: this.metadata,
      events: batchEvents,
    };
    return JSON.stringify(ingestionRecord);
  }

  private async sendEventImmediately(item: EventData): Promise<void> {
    this.logger.debug(
      `Event Reporting - InMemoryJSONEventBuffer - sendEventImmediately - important event received ${JSON.stringify(
        item
      )}`
    );
    const { name, ts, attributes } = item;
    const event: JSONIngestionEvent = {
      type: this.type,
      v: this.v,
      payloads: [
        {
          name,
          ts,
          ...attributes,
        },
      ],
    };
    let failed = false;
    let response: Response = null;
    const body = this.makeRequestBody([event]);
    try {
      response = await this.send(body);
      if (response.ok) {
        try {
          const data = await response.json();
          this.logger.debug(
            `Event Reporting - InMemoryJSONEventBuffer - sendEventImmediately - send successful event: ${body}, message: ${JSON.stringify(
              data
            )}`
          );
        } catch (err) {
          /* istanbul ignore next */
          this.logger.warn(
            `Event Reporting - InMemoryJSONEventBuffer - sendEventImmediately - Error reading OK response ${err} for event ${body}`
          );
        }
        return;
      } else {
        this.logger.error(
          `Event Reporting - InMemoryJSONEventBuffer - sendEventImmediately - Failed to send an important event ${body} with response status ${response.status}`
        );
        failed = true;
      }
    } catch (error) {
      this.logger.warn(
        `Event Reporting - There may be a failure in sending an important event ${body} to the ingestion endpoint ${error}.`
      );
      failed = true;
      try {
        /**
         * Important events like meetingEnded, meetingStartFailed may result into page-redirects.
         * In such a case, Firefox aborts the fetch request with 'NS_BINDING_ABORT' state.
         * Chrome and Safari show fetch request as cancelled and the fetch failure is catched, but,
         * events appear at ingestion backend. Chrome and Safari behavior is unreliable, but Firefox consistently fails,
         * hence, we beacon data as a last resort when using Firefox.
         * During the page-redirect, we do not have access to check fetch's response to handle Chrome and Safari behavior,
         * hence, event ingestion may fail.
         *
         */
        if (this.metadata.browserName.toLowerCase() === 'firefox') {
          const body = this.makeBeaconRequestBody([event]);
          this.logger.debug(
            `Event Reporting - InMemoryJSONEventBuffer - sendEventImmediately - beaconing data out ${body}`
          );
          if (!navigator.sendBeacon(`${this.ingestionURL}?beacon=1`, body)) {
            failed = true;
          } else {
            failed = false;
          }
        }
      } catch (error) {
        this.logger.warn(`Event Reporting - Error sending beacon for an important event ${body}`);
        failed = true;
      }
    }

    /* istanbul ignore else */
    if (failed) {
      this.logger.debug(
        `Event Reporting - InMemoryJSONEventBuffer - sendEventImmediately - pushing to failed events ${body}`
      );
      this.failedIngestionEvents.push(event);
    }
  }

  private getBackoffWaitTime(retryCount: number): number {
    return (
      Math.random() *
      Math.min(
        InMemoryJSONEventBuffer.RETRY_LONG_BACKOFF_MS,
        InMemoryJSONEventBuffer.RETRY_SHORT_BACKOFF_MS * Math.pow(2.0, retryCount)
      )
    );
  }

  private wait(delayInMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delayInMs));
  }

  private async send(data: string): Promise<Response> {
    try {
      let retryCount = 0;
      while (retryCount < this.retryCountLimit) {
        const response = await fetch(this.ingestionURL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.authenticationToken}`,
          },
          body: data,
        });
        if (response.ok || !InMemoryJSONEventBuffer.SENDING_FAILURE_CODES.has(response.status)) {
          return response;
        } else {
          retryCount++;
          /* istanbul ignore else */
          if (retryCount < this.retryCountLimit) {
            const backoffTime = this.getBackoffWaitTime(retryCount);
            await this.wait(backoffTime);
          }
        }
      }
      /* istanbul ignore else */
      if (retryCount === this.retryCountLimit) {
        throw new Error(`Retry count limit reached for ${data}`);
      }
    } catch (error) {
      throw error;
    }
  }

  private async sendBeacon(): Promise<void> {
    // Any pending events from buffer.
    const events = this.buffer;
    this.logger.debug(
      `Event Reporting - InMemoryJSONEventBuffer - sendBeacon - clearing out buffer events ${JSON.stringify(
        events
      )}`
    );
    this.buffer = [];
    // Any pending event in current ingestion event.
    if (this.currentIngestionEvent.payloads.length > 0) {
      const clearCurrenIngestionEvent = this.deepCopyCurrentIngestionEvent(
        this.currentIngestionEvent
      );
      events.push(clearCurrenIngestionEvent);
      this.logger.debug(
        `Event Reporting - InMemoryJSONEventBuffer - sendBeacon - clearing out current ingestion event ${JSON.stringify(
          clearCurrenIngestionEvent
        )}`
      );
      this.currentIngestionEvent = this.initializeAndGetCurrentIngestionEvent();
    }

    // Any failed ingestion events which were sent before.
    if (this.failedIngestionEvents.length > 0) {
      const failedRecordsCopy = this.failedIngestionEvents.map(record =>
        this.deepCopyCurrentIngestionEvent(record)
      );
      events.push(...failedRecordsCopy);
      this.logger.debug(
        `Event Reporting - InMemoryJSONEventBuffer - sendBeacon - clearing out any failed ingestion event ${JSON.stringify(
          failedRecordsCopy
        )}`
      );
      this.failedIngestionEvents = [];
    }

    // Any cancelled requests due to page-redirects.
    if (this.cancellableEvents.size > 0) {
      this.cancellableEvents.forEach(value => {
        events.push(...value);
        this.logger.debug(
          `Event Reporting - InMemoryJSONEventBuffer - sendBeacon - clearing out each cancellable event ${JSON.stringify(
            value
          )}`
        );
      });
      this.cancellableEvents.clear();
    }

    if (events.length === 0) {
      return;
    }
    const beaconData = this.makeBeaconRequestBody(events);
    this.logger.debug(
      `Event Reporting - InMemoryJSONEventBuffer - sendBeacon - beacon data to send ${beaconData}`
    );
    try {
      /* istanbul ignore else */
      if (!navigator.sendBeacon(`${this.ingestionURL}?beacon=1`, beaconData)) {
        this.logger.warn(`Event Reporting - Browser failed to queue beacon data ${beaconData}`);
      }
    } catch (error) {
      this.logger.warn(
        `Event Reporting - Sending beacon data ${beaconData} failed with error ${error}`
      );
    }
  }

  private reset(): void {
    this.maxBufferCapacityBytes = 0;
    this.totalBufferItems = 0;
    this.buffer = [];
    this.bufferSize = 0;
    this.maxBufferItemCapacityBytes = 0;
    this.ingestionEventSize = 0;
    this.flushIntervalMs = 0;
    this.flushSize = 0;
    this.failedIngestionEvents = [];
    this.lock = false;
    this.beaconEventListener = undefined;
    this.cancellableEvents.clear();
  }

  async destroy(): Promise<void> {
    this.stop();
    this.reset();
  }
}
