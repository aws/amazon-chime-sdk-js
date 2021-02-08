// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoController from '../../src/audiovideocontroller/AudioVideoController';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';
import BrowserBehavior from '../../src/browserbehavior/BrowserBehavior';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import ClientMetricReport from '../../src/clientmetricreport/ClientMetricReport';
import ClientMetricReportDirection from '../../src/clientmetricreport/ClientMetricReportDirection';
import ClientMetricReportMediaType from '../../src/clientmetricreport/ClientMetricReportMediaType';
import ClientVideoStreamReceivingReport from '../../src/clientmetricreport/ClientVideoStreamReceivingReport';
import DefaultClientMetricReport from '../../src/clientmetricreport/DefaultClientMetricReport';
import StreamMetricReport from '../../src/clientmetricreport/StreamMetricReport';
import ConnectionHealthData from '../../src/connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../../src/connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import ConnectionMonitor from '../../src/connectionmonitor/ConnectionMonitor';
import DefaultEventController from '../../src/eventcontroller/DefaultEventController';
import EventAttributes from '../../src/eventcontroller/EventAttributes';
import EventName from '../../src/eventcontroller/EventName';
import Logger from '../../src/logger/Logger';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionVideoAvailability from '../../src/meetingsession/MeetingSessionVideoAvailability';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';
import DefaultReconnectController from '../../src/reconnectcontroller/DefaultReconnectController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClientEvent from '../../src/signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../../src/signalingclient/SignalingClientEventType';
import {
  SdkAudioStatusFrame,
  SdkBitrate,
  SdkBitrateFrame,
  SdkErrorFrame,
  SdkSignalFrame,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import AudioLogEvent from '../../src/statscollector/AudioLogEvent';
import DefaultStatsCollector from '../../src/statscollector/DefaultStatsCollector';
import VideoLogEvent from '../../src/statscollector/VideoLogEvent';
import MonitorTask from '../../src/task/MonitorTask';
import NoVideoDownlinkBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/NoVideoDownlinkBandwidthPolicy';
import VideoAdaptiveProbePolicy from '../../src/videodownlinkbandwidthpolicy/VideoAdaptiveProbePolicy';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import SimulcastVideoStreamIndex from '../../src/videostreamindex/SimulcastVideoStreamIndex';
import DefaultVideoTileController from '../../src/videotilecontroller/DefaultVideoTileController';
import DefaultVideoTileFactory from '../../src/videotilefactory/DefaultVideoTileFactory';
import DefaultSimulcastUplinkPolicy from '../../src/videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicy';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

function createSignalingEventForBitrateFrame(logger: Logger): SignalingClientEvent {
  const webSocketAdapter = new DefaultWebSocketAdapter(logger);
  const message = SdkSignalFrame.create();
  message.bitrates = SdkBitrateFrame.create();
  const bitrate = SdkBitrate.create();
  bitrate.sourceStreamId = 1;
  bitrate.avgBitrateBps = 1400 * 1000;
  message.bitrates.bitrates.push(bitrate);
  const bitrate2 = SdkBitrate.create();
  bitrate2.sourceStreamId = 3;
  bitrate2.avgBitrateBps = 60 * 1000;
  message.bitrates.bitrates.push(bitrate2);
  return new SignalingClientEvent(
    new DefaultSignalingClient(webSocketAdapter, logger),
    SignalingClientEventType.ReceivedSignalFrame,
    message
  );
}

describe('MonitorTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const behavior = new DOMMockBehavior();
  const logger = new NoOpDebugLogger();
  const browserBehavior = new DefaultBrowserBehavior();

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
    constructor(
      audioVideoController: AudioVideoController,
      logger: Logger,
      browserBehavior: BrowserBehavior
    ) {
      super(audioVideoController, logger, browserBehavior);
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
    context.eventController = new DefaultEventController(context.audioVideoController);
    context.videoTileController = new DefaultVideoTileController(
      new DefaultVideoTileFactory(),
      context.audioVideoController,
      logger
    );
    context.videoDownlinkBandwidthPolicy = new NoVideoDownlinkBandwidthPolicy();
    context.videosToReceive = context.videoDownlinkBandwidthPolicy.chooseSubscriptions().clone();
    context.statsCollector = new DefaultStatsCollector(
      context.audioVideoController,
      logger,
      browserBehavior
    );
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
    context.statsCollector = new TestStatsCollector(
      context.audioVideoController,
      logger,
      browserBehavior
    );

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
    beforeEach(() => {
      context.meetingSessionConfiguration = new MeetingSessionConfiguration();
      context.meetingSessionConfiguration.credentials = new MeetingSessionCredentials();
      context.meetingSessionConfiguration.credentials.attendeeId = 'attendeeId';
      context.meetingSessionConfiguration.credentials.joinToken = 'foo-join-token';
      context.meetingSessionConfiguration.attendeePresenceTimeoutMs = 0;
    });
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

    it('publish a meeting event when an attendeeId is present', async () => {
      const spy = sinon.spy(context.realtimeController, 'realtimeSubscribeToAttendeeIdPresence');
      const handleEventSpy = sinon.spy(context.eventController, 'publishEvent');
      await task.run();
      context.realtimeController.realtimeSetAttendeeIdPresence(
        'attendeeId',
        true,
        null,
        false,
        null
      );
      assert(spy.called);
      expect(handleEventSpy.called).to.be.true;
    });

    it('does not publish a meeting event when an attendeeId is not present', async () => {
      const spy = sinon.spy(context.realtimeController, 'realtimeSubscribeToAttendeeIdPresence');
      const handleEventSpy = sinon.spy(context.eventController, 'publishEvent');
      await task.run();
      context.realtimeController.realtimeSetAttendeeIdPresence(
        'attendeeId',
        false,
        null,
        false,
        null
      );
      assert(spy.called);
      expect(handleEventSpy.called).to.be.false;
    });
  });

  describe('run for attendeePresenceTimeoutMs > 0', () => {
    beforeEach(() => {
      context.meetingSessionConfiguration = new MeetingSessionConfiguration();
      context.meetingSessionConfiguration.credentials = new MeetingSessionCredentials();
      context.meetingSessionConfiguration.credentials.attendeeId = 'attendeeId';
      context.meetingSessionConfiguration.credentials.joinToken = 'foo-join-token';
      context.meetingSessionConfiguration.attendeePresenceTimeoutMs = 5000;
    });

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

    it('publish a meeting event when an attendeeId is present', async () => {
      const spy = sinon.spy(context.realtimeController, 'realtimeSubscribeToAttendeeIdPresence');
      const handleEventSpy = sinon.spy(context.eventController, 'publishEvent');
      await task.run();
      context.realtimeController.realtimeSetAttendeeIdPresence(
        'attendeeId',
        true,
        null,
        false,
        null
      );
      assert(spy.called);
      expect(handleEventSpy.called).to.be.true;
    });

    it('does not publish a meeting event when an attendeeId is not present', async () => {
      const spy = sinon.spy(context.realtimeController, 'realtimeSubscribeToAttendeeIdPresence');
      const handleEventSpy = sinon.spy(context.eventController, 'publishEvent');
      await task.run();
      context.realtimeController.realtimeSetAttendeeIdPresence(
        'attendeeId',
        false,
        null,
        false,
        null
      );
      assert(spy.called);
      expect(handleEventSpy.called).to.be.false;
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

    it('subscribes to real-time attendee ID presence API', async () => {
      const spy = sinon.spy(context.realtimeController, 'realtimeSubscribeToAttendeeIdPresence');
      await task.run();
      assert(spy.called);
    });

    it('unsubscribes from real-time attendee ID presence API', async () => {
      const spy = sinon.spy(context.realtimeController, 'realtimeUnsubscribeToAttendeeIdPresence');
      await task.run();
      context.removableObservers[0].removeObserver();
      expect(spy.called).to.be.true;
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

  describe('metricsDidReceive', () => {
    it('can only handle DefaultClientMetricReport with StreamMetricReport', () => {
      context.videoStreamIndex = new DefaultVideoStreamIndex(logger);
      task.handleSignalingClientEvent(createSignalingEventForBitrateFrame(logger));

      class TestClientMetricReport implements ClientMetricReport {
        getObservableMetrics(): { [id: string]: number } {
          return;
        }
      }
      task.metricsDidReceive(undefined);
      const clientMetricReport = new TestClientMetricReport();
      task.metricsDidReceive(clientMetricReport);

      const defaultClientMetricReport = new DefaultClientMetricReport(logger);
      const ssrc = 6789;
      defaultClientMetricReport.streamMetricReports[ssrc] = new StreamMetricReport();
      task.metricsDidReceive(defaultClientMetricReport);
    });

    it('no-op if there is no SdkBitrateFrame ever received', () => {
      const metric = 'bytesReceived';
      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.previousMetrics[metric] = 100 * 1000;
      streamMetricReport.currentMetrics[metric] = 200 * 1000;
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.DOWNSTREAM;

      const clientMetricReport = new DefaultClientMetricReport(logger);
      clientMetricReport.streamMetricReports[1] = streamMetricReport;
      task.metricsDidReceive(clientMetricReport);
    });

    it('handles clientMetricReport and not fire callback if receiving video meets expectation', () => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        attendeeIdForStreamId(streamId: number): string {
          return 'attendee' + streamId.toString();
        }
      }
      context.videoStreamIndex = new TestVideoStreamIndex(logger);
      task.handleSignalingClientEvent(createSignalingEventForBitrateFrame(logger));
      const metric = 'bytesReceived';
      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.previousMetrics[metric] = 100 * 1000;
      streamMetricReport.currentMetrics[metric] = 200 * 1000;
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.DOWNSTREAM;

      const streamMetricReportAudio = new StreamMetricReport();
      streamMetricReportAudio.previousMetrics[metric] = 10 * 1000;
      streamMetricReportAudio.currentMetrics[metric] = 100 * 1000;
      streamMetricReportAudio.streamId = 0;
      streamMetricReportAudio.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReportAudio.direction = ClientMetricReportDirection.UPSTREAM;

      const clientMetricReport = new DefaultClientMetricReport(logger);
      clientMetricReport.streamMetricReports[1] = streamMetricReport;
      clientMetricReport.streamMetricReports[56789] = streamMetricReportAudio;
      task.metricsDidReceive(clientMetricReport);
    });

    it('handles clientMetricReport and fires callback if receiving video falls short', done => {
      class TestObserver implements AudioVideoObserver {
        videoNotReceivingEnoughData?(receivingDataMap: ClientVideoStreamReceivingReport[]): void {
          for (const report of receivingDataMap) {
            if (report.attendeeId === 'attendeeId1') {
              done();
            }
          }
        }
      }
      context.audioVideoController.addObserver(new TestObserver());
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        attendeeIdForStreamId(streamId: number): string {
          return 'attendeeId' + streamId.toString();
        }
      }
      context.videoStreamIndex = new TestVideoStreamIndex(logger);
      task.handleSignalingClientEvent(createSignalingEventForBitrateFrame(logger));
      const metric = 'bytesReceived';
      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.previousMetrics[metric] = 30 * 1000;
      streamMetricReport.currentMetrics[metric] = 80 * 1000;
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.DOWNSTREAM;

      const streamMetricReportAudio = new StreamMetricReport();
      streamMetricReportAudio.previousMetrics[metric] = 10 * 1000;
      streamMetricReportAudio.currentMetrics[metric] = 100 * 1000;
      streamMetricReportAudio.streamId = 0;
      streamMetricReportAudio.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReportAudio.direction = ClientMetricReportDirection.UPSTREAM;

      const clientMetricReport = new DefaultClientMetricReport(logger);
      clientMetricReport.streamMetricReports[1] = streamMetricReport;
      clientMetricReport.streamMetricReports[56789] = streamMetricReportAudio;
      task.metricsDidReceive(clientMetricReport);
    });

    it('handles clientMetricReport in no attendee id case', () => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        attendeeIdForStreamId(_streamId: number): string {
          return '';
        }
      }
      context.videoStreamIndex = new TestVideoStreamIndex(logger);
      task.handleSignalingClientEvent(createSignalingEventForBitrateFrame(logger));
      const metric = 'bytesReceived';
      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.previousMetrics[metric] = 100 * 1000;
      streamMetricReport.currentMetrics[metric] = 200 * 1000;
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.DOWNSTREAM;

      const clientMetricReport = new DefaultClientMetricReport(logger);
      clientMetricReport.streamMetricReports[1] = streamMetricReport;
      task.metricsDidReceive(clientMetricReport);
    });

    it('handles clientMetricReport in no previous metric case', () => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        attendeeIdForStreamId(_streamId: number): string {
          return 'attendeeid';
        }
      }
      context.videoStreamIndex = new TestVideoStreamIndex(logger);
      task.handleSignalingClientEvent(createSignalingEventForBitrateFrame(logger));
      const metric = 'bytesReceived';
      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.previousMetrics[metric] = 100 * 1000;
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.DOWNSTREAM;

      const clientMetricReport = new DefaultClientMetricReport(logger);
      clientMetricReport.streamMetricReports[1] = streamMetricReport;
      task.metricsDidReceive(clientMetricReport);
    });

    it('could trigger resubscription', done => {
      // eslint-disable-next-line
      type RawMetrics = any;
      class TestClientMetricReport extends DefaultClientMetricReport {
        packetsReceived: RawMetrics = null;
        fractionLoss: RawMetrics = null;
        videoPacketSentPerSecond: RawMetrics = 1000;
        videoUpstreamBitrate: RawMetrics = 100;
        availableSendBandwidth: RawMetrics = 1200 * 1000;
        availableReceiveBandwidth: RawMetrics = 1000 * 1000;

        getObservableMetrics(): { [id: string]: number } {
          return {
            audioPacketsReceived: this.packetsReceived,
            audioPacketsReceivedFractionLoss: this.fractionLoss,
            videoPacketSentPerSecond: this.videoPacketSentPerSecond,
            videoUpstreamBitrate: this.videoUpstreamBitrate,
            availableSendBandwidth: this.availableSendBandwidth,
            availableReceiveBandwidth: this.availableReceiveBandwidth,
          };
        }
      }
      let firstTimeUplink = 0;
      let firstTimeDownlink = 0;
      class TestDownlinkPolicy extends VideoAdaptiveProbePolicy {
        updateMetrics(_metricReport: ClientMetricReport): void {
          return;
        }

        wantsResubscribe(): boolean {
          firstTimeDownlink += 1;
          if (firstTimeDownlink % 2 === 0) {
            return true;
          } else {
            return false;
          }
        }
      }
      class TestVideoUplinkPolicy extends DefaultSimulcastUplinkPolicy {
        wantsResubscribe(): boolean {
          if (firstTimeUplink < 4) {
            firstTimeUplink += 1;
            return false;
          } else {
            firstTimeUplink += 1;
            return true;
          }
        }
      }
      context.videoTileController.startLocalVideoTile();
      context.videoStreamIndex = new SimulcastVideoStreamIndex(logger);

      context.videoUplinkBandwidthPolicy = new TestVideoUplinkPolicy('self', logger);
      context.videoDownlinkBandwidthPolicy = new TestDownlinkPolicy(logger, null);
      const spy = sinon.spy(context.audioVideoController, 'update');
      // task.handleSignalingClientEvent(createSignalingEventForBitrateFrame(logger));
      const metric = 'bytesReceived';
      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.previousMetrics[metric] = 30 * 1000;
      streamMetricReport.currentMetrics[metric] = 80 * 1000;
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.DOWNSTREAM;

      const streamMetricReportAudio = new StreamMetricReport();
      streamMetricReportAudio.previousMetrics[metric] = 10 * 1000;
      streamMetricReportAudio.currentMetrics[metric] = 100 * 1000;
      streamMetricReportAudio.streamId = 0;
      streamMetricReportAudio.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReportAudio.direction = ClientMetricReportDirection.UPSTREAM;

      const clientMetricReport = new TestClientMetricReport(logger);
      clientMetricReport.streamMetricReports[1] = streamMetricReport;
      clientMetricReport.streamMetricReports[56789] = streamMetricReportAudio;
      task.metricsDidReceive(clientMetricReport);
      task.metricsDidReceive(clientMetricReport);
      task.metricsDidReceive(clientMetricReport);
      task.metricsDidReceive(clientMetricReport);
      task.metricsDidReceive(clientMetricReport);
      new TimeoutScheduler(100).start(() => {
        // @ts-ignore
        expect(context.videoUplinkBandwidthPolicy.lastUplinkBandwidthKbps).to.equal(1200);
        expect(spy.called).to.be.true;
        done();
      });
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

  describe('connectionHealthDidChange', () => {
    it('does not set the last active timestamp of the reconnect controller if it misses any pong', () => {
      const spy = sinon.spy(context.reconnectController, 'setLastActiveTimestampMs');
      const connectionHealthData = new ConnectionHealthData();
      connectionHealthData.consecutiveMissedPongs = 1;
      task.connectionHealthDidChange(connectionHealthData);
      expect(spy.called).to.be.false;
    });

    it('cannot set the last active timestamp of the reconnect controller if not existed', () => {
      const spy = sinon.spy(context.reconnectController, 'setLastActiveTimestampMs');
      const connectionHealthData = new ConnectionHealthData();
      connectionHealthData.consecutiveMissedPongs = 0;
      context.reconnectController = null;
      task.connectionHealthDidChange(connectionHealthData);
      expect(spy.called).to.be.false;
    });

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
      const spy = sinon.spy(context.eventController, 'pushMeetingState');

      class TestObserver implements AudioVideoObserver {
        connectionDidBecomePoor(): void {
          expect(context.poorConnectionCount).to.eq(1);
          expect(spy.calledWith('receivingAudioDropped')).to.be.true;
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

    it('notifies the connection is poor regardless of the event controller existence', done => {
      class TestObserver implements AudioVideoObserver {
        connectionDidBecomePoor(): void {
          expect(context.poorConnectionCount).to.eq(1);
          done();
        }
      }

      context.audioVideoController.addObserver(new TestObserver());
      context.eventController = null;

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

    it('notifies the connection is good when changed from poor', done => {
      const testConfig = new ConnectionHealthPolicyConfiguration();
      testConfig.cooldownTimeMs = 500;
      testConfig.pastSamplesToConsider = 15;
      testConfig.packetsExpected = 10;
      task = new MonitorTask(context, testConfig, new ConnectionHealthData());
      let notifiedPoor = 0;
      let notifiedGood = 0;
      class TestObserver implements AudioVideoObserver {
        connectionDidBecomePoor(): void {
          notifiedPoor++;
        }

        connectionDidBecomeGood(): void {
          notifiedGood++;
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
      expect(notifiedPoor).to.equal(1);
      expect(notifiedGood).to.equal(0);
      // during hold down time, connectionDidBecomePoor and connectionDidBecomeGood should not be called.
      task.connectionHealthDidChange(connectionHealthData);
      expect(notifiedPoor).to.equal(1);
      expect(notifiedGood).to.equal(0);

      new TimeoutScheduler(testConfig.cooldownTimeMs + 10).start(() => {
        connectionHealthData.packetsReceivedInLastMinute = [
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
          10,
        ];

        task.connectionHealthDidChange(connectionHealthData);
        expect(notifiedPoor).to.equal(1);
        expect(notifiedGood).to.equal(1);

        task.connectionHealthDidChange(connectionHealthData);
        expect(notifiedPoor).to.equal(1);
        expect(notifiedGood).to.equal(1);

        done();
      });
    });

    it('suggests turning off video', done => {
      class TestObserver implements AudioVideoObserver {
        connectionDidSuggestStopVideo(): void {
          expect(context.poorConnectionCount).to.eq(1);
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
    it('handles SdkBitrateFrame', done => {
      const avgBitrateTestValue = 35000 * 1000;
      const streamIdTestValue = 1;
      class TestObserver implements AudioVideoObserver {
        estimatedDownlinkBandwidthLessThanRequired(_estimation: number, _required: number): void {
          expect(_required).to.equal(avgBitrateTestValue / 1000);
          done();
        }
      }
      context.videoSubscriptions = [streamIdTestValue];
      context.videoStreamIndex = new DefaultVideoStreamIndex(logger);
      context.audioVideoController.addObserver(new TestObserver());
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const message = SdkSignalFrame.create();
      message.bitrates = SdkBitrateFrame.create();
      const bitrate = SdkBitrate.create();
      bitrate.sourceStreamId = streamIdTestValue;
      bitrate.avgBitrateBps = avgBitrateTestValue;
      message.bitrates.bitrates.push(bitrate);
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.ReceivedSignalFrame,
          message
        )
      );
    });

    it('handles SdkBitrate for no video subscription case', () => {
      class TestObserver implements AudioVideoObserver {
        estimatedDownlinkBandwidthLessThanRequired(_estimation: number, _required: number): void {
          assert.fail();
        }
      }
      context.videoSubscriptions = [];
      context.videoStreamIndex = new DefaultVideoStreamIndex(logger);
      context.audioVideoController.addObserver(new TestObserver());
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const message = SdkSignalFrame.create();
      message.bitrates = SdkBitrateFrame.create();
      const bitrate = SdkBitrate.create();
      bitrate.sourceStreamId = 1;
      bitrate.avgBitrateBps = 35000 * 1000;
      message.bitrates.bitrates.push(bitrate);
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.ReceivedSignalFrame,
          message
        )
      );
      context.videoSubscriptions = null;
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.ReceivedSignalFrame,
          message
        )
      );
    });

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

    it('stops audio and video if the error status code is 410 (MeetingEnded)', () => {
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

    it('captures the signaling dropped state when the WebSocket has an error', done => {
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);

      context.audioVideoController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(attributes.meetingHistory[0].name).to.equal('signalingDropped');
          done();
        },
      });

      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.WebSocketError,
          null
        )
      );

      new TimeoutScheduler(100).start(() => {
        context.eventController.publishEvent('meetingEnded');
      });
    });

    it('captures the signaling dropped state when the WebSocket is closed', done => {
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);

      context.audioVideoController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(attributes.meetingHistory[0].name).to.equal('signalingDropped');
          expect(attributes.meetingHistory[1].name).to.equal('meetingEnded');

          // [signalingDropped, meetingEnded]. Note that meeting
          // history includes only one "signalingDropped."
          expect(attributes.meetingHistory.length).to.equal(2);
          done();
        },
      });

      const signalingClient = new DefaultSignalingClient(webSocketAdapter, logger);
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          signalingClient,
          SignalingClientEventType.WebSocketClosed,
          null,
          4410
        )
      );
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          signalingClient,
          SignalingClientEventType.WebSocketClosed,
          null,
          4500
        )
      );

      new TimeoutScheduler(100).start(() => {
        context.eventController.publishEvent('meetingEnded');
      });
    });

    it('can handle when the event controller does not exist', done => {
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);

      context.audioVideoController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(attributes.meetingHistory[0].name).to.equal('meetingEnded');

          // Meeting history includes only "meetingEnded" since
          // the event controller is missing before publishing.
          expect(attributes.meetingHistory.length).to.equal(1);
          done();
        },
      });

      context.eventController = null;
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.WebSocketError,
          null
        )
      );

      context.eventController = new DefaultEventController(context.audioVideoController);
      new TimeoutScheduler(100).start(() => {
        context.eventController.publishEvent('meetingEnded');
      });
    });
  });
});
