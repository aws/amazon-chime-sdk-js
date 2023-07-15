// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { UAParser } from 'ua-parser-js';

import Destroyable, { isDestroyable } from '../destroyable/Destroyable';
import EventIngestionConfiguration from '../eventingestionconfiguration/EventIngestionConfiguration';
import EventObserver from '../eventobserver/EventObserver';
import DefaultMeetingEventReporter from '../eventreporter/DefaultMeetingEventReporter';
import EventReporter from '../eventreporter/EventReporter';
import EventsClientConfiguration from '../eventsclientconfiguration/EventsClientConfiguration';
import MeetingEventsClientConfiguration from '../eventsclientconfiguration/MeetingEventsClientConfiguration';
import Logger from '../logger/Logger';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import Versioning from '../versioning/Versioning';
import AudioVideoEventAttributes from './AudioVideoEventAttributes';
import DeviceEventAttributes from './DeviceEventAttributes';
import EventAttributes from './EventAttributes';
import EventController from './EventController';
import EventName from './EventName';
import flattenEventAttributes from './flattenEventAttributes';
import MeetingHistoryState from './MeetingHistoryState';
import VideoFXEventAttributes from './VideoFXEventAttributes';

export default class DefaultEventController implements EventController, Destroyable {
  private static readonly UNAVAILABLE = 'Unavailable';

  // Use "ua-parser-js" over "detect-browser" to get more detailed information.
  // We can consider replacing "detect-browser" in DefaultBrowserBehavior.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parserResult: any;
  private browserMajorVersion: string;
  private meetingHistoryStates: { name: MeetingHistoryState; timestampMs: number }[] = [];
  private observerSet: Set<EventObserver> = new Set<EventObserver>();
  private logger: Logger;
  private configuration: MeetingSessionConfiguration;
  private _eventReporter: EventReporter;
  destroyed = false;

  // Compute these once so we're not doing work on each event.
  private browserName: string;
  private browserVersion: string;
  private deviceName: string;

  constructor(
    configuration: MeetingSessionConfiguration,
    logger: Logger,
    eventReporter?: EventReporter
  ) {
    this.logger = logger;
    this.configuration = configuration;
    this.setupEventReporter(configuration, logger, eventReporter);
    try {
      this.parserResult =
        navigator && navigator.userAgent ? new UAParser(navigator.userAgent).getResult() : null;
    } catch (error) {
      // This seems to never happen with ua-parser-js in reality, even with malformed strings.
      /* istanbul ignore next */
      this.logger.error(error.message);
    }

    this.browserMajorVersion =
      this.parserResult?.browser?.version?.split('.')[0] || DefaultEventController.UNAVAILABLE;
    this.browserName = this.parserResult?.browser.name || DefaultEventController.UNAVAILABLE;
    this.browserVersion = this.parserResult?.browser.version || DefaultEventController.UNAVAILABLE;
    this.deviceName =
      [this.parserResult?.device.vendor || '', this.parserResult?.device.model || '']
        .join(' ')
        .trim() || DefaultEventController.UNAVAILABLE;
  }

  addObserver(observer: EventObserver): void {
    this.observerSet.add(observer);
  }

  removeObserver(observer: EventObserver): void {
    this.observerSet.delete(observer);
  }

  private forEachObserver(observerFunc: (observer: EventObserver) => void): void {
    for (const observer of this.observerSet) {
      AsyncScheduler.nextTick(() => {
        /* istanbul ignore else */
        if (this.observerSet.has(observer)) {
          observerFunc(observer);
        }
      });
    }
  }

  async publishEvent(
    name: EventName,
    attributes?: AudioVideoEventAttributes | DeviceEventAttributes | VideoFXEventAttributes
  ): Promise<void> {
    const timestampMs = Date.now();
    this.meetingHistoryStates.push({
      name,
      timestampMs,
    });
    // Make a single frozen copy of the event, reusing the object returned by
    // `getAttributes` to avoid copying too much.
    const eventAttributes = Object.freeze(
      Object.assign(this.getAttributes(timestampMs), attributes)
    );
    // Publishes event to observers
    this.forEachObserver((observer: EventObserver) => {
      observer.eventDidReceive(name, eventAttributes);
    });
    // Reports event to the ingestion service
    this.reportEvent(name, timestampMs, attributes);
  }

  private async reportEvent(
    name: MeetingHistoryState,
    timestampMs: number,
    attributes?: AudioVideoEventAttributes | DeviceEventAttributes | VideoFXEventAttributes
  ): Promise<void> {
    let flattenedAttributes;
    try {
      if (attributes) {
        flattenedAttributes = flattenEventAttributes(attributes);
      }
      await this.eventReporter?.reportEvent(timestampMs, name, flattenedAttributes);
    } catch (error) {
      /* istanbul ignore next */
      this.logger.error(`Error reporting event ${error}`);
    }
  }

  private setupEventReporter(
    configuration: MeetingSessionConfiguration,
    logger: Logger,
    eventReporter?: EventReporter
  ): void {
    if (eventReporter) {
      this._eventReporter = eventReporter;
    } else if (configuration.urls) {
      // Attempts to set up a event reporter using the meeting configuration if one is not provided
      const eventIngestionURL = configuration.urls.eventIngestionURL;
      if (eventIngestionURL) {
        this.logger.info(`Event ingestion URL is present in the configuration`);
        const {
          meetingId,
          credentials: { attendeeId, joinToken },
        } = configuration;
        const meetingEventsClientConfiguration: EventsClientConfiguration = new MeetingEventsClientConfiguration(
          meetingId,
          attendeeId,
          joinToken
        );
        const eventIngestionConfiguration = new EventIngestionConfiguration(
          meetingEventsClientConfiguration,
          eventIngestionURL
        );
        this._eventReporter = new DefaultMeetingEventReporter(eventIngestionConfiguration, logger);
      }
    }
  }

  private getAttributes(timestampMs: number): EventAttributes {
    return {
      attendeeId: this.configuration.credentials.attendeeId,
      browserMajorVersion: this.browserMajorVersion,
      browserName: this.browserName,
      browserVersion: this.browserVersion,
      deviceName: this.deviceName,
      externalMeetingId:
        typeof this.configuration.externalMeetingId === 'string'
          ? this.configuration.externalMeetingId
          : '',
      externalUserId: this.configuration.credentials.externalUserId,
      meetingHistory: this.meetingHistoryStates,
      meetingId: this.configuration.meetingId,
      osName: this.parserResult?.os.name || DefaultEventController.UNAVAILABLE,
      osVersion: this.parserResult?.os.version || DefaultEventController.UNAVAILABLE,
      sdkVersion: Versioning.sdkVersion,
      sdkName: Versioning.sdkName,
      timestampMs,
    };
  }

  get eventReporter(): EventReporter {
    return this._eventReporter;
  }

  /**
   * Clean up this instance and resources that it created.
   *
   * After calling `destroy`, internal fields like `eventReporter` will be unavailable.
   */
  async destroy(): Promise<void> {
    if (isDestroyable(this.eventReporter)) {
      await this.eventReporter.destroy();
    }
    this.logger = undefined;
    this.configuration = undefined;
    this._eventReporter = undefined;
    this.destroyed = true;
  }
}
