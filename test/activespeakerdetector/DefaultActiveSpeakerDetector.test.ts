// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultActiveSpeakerDetector from '../../src/activespeakerdetector/DefaultActiveSpeakerDetector';
import DefaultActiveSpeakerPolicy from '../../src/activespeakerpolicy/DefaultActiveSpeakerPolicy';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';

describe('DefaultActiveSpeakerDetector', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const attendeeId = 'self';
  const bandwidthPriorityCallback = (): void => {};

  describe('construction', () => {
    it('can be constructed', () => {
      let rt = new DefaultRealtimeController();
      let detector = new DefaultActiveSpeakerDetector(rt, attendeeId, bandwidthPriorityCallback);
      expect(detector).to.not.equal(null);
    });
  });

  describe('subscribeToActiveSpeakerDetector', () => {
    it('can subscribe to detector', () => {
      let rt = new DefaultRealtimeController();
      let detector = new DefaultActiveSpeakerDetector(rt, attendeeId, bandwidthPriorityCallback);
      let policy = new DefaultActiveSpeakerPolicy();
      const callback = (_attendeeIds: string[]): void => {};
      detector.subscribe(policy, callback);
      detector.unsubscribe(callback);
    });

    it('attendee id change should trigger the active speaker detector', () => {
      let rt = new DefaultRealtimeController();
      let detector = new DefaultActiveSpeakerDetector(rt, attendeeId, bandwidthPriorityCallback);
      let policy = new DefaultActiveSpeakerPolicy();
      let callbackFired = false;
      const fooAttendee = 'foo-attendee';
      const callback = (_attendeeIds: string[]): void => {
        callbackFired = true;
      };
      detector.subscribe(policy, callback);
      rt.realtimeSetAttendeeIdPresence(fooAttendee, true, null, false);
      rt.realtimeUpdateVolumeIndicator(fooAttendee, 10, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee, 10, false, 1, null);
      expect(callbackFired).to.be.true;
      callbackFired = false;
      rt.realtimeUpdateVolumeIndicator(fooAttendee, 10, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee, 0, false, 1, null);
      expect(callbackFired).to.be.false;
      rt.realtimeSetAttendeeIdPresence(fooAttendee, false, null, true);
      expect(callbackFired).to.be.true;
      detector.unsubscribe(callback);
    });

    it('can return sorted active speakers', () => {
      let rt = new DefaultRealtimeController();
      let detector = new DefaultActiveSpeakerDetector(rt, attendeeId, bandwidthPriorityCallback);
      let policy = new DefaultActiveSpeakerPolicy();
      const fooAttendee1 = 'foo-attendee';
      const fooAttendee2 = 'foo-attendee2';
      const callback = (attendeeIds: string[]): void => {
        expect(attendeeIds.length === 2);
        expect(attendeeIds[0] === fooAttendee2);
      };
      detector.subscribe(policy, callback);
      rt.realtimeSetAttendeeIdPresence(fooAttendee1, true, null, false);
      rt.realtimeSetAttendeeIdPresence(fooAttendee2, true, null, false);
      rt.realtimeUpdateVolumeIndicator(fooAttendee1, 10, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee1, 20, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee2, 10, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee2, 90, false, 1, null);
      detector.unsubscribe(callback);
    });
  });

  describe('unsubscribeFromActiveSpeakerDetector', () => {
    it('can unsubscribe from detector', () => {
      let rt = new DefaultRealtimeController();
      let detector = new DefaultActiveSpeakerDetector(rt, attendeeId, bandwidthPriorityCallback);
      let policy = new DefaultActiveSpeakerPolicy();
      let callbackFired = false;
      const fooAttendee = 'foo-attendee';
      const callback = (_attendeeIds: string[]): void => {
        callbackFired = true;
      };
      detector.subscribe(policy, callback);
      detector.unsubscribe(callback);
      rt.realtimeSetAttendeeIdPresence(fooAttendee, true, null, false);
      rt.realtimeUpdateVolumeIndicator(fooAttendee, 10, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee, 10, false, 1, null);
      expect(callbackFired).to.be.false;
    });
  });
});
