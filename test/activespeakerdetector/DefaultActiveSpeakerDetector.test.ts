// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultActiveSpeakerDetector from '../../src/activespeakerdetector/DefaultActiveSpeakerDetector';
import DefaultActiveSpeakerPolicy from '../../src/activespeakerpolicy/DefaultActiveSpeakerPolicy';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';

describe('DefaultActiveSpeakerDetector', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const fooAttendee1 = 'foo-attendee1';
  const fooAttendee2 = 'foo-attendee2';
  const attendeeId = 'self';
  const bandwidthPriorityCallback = (): void => {};
  async function delay(timeoutMs: number): Promise<void> {
    await new Promise(resolve => new TimeoutScheduler(timeoutMs).start(resolve));
  }
  const talkingVolumeSimulator = (i: number, volume: number): number =>
    volume * (0.5 + 0.5 * (i % 2));

  describe('construction', () => {
    it('can be constructed', () => {
      const rt = new DefaultRealtimeController();
      const detector = new DefaultActiveSpeakerDetector(rt, attendeeId, bandwidthPriorityCallback);
      expect(detector).to.not.equal(null);
    });
  });

  describe('subscribeToActiveSpeakerDetector', () => {
    it('can subscribe to detector', () => {
      const rt = new DefaultRealtimeController();
      const detector = new DefaultActiveSpeakerDetector(rt, attendeeId, bandwidthPriorityCallback);
      const policy = new DefaultActiveSpeakerPolicy();
      const callback = (_attendeeIds: string[]): void => {};
      detector.subscribe(policy, callback);
      detector.unsubscribe(callback);
    });

    it('attendee id change should trigger the active speaker detector', () => {
      const rt = new DefaultRealtimeController();
      const detector = new DefaultActiveSpeakerDetector(rt, attendeeId, bandwidthPriorityCallback);
      const policy = new DefaultActiveSpeakerPolicy();
      let callbackFired = false;
      const callback = (_attendeeIds: string[]): void => {
        callbackFired = true;
      };
      detector.subscribe(policy, callback);
      rt.realtimeSetAttendeeIdPresence(fooAttendee1, true, null, false, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee1, 1, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee1, 1, false, 1, null);
      expect(callbackFired).to.be.true;
      callbackFired = false;
      rt.realtimeUpdateVolumeIndicator(fooAttendee1, 1, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee1, 0, false, 1, null);
      expect(callbackFired).to.be.false;
      rt.realtimeSetAttendeeIdPresence(fooAttendee1, false, null, true, null);
      expect(callbackFired).to.be.true;
      detector.unsubscribe(callback);
    });

    it('can return sorted active speakers', () => {
      const rt = new DefaultRealtimeController();
      const detector = new DefaultActiveSpeakerDetector(rt, attendeeId, bandwidthPriorityCallback);
      const policy = new DefaultActiveSpeakerPolicy();
      const callback = (attendeeIds: string[]): void => {
        expect(attendeeIds.length === 2).to.be.true;
        expect(attendeeIds[0] === fooAttendee2).to.be.true;
      };
      detector.subscribe(policy, callback);
      rt.realtimeSetAttendeeIdPresence(fooAttendee1, true, null, false, null);
      rt.realtimeSetAttendeeIdPresence(fooAttendee2, true, null, false, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee1, 0.1, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee1, 0.2, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee2, 0.1, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee2, 0.9, false, 1, null);
      detector.unsubscribe(callback);
    });

    it('can switch between active speakers', () => {
      const rt = new DefaultRealtimeController();
      const detector = new DefaultActiveSpeakerDetector(rt, attendeeId, bandwidthPriorityCallback);
      const policy = new DefaultActiveSpeakerPolicy();
      const talkLength = 100;
      const steps: boolean[] = [];
      const callback = (attendeeIds: string[]): void => {
        if (steps.length === 0) {
          steps.push(attendeeIds.length === 0);
        } else if (steps.length === 1) {
          steps.push(attendeeIds.length === 1 && attendeeIds[0] === fooAttendee1);
        } else if (steps.length === 2) {
          steps.push(
            attendeeIds.length === 2 &&
              attendeeIds[0] === fooAttendee1 &&
              attendeeIds[1] === fooAttendee2
          );
        } else if (steps.length === 3) {
          steps.push(attendeeIds.length === 1 && attendeeIds[0] === fooAttendee2);
        } else if (steps.length === 4) {
          steps.push(attendeeIds.length === 0);
        }
      };
      detector.subscribe(policy, callback);
      rt.realtimeSetAttendeeIdPresence(fooAttendee1, true, null, false, null);
      rt.realtimeSetAttendeeIdPresence(fooAttendee2, true, null, false, null);
      for (let i = 0; i < talkLength; i++) {
        rt.realtimeUpdateVolumeIndicator(
          fooAttendee1,
          talkingVolumeSimulator(i, 0.01),
          false,
          1,
          null
        );
        rt.realtimeUpdateVolumeIndicator(
          fooAttendee2,
          talkingVolumeSimulator(i, 0.01),
          false,
          1,
          null
        );
      }
      for (let i = 0; i < talkLength; i++) {
        rt.realtimeUpdateVolumeIndicator(
          fooAttendee1,
          talkingVolumeSimulator(i, 1.0),
          false,
          1,
          null
        );
        rt.realtimeUpdateVolumeIndicator(
          fooAttendee2,
          talkingVolumeSimulator(i, 0.01),
          false,
          1,
          null
        );
      }
      for (let i = 0; i < talkLength; i++) {
        rt.realtimeUpdateVolumeIndicator(
          fooAttendee1,
          talkingVolumeSimulator(i, 0.01),
          false,
          1,
          null
        );
        rt.realtimeUpdateVolumeIndicator(
          fooAttendee2,
          talkingVolumeSimulator(i, 1.0),
          false,
          1,
          null
        );
      }
      for (let i = 0; i < talkLength; i++) {
        rt.realtimeUpdateVolumeIndicator(
          fooAttendee1,
          talkingVolumeSimulator(i, 0.01),
          false,
          1,
          null
        );
        rt.realtimeUpdateVolumeIndicator(
          fooAttendee2,
          talkingVolumeSimulator(i, 0.01),
          false,
          1,
          null
        );
      }
      expect(steps.length).to.equal(5);
      expect(steps.every(step => step === true)).to.be.true;
      detector.unsubscribe(callback);
    });

    it('will decay the score over time and turn off active speaker', async () => {
      const rt = new DefaultRealtimeController();
      const detector = new DefaultActiveSpeakerDetector(
        rt,
        fooAttendee1,
        bandwidthPriorityCallback,
        10,
        5
      );
      const policy = new DefaultActiveSpeakerPolicy();
      const talkLength = 100;
      const steps: boolean[] = [];
      const callback = (attendeeIds: string[]): void => {
        if (steps.length === 0) {
          steps.push(attendeeIds.length === 1 && attendeeIds[0] === fooAttendee1);
        } else if (steps.length === 1) {
          steps.push(attendeeIds.length === 0);
        }
      };
      detector.subscribe(
        policy,
        callback,
        (_scores: { [attendeeId: string]: number }): void => {},
        100
      );
      rt.realtimeSetAttendeeIdPresence(fooAttendee1, true, null, false, null);
      rt.realtimeSetAttendeeIdPresence(fooAttendee2, true, null, false, null);
      for (let i = 0; i < talkLength; i++) {
        rt.realtimeUpdateVolumeIndicator(
          fooAttendee1,
          talkingVolumeSimulator(i, 1.0),
          false,
          1,
          null
        );
        rt.realtimeUpdateVolumeIndicator(
          fooAttendee2,
          talkingVolumeSimulator(i, 0.01),
          false,
          1,
          null
        );
      }
      await delay(1000);
      expect(steps.length).to.equal(2);
      expect(steps.every(step => step === true)).to.be.true;
      detector.unsubscribe(callback);
    });
  });

  describe('unsubscribeFromActiveSpeakerDetector', () => {
    it('can unsubscribe from detector', () => {
      const rt = new DefaultRealtimeController();
      const detector = new DefaultActiveSpeakerDetector(rt, attendeeId, bandwidthPriorityCallback);
      const policy = new DefaultActiveSpeakerPolicy();
      let callbackFired = false;
      const callback = (_attendeeIds: string[]): void => {
        callbackFired = true;
      };
      detector.subscribe(
        policy,
        callback,
        (_scores: { [attendeeId: string]: number }): void => {},
        1000
      );
      detector.unsubscribe(callback);
      // and can unsubscribe twice idempotently
      detector.unsubscribe(callback);
      rt.realtimeSetAttendeeIdPresence(fooAttendee1, true, null, false, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee1, 0.1, false, 1, null);
      rt.realtimeUpdateVolumeIndicator(fooAttendee1, 0.1, false, 1, null);
      expect(callbackFired).to.be.false;
    });
  });
});
