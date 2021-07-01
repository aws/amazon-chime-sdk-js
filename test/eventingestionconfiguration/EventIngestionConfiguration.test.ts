// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import EventBufferConfiguration from '../../src/eventbufferconfiguration/EventBufferConfiguration';
import EventIngestionConfiguration from '../../src/eventingestionconfiguration/EventIngestionConfiguration';
import MeetingEventsClientConfiguration from '../../src/eventsclientconfiguration/MeetingEventsClientConfiguration';

describe('EventIngestionConfiguration', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('contructor', () => {
    it('can be constructed with default buffer configuration', () => {
      const meetingId = 'meetingId';
      const attendeeId = 'attendeeId';
      const joinToken = 'joinToken';
      const ingestionURL = 'ingestion-url';
      const meetingEventsClientConfiguration = new MeetingEventsClientConfiguration(
        meetingId,
        attendeeId,
        joinToken
      );

      const eventIngestionConfiguration = new EventIngestionConfiguration(
        meetingEventsClientConfiguration,
        ingestionURL
      );
      expect(eventIngestionConfiguration.ingestionURL).to.eq('ingestion-url');
      expect(eventIngestionConfiguration.eventsClientConfiguration.type).to.eq('Meet');
      expect(eventIngestionConfiguration.eventBufferConfiguration.flushIntervalMs).to.eq(5000);
    });

    it('can be constructed with custom buffer configuration', () => {
      const meetingId = 'meetingId';
      const attendeeId = 'attendeeId';
      const joinToken = 'joinToken';
      const ingestionURL = 'ingestion-url';
      const meetingEventsClientConfiguration = new MeetingEventsClientConfiguration(
        meetingId,
        attendeeId,
        joinToken
      );

      const eventIngestionConfiguration = new EventIngestionConfiguration(
        meetingEventsClientConfiguration,
        ingestionURL,
        new EventBufferConfiguration(2000)
      );
      expect(eventIngestionConfiguration.ingestionURL).to.eq('ingestion-url');
      expect(eventIngestionConfiguration.eventsClientConfiguration.type).to.eq('Meet');
      expect(eventIngestionConfiguration.eventBufferConfiguration.flushIntervalMs).to.eq(2000);
    });
  });
});
