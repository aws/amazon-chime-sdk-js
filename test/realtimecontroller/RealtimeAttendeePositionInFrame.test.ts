// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import RealtimeAttendeePositionInFrame from '../../src/realtimecontroller/RealtimeAttendeePositionInFrame';

describe('RealtimeAttendeePositionInFrame', () => {
  let expect: Chai.ExpectStatic;

  before(() => {
    expect = chai.expect;
  });

  describe('default values for RealtimeState', () => {
    it('has the expected default values', () => {
      const positionInFrame = new RealtimeAttendeePositionInFrame();
      expect(positionInFrame.attendeeIndex).to.be.null;
      expect(positionInFrame.attendeesInFrame).to.be.null;
    });
  });
});
