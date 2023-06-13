// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoController from '../../src/audiovideocontroller/AudioVideoController';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';
import ClientMetricReport from '../../src/clientmetricreport/ClientMetricReport';
import ClientMetricReportDirection from '../../src/clientmetricreport/ClientMetricReportDirection';
import ClientMetricReportMediaType from '../../src/clientmetricreport/ClientMetricReportMediaType';
import StreamMetricReport from '../../src/clientmetricreport/StreamMetricReport';
import ConnectionHealthData from '../../src/connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../../src/connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import ConnectionMonitor from '../../src/connectionmonitor/ConnectionMonitor';
import AudioVideoEventAttributes from '../../src/eventcontroller/AudioVideoEventAttributes';
import DefaultEventController from '../../src/eventcontroller/DefaultEventController';
import EventAttributes from '../../src/eventcontroller/EventAttributes';
import EventName from '../../src/eventcontroller/EventName';
import Logger from '../../src/logger/Logger';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import NoOpMediaStreamBroker from '../../src/mediastreambroker/NoOpMediaStreamBroker';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
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
import StatsCollector from '../../src/statscollector/StatsCollector';
import MonitorTask from '../../src/task/MonitorTask';
import NoVideoDownlinkBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/NoVideoDownlinkBandwidthPolicy';
import VideoAdaptiveProbePolicy from '../../src/videodownlinkbandwidthpolicy/VideoAdaptiveProbePolicy';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIdSet from '../../src/videostreamidset/VideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import SimulcastVideoStreamIndex from '../../src/videostreamindex/SimulcastVideoStreamIndex';
import DefaultVideoTileController from '../../src/videotilecontroller/DefaultVideoTileController';
import DefaultVideoTileFactory from '../../src/videotilefactory/DefaultVideoTileFactory';
import DefaultSimulcastUplinkPolicy from '../../src/videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicy';
import NoVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NoVideoUplinkBandwidthPolicy';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import CreateMeetingResponseMock from '../meetingsession/CreateMeetingResponseMock';

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

  let task: MonitorTask;
  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder | null = null;
  let realtimeFatalErrorCallback: (error: Error) => void;
  let realtimeSignalStrengthCallback: (signalStrength: number) => void;

  const RECONNECT_TIMEOUT_MS = 120 * 1000;
  const RECONNECT_FIXED_WAIT_MS = 0;
  const RECONNECT_SHORT_BACKOFF_MS = 1 * 1000;
  const RECONNECT_LONG_BACKOFF_MS = 5 * 1000;
  const baseAudioVideoEventAttributeKeys = [
    'meetingStartDurationMs',
    'meetingDurationMs',
    'signalingOpenDurationMs',
    'iceGatheringDurationMs',
    'attendeePresenceDurationMs',
  ];
  const receivingAudioDroppedAudioVideoEventAttributeKeys = [
    ...baseAudioVideoEventAttributeKeys,
    'maxVideoTileCount',
    'poorConnectionCount',
  ];

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

  class TestStatsCollector extends StatsCollector {
    constructor(audioVideoController: AudioVideoController, logger: Logger) {
      super(audioVideoController, logger);
    }
    start(): boolean {
      return false;
    }
    stop(): void {}

    overrideObservableMetric(): void {}
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
    context.realtimeController = new TestRealtimeController(new NoOpMediaStreamBroker());
    context.eventController = new DefaultEventController(
      new NoOpAudioVideoController().configuration,
      logger
    );
    context.videoTileController = new DefaultVideoTileController(
      new DefaultVideoTileFactory(),
      context.audioVideoController,
      logger
    );
    context.videoDownlinkBandwidthPolicy = new NoVideoDownlinkBandwidthPolicy();
    context.videosToReceive = context.videoDownlinkBandwidthPolicy.chooseSubscriptions().clone();
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
    context.meetingSessionConfiguration = new MeetingSessionConfiguration(
      CreateMeetingResponseMock.MeetingResponseMock,
      CreateMeetingResponseMock.AttendeeResponseMock
    );
  });

  afterEach(() => {
    if (context.eventController) {
      (context.eventController as DefaultEventController).destroy();
      context.eventController = null;
    }
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('run', () => {
    beforeEach(() => {
      context.meetingSessionConfiguration.credentials.attendeeId = 'attendeeId';
      context.meetingSessionConfiguration.credentials.joinToken = 'foo-join-token';
      context.meetingSessionConfiguration.attendeePresenceTimeoutMs = 0;
    });

    it('registers an observer', async () => {
      const spy = sinon.spy(task, 'connectionHealthDidChange');
      const connectionHealthData = new ConnectionHealthData();

      await task.run();
      context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.connectionHealthDidChange(connectionHealthData);
      });

      expect(spy.calledOnceWith(connectionHealthData)).to.be.true;
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
      context.meetingSessionConfiguration.credentials = new MeetingSessionCredentials();
      context.meetingSessionConfiguration.credentials.attendeeId = 'attendeeId';
      context.meetingSessionConfiguration.credentials.joinToken = 'foo-join-token';
      context.meetingSessionConfiguration.attendeePresenceTimeoutMs = 5000;
    });

    it('registers an observer', async () => {
      const spy = sinon.spy(task, 'connectionHealthDidChange');
      const connectionHealthData = new ConnectionHealthData();

      await task.run();
      context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.connectionHealthDidChange(connectionHealthData);
      });

      expect(spy.calledOnceWith(connectionHealthData)).to.be.true;
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
      const spy = sinon.spy(task, 'connectionHealthDidChange');
      await task.run();
      context.removableObservers[0].removeObserver();
      context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.connectionHealthDidChange(new ConnectionHealthData());
      });
      expect(spy.called).to.be.false;
    });
  });

  describe('metricsDidReceive', () => {
    it('no-op if there is no SdkBitrateFrame ever received', () => {
      const metric = 'bytesReceived';
      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.previousMetrics[metric] = 100 * 1000;
      streamMetricReport.currentMetrics[metric] = 200 * 1000;
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.DOWNSTREAM;

      const clientMetricReport = new ClientMetricReport(logger);
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

      const clientMetricReport = new ClientMetricReport(logger);
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

      const clientMetricReport = new ClientMetricReport(logger);
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

      const clientMetricReport = new ClientMetricReport(logger);
      clientMetricReport.streamMetricReports[1] = streamMetricReport;
      task.metricsDidReceive(clientMetricReport);
    });

    it('could trigger resubscription', done => {
      // eslint-disable-next-line
      type RawMetrics = any;
      class TestClientMetricReport extends ClientMetricReport {
        packetsReceived: RawMetrics = null;
        fractionLoss: RawMetrics = null;
        videoPacketSentPerSecond: RawMetrics = 1000;
        videoUpstreamBitrate: RawMetrics = 100;
        availableOutgoingBitrate: RawMetrics = 1200 * 1000;
        availableIncomingBitrate: RawMetrics = 1000 * 1000;

        getObservableMetrics(): { [id: string]: number } {
          return {
            audioPacketsReceived: this.packetsReceived,
            audioPacketsReceivedFractionLoss: this.fractionLoss,
            videoPacketSentPerSecond: this.videoPacketSentPerSecond,
            videoUpstreamBitrate: this.videoUpstreamBitrate,
            availableOutgoingBitrate: this.availableOutgoingBitrate,
            availableIncomingBitrate: this.availableIncomingBitrate,
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
      context.videoDownlinkBandwidthPolicy = new TestDownlinkPolicy(logger);
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

  it('will not trigger resubscription if paused', done => {
    // eslint-disable-next-line
    type RawMetrics = any;
    class TestClientMetricReport extends ClientMetricReport {
      packetsReceived: RawMetrics = null;
      fractionLoss: RawMetrics = null;
      videoPacketSentPerSecond: RawMetrics = 1000;
      videoUpstreamBitrate: RawMetrics = 100;
      availableOutgoingBitrate: RawMetrics = 1200 * 1000;
      availableIncomingBitrate: RawMetrics = 1000 * 1000;

      getObservableMetrics(): { [id: string]: number } {
        return {
          audioPacketsReceived: this.packetsReceived,
          audioPacketsReceivedFractionLoss: this.fractionLoss,
          videoPacketSentPerSecond: this.videoPacketSentPerSecond,
          videoUpstreamBitrate: this.videoUpstreamBitrate,
          availableOutgoingBitrate: this.availableOutgoingBitrate,
          availableIncomingBitrate: this.availableIncomingBitrate,
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
    context.videoDownlinkBandwidthPolicy = new TestDownlinkPolicy(logger);
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

    task.resumeResubscribeCheck();
    task.pauseResubscribeCheck();
    task.resumeResubscribeCheck();
    task.pauseResubscribeCheck();

    task.metricsDidReceive(clientMetricReport);
    task.metricsDidReceive(clientMetricReport);
    task.metricsDidReceive(clientMetricReport);
    task.metricsDidReceive(clientMetricReport);
    task.metricsDidReceive(clientMetricReport);
    new TimeoutScheduler(100).start(() => {
      expect(spy.called).to.be.false;
      done();
    });
  });

  it('will trigger resubscription if paused and resumed', done => {
    // eslint-disable-next-line
    type RawMetrics = any;
    class TestClientMetricReport extends ClientMetricReport {
      packetsReceived: RawMetrics = null;
      fractionLoss: RawMetrics = null;
      videoPacketSentPerSecond: RawMetrics = 1000;
      videoUpstreamBitrate: RawMetrics = 100;
      availableOutgoingBitrate: RawMetrics = 1200 * 1000;
      availableIncomingBitrate: RawMetrics = 1000 * 1000;

      getObservableMetrics(): { [id: string]: number } {
        return {
          audioPacketsReceived: this.packetsReceived,
          audioPacketsReceivedFractionLoss: this.fractionLoss,
          videoPacketSentPerSecond: this.videoPacketSentPerSecond,
          videoUpstreamBitrate: this.videoUpstreamBitrate,
          availableOutgoingBitrate: this.availableOutgoingBitrate,
          availableIncomingBitrate: this.availableIncomingBitrate,
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
    context.videoDownlinkBandwidthPolicy = new TestDownlinkPolicy(logger);
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
    task.pauseResubscribeCheck();
    task.metricsDidReceive(clientMetricReport);
    new TimeoutScheduler(100).start(() => {
      task.resumeResubscribeCheck();

      task.pauseResubscribeCheck();
      task.metricsDidReceive(clientMetricReport);
      task.resumeResubscribeCheck();

      expect(spy.called).to.be.true;
      done();
    });
  });

  it('could trigger resubscription', done => {
    // eslint-disable-next-line
    class TestDownlinkPolicy extends VideoAdaptiveProbePolicy {
      updateMetrics(_metricReport: ClientMetricReport): void {
        return;
      }

      chooseSubscriptions(): VideoStreamIdSet {
        return new DefaultVideoStreamIdSet([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      }

      wantsResubscribe(): boolean {
        return true;
      }
    }

    context.videoSubscriptionLimit = 5;
    context.videoTileController.startLocalVideoTile();
    context.videoStreamIndex = new SimulcastVideoStreamIndex(logger);
    context.videoUplinkBandwidthPolicy = new NoVideoUplinkBandwidthPolicy();
    context.videoDownlinkBandwidthPolicy = new TestDownlinkPolicy(logger);
    const spy = sinon.spy(context.audioVideoController, 'update');

    const clientMetricReport = new ClientMetricReport(logger);
    task.metricsDidReceive(clientMetricReport);

    new TimeoutScheduler(100).start(() => {
      // @ts-ignore
      expect(context.videosToReceive.equal(new DefaultVideoStreamIdSet([1, 2, 3, 4, 5])));
      expect(spy.called).to.be.true;
      done();
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
      const spy = sinon.spy(context.eventController, 'publishEvent');

      class TestObserver implements AudioVideoObserver {
        connectionDidBecomePoor(): void {
          expect(context.poorConnectionCount).to.eq(1);
          const args = spy.getCalls()[0].args;
          const additionalArgs = <AudioVideoEventAttributes>args[1];
          assert.equal(args[0], 'receivingAudioDropped');
          assert.equal(additionalArgs.poorConnectionCount, 1);
          expect(additionalArgs).to.have.all.keys(
            receivingAudioDroppedAudioVideoEventAttributeKeys
          );
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

    describe('sending audio connection health', () => {
      let connectionHealthData: ConnectionHealthData;
      let testConfig: ConnectionHealthPolicyConfiguration;

      beforeEach(() => {
        testConfig = new ConnectionHealthPolicyConfiguration();
        testConfig.sendingAudioFailureSamplesToConsider = 2;
        class TestConnectionHealthData extends ConnectionHealthData {
          isConnectionStartRecent(_recentDurationMs: number): boolean {
            return false;
          }
        }
        connectionHealthData = new TestConnectionHealthData();
        connectionHealthData.setConsecutiveStatsWithNoAudioPacketsSent(
          testConfig.sendingAudioFailureSamplesToConsider
        );
      });

      it('does not notify sendingAudioFailed when audioVideoDidStart is not called', () => {
        const spy = sinon.spy(context.eventController, 'publishEvent');
        task.audioVideoDidStartConnecting(false);
        task.connectionHealthDidChange(connectionHealthData);
        expect(spy.calledWith('sendingAudioFailed')).to.be.false;
      });

      it('does not notify sendingAudioFailed when audioVideoDidStartConnecting is called after audioVideoDidStart', () => {
        const spy = sinon.spy(context.eventController, 'publishEvent');
        task.audioVideoDidStart();
        task.audioVideoDidStartConnecting(true);
        // audioVideoStart() not called after reconnection
        task.connectionHealthDidChange(connectionHealthData);
        expect(spy.calledWith('sendingAudioFailed')).to.be.false;
      });

      it('does not notify sendingAudioFailed when audioVideoDidStop is called', () => {
        const spy = sinon.spy(context.eventController, 'publishEvent');
        task.audioVideoDidStart();
        task.audioVideoDidStop(new MeetingSessionStatus(MeetingSessionStatusCode.Left));
        task.connectionHealthDidChange(connectionHealthData);
        expect(spy.calledWith('sendingAudioFailed')).to.be.false;
      });

      it('does notify sendingAudioFailed and sendingAudioRecovered when audioPacketsSent dips and recovers', () => {
        const spy = sinon.spy(context.eventController, 'publishEvent');
        task.audioVideoDidStart();
        task.connectionHealthDidChange(connectionHealthData);
        expect(spy.calledWith('sendingAudioFailed')).to.be.true;

        connectionHealthData.setConsecutiveStatsWithNoAudioPacketsSent(0);
        task.connectionHealthDidChange(connectionHealthData);
        expect(spy.calledWith('sendingAudioRecovered')).to.be.true;

        const calls = spy.getCalls();
        for (const call of calls) {
          const eventAttributes = call.args[1];
          expect(eventAttributes).to.have.all.keys(baseAudioVideoEventAttributeKeys);
        }
      });

      it('does nothing when event controller does not exist', () => {
        const spy = sinon.spy(context.eventController, 'publishEvent');
        context.eventController = null;

        task.audioVideoDidStart();
        task.connectionHealthDidChange(connectionHealthData);
        expect(spy.called).to.be.false;

        connectionHealthData.setConsecutiveStatsWithNoAudioPacketsSent(0);
        task.connectionHealthDidChange(connectionHealthData);
        expect(spy.called).to.be.false;
      });
    });
  });

  describe('handleSignalingClientEvent', () => {
    it('handles SdkBitrateFrame', () => {
      let called = false;
      class TestStatsCollector extends StatsCollector {
        constructor(audioVideoController: AudioVideoController, logger: Logger) {
          super(audioVideoController, logger);
        }
        start(): boolean {
          return false;
        }
        stop(): void {}
        overrideObservableMetric(name: string, value: number): void {
          called = true;
          expect(name).to.eq('availableIncomingBitrate');
          expect(value).to.eq(100000);
        }
      }

      const avgBitrateTestValue = 35000 * 1000;
      const streamIdTestValue = 1;
      context.videosToReceive = new DefaultVideoStreamIdSet([streamIdTestValue]);
      context.videoStreamIndex = new DefaultVideoStreamIndex(logger);
      context.statsCollector = new TestStatsCollector(context.audioVideoController, context.logger);
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const message = SdkSignalFrame.create();
      message.bitrates = SdkBitrateFrame.create();
      const bitrate = SdkBitrate.create();
      bitrate.sourceStreamId = streamIdTestValue;
      bitrate.avgBitrateBps = avgBitrateTestValue;
      message.bitrates.bitrates.push(bitrate);
      message.bitrates.serverAvailableOutgoingBitrate = 100;
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.ReceivedSignalFrame,
          message
        )
      );
      expect(called).to.be.true;
    });

    it('handles SdkBitrate for no video subscription case', () => {
      context.videoSubscriptions = [];
      context.videoStreamIndex = new DefaultVideoStreamIndex(logger);
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

    it('publish event for Signalling Dropped when Web Socket Failed', () => {
      const spy = sinon.spy(context.eventController, 'publishEvent');
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.WebSocketFailed,
          null
        )
      );
      expect(spy.calledWith('signalingDropped')).to.be.true;
    });

    it('publish event for Signalling Dropped when Web Socket Error', () => {
      const spy = sinon.spy(context.eventController, 'publishEvent');
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.WebSocketError,
          null
        )
      );
      expect(spy.calledWith('signalingDropped')).to.be.true;
    });

    it('publish event for Signalling Dropped when Web Socket Closed', () => {
      const spy = sinon.spy(context.eventController, 'publishEvent');
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const currentEvent = new SignalingClientEvent(
        new DefaultSignalingClient(webSocketAdapter, logger),
        SignalingClientEventType.WebSocketError,
        null
      );
      currentEvent.closeCode = 4410;
      task.handleSignalingClientEvent(currentEvent);
      expect(spy.calledWith('signalingDropped')).to.be.true;
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

    it('stops audio and video if the error status code is 411 (AudioAttendeeRemoved)', () => {
      const spy = sinon.spy(context.audioVideoController, 'handleMeetingSessionStatus');
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const message = SdkSignalFrame.create();
      message.type = SdkSignalFrame.Type.AUDIO_STATUS;
      message.audioStatus = SdkAudioStatusFrame.create();
      message.audioStatus.audioStatus = 411;
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
      context.eventController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          if (name === 'meetingEnded') {
            expect(attributes.meetingHistory[0].name).to.equal('signalingDropped');
            expect(attributes.meetingHistory[1].name).to.equal('meetingEnded');
            // [signalingDropped, meetingEnded]
            expect(attributes.meetingHistory.length).to.equal(2);
            done();
          }
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
      context.eventController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          if (name === 'meetingEnded') {
            expect(attributes.meetingHistory[0].name).to.equal('signalingDropped');
            expect(attributes.meetingHistory[1].name).to.equal('meetingEnded');
            // [signalingDropped, meetingEnded]. Note that meeting
            // history includes only one "signalingDropped."
            expect(attributes.meetingHistory.length).to.equal(2);
            done();
          }
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

      (context.eventController as DefaultEventController).destroy();
      context.eventController = null;
      task.handleSignalingClientEvent(
        new SignalingClientEvent(
          new DefaultSignalingClient(webSocketAdapter, logger),
          SignalingClientEventType.WebSocketError,
          null
        )
      );

      context.eventController = new DefaultEventController(
        new NoOpAudioVideoController().configuration,
        logger
      );

      context.eventController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(attributes.meetingHistory[0].name).to.equal('meetingEnded');

          // Meeting history includes only "meetingEnded" since
          // the event controller is missing before publishing.
          expect(attributes.meetingHistory.length).to.equal(1);
          done();
        },
      });
      new TimeoutScheduler(100).start(() => {
        context.eventController.publishEvent('meetingEnded');
      });
    });
  });
});
