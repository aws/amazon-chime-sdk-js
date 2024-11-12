// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoController from '../../src/audiovideocontroller/AudioVideoController';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import ConnectionMonitor from '../../src/connectionmonitor/ConnectionMonitor';
import Logger from '../../src/logger/Logger';
import NoOpMediaStreamBroker from '../../src/mediastreambroker/NoOpMediaStreamBroker';
import DefaultReconnectController from '../../src/reconnectcontroller/DefaultReconnectController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClient from '../../src/signalingclient/SignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import StatsCollector from '../../src/statscollector/StatsCollector';
import CleanStoppedSessionTask from '../../src/task/CleanStoppedSessionTask';
import Task from '../../src/task/Task';
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import { wait as delay } from '../../src/utils/Utils';
import NoVideoDownlinkBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/NoVideoDownlinkBandwidthPolicy';
import VideoAdaptiveProbePolicy from '../../src/videodownlinkbandwidthpolicy/VideoAdaptiveProbePolicy';
import VideoTile from '../../src/videotile/VideoTile';
import DefaultVideoTileController from '../../src/videotilecontroller/DefaultVideoTileController';
import DefaultVideoTileFactory from '../../src/videotilefactory/DefaultVideoTileFactory';
import NoVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NoVideoUplinkBandwidthPolicy';
import NScaleVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('CleanStoppedSessionTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const RECONNECT_TIMEOUT_MS = 120 * 1000;
  const RECONNECT_FIXED_WAIT_MS = 0;
  const RECONNECT_SHORT_BACKOFF_MS = 1 * 1000;
  const RECONNECT_LONG_BACKOFF_MS = 5 * 1000;
  const behavior = new DOMMockBehavior();

  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder | null = null;
  let task: Task;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let signalingClient: SignalingClient;
  let request: SignalingClientConnectionRequest;

  class TestStatsCollector extends StatsCollector {
    constructor(audioVideoController: AudioVideoController, logger: Logger) {
      super(audioVideoController, logger);
    }
    start(): boolean {
      return false;
    }
    stop(): void {}
  }

  class TestConnectionMonitor implements ConnectionMonitor {
    start(): void {}
    stop(): void {}
  }

  beforeEach(async () => {
    domMockBuilder = new DOMMockBuilder(behavior);
    context = new AudioVideoControllerState();
    context.browserBehavior = new DefaultBrowserBehavior();
    context.audioProfile = new AudioProfile();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    context.realtimeController = context.audioVideoController.realtimeController;
    context.videoTileController = context.audioVideoController.videoTileController;
    context.mediaStreamBroker = new NoOpMediaStreamBroker();
    context.statsCollector = new TestStatsCollector(context.audioVideoController, context.logger);
    context.connectionMonitor = new TestConnectionMonitor();
    context.transceiverController = new DefaultTransceiverController(
      context.logger,
      context.browserBehavior,
      context
    );
    context.videoUplinkBandwidthPolicy = new NoVideoUplinkBandwidthPolicy();
    context.videoDownlinkBandwidthPolicy = new NoVideoDownlinkBandwidthPolicy();
    context.videoTileController = new DefaultVideoTileController(
      new DefaultVideoTileFactory(),
      context.audioVideoController,
      context.logger
    );

    // @ts-ignore
    const audioTrack = new MediaStreamTrack('attach-media-input-task-audio-track-id', 'audio');
    // @ts-ignore
    const videoTrack = new MediaStreamTrack('attach-media-input-task-video-track-id', 'video');
    context.activeAudioInput = new MediaStream();
    context.activeAudioInput.addTrack(audioTrack);
    context.activeVideoInput = new MediaStream();
    context.activeVideoInput.addTrack(videoTrack);
    context.reconnectController = new DefaultReconnectController(
      RECONNECT_TIMEOUT_MS,
      new FullJitterBackoff(
        RECONNECT_FIXED_WAIT_MS,
        RECONNECT_SHORT_BACKOFF_MS,
        RECONNECT_LONG_BACKOFF_MS
      )
    );
    class Observer {
      removeObserver(): void {}
    }
    context.removableObservers = [new Observer()];

    webSocketAdapter = new DefaultWebSocketAdapter(context.logger);
    signalingClient = new DefaultSignalingClient(webSocketAdapter, context.logger);
    context.signalingClient = signalingClient;
    context.peer = new RTCPeerConnection();
    request = new SignalingClientConnectionRequest('ws://localhost:9999/control', 'test-auth');
    context.signalingClient.openConnection(request);
    await delay(behavior.asyncWaitMs + 10);

    task = new CleanStoppedSessionTask(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('run', () => {
    it('closes the connection', done => {
      expect(context.signalingClient.ready()).to.equal(true);
      task.run().then(() => {
        expect(context.signalingClient.ready()).to.equal(false);
        done();
      });
    });

    it('does not close the connection if already closed', done => {
      expect(context.signalingClient.ready()).to.equal(true);
      context.signalingClient.closeConnection();
      task.run().then(() => {
        expect(context.signalingClient.ready()).to.equal(false);
        done();
      });
    });

    it('sets audio and video input to null', done => {
      task.run().then(() => {
        expect(context.activeAudioInput).to.not.be.undefined;
        expect(context.activeVideoInput).to.not.be.undefined;
        done();
      });
    });

    it('does not release audio and video device', done => {
      let releaseFunctionCalled = false;
      class MockMediaStreamBroker extends NoOpMediaStreamBroker {
        releaseMediaStream(_mediaStream: MediaStream): void {
          releaseFunctionCalled = true;
        }
      }
      context.mediaStreamBroker = new MockMediaStreamBroker();
      task.run().then(() => {
        expect(releaseFunctionCalled).to.not.be.true;
        done();
      });
    });

    it('clears local video if exists', done => {
      context.activeAudioInput = undefined;
      const videoInput = new MediaStream();
      context.activeVideoInput = videoInput;
      class TestVideoTileController extends DefaultVideoTileController {
        private testLocalTile: VideoTile | null = null;
        startLocalVideoTile(): number {
          this.testLocalTile = this.addVideoTile();
          this.testLocalTile.bindVideoStream(
            'fake-id',
            true,
            context.activeVideoInput,
            640,
            480,
            0
          );
          return this.testLocalTile.id();
        }

        getLocalVideoTile(): VideoTile {
          return this.testLocalTile;
        }
      }

      context.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        context.audioVideoController,
        context.logger
      );
      context.videoTileController.startLocalVideoTile();

      task.run().then(() => {
        const localTile = context.videoTileController.getLocalVideoTile();
        expect(localTile.state().boundVideoStream).to.equal(null);
        done();
      });
    });

    it('clear transceiver from video uplink bandwidth if needed', done => {
      context.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy('');
      context.videoUplinkBandwidthPolicy.setTransceiverController(context.transceiverController);
      const spy = sinon.spy(context.videoUplinkBandwidthPolicy, 'setTransceiverController');

      task.run().then(() => {
        expect(spy.calledOnceWith(undefined)).to.be.true;
        done();
      });
    });

    it('clear tile controller from video downlink bandwidth if needed', done => {
      context.videoDownlinkBandwidthPolicy = new VideoAdaptiveProbePolicy(context.logger);
      context.videoDownlinkBandwidthPolicy.bindToTileController(
        new DefaultVideoTileController(
          new DefaultVideoTileFactory(),
          context.audioVideoController,
          context.logger
        )
      );
      const spy = sinon.spy(context.videoDownlinkBandwidthPolicy, 'bindToTileController');

      task.run().then(() => {
        expect(spy.calledOnceWith(undefined)).to.be.true;
        done();
      });
    });

    it('clears local audio only', async () => {
      context.activeAudioInput = new MediaStream();
      context.activeVideoInput = undefined;
      await task.run();
      expect(context.activeAudioInput).to.not.be.undefined;
      expect(context.activeVideoInput).to.be.undefined;
    });

    it('stops the stats collector the connection monitor', async () => {
      const statsCollectorSpy = sinon.spy(context.statsCollector, 'stop');
      const connectionMonitorSpy = sinon.spy(context.connectionMonitor, 'stop');
      await task.run();
      expect(statsCollectorSpy.called).to.be.true;
      expect(connectionMonitorSpy.called).to.be.true;
    });

    it('removes all video tiles', async () => {
      const removeAllVideoTilesSpy = sinon.spy(context.videoTileController, 'removeAllVideoTiles');
      await task.run();
      expect(removeAllVideoTilesSpy.called).to.be.true;
    });

    it('closes the peer', async () => {
      const peerSpy = sinon.spy(context.peer, 'close');
      await task.run();
      expect(peerSpy.called).to.be.true;
    });

    it('can be run when the peer is not available', done => {
      context.peer = null;
      task.run().then(done);
    });

    it('continues to clean up remaining audio-video state regardless of the close connection failure', done => {
      class TestSignalingClient extends DefaultSignalingClient {
        ready(): boolean {
          return true;
        }
        closeConnection(): void {
          throw new Error();
        }
      }
      context.signalingClient = new TestSignalingClient(webSocketAdapter, context.logger);
      expect(context.peer).to.not.be.null;
      task
        .run()
        .then(() => {})
        .catch(() => {
          expect(context.peer).to.be.null;
          done();
        });
    });
  });

  describe('cancel', () => {
    it('should cancel the task and throw an error but should clean up remaining audio-video state', done => {
      expect(context.peer).to.not.be.null;
      task
        .run()
        .then(() => {
          expect(context.peer).to.be.null;
        })
        .catch(() => {
          done();
        });
      task.cancel();
    });

    it('should not close the WebSocket connection if the message is not the WebSocket closed event', done => {
      expect(context.signalingClient.ready()).to.equal(true);
      class TestSignalingClient extends DefaultSignalingClient {
        ready(): boolean {
          return true;
        }
        closeConnection(): void {}
      }
      context.signalingClient = new TestSignalingClient(webSocketAdapter, context.logger);
      task
        .run()
        .then(() => {
          done('This line should not be reached.');
        })
        .catch(() => {
          expect(context.peer).to.be.null;
          done();
        });
      context.signalingClient.leave();
      new TimeoutScheduler(behavior.asyncWaitMs).start(() => {
        task.cancel();
      });
    });

    it('will cancel idempotently', async () => {
      task.cancel();
      task.cancel();
      try {
        await task.run();
      } catch (_err) {}
    });
  });
});
