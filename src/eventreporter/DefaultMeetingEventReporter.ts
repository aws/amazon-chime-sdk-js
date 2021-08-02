// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Destroyable, { isDestroyable } from '../destroyable/Destroyable';
import EventBuffer from '../eventbuffer/EventBuffer';
import InMemoryJSONEventBuffer from '../eventbuffer/InMemoryJSONEventBuffer';
import MeetingHistoryState from '../eventcontroller/MeetingHistoryState';
import EventIngestionConfiguration from '../eventingestionconfiguration/EventIngestionConfiguration';
import Logger from '../logger/Logger';
import EventData from './EventData';
import EventReporter from './EventReporter';

export default class DefaultMeetingEventReporter implements EventReporter, Destroyable {
  private eventBuffer: EventBuffer<EventData>;
  private logger: Logger;
  private reportingEvents = false;
  private eventsToIgnore: string[];
  private importantEvents: MeetingHistoryState[] = [
    'meetingEnded',
    'meetingFailed',
    'meetingStartFailed',
    'audioInputFailed',
    'videoInputFailed',
    'meetingStartSucceeded',
  ];
  destroyed = false;

  constructor(eventIngestionConfiguration: EventIngestionConfiguration, logger: Logger) {
    const {
      eventsClientConfiguration,
      ingestionURL,
      eventBufferConfiguration,
    } = eventIngestionConfiguration;
    const { eventsToIgnore } = eventsClientConfiguration;
    this.eventBuffer = new InMemoryJSONEventBuffer(
      eventBufferConfiguration,
      eventsClientConfiguration,
      ingestionURL,
      this.importantEvents,
      logger
    );
    this.logger = logger;
    this.eventsToIgnore = eventsToIgnore;
    this.start();
  }

  start(): void {
    if (this.reportingEvents) {
      return;
    }
    try {
      this.eventBuffer.start();
      this.logger.info('Event reporting started');
      this.reportingEvents = true;
    } catch (error) {
      /* istanbul ignore next */
      this.logger.error(`Event Reporting - Error starting the event buffer ${error}`);
    }
  }

  stop(): void {
    if (!this.reportingEvents) {
      return;
    }
    try {
      this.eventBuffer.stop();
      this.logger.info('Event reporting stopped');
      this.reportingEvents = false;
    } catch (error) {
      /* istanbul ignore next */
      this.logger.error(`Event Reporting - Error stopping the event buffer ${error}`);
    }
  }

  async reportEvent(
    ts: number,
    name: MeetingHistoryState,
    attributes?: { [key: string]: string | number }
  ): Promise<void> {
    this.logger.debug(
      `Event Reporting - DefaultMeetingEventReporter - event received in reportEvent ${ts}, ${name}, ${JSON.stringify(
        attributes
      )}`
    );
    if (this.eventsToIgnore.includes(name)) {
      this.logger.debug(
        `Event Reporting - DefaultMeetingEventReporter - ${name} event will be ignored as it is in events to ignore`
      );
      return;
    }
    try {
      this.logger.debug(
        `Event Reporting - DefaultMeetingEventReporter - adding item to event buffer`
      );
      await this.eventBuffer.addItem({ ts, name, attributes });
    } catch (error) {
      this.logger.error(`Event Reporting - Error adding event to buffer ${error}`);
    }
  }

  async destroy(): Promise<void> {
    this.destroyed = true;
    this.stop();
    /* istanbul ignore else */
    if (isDestroyable(this.eventBuffer)) {
      this.eventBuffer.destroy();
    }
    this.eventBuffer = undefined;
  }
}
