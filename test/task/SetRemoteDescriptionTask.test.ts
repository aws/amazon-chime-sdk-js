// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

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
import { delay } from '../utils';

describe('SetRemoteDescriptionTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let context: AudioVideoControllerState;
  let domMockBehavior: DOMMockBehavior | null = null;
  let domMockBuilder: DOMMockBuilder | null = null;
  let turnCredentials: MeetingSessionTURNCredentials;
  let task: Task;

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
    // Wait for calls to finish.
    await delay(100);
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
    it('can be run and succeed with turn credentials', done => {
      task.run().then(() => {
        const peerSDPAnswer = context.peer.currentRemoteDescription.sdp;
        expect(peerSDPAnswer).to.be.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
        done();
      });
    });

    it('can be run and succeed without turn credentials', done => {
      context.turnCredentials = null;
      task.run().then(() => {
        const peerSDPAnswer = context.peer.currentRemoteDescription.sdp;
        expect(peerSDPAnswer).to.be.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
        done();
      });
    });

    it('can be run and received parameters are correct', done => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
          const result = super.setRemoteDescription(description);
          expect(description.sdp).to.be.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
          expect(description.type).to.be.equal('answer');
          return result;
        }
      }
      context.peer = new TestPeerConnectionMock();
      task.run().then(() => done());
    });

    it('can proceed if it receives the connected state instead of completed', done => {
      domMockBehavior.iceConnectionStates = ['connected'];
      context.peer = new RTCPeerConnection();
      task.run().then(() => done());
    });

    it('ignores connection states that are not completed or connected', done => {
      domMockBehavior.iceConnectionStates = ['someotherstate', 'completed'];
      context.peer = new RTCPeerConnection();
      task.run().then(() => done());
    });

    it('can be run and succeed with stereo audio profile', done => {
      context.audioProfile = AudioProfile.fullbandMusicStereo();
      task.run().then(() => {
        const peerSDPAnswer = context.peer.currentRemoteDescription.sdp;
        expect(peerSDPAnswer).to.be.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER_WITH_STEREO);
        done();
      });
    });

    it('will update sdp with send codec preferences', done => {
      context.sdpAnswer = SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO;
      context.videoSendCodecPreferences = [VideoCodecCapability.h264(), VideoCodecCapability.vp8()];
      task.run().then(() => {
        const peerSDPAnswer = context.peer.currentRemoteDescription.sdp;
        expect(peerSDPAnswer).to.be.equal(
          SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_PREFERS_H264_CBP_THEN_VP8
        );
        done();
      });
    });

    it('will update sdp with meeting intersection codec preferences if they exist', done => {
      context.sdpAnswer = SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO;
      context.videoSendCodecPreferences = [VideoCodecCapability.vp8(), VideoCodecCapability.h264()];
      context.meetingSupportedVideoSendCodecPreferences = [
        VideoCodecCapability.h264(),
        VideoCodecCapability.vp8(),
      ];
      task.run().then(() => {
        const peerSDPAnswer = context.peer.currentRemoteDescription.sdp;
        expect(peerSDPAnswer).to.be.equal(
          SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_PREFERS_H264_CBP_THEN_VP8
        );
        done();
      });
    });

    it('sets content hint for SVC content', done => {
      context.sdpAnswer = SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO;
      context.audioVideoController.configuration.credentials.attendeeId = 'attendee#content';
      context.audioVideoController.configuration.enableSVC = true;
      context.activeVideoInput = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      context.activeVideoInput.addTrack(track);
      task.run().then(() => done());
    });

    it('sets content hint for AV1 content', done => {
      context.sdpAnswer = SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO_AV1;
      context.audioVideoController.configuration.credentials.attendeeId = 'attendee#content';
      context.activeVideoInput = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      context.activeVideoInput.addTrack(track);
      task.run().then(() => done());
    });

    it('does not set content hint for non AV1/SVC content', done => {
      context.sdpAnswer = SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO;
      context.audioVideoController.configuration.credentials.attendeeId = 'attendee#content';
      context.currentVideoSendCodec = VideoCodecCapability.h264ConstrainedBaselineProfile();
      context.activeVideoInput = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      context.activeVideoInput.addTrack(track);
      task.run().then(() => done());
    });

    it('can handle undefined current video send codec', done => {
      context.sdpAnswer = SDPMock.CHROME_UNIFIED_PLAN_AUDIO_ONLY_WITH_VIDEO_CHECK_IN;
      context.audioVideoController.configuration.credentials.attendeeId = 'attendee#content';
      context.currentVideoSendCodec = undefined;
      context.activeVideoInput = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      context.activeVideoInput.addTrack(track);
      task.run().then(() => done());
    });
  });

  describe('cancel', () => {
    it('can cancel a task while waiting for the "connected" or "completed" event', done => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setRemoteDescription(_description: RTCSessionDescriptionInit): Promise<void> {
          return;
        }
      }
      context.peer = new TestPeerConnectionMock();

      task.run().catch(err => {
        expect(err.message).have.string('canceled');
        done();
      });
      task.cancel();
    });

    it('can cancel a task before running a task', done => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setRemoteDescription(_description: RTCSessionDescriptionInit): Promise<void> {
          return;
        }
      }
      context.peer = new TestPeerConnectionMock();
      context.peer.addEventListener('iceconnectionstatechange', () => {
        done(new Error('This line should not be reached.'));
      });
      task.cancel();
      task
        .run()
        .then()
        .catch(err => {
          expect(err.message).have.string('canceled');
          done();
        });
    });

    it('can cancel a task when the peer is not available', done => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setRemoteDescription(_description: RTCSessionDescriptionInit): Promise<void> {
          return;
        }
      }
      context.peer = new TestPeerConnectionMock();

      task.run().catch(err => {
        expect(err.message).have.string('canceled');
        done();
      });
      context.peer = null;
      task.cancel();
    });
  });

  describe('throw', () => {
    it('can throw error during failure to set remote description', done => {
      class TestPeerConnectionMock extends RTCPeerConnection {
        setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
          expect(description.sdp).to.be.equal(SDPMock.VIDEO_HOST_AUDIO_ANSWER);
          return new Promise<void>((_resolve, reject) => {
            reject();
          });
        }
      }
      context.peer = new TestPeerConnectionMock();
      task.run().catch(() => done());
    });

    it('can throw error when peer is null', done => {
      context.peer = null;
      task.run().catch(() => done());
    });
  });
});
