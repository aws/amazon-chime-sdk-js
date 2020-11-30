// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoEventAttributes from './AudioVideoEventAttributes';
import DeviceEventAttributes from './DeviceEventAttributes';
import EventName from './EventName';
import MeetingHistoryState from './MeetingHistoryState';

/**
 * [[EventController]] keeps track of events and notifies audio-video observers.
 * An event describes the success and failure conditions for the meeting session.
 */
export default interface EventController {
  /**
   * Notifies observers of an event.
   */
  publishEvent(
    name: EventName,
    attributes?: AudioVideoEventAttributes | DeviceEventAttributes
  ): Promise<void>;

  /**
   * Adds a state to the meeting history stack.
   */
  pushMeetingState(state: MeetingHistoryState): Promise<void>;
}
