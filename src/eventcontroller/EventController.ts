// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import EventObserver from '../eventobserver/EventObserver';
import EventReporter from '../eventreporter/EventReporter';
import AudioVideoEventAttributes from './AudioVideoEventAttributes';
import DeviceEventAttributes from './DeviceEventAttributes';
import EventName from './EventName';

/**
 * [[EventController]] keeps track of a list of event observers and notifies them of SDK events.
 * An event can describe success or failure of SDK components that make use of this controller.
 * Example: The success and failure for a meeting session.
 * If `EventIngestionUrl` is available in `MeetingSessionConfiguration`, then the generated meeting events will
 * be reported to Amazon Chime's backend using the `EventReporter`.
 *
 * In most cases you will want to use the default `EventController`, but you may want to implement your
 * own if you wish to keep track of more meta data or wish to implement your own custom events.
 */
export default interface EventController {
  /**
   * Adds an observer to receive events.
   */
  addObserver(observer: EventObserver): void;

  /**
   * Remove an observer to receive events.
   */
  removeObserver(observer: EventObserver): void;

  /**
   * Notifies observers of an event.
   */
  publishEvent(
    name: EventName,
    attributes?: AudioVideoEventAttributes | DeviceEventAttributes
  ): Promise<void>;

  /**
   * EventReporter that the EventController uses to send events to the Amazon Chime backend.
   */
  readonly eventReporter?: EventReporter;
}
