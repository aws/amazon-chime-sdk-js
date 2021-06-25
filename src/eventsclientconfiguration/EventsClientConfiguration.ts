// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import EventsIngestionMetadata from '../eventreporter/EventsIngestionMetadata';

/**
 * [[EventsClientConfiguration]] contains necessary information to
 * create events specific data when sending events to the ingestion service.
 */
export default interface EventsClientConfiguration {
  /**
   * Type of an event. Currently, only meeting events with type = 'Meet' are supported.
   * Each event sent to the ingestion service must have a type.
   */
  readonly type: string;

  /**
   * Ingestion service requires an events envelope version number.
   */
  readonly v: number;

  /**
   * These events will not be sent to the ingestion service.
   */
  readonly eventsToIgnore: string[];

  /**
   * Returns authentication token to use while sending requests to the
   * events ingestion URL.
   */
  getAuthenticationToken(): string;

  /**
   * Returns data specific to an event type along with the type and the event envelope version.
   * For e.g. for the "Meet" type events, this data is:
   * {
   *  type: 'Meet',
   *  v: 1,
   *  'meetingId': <meetingId>,
   *  'attendeeId': <attendeeId>
   * }
   */
  toJSON(): EventsIngestionMetadata;
}
