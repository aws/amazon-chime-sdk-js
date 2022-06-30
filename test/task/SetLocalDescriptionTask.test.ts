// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { DefaultBrowserBehavior, SDP, VideoCodecCapability } from '../../src';
import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
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
      expect(peerLocalSDP).to.be.equal(sdpOffer.sdp);
    });

    it('can be run and succeed in iOS 15.1', async () => {
      domMockBehavior.browserName = 'ios15.1';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      await task.run();
      const peerLocalSDP = context.peer.localDescription.sdp;
      expect(peerLocalSDP).to.be.equal(sdpOffer.sdp);
    });

    it('can be run and received parameters are correct', async () => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
          expect(description.sdp).to.be.equal(sdpOffer.sdp);
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
          expect(description.sdp).to.be.equal(sdpOffer.sdp);
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
      expect(peerLocalSDP).to.be.equal(sdpOffer.sdp);
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
