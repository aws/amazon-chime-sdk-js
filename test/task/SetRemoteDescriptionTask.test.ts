// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { VideoCodecCapability } from '../../src';
import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import MeetingSessionTURNCredentials from '../../src/meetingsession/MeetingSessionTURNCredentials';
import SetRemoteDescriptionTask from '../../src/task/SetRemoteDescriptionTask';
import Task from '../../src/task/Task';
import DefaultVideoAndCaptureParameter from '../../src/videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import SDPMock from '../sdp/SDPMock';
import { createFakeTimers, tick } from '../utils/fakeTimerHelper';

describe('SetRemoteDescriptionTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const ASYNC_WAIT_MS = 10; // DOMMockBehavior.asyncWaitMs default
  let context: AudioVideoControllerState;
  let domMockBehavior: DOMMockBehavior | null = null;
  let domMockBuilder: DOMMockBuilder | null = null;
  let turnCredentials: MeetingSessionTURNCredentials;
  let task: Task;
  let clock: sinon.SinonFakeTimers;

  function makeTURNCredentials(): MeetingSessionTURNCredentials {
    const testCredentials = new MeetingSessionTURNCredentials();
    testCredentials.username = 'fakeUsername';
    testCredentials.password = 'fakeTURNCredentials';
    testCredentials.ttl = Infinity;
    testCredentials.uris = ['fakeUDPURI', 'fakeTCPURI'];

    return testCredentials;
  }

  before(() => {
    turnCredentials = makeTURNCredentials();
  });

  beforeEach(() => {
    clock = createFakeTimers();
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);

    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.videoTileController = context.audioVideoController.videoTileController;
    context.logger = context.audioVideoController.logger;

    const peer: RTCPeerConnection = new RTCPeerConnection();
    context.peer = peer;
    context.sdpAnswer = SDPMock.VIDEO_HOST_AUDIO_ANSWER;
    context.turnCredentials = turnCredentials;
    context.videoCaptureAndEncodeParameter = new DefaultVideoAndCaptureParameter(0, 0, 0, 0, false);
    context.browserBehavior = new DefaultBrowserBehavior();
    // @ts-ignore
    task = new SetRemoteDescriptionTask(context);
  });

  afterEach(async () => {
    // Advance time to allow any pending timers to complete
    await tick(clock, 100);
    clock.restore();
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('construction', () => {
    it('can be constructed', () => {
      expect(task).to.not.equal(null);
    });
  });

  describe('run', () => {
    it('can be run and succeed with turn credentials', async () => {
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
      const peerSDPAnswer = context.peer.currentRemoteDescription.sdp;
      expect(peerSDPAnswer).to.be.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
    });

    it('can be run and succeed without turn credentials', async () => {
      context.turnCredentials = null;
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
      const peerSDPAnswer = context.peer.currentRemoteDescription.sdp;
      expect(peerSDPAnswer).to.be.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
    });

    it('can be run and received parameters are correct', async () => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
          const result = super.setRemoteDescription(description);
          expect(description.sdp).to.be.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
          expect(description.type).to.be.equal('answer');
          return result;
        }
      }
      context.peer = new TestPeerConnectionMock();
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
    });

    it('can proceed if it receives the connected state instead of completed', async () => {
      domMockBehavior.iceConnectionStates = ['connected'];
      context.peer = new RTCPeerConnection();
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
    });

    it('ignores connection states that are not completed or connected', async () => {
      domMockBehavior.iceConnectionStates = ['someotherstate', 'completed'];
      context.peer = new RTCPeerConnection();
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
    });

    it('can be run and succeed with stereo audio profile', async () => {
      context.audioProfile = AudioProfile.fullbandMusicStereo();
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
      const peerSDPAnswer = context.peer.currentRemoteDescription.sdp;
      expect(peerSDPAnswer).to.be.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER_WITH_STEREO);
    });

    it('will update sdp with send codec preferences', async () => {
      context.sdpAnswer = SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO;
      context.videoSendCodecPreferences = [VideoCodecCapability.h264(), VideoCodecCapability.vp8()];
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
      const peerSDPAnswer = context.peer.currentRemoteDescription.sdp;
      expect(peerSDPAnswer).to.be.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_PREFERS_H264_CBP_THEN_VP8
      );
    });

    it('will update sdp with meeting intersection codec preferences if they exist', async () => {
      context.sdpAnswer = SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO;
      context.videoSendCodecPreferences = [VideoCodecCapability.vp8(), VideoCodecCapability.h264()];
      context.meetingSupportedVideoSendCodecPreferences = [
        VideoCodecCapability.h264(),
        VideoCodecCapability.vp8(),
      ];
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
      const peerSDPAnswer = context.peer.currentRemoteDescription.sdp;
      expect(peerSDPAnswer).to.be.equal(
        SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_PREFERS_H264_CBP_THEN_VP8
      );
    });

    it('sets content hint for SVC content', async () => {
      context.sdpAnswer = SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO;
      context.audioVideoController.configuration.credentials.attendeeId = 'attendee#content';
      context.audioVideoController.configuration.enableSVC = true;
      context.activeVideoInput = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      context.activeVideoInput.addTrack(track);
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
    });

    it('sets content hint for AV1 content', async () => {
      context.sdpAnswer = SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_AV1;
      context.audioVideoController.configuration.credentials.attendeeId = 'attendee#content';
      context.activeVideoInput = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      context.activeVideoInput.addTrack(track);
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
    });

    it('does not set content hint for non AV1/SVC content', async () => {
      context.sdpAnswer = SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO;
      context.audioVideoController.configuration.credentials.attendeeId = 'attendee#content';
      context.currentVideoSendCodec = VideoCodecCapability.h264ConstrainedBaselineProfile();
      context.activeVideoInput = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      context.activeVideoInput.addTrack(track);
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
    });

    it('can handle undefined current video send codec', async () => {
      context.sdpAnswer = SDPMock.CHROME_UNIFIED_PLAN_AUDIO_ONLY_WITH_VIDEO_CHECK_IN;
      context.audioVideoController.configuration.credentials.attendeeId = 'attendee#content';
      context.currentVideoSendCodec = undefined;
      context.activeVideoInput = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      context.activeVideoInput.addTrack(track);
      const runPromise = task.run();
      await tick(clock, ASYNC_WAIT_MS);
      await runPromise;
    });
  });

  describe('cancel', () => {
    it('can cancel a task while waiting for the "connected" or "completed" event', async () => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setRemoteDescription(_description: RTCSessionDescriptionInit): Promise<void> {
          return;
        }
      }
      context.peer = new TestPeerConnectionMock();

      const runPromise = task.run();
      task.cancel();
      try {
        await runPromise;
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).have.string('canceled');
      }
    });

    it('can cancel a task before running a task', async () => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setRemoteDescription(_description: RTCSessionDescriptionInit): Promise<void> {
          return;
        }
      }
      context.peer = new TestPeerConnectionMock();
      let eventFired = false;
      context.peer.addEventListener('iceconnectionstatechange', () => {
        eventFired = true;
      });
      task.cancel();
      try {
        await task.run();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).have.string('canceled');
        expect(eventFired).to.be.false;
      }
    });

    it('can cancel a task when the peer is not available', async () => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setRemoteDescription(_description: RTCSessionDescriptionInit): Promise<void> {
          return;
        }
      }
      context.peer = new TestPeerConnectionMock();

      const runPromise = task.run();
      context.peer = null;
      task.cancel();
      try {
        await runPromise;
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).have.string('canceled');
      }
    });
  });

  describe('throw', () => {
    it('can throw error during failure to set remote description', async () => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
          expect(description.sdp).to.be.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
          return new Promise<void>((_resolve, reject) => {
            reject();
          });
        }
      }
      context.peer = new TestPeerConnectionMock();
      try {
        await task.run();
        expect.fail('Should have thrown');
      } catch (err) {
        // Expected to throw
      }
    });

    it('can throw error when peer is null', async () => {
      context.peer = null;
      try {
        await task.run();
        expect.fail('Should have thrown');
      } catch (err) {
        // Expected to throw
      }
    });
  });
});
