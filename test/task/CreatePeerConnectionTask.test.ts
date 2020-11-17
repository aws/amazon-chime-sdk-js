// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import DefaultAudioMixController from '../../src/audiomixcontroller/DefaultAudioMixController';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import BrowserBehavior from '../../src/browserbehavior/BrowserBehavior';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import NoOpLogger from '../../src/logger/NoOpLogger';
import MeetingSessionTURNCredentials from '../../src/meetingsession/MeetingSessionTURNCredentials';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import CreatePeerConnectionTask from '../../src/task/CreatePeerConnectionTask';
import Task from '../../src/task/Task';
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import VideoTile from '../../src/videotile/VideoTile';
import DefaultVideoTileController from '../../src/videotilecontroller/DefaultVideoTileController';
import DefaultVideoTileFactory from '../../src/videotilefactory/DefaultVideoTileFactory';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import SDPMock from '../sdp/SDPMock';

describe('CreatePeerConnectionTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger();
  const videoRemoteDescription: RTCSessionDescription = {
    type: 'answer',
    sdp: SDPMock.VIDEO_HOST_AUDIO_VIDEO_ANSWER,
    toJSON: null,
  };
  const audioRemoteDescription: RTCSessionDescription = {
    type: 'answer',
    sdp: SDPMock.VIDEO_HOST_AUDIO_ANSWER,
    toJSON: null,
  };
  let domMockBehavior: DOMMockBehavior;
  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder | null = null;
  let task: Task;
  const browser: BrowserBehavior = new DefaultBrowserBehavior();

  function makeICEEvent(candidateStr: string | null): RTCPeerConnectionIceEvent {
    let iceCandidate: RTCIceCandidate = null;
    if (candidateStr) {
      // @ts-ignore
      iceCandidate = { candidate: candidateStr };
    }
    const iceEventInit: RTCPeerConnectionIceEventInit = {
      candidate: iceCandidate,
      url: 'test-foo-url',
    };
    return new RTCPeerConnectionIceEvent('icecandidate', iceEventInit);
  }

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);

    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    context.realtimeController = context.audioVideoController.realtimeController;
    context.turnCredentials = new MeetingSessionTURNCredentials();
    context.turnCredentials.username = 'fakeUsername';
    context.turnCredentials.password = 'fakeTURNCredentials';
    context.turnCredentials.ttl = Infinity;
    context.turnCredentials.uris = ['fakeUDPURI', 'fakeTCPURI'];
    context.videoTileController = new DefaultVideoTileController(
      new DefaultVideoTileFactory(),
      context.audioVideoController,
      logger
    );
    context.videosPaused = new DefaultVideoStreamIdSet();
    context.videosToReceive = new DefaultVideoStreamIdSet();
    context.videoStreamIndex = new DefaultVideoStreamIndex(logger);
    context.activeVideoInput = null;
    context.transceiverController = new DefaultTransceiverController(logger, browser);
    context.audioMixController = new DefaultAudioMixController(logger);
    context.browserBehavior = new DefaultBrowserBehavior();
    task = new CreatePeerConnectionTask(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      expect(task).to.not.equal(null);
    });
  });

  describe('run', () => {
    it('can be run', done => {
      task.run().then(() => done());
    });

    it('creates the peer with correct configuration', done => {
      task.run().then(() => {
        const configuration = context.peer.getConfiguration();
        const credentials = context.turnCredentials;
        expect(configuration.iceServers[0].urls).to.deep.equal(credentials.uris);
        expect(configuration.iceServers[0].username).to.equal(credentials.username);
        expect(configuration.iceServers[0].credential).to.equal(credentials.password);
        expect(configuration.iceServers[0].credentialType).to.equal('password');
        expect(configuration.iceTransportPolicy).to.equal('relay');
        expect(configuration.bundlePolicy).to.equal(context.browserBehavior.requiresBundlePolicy());
        done();
      });
    });

    it('can create a peer connection without TURN credentials', done => {
      context.turnCredentials = null;
      task = new CreatePeerConnectionTask(context);
      task.run().then(() => {
        const configuration = context.peer.getConfiguration();
        expect(configuration.bundlePolicy).to.equal(context.browserBehavior.requiresBundlePolicy());
        done();
      });
    });

    it('reuses peer connection if it already exists', done => {
      const peer = new RTCPeerConnection();
      context.peer = peer;
      task.run().then(() => {
        expect(context.peer).to.deep.equal(peer);
        done();
      });
    });

    it('could log peer connection events', done => {
      task.run().then(() => {
        context.peer.dispatchEvent(makeICEEvent(null));
        context.peer.dispatchEvent(makeICEEvent('a=candidate something'));
        context.peer.dispatchEvent(new Event('iceconnectionstatechange'));
        context.peer.dispatchEvent(new Event('icegatheringstatechange'));
        context.peer.dispatchEvent(new Event('negotiationneeded'));
        context.peer.dispatchEvent(new Event('connectionstatechange'));
        done();
      });
    });

    it('do not log events if peer is null', done => {
      task.run().then(() => {});

      context.peer.dispatchEvent(makeICEEvent(null));
      context.peer.dispatchEvent(makeICEEvent('a=candidate something'));
      context.peer.dispatchEvent(new Event('iceconnectionstatechange'));
      context.peer.dispatchEvent(new Event('icegatheringstatechange'));
      context.peer.dispatchEvent(new Event('negotiationneeded'));
      context.peer.dispatchEvent(new Event('connectionstatechange'));
      context.peer = null;
      done();
    });
  });

  describe('video', () => {
    describe('adding a track', () => {
      it('does not handle a local video track if the transceiver controller indicates that the given track is local', async () => {
        const addVideoTileSpy: sinon.SinonSpy = sinon.spy(
          context.videoTileController,
          'addVideoTile'
        );

        class TestTransceiverController extends DefaultTransceiverController {
          useTransceivers(): boolean {
            return true;
          }

          trackIsVideoInput(_track: MediaStreamTrack): boolean {
            return true;
          }
        }
        context.transceiverController = new TestTransceiverController(logger, browser);

        await task.run();
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );
        expect(addVideoTileSpy.called).to.be.false;
      });

      it('does not handle a local video track of an active video input', async () => {
        const addVideoTileSpy: sinon.SinonSpy = sinon.spy(
          context.videoTileController,
          'addVideoTile'
        );

        class TestTransceiverController extends DefaultTransceiverController {
          useTransceivers(): boolean {
            return false;
          }
        }
        context.transceiverController = new TestTransceiverController(logger, browser);

        const videoTrack = new MediaStreamTrack();
        // @ts-ignore
        videoTrack.id = '0';
        // @ts-ignore
        videoTrack.kind = 'video';

        const activeVideoInput = new MediaStream();
        activeVideoInput.addTrack(videoTrack);
        context.activeVideoInput = activeVideoInput;

        await task.run();
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );
        expect(addVideoTileSpy.called).to.be.false;
      });

      it('handles a remote video track not available in an active video input', async () => {
        const addVideoTileSpy: sinon.SinonSpy = sinon.spy(
          context.videoTileController,
          'addVideoTile'
        );

        class TestTransceiverController extends DefaultTransceiverController {
          useTransceivers(): boolean {
            return false;
          }
        }
        context.transceiverController = new TestTransceiverController(logger, browser);

        // @ts-ignore
        const videoTrack = new MediaStreamTrack('local-track-id', 'video');
        const activeVideoInput = new MediaStream();
        activeVideoInput.addTrack(videoTrack);
        context.activeVideoInput = activeVideoInput;

        await task.run();
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );
        expect(addVideoTileSpy.called).to.be.true;
      });

      it('does not handle a track event with no streams', async () => {
        const addVideoTileSpy: sinon.SinonSpy = sinon.spy(
          context.videoTileController,
          'addVideoTile'
        );

        domMockBehavior.hasStreamForTrack = false;

        class TestTransceiverController extends DefaultTransceiverController {
          useTransceivers(): boolean {
            return true;
          }
        }
        context.transceiverController = new TestTransceiverController(logger, browser);

        await task.run();
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );
        expect(addVideoTileSpy.called).to.be.false;
      });

      it('ignore a m-line which is inactive', async () => {
        const addVideoTileSpy: sinon.SinonSpy = sinon.spy(
          context.videoTileController,
          'addVideoTile'
        );

        domMockBehavior.hasInactiveTransceiver = true;
        await task.run();
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );
        expect(addVideoTileSpy.called).to.be.false;
      });

      it('ignore track event when attendee ID already associated with tile', async () => {
        const addVideoTileSpy: sinon.SinonSpy = sinon.spy(
          context.videoTileController,
          'addVideoTile'
        );

        let called = false;

        const attendeeIdForTrack = 'attendee-id';
        class TestVideoStreamIndex extends DefaultVideoStreamIndex {
          attendeeIdForTrack(_trackId: string): string {
            return attendeeIdForTrack;
          }
        }
        context.videoStreamIndex = new TestVideoStreamIndex(logger);

        class TestVideoTileController extends DefaultVideoTileController {
          haveVideoTileForAttendeeId(attendeeId: string): boolean {
            expect(attendeeId).to.equal(attendeeIdForTrack);
            called = true;
            return true;
          }
        }
        context.videoTileController = new TestVideoTileController(
          new DefaultVideoTileFactory(),
          context.audioVideoController,
          logger
        );

        await task.run();
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );
        expect(called).to.be.true;
        expect(addVideoTileSpy.called).to.be.false;
      });

      it('can have a stream ID', async () => {
        const streamId = 1;
        let tile: VideoTile;
        const attendeeIdForTrack = 'attendee-id';
        class TestVideoStreamIndex extends DefaultVideoStreamIndex {
          streamIdForTrack(_trackId: string): number {
            return streamId;
          }
          attendeeIdForTrack(_trackId: string): string {
            return attendeeIdForTrack;
          }
        }
        context.videoStreamIndex = new TestVideoStreamIndex(logger);

        class TestVideoTileController extends DefaultVideoTileController {
          addVideoTile(): VideoTile {
            return (tile = super.addVideoTile());
          }
        }
        context.videoTileController = new TestVideoTileController(
          new DefaultVideoTileFactory(),
          context.audioVideoController,
          logger
        );

        await task.run();
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );
        expect(tile.state().streamId).to.equal(streamId);
      });

      it('uses getCapabilities if getSettings is not available in the track', async () => {
        domMockBehavior.mediaStreamTrackCapabilities = {
          width: 640,
          height: 480,
        };

        // eslint-disable-next-line
        delete MediaStreamTrack.prototype['getSettings'];

        let tile: VideoTile;
        const attendeeIdForTrack = 'attendee-id';

        class TestVideoStreamIndex extends DefaultVideoStreamIndex {
          attendeeIdForTrack(_trackId: string): string {
            return attendeeIdForTrack;
          }
        }
        context.videoStreamIndex = new TestVideoStreamIndex(logger);
        class TestVideoTileController extends DefaultVideoTileController {
          addVideoTile(): VideoTile {
            return (tile = super.addVideoTile());
          }
        }
        context.videoTileController = new TestVideoTileController(
          new DefaultVideoTileFactory(),
          context.audioVideoController,
          logger
        );

        await task.run();
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );
        expect(tile.state().videoStreamContentWidth).to.equal(
          domMockBehavior.mediaStreamTrackCapabilities.width
        );
        expect(tile.state().videoStreamContentHeight).to.equal(
          domMockBehavior.mediaStreamTrackCapabilities.height
        );
      });

      it('uses getSettings if available', async () => {
        domMockBehavior.mediaStreamTrackCapabilities = {
          width: 400,
          height: 300,
        };
        domMockBehavior.mediaStreamTrackSettings = {
          width: 640,
          height: 480,
          deviceId: '',
        };

        let tile: VideoTile;

        const attendeeIdForTrack = 'attendee-id';
        class TestVideoStreamIndex extends DefaultVideoStreamIndex {
          attendeeIdForTrack(_trackId: string): string {
            return attendeeIdForTrack;
          }
        }
        context.videoStreamIndex = new TestVideoStreamIndex(logger);

        class TestVideoTileController extends DefaultVideoTileController {
          addVideoTile(): VideoTile {
            return (tile = super.addVideoTile());
          }
        }
        context.videoTileController = new TestVideoTileController(
          new DefaultVideoTileFactory(),
          context.audioVideoController,
          logger
        );

        await task.run();
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );
        expect(tile.state().videoStreamContentWidth).to.equal(
          domMockBehavior.mediaStreamTrackSettings.width
        );
        expect(tile.state().videoStreamContentHeight).to.equal(
          domMockBehavior.mediaStreamTrackSettings.height
        );
      });

      it('does not log track events if the video track array is empty', async () => {
        class TestLogger extends NoOpLogger {
          info(msg: string): void {
            expect(msg.includes('received the ended event')).to.be.false;
          }
        }
        context.logger = new TestLogger();
        domMockBehavior.setRemoteDescriptionAddTrackSucceeds = false;

        await task.run();
        context.peer.addEventListener('track', (event: RTCTrackEvent) => {
          const track = event.track;
          track.stop();
        });
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );
      });

      it('has externalUserId for an attendee', async () => {
        let called = false;
        const addVideoTileSpy: sinon.SinonSpy = sinon.spy(
          context.videoTileController,
          'addVideoTile'
        );
        task = new CreatePeerConnectionTask(context);
        const externalUserIdForTrack = 'attendee-id-external';
        class TestVideoStreamIndex extends DefaultVideoStreamIndex {
          externalUserIdForTrack(_trackId: string): string {
            called = true;
            return externalUserIdForTrack;
          }
        }
        context.videoStreamIndex = new TestVideoStreamIndex(logger);

        await task.run();
        context.peer.addEventListener('track', (event: RTCTrackEvent) => {
          const track = event.track;
          track.stop();
        });
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );
        expect(called).to.be.true;
        expect(addVideoTileSpy.called).to.be.true;
      });

      it('uses a track ID for Plan B', async () => {
        // @ts-ignore
        navigator.userAgent = 'Chrome/77.0.3865.75';
        context.browserBehavior = new DefaultBrowserBehavior();
        let called1 = false;
        let called2 = false;

        class TestVideoStreamIndex extends DefaultVideoStreamIndex {
          streamIdForTrack(trackId: string): number {
            expect(trackId).to.equal('0');
            called1 = true;
            return 1;
          }
          attendeeIdForTrack(trackId: string): string {
            expect(trackId).to.equal('0');
            called2 = true;
            return 'attendee-id';
          }
        }
        context.videoStreamIndex = new TestVideoStreamIndex(logger);

        await task.run();
        await context.peer.setRemoteDescription(videoRemoteDescription);
        await new Promise(resolve =>
          new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
        );

        expect(called1).to.be.true;
        expect(called2).to.be.true;
      });
    });

    describe('stopping a track', () => {
      it('removes stream ID from the paused video stream ID set if stream ID exists', done => {
        let called = false;
        const attendeeIdForTrack = 'attendee-id';
        class TestVideoStreamIndex extends DefaultVideoStreamIndex {
          streamIdForTrack(_trackId: string): number {
            return 1;
          }
          attendeeIdForTrack(_trackId: string): string {
            return attendeeIdForTrack;
          }
        }
        context.videoStreamIndex = new TestVideoStreamIndex(logger);

        let tile: VideoTile;
        class TestVideoTileController extends DefaultVideoTileController {
          addVideoTile(): VideoTile {
            return (tile = super.addVideoTile());
          }

          useTransceivers(): boolean {
            return true;
          }

          removeVideoTile(tileId: number): void {
            expect(tile.id()).to.equal(tileId);
            expect(called).to.be.true;
            done();
          }
        }
        context.videoTileController = new TestVideoTileController(
          new DefaultVideoTileFactory(),
          context.audioVideoController,
          logger
        );

        class TestVideoStreamIdSet extends DefaultVideoStreamIdSet {
          remove(_id: number): void {
            called = true;
          }
        }
        context.videosPaused = new TestVideoStreamIdSet();

        task.run().then(() => {
          context.peer.addEventListener('track', (event: RTCTrackEvent) => {
            const track = event.track;
            const stream = event.streams[0];
            stream.removeTrack(track);
          });
          context.peer.setRemoteDescription(videoRemoteDescription);
        });
      });

      it('uses a stream for handling the "removetrack" event and removing stream ID from the paused video stream ID set', done => {
        class TestTransceiverController extends DefaultTransceiverController {
          useTransceivers(): boolean {
            return true;
          }
        }
        context.transceiverController = new TestTransceiverController(logger, browser);

        let tile: VideoTile;
        class TestVideoTileController extends DefaultVideoTileController {
          addVideoTile(): VideoTile {
            return (tile = super.addVideoTile());
          }

          removeVideoTile(tileId: number): void {
            expect(tile.id()).to.equal(tileId);
            done();
          }
        }
        context.videoTileController = new TestVideoTileController(
          new DefaultVideoTileFactory(),
          context.audioVideoController,
          logger
        );

        task.run().then(() => {
          context.peer.addEventListener('track', (event: RTCTrackEvent) => {
            const track = event.track;
            const stream = event.streams[0];
            stream.removeTrack(track);
          });
          context.peer.setRemoteDescription(videoRemoteDescription);
        });
      });

      it('uses a track for handling the "ended" event in Plan B and removing stream ID from the paused video stream ID set', done => {
        // @ts-ignore
        navigator.userAgent = 'Chrome/77.0.3865.75';
        context.browserBehavior = new DefaultBrowserBehavior();
        let tile: VideoTile;
        class TestVideoTileController extends DefaultVideoTileController {
          addVideoTile(): VideoTile {
            return (tile = super.addVideoTile());
          }

          removeVideoTile(tileId: number): void {
            expect(tile.id()).to.equal(tileId);
            done();
          }
        }
        context.videoTileController = new TestVideoTileController(
          new DefaultVideoTileFactory(),
          context.audioVideoController,
          logger
        );

        task.run().then(() => {
          context.peer.addEventListener('track', (event: RTCTrackEvent) => {
            const track = event.track;
            track.stop();
          });
          context.peer.setRemoteDescription(videoRemoteDescription);
        });
      });
    });
  });

  describe('audio', () => {
    it('binds a stream for a newly-added audio track', async () => {
      const spy: sinon.SinonSpy = sinon.spy(context.audioMixController, 'bindAudioStream');
      await task.run();
      await context.peer.setRemoteDescription(audioRemoteDescription);
      await new Promise(resolve =>
        new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
      );
      expect(spy.called).to.be.true;
    });
  });

  describe('cancel', () => {
    it('can cancel using the context before the "track" event is triggered', async () => {
      let called = false;

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        attendeeIdForTrack(_trackId: string): string {
          called = true;
          return 'attendee-id';
        }
      }
      context.videoStreamIndex = new TestVideoStreamIndex(logger);

      await task.run();
      context.removableObservers[0].removeObserver();
      await context.peer.setRemoteDescription(videoRemoteDescription);
      await new Promise(resolve =>
        new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
      );
      expect(called).to.be.false;
    });

    it('can cancel using the context before the "ended" or "removetrack" event is triggered', async () => {
      let called = false;

      class TestVideoTileController extends DefaultVideoTileController {
        removeVideoTile(_tileId: number): void {
          called = true;
        }
      }
      context.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        context.audioVideoController,
        logger
      );

      await task.run();
      const peerRemoveEventListenerSpy: sinon.SinonSpy = sinon.spy(
        context.peer,
        'removeEventListener'
      );
      context.peer.addEventListener('track', (event: RTCTrackEvent) => {
        context.removableObservers[0].removeObserver();

        const track = event.track;
        track.stop();
      });
      await context.peer.setRemoteDescription(videoRemoteDescription);
      await new Promise(resolve =>
        new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
      );
      expect(called).to.be.true;
      expect(peerRemoveEventListenerSpy.called).to.be.true;
    });

    it('can cancel using the context but does not remove an event listener if the peer is not available', async () => {
      let called = false;

      class TestVideoTileController extends DefaultVideoTileController {
        removeVideoTile(_tileId: number): void {
          called = true;
        }
      }
      context.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        context.audioVideoController,
        logger
      );

      await task.run();
      const peerRemoveEventListenerSpy: sinon.SinonSpy = sinon.spy(
        context.peer,
        'removeEventListener'
      );
      context.peer.addEventListener('track', (event: RTCTrackEvent) => {
        context.peer = null;
        context.removableObservers[0].removeObserver();

        const track = event.track;
        track.stop();
      });
      await context.peer.setRemoteDescription(videoRemoteDescription);
      await new Promise(resolve =>
        new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(resolve)
      );
      expect(called).to.be.true;
      expect(peerRemoveEventListenerSpy.called).to.be.false;
    });
  });
});
