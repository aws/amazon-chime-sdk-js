// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import EventsClientConfiguration from './EventsClientConfiguration';
import MeetingEventsClientConfigurationAttributes from './MeetingEventsClientConfigurationAttributes';

/**
 * [[MeetingEventsClientConfiguration]] contains necessary information to
 * report meeting events metadata to each event while sending events to the ingestion service.
 */
export default class MeetingEventsClientConfiguration implements EventsClientConfiguration {
  readonly type = 'Meet';
  readonly v = 1;
  private readonly authenticationToken: string;
  private readonly meetingId: string;
  private readonly attendeeId: string;
  readonly eventsToIgnore: string[];

  constructor(
    meetingId: string,
    attendeeId: string,
    authenticationToken: string,
    eventsToIgnore: string[] = []
  ) {
    this.meetingId = meetingId;
    this.attendeeId = attendeeId;
    this.eventsToIgnore = eventsToIgnore;
    this.authenticationToken = authenticationToken;
  }

  getAuthenticationToken(): string {
    return this.authenticationToken;
  }

  toJSON(): MeetingEventsClientConfigurationAttributes {
    const attributes: MeetingEventsClientConfigurationAttributes = {};
    attributes.type = this.type;
    attributes.v = this.v;
    attributes.meetingId = this.meetingId;
    attributes.attendeeId = this.attendeeId;
    return attributes;
  }
}
