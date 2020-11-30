// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { UAParser } from 'ua-parser-js';

import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import Versioning from '../versioning/Versioning';
import AudioVideoEventAttributes from './AudioVideoEventAttributes';
import DeviceEventAttributes from './DeviceEventAttributes';
import EventAttributes from './EventAttributes';
import EventController from './EventController';
import EventName from './EventName';
import MeetingHistoryState from './MeetingHistoryState';

export default class DefaultEventController implements EventController {
  /** @internal */
  private static readonly UNAVAILABLE = 'Unavailable';

  // Use "ua-parser-js" over "detect-browser" to get more detailed information.
  // We can consider replacing "detect-browser" in DefaultBrowserBehavior.
  /** @internal */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parserResult: any;
  /** @internal */
  private browserMajorVersion: string;
  /** @internal */
  private meetingHistoryStates: { name: MeetingHistoryState; timestampMs: number }[] = [];

  // Compute these once so we're not doing work on each event.
  /** @internal */
  private browserName: string;
  /** @internal */
  private browserVersion: string;
  /** @internal */
  private deviceName: string;

  constructor(private audioVideoController: AudioVideoController) {
    try {
      this.parserResult =
        navigator && navigator.userAgent ? new UAParser(navigator.userAgent).getResult() : null;
    } catch (error) {
      audioVideoController.logger.error(error.message);
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

  async publishEvent(
    name: EventName,
    attributes?: AudioVideoEventAttributes | DeviceEventAttributes
  ): Promise<void> {
    const timestampMs = Date.now();
    await this.pushMeetingState(name, timestampMs);

    // Make a single frozen copy of the event, reusing the object returned by
    // `getAttributes` to avoid copying too much.
    const eventAttributes = Object.freeze(
      Object.assign(this.getAttributes(timestampMs), attributes)
    );
    this.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
      if (observer.eventDidReceive) {
        observer.eventDidReceive(name, eventAttributes);
      }
    });
  }

  async pushMeetingState(
    state: MeetingHistoryState,
    timestampMs: number = Date.now()
  ): Promise<void> {
    this.meetingHistoryStates.push({
      name: state,
      timestampMs,
    });
  }

  private getAttributes(timestampMs: number): EventAttributes {
    return {
      attendeeId: this.audioVideoController.configuration.credentials.attendeeId,
      browserMajorVersion: this.browserMajorVersion,
      browserName: this.browserName,
      browserVersion: this.browserVersion,
      deviceName: this.deviceName,
      externalMeetingId:
        typeof this.audioVideoController.configuration.externalMeetingId === 'string'
          ? this.audioVideoController.configuration.externalMeetingId
          : '',
      externalUserId: this.audioVideoController.configuration.credentials.externalUserId,
      meetingHistory: this.meetingHistoryStates,
      meetingId: this.audioVideoController.configuration.meetingId,
      osName: this.parserResult?.os.name || DefaultEventController.UNAVAILABLE,
      osVersion: this.parserResult?.os.version || DefaultEventController.UNAVAILABLE,
      sdkVersion: Versioning.sdkVersion,
      sdkName: Versioning.sdkName,
      timestampMs,
    };
  }
}
