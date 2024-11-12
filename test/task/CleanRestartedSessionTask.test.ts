// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import { NScaleVideoUplinkBandwidthPolicy } from '../../src';
import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import ConnectionHealthData from '../../src/connectionhealthpolicy/ConnectionHealthData';
import SignalingAndMetricsConnectionMonitor from '../../src/connectionmonitor/SignalingAndMetricsConnectionMonitor';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import PingPong from '../../src/pingpong/PingPong';
import PingPongObserver from '../../src/pingpongobserver/PingPongObserver';
import StatsCollector from '../../src/statscollector/StatsCollector';
import CleanRestartedSessionTask from '../../src/task/CleanRestartedSessionTask';
import Task from '../../src/task/Task';
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import { wait as delay } from '../../src/utils/Utils';
import NoVideoDownlinkBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/NoVideoDownlinkBandwidthPolicy';
import DefaultVideoTileController from '../../src/videotilecontroller/DefaultVideoTileController';
import DefaultVideoTileFactory from '../../src/videotilefactory/DefaultVideoTileFactory';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

class TestPingPong implements PingPong {
  addObserver(_observer: PingPongObserver): void {}
  removeObserver(_observer: PingPongObserver): void {}
  forEachObserver(_observerFunc: (_observer: PingPongObserver) => void): void {}
  start(): void {}
  stop(): void {}
}

describe('CleanRestartedSessionTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let task: Task;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context = new AudioVideoControllerState();
    context.browserBehavior = new DefaultBrowserBehavior();
    context.audioProfile = new AudioProfile();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    context.transceiverController = new DefaultTransceiverController(
      context.logger,
      context.browserBehavior,
      context
    );
    context.videoTileController = new DefaultVideoTileController(
      new DefaultVideoTileFactory(),
      context.audioVideoController,
      context.audioVideoController.logger
    );
    context.connectionMonitor = new SignalingAndMetricsConnectionMonitor(
      context.audioVideoController,
      context.audioVideoController.realtimeController,
      new ConnectionHealthData(),
      new TestPingPong(),
      new StatsCollector(context.audioVideoController, new NoOpDebugLogger())
    );
    context.videoDownlinkBandwidthPolicy = new NoVideoDownlinkBandwidthPolicy();
    context.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy('self');

    task = new CleanRestartedSessionTask(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('run', () => {
    it('closes the peer connection', async () => {
      const peer = new RTCPeerConnection();
      context.peer = peer;
      await task.run();
      await delay(domMockBehavior.asyncWaitMs * 2);
      expect(peer.connectionState).to.equal('closed');
      expect(context.peer).to.equal(null);
    });
  });
});
