// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoController from '../../src/audiovideocontroller/AudioVideoController';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';
import BrowserBehavior from '../../src/browserbehavior/BrowserBehavior';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import ConnectionMonitor from '../../src/connectionmonitor/ConnectionMonitor';
import Logger from '../../src/logger/Logger';
import NoOpMediaStreamBroker from '../../src/mediastreambroker/NoOpMediaStreamBroker';
import DefaultReconnectController from '../../src/reconnectcontroller/DefaultReconnectController';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClient from '../../src/signalingclient/SignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import DefaultStatsCollector from '../../src/statscollector/DefaultStatsCollector';
import ReleaseMediaStreamsTask from '../../src/task/ReleaseMediaStreamsTask';
import Task from '../../src/task/Task';
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import NoVideoDownlinkBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/NoVideoDownlinkBandwidthPolicy';
import DefaultVideoTileController from '../../src/videotilecontroller/DefaultVideoTileController';
import DefaultVideoTileFactory from '../../src/videotilefactory/DefaultVideoTileFactory';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { delay } from '../utils';

describe('ReleaseMediaStreamsTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const RECONNECT_TIMEOUT_MS = 120 * 1000;
  const RECONNECT_FIXED_WAIT_MS = 0;
  const RECONNECT_SHORT_BACKOFF_MS = 1 * 1000;
  const RECONNECT_LONG_BACKOFF_MS = 5 * 1000;
  const behavior = new DOMMockBehavior();
  const browserBehavior = new DefaultBrowserBehavior();

  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder | null = null;
  let task: Task;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let signalingClient: SignalingClient;
  let request: SignalingClientConnectionRequest;

  class TestStatsCollector extends DefaultStatsCollector {
    constructor(
      audioVideoController: AudioVideoController,
      logger: Logger,
      browser: BrowserBehavior
    ) {
      super(audioVideoController, logger, browser);
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
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    context.realtimeController = context.audioVideoController.realtimeController;
    context.videoTileController = context.audioVideoController.videoTileController;
    context.mediaStreamBroker = new NoOpMediaStreamBroker();
    context.statsCollector = new TestStatsCollector(
      context.audioVideoController,
      context.logger,
      browserBehavior
    );
    context.connectionMonitor = new TestConnectionMonitor();
    context.transceiverController = new DefaultTransceiverController(
      context.logger,
      browserBehavior
    );
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

    task = new ReleaseMediaStreamsTask(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('no media stream broker', () => {
    it('is safe to call', async () => {
      context.mediaStreamBroker = null;
      await task.run();
    });
  });

  describe('run', async () => {
    it('sets audio and video input to null', async () => {
      await task.run();
      expect(context.activeAudioInput).to.be.null;
      expect(context.activeVideoInput).to.be.null;
    });

    it('releases audio and video device', async () => {
      let releaseFunctionCalled = false;
      class MockMediaStreamBroker extends NoOpMediaStreamBroker {
        releaseMediaStream(_mediaStream: MediaStream): void {
          releaseFunctionCalled = true;
        }
      }
      context.mediaStreamBroker = new MockMediaStreamBroker();
      await task.run();
      expect(releaseFunctionCalled).to.equal(true);
    });
  });

  describe('cancel', () => {
    it('can cancel', async () => {
      const p = task.run();
      task.cancel();
      expect(p).to.eventually.rejected;
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
