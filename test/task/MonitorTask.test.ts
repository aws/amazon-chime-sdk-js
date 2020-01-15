// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { DefaultVideoSubscribeContext } from '../../src';
import AudioVideoController from '../../src/audiovideocontroller/AudioVideoController';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';
import ConnectionHealthData from '../../src/connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../../src/connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import ConnectionMonitor from '../../src/connectionmonitor/ConnectionMonitor';
import Logger from '../../src/logger/Logger';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionVideoAvailability from '../../src/meetingsession/MeetingSessionVideoAvailability';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';
import DefaultReconnectController from '../../src/reconnectcontroller/DefaultReconnectController';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClientEvent from '../../src/signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../../src/signalingclient/SignalingClientEventType';
import {
  SdkAudioStatusFrame,
  SdkErrorFrame,
  SdkSignalFrame,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import AudioLogEvent from '../../src/statscollector/AudioLogEvent';
import DefaultStatsCollector from '../../src/statscollector/DefaultStatsCollector';
import VideoLogEvent from '../../src/statscollector/VideoLogEvent';
import MonitorTask from '../../src/task/MonitorTask';
import NoVideoDownlinkBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/NoVideoDownlinkBandwidthPolicy';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoTileController from '../../src/videotilecontroller/DefaultVideoTileController';
import DefaultVideoTileFactory from '../../src/videotilefactory/DefaultVideoTileFactory';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('MonitorTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const behavior = new DOMMockBehavior();
  const logger = new NoOpDebugLogger();

  let task: MonitorTask;
  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder | null = null;
  let realtimeFatalErrorCallback: (error: Error) => void;
  let realtimeSignalStrengthCallback: (signalStrength: number) => void;

  const RECONNECT_TIMEOUT_MS = 120 * 1000;
  const RECONNECT_FIXED_WAIT_MS = 0;
  const RECONNECT_SHORT_BACKOFF_MS = 1 * 1000;
  const RECONNECT_LONG_BACKOFF_MS = 5 * 1000;

  class TestAudioVideoController extends NoOpAudioVideoController {
    private testObserverQueue: Set<AudioVideoObserver> = new Set<AudioVideoObserver>();

    addObserver(observer: AudioVideoObserver): void {
      this.testObserverQueue.add(observer);
    }

    removeObserver(observer: AudioVideoObserver): void {
      this.testObserverQueue.delete(observer);
    }

    forEachObserver(observerFunc: (observer: AudioVideoObserver) => void): void {
      for (const observer of this.testObserverQueue) {
        if (this.testObserverQueue.has(observer)) {
          observerFunc(observer);
        }
      }
    }

    handleMeetingSessionStatus(_status: MeetingSessionStatus): boolean {
      return false;
    }
  }

  class TestRealtimeController extends DefaultRealtimeController {
    realtimeSubscribeToLocalSignalStrengthChange(callback: (signalStrength: number) => void): void {
      realtimeSignalStrengthCallback = callback;
    }

    realtimeSubscribeToFatalError(callback: (error: Error) => void): void {
      realtimeFatalErrorCallback = callback;
    }
  }

  class TestStatsCollector extends DefaultStatsCollector {
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

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(behavior);

    context = new AudioVideoControllerState();
    context.audioVideoController = new TestAudioVideoController();
    context.logger = logger;
    context.realtimeController = new TestRealtimeController();
    context.videoTileController = new DefaultVideoTileController(
      new DefaultVideoTileFactory(),
      context.audioVideoController,
      logger
    );
    context.videoDownlinkBandwidthPolicy = new NoVideoDownlinkBandwidthPolicy();
    context.statsCollector = new DefaultStatsCollector(context.audioVideoController, logger);
    context.reconnectController = new DefaultReconnectController(
      RECONNECT_TIMEOUT_MS,
      new FullJitterBackoff(
        RECONNECT_FIXED_WAIT_MS,
        RECONNECT_SHORT_BACKOFF_MS,
        RECONNECT_LONG_BACKOFF_MS
      )
    );
    context.lastKnownVideoAvailability = new MeetingSessionVideoAvailability();
    context.connectionMonitor = new TestConnectionMonitor();
    context.statsCollector = new TestStatsCollector(context.audioVideoController, logger);

    context.signalingClient = new DefaultSignalingClient(
      new DefaultWebSocketAdapter(context.logger),
      context.logger
    );
    task = new MonitorTask(
      context,
      new ConnectionHealthPolicyConfiguration(),
      new ConnectionHealthData()
    );
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('run', () => {
    it('registers an observer', async () => {
      const spy1 = sinon.spy(task, 'videoReceiveBandwidthDidChange');
      const spy2 = sinon.spy(task, 'connectionHealthDidChange');
      const connectionHealthData = new ConnectionHealthData();
      const oldBandwidthKbps = 512;
      const newBandwidthKbps = 1024;

      await task.run();
      context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.videoReceiveBandwidthDidChange(oldBandwidthKbps, newBandwidthKbps);
        observer.connectionHealthDidChange(connectionHealthData);
      });

      expect(spy1.calledOnceWith(oldBandwidthKbps, newBandwidthKbps)).to.be.true;
      expect(spy2.calledOnceWith(connectionHealthData)).to.be.true;
    });
  });

  describe('realtime controller events', () => {
    it('handles a fatal error', async () => {
      const spy = sinon.spy(context.audioVideoController, 'handleMeetingSessionStatus');
      await task.run();
      realtimeFatalErrorCallback(new Error('Test error'));
      expect(spy.called).to.be.true;
    });

    it('handles local signal strength changes', async () => {
      const spy = sinon.spy(context.statsCollector, 'logAudioEvent');
      await task.run();
      realtimeSignalStrengthCallback(0.5);
      expect(spy.calledWith(AudioLogEvent.RedmicStartLoss)).to.be.true;
      realtimeSignalStrengthCallback(0.5);
      realtimeSignalStrengthCallback(1);
      expect(spy.calledWith(AudioLogEvent.RedmicEndLoss)).to.be.true;
      realtimeSignalStrengthCallback(1);
    });
  });

  describe('cancel', () => {
    it('can cancel using the context', async () => {
      const spy1 = sinon.spy(task, 'videoReceiveBandwidthDidChange');
      const spy2 = sinon.spy(task, 'connectionHealthDidChange');
      await task.run();
      context.removableObservers[0].removeObserver();
      context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.videoReceiveBandwidthDidChange(10, 20);
        observer.connectionHealthDidChange(new ConnectionHealthData());
      });
      expect(spy1.called).to.be.false;
      expect(spy2.called).to.be.false;
    });
  });

  describe('videoSendHealthDidChange', () => {
    beforeEach(() => {
      context.videoInputAttachedTimestampMs = Date.now() - 5000;
      context.videoTileController.startLocalVideoTile();
      context.lastKnownVideoAvailability.canStartLocalVideo = true;
      context.videoDeviceInformation = {};
      context.activeVideoInput = new MediaStream();
      // @ts-ignore
      const videoTrack = new MediaStreamTrack('attach-media-input-task-video-track-id', 'video');
      context.activeVideoInput.addTrack(videoTrack);
    });

    it('logs success when the bitrate is greater than 0', () => {
      const spy = sinon.spy(context.statsCollector, 'logVideoEvent');
      task.videoSendHealthDidChange(1024, 0);
      expect(spy.calledOnceWith(VideoLogEvent.SendingSuccess, context.videoDeviceInformation)).to.be
        .true;
    });

    it('logs success when the number of sending packets per second is greater than 0', () => {
      const spy = sinon.spy(context.statsCollector, 'logVideoEvent');
      task.videoSendHealthDidChange(0, 5);
      expect(spy.calledOnceWith(VideoLogEvent.SendingSuccess, context.videoDeviceInformation)).to.be
        .true;
    });

    it('logs failure if the bitrate and the number of sending packets are 0 with the timeout', () => {
      context.videoInputAttachedTimestampMs = Date.now() - 50000;

      const spy = sinon.spy(context.statsCollector, 'logVideoEvent');
      task.videoSendHealthDidChange(0, 0);
      expect(spy.calledOnceWith(VideoLogEvent.SendingFailed, context.videoDeviceInformation)).to.be
        .true;
    });

    it('does not log if the bitrate and the number of sending packets are 0', () => {
      const spy = sinon.spy(context.statsCollector, 'logVideoEvent');
      task.videoSendHealthDidChange(0, 0);
      expect(spy.called).to.be.false;
    });

    it('does not log if videoInputAttachedTimestampMs has not been updated', () => {
      context.videoInputAttachedTimestampMs = 0;

      const spy = sinon.spy(context.statsCollector, 'logVideoEvent');
      task.videoSendHealthDidChange(1024, 5);
      expect(spy.called).to.be.false;
    });

    it('does not log if the active video input is not available', () => {
      context.activeVideoInput = null;

      const spy = sinon.spy(context.statsCollector, 'logVideoEvent');
      task.videoSendHealthDidChange(1024, 5);
      expect(spy.called).to.be.false;
    });
  });

  describe('videoReceiveBandwidthDidChange', () => {
    it('does not update the available bandwidth if the downlink bandwidth policy does not exist', () => {
      context.videoDownlinkBandwidthPolicy = null;
      task.videoReceiveBandwidthDidChange(10, 20);
    });

    it('resubscribes if the downlink bandwidth policy wants resubscribe', () => {
      const spy = sinon.spy(context.audioVideoController, 'update');
      class TestVideoDownlinkBandwidthPolicy extends NoVideoDownlinkBandwidthPolicy {
        wantsResubscribe(): boolean {
          return true;
        }
        chooseSubscriptions(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }
      }
      context.videoSubscribeContext = new DefaultVideoSubscribeContext();
      context.videoDownlinkBandwidthPolicy = new TestVideoDownlinkBandwidthPolicy();
      task.videoReceiveBandwidthDidChange(10, 20);
      expect(spy.called).to.be.true;
    });
  });

  describe('connectionHealthDidChange', () => {
    it('updates the reconnection health policy', () => {
      class TestConnectionHealthData extends ConnectionHealthData {
        isConnectionStartRecent(_recentDurationMs: number): boolean {
          return false;
        }
      }
      const spy = sinon.spy(context.audioVideoController, 'handleMeetingSessionStatus');
      const connectionHealthData = new TestConnectionHealthData();
      connectionHealthData.consecutiveStatsWithNoPackets = Infinity;
      task.connectionHealthDidChange(connectionHealthData);

      connectionHealthData.consecutiveStatsWithNoPackets = 0;
      task.connectionHealthDidChange(connectionHealthData);

      expect(spy.calledOnce).to.be.true;
    });

    it('notifies the connection is poor', done => {
      class TestObserver implements AudioVideoObserver {
        connectionDidBecomePoor(): void {
          done();
        }
      }

      context.audioVideoController.addObserver(new TestObserver());
      const connectionHealthData = new ConnectionHealthData();
      connectionHealthData.packetsReceivedInLastMinute = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
      ];
      task.connectionHealthDidChange(connectionHealthData);

      // connectionDidBecomePoor() should not be called again.
      task.connectionHealthDidChange(connectionHealthData);
    });

    it('suggests turning off video', done => {
      class TestObserver implements AudioVideoObserver {
        connectionDidSuggestStopVideo(): void {
          done();
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTilesWithStreams(): boolean {
          return true;
        }
      }

      context.audioVideoController.addObserver(new TestObserver());
      context.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        context.audioVideoController,
        logger
      );

      const connectionHealthData = new ConnectionHealthData();
      connectionHealthData.packetsReceivedInLastMinute = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
      ];
      task.connectionHealthDidChange(connectionHealthData);
    });
  });

  describe('handleSignalingClientEvent', () => {
    it('does not handle non-ReceivedSignalFrame', () => {
      const spy = sinon.spy(MeetingSessionStatus, 'fromSignalFrame');
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.WebSocketOpen,
          null
        )
      );
      expect(spy.called).to.be.false;
    });

    it('does not handle the non-OK status code', () => {
      const spy = sinon.spy(context.statsCollector, 'logMeetingSessionStatus');
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const message = SdkSignalFrame.create();
      message.type = SdkSignalFrame.Type.JOIN;
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.ReceivedSignalFrame,
          message
        )
      );
      expect(spy.called).to.be.false;
    });

    it('removes local video tile if the error status code is 206', () => {
      const spy = sinon.spy(context.audioVideoController, 'handleMeetingSessionStatus');
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const message = SdkSignalFrame.create();
      message.type = SdkSignalFrame.Type.SUBSCRIBE_ACK;
      message.error = SdkErrorFrame.create();
      message.error.status = 206;
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.ReceivedSignalFrame,
          message
        )
      );
      expect(spy.called).to.be.true;
    });

    it('stops audio and video if the error status code is 410 (AudioCallEnded)', () => {
      const spy = sinon.spy(context.audioVideoController, 'handleMeetingSessionStatus');
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const message = SdkSignalFrame.create();
      message.type = SdkSignalFrame.Type.AUDIO_STATUS;
      message.audioStatus = SdkAudioStatusFrame.create();
      message.audioStatus.audioStatus = 410;
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.ReceivedSignalFrame,
          message
        )
      );
      expect(spy.called).to.be.true;
    });

    it('is neither failure or terminal if the error status code is 302 (AudioDisconnectAudio)', () => {
      const spy = sinon.spy(context.audioVideoController, 'handleMeetingSessionStatus');
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const message = SdkSignalFrame.create();
      message.type = SdkSignalFrame.Type.AUDIO_STATUS;
      message.audioStatus = SdkAudioStatusFrame.create();
      message.audioStatus.audioStatus = 302;
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.ReceivedSignalFrame,
          message
        )
      );
      expect(spy.called).to.be.true;
    });
  });
});
