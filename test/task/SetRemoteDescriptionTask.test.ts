// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import MeetingSessionTURNCredentials from '../../src/meetingsession/MeetingSessionTURNCredentials';
import SetRemoteDescriptionTask from '../../src/task/SetRemoteDescriptionTask';
import Task from '../../src/task/Task';
import DefaultVideoAndCaptureParameter from '../../src/videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import FirefoxSDPMock from '../sdp/FirefoxSDPMock';
import SDPMock from '../sdp/SDPMock';

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

  afterEach(() => {
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
  });

  describe('run with Firefox 68', () => {
    beforeEach(() => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:68.0) Gecko/20100101 Firefox/68.0';
      context.browserBehavior = new DefaultBrowserBehavior();
    });

    it('uses the sdp answer if both offer and answer have a video', done => {
      const localDescription: RTCSessionDescriptionInit = {
        type: 'offer',
        sdp: SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO,
      };
      context.peer.setLocalDescription(localDescription);
      context.sdpAnswer = FirefoxSDPMock.FIREFOX_REMOTE_ANSWER_WITH_VP8_H264_UNSORTED;

      task.run().then(() => {
        expect(context.peer.currentRemoteDescription.sdp).to.deep.equal(
          FirefoxSDPMock.FIREFOX_REMOTE_ANSWER_WITH_VP8_H264_SORTED
        );
        done();
      });
    });
  });

  describe('run in Plan B', () => {
    beforeEach(() => {
      // @ts-ignore
      navigator.userAgent = 'Chrome/77.0.3865.75';
      context.browserBehavior = new DefaultBrowserBehavior();
    });

    it('copies video sections from the offer to the answer if only the offer has a video', done => {
      const localDescription: RTCSessionDescriptionInit = {
        type: 'offer',
        sdp: SDPMock.VIDEO_HOST_AUDIO_VIDEO_ANSWER,
      };
      context.peer.setLocalDescription(localDescription);

      const remoteDescription: RTCSessionDescription = {
        type: 'answer',
        sdp: context.sdpAnswer,
        toJSON: null,
      };
      context.peer.setRemoteDescription(remoteDescription);
      context.videosToReceive = new DefaultVideoStreamIdSet();

      task.run().then(() => {
        expect(context.peer.currentRemoteDescription.sdp).to.equal(
          SDPMock.VIDEO_HOST_AUDIO_ANSWER_WITH_VIDEO_COPIED
        );
        done();
      });
    });

    it('uses the sdp answer if both offer and answer have a video', done => {
      const localDescription: RTCSessionDescriptionInit = {
        type: 'offer',
        sdp: SDPMock.LOCAL_OFFER_WITH_AUDIO_VIDEO,
      };
      context.peer.setLocalDescription(localDescription);
      context.sdpAnswer = SDPMock.VIDEO_HOST_AUDIO_VIDEO_ANSWER;

      const remoteDescription: RTCSessionDescription = {
        type: 'answer',
        sdp: context.sdpAnswer,
        toJSON: null,
      };
      context.peer.setRemoteDescription(remoteDescription);
      context.videosToReceive = new DefaultVideoStreamIdSet();

      task.run().then(() => {
        expect(context.peer.currentRemoteDescription.sdp).to.equal(context.sdpAnswer);
        done();
      });
    });

    it('uses the sdp answer if the offer does not have a video', done => {
      const localDescription: RTCSessionDescriptionInit = {
        type: 'offer',
        sdp: SDPMock.LOCAL_OFFER_WITHOUT_CANDIDATE,
      };
      context.peer.setLocalDescription(localDescription);
      context.sdpAnswer = SDPMock.VIDEO_HOST_AUDIO_VIDEO_ANSWER;

      const remoteDescription: RTCSessionDescription = {
        type: 'answer',
        sdp: context.sdpAnswer,
        toJSON: null,
      };
      context.peer.setRemoteDescription(remoteDescription);
      context.videosToReceive = new DefaultVideoStreamIdSet();

      task.run().then(() => {
        expect(context.peer.currentRemoteDescription.sdp).to.equal(context.sdpAnswer);
        done();
      });
    });

    it('uses the sdp answer if the remote description is not set before', done => {
      context.videosToReceive = new DefaultVideoStreamIdSet();

      task.run().then(() => {
        expect(context.peer.currentRemoteDescription.sdp).to.equal(context.sdpAnswer);
        done();
      });
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
