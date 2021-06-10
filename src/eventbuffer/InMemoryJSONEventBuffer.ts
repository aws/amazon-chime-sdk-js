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
import JSONIngestionBufferItem from './JSONIngestionBufferItem';
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
  private static readonly MAX_PAYLOAD_ITEMS = 2;
  private static readonly MAX_ITEM_SIZE_BYTES_ALLOWED = 3000;
  private maxBufferCapacityBytes: number;
  private totalBufferItems: number;
  private buffer: JSONIngestionBufferItem[] = [];
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
      this.buffer.push({ retryCount: 0, event: currentEvent });
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

  private getItems(end: number, start: number = 0): JSONIngestionBufferItem[] {
    if (this.isEmpty()) {
      return [];
    }
    end = Math.min(this.buffer.length, end + 1);
    const items = this.buffer.splice(start, end);
    return items;
  }

  private getEventsFromBuffer(batch: JSONIngestionBufferItem[]): JSONIngestionEvent[] {
    if (!batch || (batch && batch.length === 0)) {
      return [];
    }
    return batch.map(({ retryCount: _retryCount, event }) => event);
  }

  private sendEvents = async (): Promise<void> => {
    if (this.lock) {
      return;
    }
    const batch: JSONIngestionBufferItem[] = this.getItems(this.flushSize);
    if (batch.length === 0) {
      return;
    }
    this.lock = true;
    const batchEvents = this.getEventsFromBuffer(batch);
    const body = this.makeRequestBody(batchEvents);
    let failed = false;

    // If a page re-directs, in Safari and Chrome, the network
    // request shows cancelled but the data reaches the ingestion endpoint.
    // In Firefox, the request errors out with 'NS_BINDING_ABORT' state. Hence, add the event
    // to cancellable events to try with `sendBeacon` lastly.
    const timestamp = Date.now();
    if (this.metadata.browserName.toLowerCase() === 'firefox') {
      this.cancellableEvents.set(timestamp, batchEvents);
    }

    try {
      this.logger.debug(
        `Event Reporting - InMemoryJSONEventBuffer - sendEvents - sending body ${body}`
      );
      const response = await this.send(body);
      this.cancellableEvents.delete(timestamp);
      /* istanbul ignore else */
      if (!response.ok) {
        if (InMemoryJSONEventBuffer.SENDING_FAILURE_CODES.has(response.status)) {
          this.handleFailure(batch, response.status);
        } else {
          failed = true;
        }
      } else {
        try {
          const data = await response.json();
          this.logger.debug(
            `Event Reporting - InMemoryJSONEventBuffer - sendEvents - events send successful ${JSON.stringify(
              data
            )}`
          );
        } catch (err) {
          this.logger.error(
            `Event Reporting - InMemoryJSONEventBuffer - sendEvents error reading OK response ${err}`
          );
        }
      }
    } catch (error) {
      failed = true;
      this.logger.error(
        `Event Reporting - Error in sending events to the ingestion endpoint ${error}`
      );
    } finally {
      this.lock = false;
    }

    if (failed) {
      this.cancellableEvents.delete(timestamp);
      this.failedIngestionEvents.push(...batchEvents);
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

  private handleFailure(batch: JSONIngestionBufferItem[], responseStatus: number): void {
    this.logger.debug(
      `Event Reporting - InMemoryJSONEventBuffer - handleFailure - retryable failure detected ${JSON.stringify(
        batch
      )}, response status ${responseStatus}`
    );
    const retryableEvents: JSONIngestionBufferItem[] = [];
    for (let i = 0; i < batch.length; i++) {
      const { retryCount, event } = batch[i];
      if (retryCount < this.retryCountLimit) {
        retryableEvents.push({
          retryCount: retryCount + 1,
          event,
        });
      } else {
        this.failedIngestionEvents.push(event);
        this.logger.warn(
          `Event Reporting - Retry limit reached for an event ${JSON.stringify(
            event
          )}. Failure response status is ${responseStatus}`
        );
      }
    }
    this.buffer.unshift(...retryableEvents);
    this.logger.debug(
      `Event Reporting - InMemoryJSONEventBuffer - handleFailure - retryable failure added to the buffer ${JSON.stringify(
        retryableEvents
      )}`
    );
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

    let retryCount = 0;
    let failed = false;
    let response: Response = null;
    const body = this.makeRequestBody([event]);
    try {
      do {
        this.logger.debug(
          `Event Reporting - InMemoryJSONEventBuffer - sendEventImmediately - body ${body} , retryCount ${retryCount}`
        );
        response = await this.send(body);
        /* istanbul ignore else */
        if (response.ok) {
          try {
            const data = await response.json();
            this.logger.debug(
              `Event Reporting - InMemoryJSONEventBuffer - sendEventImmediately - event send successful ${JSON.stringify(
                data
              )}`
            );
            return;
          } catch (err) {
            /* istanbul ignore next */
            this.logger.debug(
              `Event Reporting - InMemoryJSONEventBuffer - sendEventImmediately - Error reading OK response ${err}`
            );
          }
        }
      } while (
        response &&
        InMemoryJSONEventBuffer.SENDING_FAILURE_CODES.has(response.status) &&
        ++retryCount < this.retryCountLimit
      );
      /* istanbul ignore else */
      if (retryCount < this.retryCountLimit) {
        this.logger.error(
          `Event Reporting - Failed to send an event ${name} with response status ${response.status}`
        );
        failed = true;
      } else if (retryCount === this.retryCountLimit) {
        this.logger.warn(`Event Reporting - Retry count limit reached for an event ${name}`);
        failed = true;
      }
    } catch (error) {
      this.logger.warn(
        `Event Reporting - There may be a failure in sending an important event ${name} to the ingestion endpoint ${error}.`
      );
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
          /* istanbul ignore else */
          if (!navigator.sendBeacon(`${this.ingestionURL}?beacon=1`, body)) {
            failed = true;
          }
        }
      } catch (error) {
        this.logger.warn(`Event Reporting - Error sending beacon for an important event ${name}`);
        failed = true;
      }
    }

    /* istanbul ignore else */
    if (failed) {
      this.logger.debug(
        `Event Reporting - InMemoryJSONEventBuffer - sendEventImmediately - pushing to failed events ${JSON.stringify(
          event
        )}`
      );
      this.failedIngestionEvents.push(event);
    }
  }

  private async send(data: string): Promise<Response> {
    try {
      const response = await fetch(this.ingestionURL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authenticationToken}`,
        },
        body: data,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  private async sendBeacon(): Promise<void> {
    // Any pending events from buffer.
    const events = this.getEventsFromBuffer(this.buffer);
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
      this.logger.error(`Event Reporting - Sending beacon failed with error ${error}`);
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
