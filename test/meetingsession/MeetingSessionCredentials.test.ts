// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';

describe('MeetingSessionCredentials', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('toJSON', () => {
    it('will redact a non-null join token', () => {
      const credentials = new MeetingSessionCredentials();
      credentials.attendeeId = 'attendee-id';
      credentials.joinToken = 'join-token';
      const result = JSON.parse(JSON.stringify(credentials));
      expect(result.attendeeId).to.equal(credentials.attendeeId);
      expect(result.joinToken).to.equal('<redacted>');
    });

    it('will not redact a null join token', () => {
      const credentials = new MeetingSessionCredentials();
      credentials.attendeeId = 'attendee-id';
      credentials.joinToken = null;
      const result = JSON.parse(JSON.stringify(credentials));
      expect(result.attendeeId).to.equal(credentials.attendeeId);
      expect(result.joinToken).to.be.null;
    });
  });
});
