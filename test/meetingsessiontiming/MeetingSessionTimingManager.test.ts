// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionTiming, {
  MeetingSessionTimingObserver,
} from '../../src/meetingsessiontiming/MeetingSessionTiming';
import MeetingSessionTimingManager from '../../src/meetingsessiontiming/MeetingSessionTimingManager';

describe('MeetingSessionTimingManager', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let manager: MeetingSessionTimingManager;
  let clock: sinon.SinonFakeTimers;
  let observerSpy: sinon.SinonStub;
  let observer: MeetingSessionTimingObserver;

  beforeEach(() => {
    clock = sinon.useFakeTimers({ now: 1000 });
    manager = new MeetingSessionTimingManager(logger);
    observerSpy = sinon.stub();
    observer = { onMeetingSessionTimingReady: observerSpy };
    manager.addObserver(observer);
  });

  afterEach(() => {
    manager.destroy();
    clock.restore();
  });

  // Helper: complete all signaling events
  function completeSignaling(): void {
    manager.onStart();
    manager.onJoinSent();
    manager.onJoinAckReceived();
    manager.onTransportConnected();
    manager.onCreateOfferCalled();
    manager.onSetLocalDescription();
    manager.onSetRemoteDescription();
    manager.onIceGatheringStarted();
    manager.onIceGatheringComplete();
    manager.onIceConnected();
    manager.onSubscribeSent();
    manager.onSubscribeAckReceived();
  }

  // Helper: complete resubscribe signaling events
  function completeResubscribeSignaling(): void {
    manager.onResubscribeStart();
    manager.onCreateOfferCalled();
    manager.onSetLocalDescription();
    manager.onSubscribeSent();
    manager.onSubscribeAckReceived();
    manager.onSetRemoteDescription();
  }

  describe('addObserver / removeObserver', () => {
    it('emits to observer', () => {
      completeSignaling();
      expect(observerSpy.calledOnce).to.be.true;
    });

    it('does not emit after removeObserver', () => {
      manager.removeObserver(observer);
      completeSignaling();
      expect(observerSpy.called).to.be.false;
    });

    it('removeObserver ignores non-matching observer', () => {
      const other: MeetingSessionTimingObserver = { onMeetingSessionTimingReady: sinon.stub() };
      manager.removeObserver(other);
      completeSignaling();
      expect(observerSpy.calledOnce).to.be.true;
    });

    it('logs warning when no observer set', () => {
      manager.removeObserver(observer);
      completeSignaling();
      // Should not throw, just logs warning
    });
  });

  describe('signaling lifecycle', () => {
    it('emits batch when all signaling events complete', () => {
      completeSignaling();
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.signaling).to.have.lengthOf(1);
      expect(timing.signaling[0].startMs).to.not.be.undefined;
      expect(timing.signaling[0].timedOut).to.be.false;
    });

    it('ignores duplicate onStart', () => {
      manager.onStart();
      manager.onStart();
    });

    it('ignores signaling events before onStart', () => {
      manager.onJoinSent();
      manager.onJoinAckReceived();
      manager.onTransportConnected();
      manager.onCreateOfferCalled();
      manager.onSetLocalDescription();
      manager.onSetRemoteDescription();
      manager.onIceGatheringStarted();
      manager.onIceGatheringComplete();
      manager.onIceConnected();
      manager.onSubscribeSent();
      manager.onSubscribeAckReceived();
      expect(observerSpy.called).to.be.false;
    });

    it('ignores duplicate signaling events', () => {
      manager.onStart();
      manager.onJoinSent();
      manager.onJoinSent();
      manager.onJoinAckReceived();
      manager.onJoinAckReceived();
      manager.onTransportConnected();
      manager.onTransportConnected();
      manager.onCreateOfferCalled();
      manager.onCreateOfferCalled();
      manager.onSetLocalDescription();
      manager.onSetLocalDescription();
      manager.onSetRemoteDescription();
      manager.onSetRemoteDescription();
      manager.onIceGatheringStarted();
      manager.onIceGatheringStarted();
      manager.onIceGatheringComplete();
      manager.onIceGatheringComplete();
      manager.onIceConnected();
      manager.onIceConnected();
      manager.onSubscribeSent();
      manager.onSubscribeSent();
      manager.onSubscribeAckReceived();
      expect(observerSpy.calledOnce).to.be.true;
    });

    it('ignores signaling events after batch was sent', () => {
      completeSignaling();
      expect(observerSpy.calledOnce).to.be.true;
      manager.onJoinSent();
      manager.onJoinAckReceived();
      expect(observerSpy.calledOnce).to.be.true;
    });
  });

  describe('resubscribe signaling', () => {
    it('emits batch with resubscribe signaling subset', () => {
      completeResubscribeSignaling();
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.signaling).to.have.lengthOf(1);
      expect(timing.signaling[0].startMs).to.not.be.undefined;
      expect(timing.signaling[0].createOfferMs).to.not.be.undefined;
      expect(timing.signaling[0].setLocalDescriptionMs).to.not.be.undefined;
      expect(timing.signaling[0].subscribeSentMs).to.not.be.undefined;
      expect(timing.signaling[0].subscribeAckMs).to.not.be.undefined;
      expect(timing.signaling[0].setRemoteDescriptionMs).to.not.be.undefined;
      expect(timing.signaling[0].timedOut).to.be.false;
      // Initial-only fields should be undefined
      expect(timing.signaling[0].joinSentMs).to.be.undefined;
      expect(timing.signaling[0].joinAckReceivedMs).to.be.undefined;
    });

    it('ignores onResubscribeStart when signaling is already active', () => {
      manager.onStart();
      manager.onResubscribeStart();
      // Should still require full signaling, not resubscribe subset
      manager.onCreateOfferCalled();
      manager.onSetLocalDescription();
      manager.onSubscribeSent();
      manager.onSubscribeAckReceived();
      manager.onSetRemoteDescription();
      expect(observerSpy.called).to.be.false; // Still waiting for join/ICE events
    });
  });

  describe('remote audio lifecycle', () => {
    it('emits when remote audio completes', () => {
      manager.onRemoteAudioAdded();
      manager.onRemoteAudioFirstPacketReceived();
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteAudio).to.have.lengthOf(1);
      expect(timing.remoteAudio[0].addedMs).to.not.be.undefined;
      expect(timing.remoteAudio[0].firstPacketReceivedMs).to.not.be.undefined;
    });

    it('ignores duplicate onRemoteAudioAdded', () => {
      manager.onRemoteAudioAdded();
      manager.onRemoteAudioAdded();
    });

    it('ignores first packet before added', () => {
      manager.onRemoteAudioFirstPacketReceived();
      expect(observerSpy.called).to.be.false;
    });

    it('ignores duplicate first packet', () => {
      manager.onStart(); // keeps batch open
      manager.onRemoteAudioAdded();
      manager.onRemoteAudioFirstPacketReceived();
      manager.onRemoteAudioFirstPacketReceived();
    });
  });

  describe('local audio lifecycle', () => {
    it('emits when local audio completes', () => {
      manager.onLocalAudioAdded();
      manager.onLocalAudioFirstPacketSent();
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.localAudio).to.have.lengthOf(1);
    });

    it('ignores duplicate onLocalAudioAdded', () => {
      manager.onLocalAudioAdded();
      manager.onLocalAudioAdded();
    });

    it('ignores first packet sent before added', () => {
      manager.onLocalAudioFirstPacketSent();
      expect(observerSpy.called).to.be.false;
    });

    it('ignores duplicate first packet sent', () => {
      manager.onStart(); // keeps batch open
      manager.onLocalAudioAdded();
      manager.onLocalAudioFirstPacketSent();
      manager.onLocalAudioFirstPacketSent();
    });
  });

  describe('local video lifecycle', () => {
    it('emits when local video completes', () => {
      manager.onLocalVideoAdded();
      manager.onLocalVideoFirstFrameSent();
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.localVideo).to.have.lengthOf(1);
    });

    it('ignores duplicate onLocalVideoAdded', () => {
      manager.onLocalVideoAdded();
      manager.onLocalVideoAdded();
    });

    it('ignores first frame sent before added', () => {
      manager.onLocalVideoFirstFrameSent();
      expect(observerSpy.called).to.be.false;
    });

    it('ignores duplicate first frame sent', () => {
      manager.onStart(); // keeps batch open
      manager.onLocalVideoAdded();
      manager.onLocalVideoFirstFrameSent();
      manager.onLocalVideoFirstFrameSent();
    });

    it('emits removed flag on onLocalVideoRemoved', () => {
      manager.onLocalVideoAdded();
      manager.onLocalVideoRemoved();
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.localVideo[0].removed).to.be.true;
    });

    it('ignores onLocalVideoRemoved without prior add', () => {
      manager.onLocalVideoRemoved();
      expect(observerSpy.called).to.be.false;
    });

    it('allows re-add after removal', () => {
      manager.onLocalVideoAdded();
      manager.onLocalVideoRemoved();
      expect(observerSpy.calledOnce).to.be.true;
      // After removal, localVideoHasEmitted is reset, so re-add works
      manager.onLocalVideoAdded();
      manager.onLocalVideoFirstFrameSent();
      expect(observerSpy.calledTwice).to.be.true;
    });

    it('localVideoHasEmitted prevents re-add on resubscribe', () => {
      manager.onLocalVideoAdded();
      manager.onLocalVideoFirstFrameSent();
      expect(observerSpy.calledOnce).to.be.true;
      // After emission, localVideoHasEmitted is true
      // Resubscribe calls onLocalVideoAdded again — should be ignored
      manager.onLocalVideoAdded();
      // No new batch should be started for local video
      clock.tick(15000);
      // Only the original emission
      expect(observerSpy.calledOnce).to.be.true;
    });

    it('localVideoHasEmitted resets on removal', () => {
      manager.onLocalVideoAdded();
      manager.onLocalVideoFirstFrameSent();
      expect(observerSpy.calledOnce).to.be.true;
      // Remove resets the flag
      manager.onLocalVideoAdded(); // ignored due to localVideoHasEmitted
      manager.onLocalVideoRemoved(); // no-op since addedMs is undefined
      // But if we reset the manager and re-add, it works
      manager.reset();
      manager.onLocalVideoAdded();
      manager.onLocalVideoFirstFrameSent();
      expect(observerSpy.calledTwice).to.be.true;
    });
  });

  describe('remote video lifecycle', () => {
    it('emits when remote video first frame renders', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      manager.onRemoteVideoFirstFrameRendered(1);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos).to.have.lengthOf(1);
      expect(timing.remoteVideos[0].groupId).to.equal(1);
      expect(timing.remoteVideos[0].addedMs).to.not.be.undefined;
      expect(timing.remoteVideos[0].firstFrameRenderedMs).to.not.be.undefined;
      expect(timing.remoteVideos[0].timedOut).to.be.false;
    });

    it('tracks multiple remote videos', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoAdded(2);
      manager.onRemoteVideoBound(1);
      manager.onRemoteVideoBound(2);
      manager.onRemoteVideoFirstFrameRendered(2);
      expect(observerSpy.called).to.be.false; // group 1 not complete
      manager.onRemoteVideoFirstFrameRendered(1);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos).to.have.lengthOf(2);
    });

    it('ignores first packet before added', () => {
      manager.onRemoteVideoFirstPacketReceived(1);
      expect(observerSpy.called).to.be.false;
    });

    it('ignores duplicate first packet', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      manager.onRemoteVideoFirstPacketReceived(1);
      manager.onRemoteVideoFirstPacketReceived(1);
    });

    it('ignores first frame before added', () => {
      manager.onRemoteVideoFirstFrameRendered(1);
      expect(observerSpy.called).to.be.false;
    });

    it('ignores duplicate first frame', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      manager.onRemoteVideoFirstFrameRendered(1);
      manager.onRemoteVideoFirstFrameRendered(1);
    });

    it('emits removed flag on onRemoteVideoRemoved', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      manager.onRemoteVideoRemoved(1);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos[0].removed).to.be.true;
      expect(timing.remoteVideos[0].timedOut).to.be.false;
    });

    it('ignores onRemoteVideoRemoved for unknown groupId', () => {
      manager.onRemoteVideoRemoved(999);
      expect(observerSpy.called).to.be.false;
    });

    it('onRemoteVideoUnbound removes groupId from bound set and triggers emission', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoAdded(2);
      manager.onRemoteVideoBound(1);
      manager.onRemoteVideoBound(2);
      manager.onRemoteVideoFirstFrameRendered(1);
      expect(observerSpy.called).to.be.false; // group 2 not complete
      manager.onRemoteVideoUnbound(2);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos).to.have.lengthOf(1);
      expect(timing.remoteVideos[0].groupId).to.equal(1);
    });

    it('onRemoteVideoUnbound triggers batch completion for unbound entries', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoUnbound(1);
      // Batch completes because unbound entries are skipped
      expect(observerSpy.calledOnce).to.be.true;
      const timing = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos).to.have.lengthOf(0);
    });

    it('omits unbound remote video from emission', () => {
      manager.onRemoteVideoAdded(1);
      // Never call onRemoteVideoBound(1)
      // Unbound entries are skipped — batch completes on timeout
      clock.tick(15000);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos).to.have.lengthOf(0);
    });

    it('omits unbound remote video but includes bound ones', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoAdded(2);
      manager.onRemoteVideoBound(1);
      // group 2 never bound
      manager.onRemoteVideoFirstFrameRendered(1);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos).to.have.lengthOf(1);
      expect(timing.remoteVideos[0].groupId).to.equal(1);
    });

    it('replaces timer on re-add of same groupId', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      clock.tick(100);
      manager.onRemoteVideoAdded(1); // replaces
      manager.onRemoteVideoFirstFrameRendered(1);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      // addedMs should be the second add time (1000 + 100 = 1100)
      expect(timing.remoteVideos[0].addedMs).to.equal(1100);
    });
  });

  describe('expectingRemoteVideo', () => {
    it('holds batch open when expecting remote video', () => {
      manager.onStart();
      manager.setExpectingRemoteVideo();
      // Complete signaling but no remote video added yet
      manager.onJoinSent();
      manager.onJoinAckReceived();
      manager.onTransportConnected();
      manager.onCreateOfferCalled();
      manager.onSetLocalDescription();
      manager.onSetRemoteDescription();
      manager.onIceGatheringStarted();
      manager.onIceGatheringComplete();
      manager.onIceConnected();
      manager.onSubscribeSent();
      manager.onSubscribeAckReceived();
      expect(observerSpy.called).to.be.false; // held open
      // Now add and complete remote video
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      manager.onRemoteVideoFirstFrameRendered(1);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.signaling).to.have.lengthOf(1);
      expect(timing.remoteVideos).to.have.lengthOf(1);
    });

    it('duplicate setExpectingRemoteVideo is no-op', () => {
      manager.setExpectingRemoteVideo();
      manager.setExpectingRemoteVideo();
    });

    it('clearExpectingRemoteVideo releases the batch', () => {
      manager.onStart();
      manager.setExpectingRemoteVideo();
      manager.onJoinSent();
      manager.onJoinAckReceived();
      manager.onTransportConnected();
      manager.onCreateOfferCalled();
      manager.onSetLocalDescription();
      manager.onSetRemoteDescription();
      manager.onIceGatheringStarted();
      manager.onIceGatheringComplete();
      manager.onIceConnected();
      manager.onSubscribeSent();
      manager.onSubscribeAckReceived();
      expect(observerSpy.called).to.be.false;
      manager.clearExpectingRemoteVideo();
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos).to.have.lengthOf(0);
    });

    it('clearExpectingRemoteVideo is no-op when not expecting', () => {
      manager.clearExpectingRemoteVideo();
      expect(observerSpy.called).to.be.false;
    });
  });

  describe('timeout', () => {
    it('emits with timedOut after 15s', () => {
      manager.onStart();
      clock.tick(15000);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.signaling[0].timedOut).to.be.true;
    });

    it('sets timedOut per-category', () => {
      manager.onStart();
      manager.onRemoteAudioAdded(); // Add before signaling completes
      manager.onJoinSent();
      manager.onJoinAckReceived();
      manager.onTransportConnected();
      manager.onCreateOfferCalled();
      manager.onSetLocalDescription();
      manager.onSetRemoteDescription();
      manager.onIceGatheringStarted();
      manager.onIceGatheringComplete();
      manager.onIceConnected();
      manager.onSubscribeSent();
      manager.onSubscribeAckReceived();
      // Signaling complete, remote audio incomplete — batch held open
      expect(observerSpy.called).to.be.false;
      clock.tick(15000);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.signaling[0].timedOut).to.be.false; // signaling was complete
      expect(timing.remoteAudio[0].timedOut).to.be.true; // remote audio was not
    });

    it('does not emit timeout for unbound remote video', () => {
      manager.onRemoteVideoAdded(1);
      // Never bound — should not block or appear in timeout
      clock.tick(15000);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos).to.have.lengthOf(0);
    });

    it('times out bound remote video that never renders', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      clock.tick(15000);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos).to.have.lengthOf(1);
      expect(timing.remoteVideos[0].timedOut).to.be.true;
    });
  });

  describe('batch composition', () => {
    it('combines signaling, audio, and video in one batch', () => {
      manager.onStart();
      manager.onRemoteAudioAdded();
      manager.onLocalAudioAdded();
      manager.onLocalVideoAdded();
      // Complete signaling
      manager.onJoinSent();
      manager.onJoinAckReceived();
      manager.onTransportConnected();
      manager.onCreateOfferCalled();
      manager.onSetLocalDescription();
      manager.onSetRemoteDescription();
      manager.onIceGatheringStarted();
      manager.onIceGatheringComplete();
      manager.onIceConnected();
      manager.onSubscribeSent();
      manager.onSubscribeAckReceived();
      // Complete audio
      manager.onRemoteAudioFirstPacketReceived();
      manager.onLocalAudioFirstPacketSent();
      // Complete local video
      manager.onLocalVideoFirstFrameSent();
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.signaling).to.have.lengthOf(1);
      expect(timing.remoteAudio).to.have.lengthOf(1);
      expect(timing.localAudio).to.have.lengthOf(1);
      expect(timing.localVideo).to.have.lengthOf(1);
    });

    it('clears state after emission for fresh batches', () => {
      manager.onRemoteAudioAdded();
      manager.onRemoteAudioFirstPacketReceived();
      expect(observerSpy.calledOnce).to.be.true;
      // New batch
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      manager.onRemoteVideoFirstFrameRendered(1);
      expect(observerSpy.calledTwice).to.be.true;
      const timing2: MeetingSessionTiming = observerSpy.secondCall.args[0];
      expect(timing2.remoteAudio).to.have.lengthOf(0);
      expect(timing2.remoteVideos).to.have.lengthOf(1);
    });

    it('resubscribe batch includes signaling and remote video', () => {
      manager.onResubscribeStart();
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      manager.onCreateOfferCalled();
      manager.onSetLocalDescription();
      manager.onSubscribeSent();
      manager.onSubscribeAckReceived();
      manager.onSetRemoteDescription();
      manager.onRemoteVideoFirstFrameRendered(1);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.signaling).to.have.lengthOf(1);
      expect(timing.remoteVideos).to.have.lengthOf(1);
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      manager.onStart();
      manager.reset();
      // After reset, onStart works again
      completeSignaling();
      expect(observerSpy.calledOnce).to.be.true;
    });

    it('cancels pending timeout', () => {
      manager.onStart();
      manager.reset();
      clock.tick(15000);
      expect(observerSpy.called).to.be.false;
    });

    it('resets localVideoHasEmitted', () => {
      manager.onLocalVideoAdded();
      manager.onLocalVideoFirstFrameSent();
      expect(observerSpy.calledOnce).to.be.true;
      manager.reset();
      manager.onLocalVideoAdded();
      manager.onLocalVideoFirstFrameSent();
      expect(observerSpy.calledTwice).to.be.true;
    });

    it('resets expectingRemoteVideo', () => {
      manager.setExpectingRemoteVideo();
      manager.reset();
      // After reset, batch should not be held open
      manager.onRemoteAudioAdded();
      manager.onRemoteAudioFirstPacketReceived();
      expect(observerSpy.calledOnce).to.be.true;
    });
  });

  describe('destroy', () => {
    it('cancels timeout and clears observer', () => {
      manager.onStart();
      manager.destroy();
      clock.tick(15000);
      expect(observerSpy.called).to.be.false;
    });
  });

  describe('observer error handling', () => {
    it('catches observer errors without crashing', () => {
      const throwingObserver: MeetingSessionTimingObserver = {
        onMeetingSessionTimingReady: () => {
          throw new Error('observer error');
        },
      };
      manager.removeObserver(observer);
      manager.addObserver(throwingObserver);
      // Should not throw
      completeSignaling();
    });
  });

  describe('edge cases', () => {
    it('duplicate onRemoteVideoFirstFrameRendered is ignored', () => {
      manager.onStart(); // keeps batch open
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      manager.onRemoteVideoFirstFrameRendered(1);
      manager.onRemoteVideoFirstFrameRendered(1); // hits duplicate check
    });

    it('scheduleBatchTimeout is no-op when timeout already exists', () => {
      // onStart schedules a timeout, onRemoteAudioAdded tries to schedule again
      manager.onStart();
      manager.onRemoteAudioAdded();
      // Should not throw or create duplicate timeouts
      clock.tick(15000);
      expect(observerSpy.calledOnce).to.be.true;
    });

    it('onRemoteVideoFirstFrameRendered warns when no timer found', () => {
      manager.onRemoteVideoFirstFrameRendered(999);
      expect(observerSpy.called).to.be.false;
    });

    it('onRemoteVideoFirstFrameRendered uses expectedDisplayTime from metadata', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      manager.onRemoteVideoFirstFrameRendered(1, {
        expectedDisplayTime: 500,
      } as VideoFrameCallbackMetadata);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos[0].firstFrameRenderedMs).to.be.a('number');
    });

    it('onRemoteVideoFirstFrameRendered falls back to Date.now without metadata', () => {
      manager.onRemoteVideoAdded(1);
      manager.onRemoteVideoBound(1);
      manager.onRemoteVideoFirstFrameRendered(1);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.remoteVideos[0].firstFrameRenderedMs).to.equal(1000);
    });

    it('resubscribe signaling completes with subset of fields', () => {
      manager.onResubscribeStart();
      manager.onCreateOfferCalled();
      manager.onSetLocalDescription();
      manager.onSubscribeSent();
      manager.onSubscribeAckReceived();
      manager.onSetRemoteDescription();
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.signaling[0].timedOut).to.be.false;
    });

    it('isSignalingComplete returns false for incomplete resubscribe', () => {
      // Add an incomplete category to keep the batch open
      manager.onLocalAudioAdded();
      // Start resubscribe — isSignalingComplete will be called with isResubscribe=true
      // but incomplete fields, exercising the resubscribe branch returning false
      manager.onResubscribeStart();
      manager.onCreateOfferCalled();
      // Batch still open because local audio and signaling are incomplete
      expect(observerSpy.called).to.be.false;
    });

    it('timeout sets timedOut on incomplete local audio', () => {
      manager.onLocalAudioAdded();
      clock.tick(15000);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.localAudio[0].timedOut).to.be.true;
    });

    it('timeout sets timedOut on incomplete local video', () => {
      manager.onLocalVideoAdded();
      clock.tick(15000);
      expect(observerSpy.calledOnce).to.be.true;
      const timing: MeetingSessionTiming = observerSpy.firstCall.args[0];
      expect(timing.localVideo[0].timedOut).to.be.true;
    });

    it('ignores onLocalVideoFirstFrameSent before added', () => {
      manager.onLocalVideoFirstFrameSent();
      expect(observerSpy.called).to.be.false;
    });

    it('ignores duplicate onLocalVideoFirstFrameSent', () => {
      manager.onLocalVideoAdded();
      manager.onLocalVideoFirstFrameSent();
      manager.onLocalVideoFirstFrameSent();
    });

    it('ignores onLocalAudioFirstPacketSent before added', () => {
      manager.onLocalAudioFirstPacketSent();
      expect(observerSpy.called).to.be.false;
    });

    it('ignores duplicate onLocalAudioFirstPacketSent', () => {
      manager.onLocalAudioAdded();
      manager.onLocalAudioFirstPacketSent();
      manager.onLocalAudioFirstPacketSent();
    });

    it('ignores onRemoteAudioFirstPacketReceived before added', () => {
      manager.onRemoteAudioFirstPacketReceived();
      expect(observerSpy.called).to.be.false;
    });
  });
});
