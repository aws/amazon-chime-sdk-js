// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import MeetingEventsClientConfiguration from '../../src/eventsclientconfiguration/MeetingEventsClientConfiguration';

describe('MeetingEventsClientConfiguration', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('contructor', () => {
    it('constructs with required arguments', () => {
      const meetingId = 'meetingId';
      const attendeeId = 'attendeeId';
      const joinToken = 'joinToken';
      const meetingEventsClientConfiguration = new MeetingEventsClientConfiguration(
        meetingId,
        attendeeId,
        joinToken
      );
      expect(meetingEventsClientConfiguration.getAuthenticationToken()).to.eq(joinToken);
      const attributes = meetingEventsClientConfiguration.toJSON();
      expect(attributes.attendeeId).to.eq(attendeeId);
      expect(attributes.meetingId).to.eq(meetingId);
      expect(attributes.type).to.eq('Meet');
      expect(attributes.v).to.eq(1);
      expect(meetingEventsClientConfiguration.eventsToIgnore).to.deep.eq([]);
    });

    it('constructs with events to ignore array argument', () => {
      const meetingId = 'meetingId';
      const attendeeId = 'attendeeId';
      const joinToken = 'joinToken';
      const meetingEventsClientConfiguration = new MeetingEventsClientConfiguration(
        meetingId,
        attendeeId,
        joinToken,
        ['meetingStartRequested']
      );
      expect(meetingEventsClientConfiguration.getAuthenticationToken()).to.eq(joinToken);
      const attributes = meetingEventsClientConfiguration.toJSON();
      expect(attributes.attendeeId).to.eq(attendeeId);
      expect(attributes.meetingId).to.eq(meetingId);
      expect(attributes.type).to.eq('Meet');
      expect(attributes.v).to.eq(1);
      expect(meetingEventsClientConfiguration.eventsToIgnore).to.deep.eq(['meetingStartRequested']);
    });
  });
});
