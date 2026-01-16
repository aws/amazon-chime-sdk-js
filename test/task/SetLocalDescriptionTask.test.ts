// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import { DefaultBrowserBehavior, SDP, VideoCodecCapability } from '../../src';
import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import EncodedTransformWorkerManager from '../../src/encodedtransformmanager/EncodedTransformWorkerManager';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import SetLocalDescriptionTask from '../../src/task/SetLocalDescriptionTask';
import Task from '../../src/task/Task';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import SDPMock from '../sdp/SDPMock';

chai.use(chaiAsPromised);
chai.should();

describe('SetLocalDescriptionTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const CRLF = '\r\n';
  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let task: Task;
  const sdpOffer: RTCSessionDescriptionInit = { type: 'offer', sdp: 'sdp-offer' };

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    const peer: RTCPeerConnection = new RTCPeerConnection();
    context.peer = peer;
    context.sdpOfferInit = sdpOffer;
    context.browserBehavior = new DefaultBrowserBehavior();
    task = new SetLocalDescriptionTask(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      expect(task).to.not.equal(null);
    });
  });

  describe('run', async () => {
    it('can be run and succeed', async () => {
      await task.run();
      const peerLocalSDP = context.peer.localDescription.sdp;
      expect(peerLocalSDP).to.be.equal(sdpOffer.sdp + CRLF);
    });

    it('can be run and succeed in iOS 15.1', async () => {
      domMockBehavior.browserName = 'ios15.1';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      await task.run();
      const peerLocalSDP = context.peer.localDescription.sdp;
      expect(peerLocalSDP).to.be.equal(sdpOffer.sdp + CRLF);
    });

    it('can be run and received parameters are correct', async () => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
          expect(description.sdp).to.be.equal(sdpOffer.sdp + CRLF);
          return new Promise<void>((resolve, _reject) => {
            resolve();
          });
        }
      }
      const peer: RTCPeerConnection = new TestPeerConnectionMock();
      context.peer = peer;
      await task.run();
    });

    it('can throw error during failure to set local description', async () => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
          expect(description.sdp).to.be.equal(sdpOffer.sdp + CRLF);
          return new Promise<void>((_resolve, reject) => {
            reject();
          });
        }
      }
      const peer: RTCPeerConnection = new TestPeerConnectionMock();
      context.peer = peer;
      expect(task.run()).to.eventually.be.rejected;
    });

    it('handles when the setLocalDescription call fails', async () => {
      domMockBehavior.setLocalDescriptionSucceeds = false;
      expect(task.run()).to.eventually.be.rejected;
    });

    it('can be run and succeed with stereo audio profile', async () => {
      context.audioProfile = AudioProfile.fullbandMusicStereo();
      await task.run();
      const peerLocalSDP = context.peer.localDescription.sdp;
      expect(peerLocalSDP).to.be.equal(sdpOffer.sdp + CRLF);
    });

    it('will update sdp with send codec preferences', async () => {
      context.videoSendCodecPreferences = [VideoCodecCapability.h264(), VideoCodecCapability.vp8()];
      context.sdpOfferInit = { type: 'offer', sdp: SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO };
      await task.run();
      const peerLocalSDP = context.peer.localDescription.sdp;
      expect(
        new SDP(peerLocalSDP).highestPriorityVideoSendCodec().equals(VideoCodecCapability.h264())
      ).to.be.be.true;
    });

    it('will update sdp with meeting intersection codec preferences if they exist', async () => {
      context.videoSendCodecPreferences = [VideoCodecCapability.vp8(), VideoCodecCapability.h264()];
      context.meetingSupportedVideoSendCodecPreferences = [
        VideoCodecCapability.h264(),
        VideoCodecCapability.vp8(),
      ];
      context.sdpOfferInit = { type: 'offer', sdp: SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO };
      await task.run();
      const peerLocalSDP = context.peer.localDescription.sdp;
      expect(
        new SDP(peerLocalSDP).highestPriorityVideoSendCodec().equals(VideoCodecCapability.h264())
      ).to.be.be.true;
    });

    it('sets audio payload types on redundant audio manager when audio redundancy is enabled', async () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'chrome116';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      context.sdpOfferInit = { type: 'offer', sdp: SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO };
      context.audioProfile = new AudioProfile(null, true);
      const setAudioPayloadTypesSpy = sinon.stub();
      context.encodedTransformWorkerManager = ({
        isEnabled: () => true,
        redundantAudioEncodeTransformManager: () => ({
          setAudioPayloadTypes: setAudioPayloadTypesSpy,
        }),
      } as unknown) as EncodedTransformWorkerManager;
      await task.run();
      expect(setAudioPayloadTypesSpy.calledOnce).to.be.true;
    });

    it('does not set audio payload types when encodedTransformWorkerManager is not enabled', async () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'chrome116';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      context.sdpOfferInit = { type: 'offer', sdp: SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO };
      context.audioProfile = new AudioProfile(null, true);
      // encodedTransformWorkerManager is undefined
      await task.run();
    });

    it('does not set audio payload types when encodedTransformWorkerManager.isEnabled returns false', async () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'chrome116';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      context.sdpOfferInit = { type: 'offer', sdp: SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO };
      context.audioProfile = new AudioProfile(null, true);
      context.encodedTransformWorkerManager = ({
        isEnabled: () => false,
      } as unknown) as EncodedTransformWorkerManager;
      await task.run();
    });

    it('handles when redundantAudioEncodeTransformManager returns null', async () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'chrome116';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      context.sdpOfferInit = { type: 'offer', sdp: SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO };
      context.audioProfile = new AudioProfile(null, true);
      context.encodedTransformWorkerManager = ({
        isEnabled: () => true,
        // @ts-ignore
        redundantAudioEncodeTransformManager: () => null,
      } as unknown) as EncodedTransformWorkerManager;
      // Should not throw
      await task.run();
    });

    it('sets start bitrate for SVC content', async () => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
          expect(description.sdp).to.be.equal(sdpOffer.sdp + CRLF);
          return new Promise<void>((resolve, _reject) => {
            resolve();
          });
        }
      }
      const peer: RTCPeerConnection = new TestPeerConnectionMock();
      context.peer = peer;
      context.audioVideoController.configuration.credentials.attendeeId = 'attendee#content';
      context.audioVideoController.configuration.enableSVC = true;
      await task.run();
    });
  });

  describe('cancel', () => {
    it('allows a no-op cancel after completion', async () => {
      await task.run();
      // @ts-ignore
      expect(task.cancelPromise).to.be.undefined;
      task.cancel();
      // @ts-ignore
      expect(task.cancelPromise).to.be.undefined;
    });

    it('cancels a task when the session is timed out', async () => {
      domMockBehavior.asyncWaitMs = 500;
      new TimeoutScheduler(50).start(() => {
        task.cancel();
      });

      expect(task.run()).to.eventually.be.rejected;
    });
  });
});
