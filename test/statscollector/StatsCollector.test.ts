// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { RedundantAudioRecoveryMetricReport } from '../../src';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import { BackgroundSegmentationInitializationStatus } from '../../src/backgroundsegmentation/BackgroundSegmentationMetrics';
import ClientMetricReport, {
  CustomStatsReport,
} from '../../src/clientmetricreport/ClientMetricReport';
import ClientMetricReportDirection from '../../src/clientmetricreport/ClientMetricReportDirection';
import ClientMetricReportMediaType from '../../src/clientmetricreport/ClientMetricReportMediaType';
import StreamMetricReport from '../../src/clientmetricreport/StreamMetricReport';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionLifecycleEvent from '../../src/meetingsession/MeetingSessionLifecycleEvent';
import MeetingSessionLifecycleEventCondition from '../../src/meetingsession/MeetingSessionLifecycleEventCondition';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import { SdkClientMetricFrame, SdkMetric } from '../../src/signalingprotocol/SignalingProtocol';
import AudioLogEvent from '../../src/statscollector/AudioLogEvent';
import StatsCollector from '../../src/statscollector/StatsCollector';
import VideoLogEvent from '../../src/statscollector/VideoLogEvent';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import VideoElementDisplay from '../../src/videotile/VideoElementDisplay';
import VideoElementObjectFit from '../../src/videotile/VideoElementObjectFit';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('StatsCollector', () => {
  class TestAudioVideoController extends NoOpAudioVideoController {
    testPeer: RTCPeerConnection = new RTCPeerConnection();

    get rtcPeerConnection(): RTCPeerConnection | null {
      return this.testPeer;
    }
  }

  const expect: Chai.ExpectStatic = chai.expect;
  const eventNamePrefix = 'meeting';
  const interval = 10;
  const CLIENT_TYPE = 'amazon-chime-sdk-js';

  let logger: NoOpDebugLogger;
  let domMockBehavior = new DOMMockBehavior();
  let domMockBuilder: DOMMockBuilder;
  let signalingClient: DefaultSignalingClient;
  let audioVideoController: NoOpAudioVideoController;
  let statsCollector: StatsCollector;
  let configuration: MeetingSessionConfiguration;

  beforeEach(() => {
    logger = new NoOpDebugLogger();
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    signalingClient = new DefaultSignalingClient(new DefaultWebSocketAdapter(logger), logger);
    audioVideoController = new TestAudioVideoController();
    statsCollector = new StatsCollector(audioVideoController, logger, interval);
    configuration = new TestAudioVideoController().configuration;
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('toAttribute', () => {
    it('does not convert if the input is in lower case', () => {
      expect(statsCollector.toAttribute('lower_case')).to.equal('lower_case');
    });

    it('converts the input to lower case', () => {
      expect(statsCollector.toAttribute('UPPER_CASE')).to.equal('upper_case');
    });

    it('converts CamelCase to snake_case', () => {
      expect(statsCollector.toAttribute('CamelCaseWithCAPS')).to.equal('camel_case_with_caps');
    });
  });

  describe('logLatency', () => {
    let logEventTimeAttributes: { [id: string]: string };

    beforeEach(() => {
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      logEventTimeAttributes = {
        call_id: configuration.meetingId,
        client_type: CLIENT_TYPE,
        metric_type: 'latency',
      };
    });

    it('logs the latency', () => {
      const eventName = 'ping_pong';
      const timeMs = 100;
      const attributes = { attr1: 'value1' };
      const spy = sinon.spy(statsCollector, 'metricsAddTime');
      statsCollector.logLatency(eventName, timeMs, attributes);
      expect(
        spy.calledOnceWith(`${eventNamePrefix}_${eventName}`, timeMs, {
          ...logEventTimeAttributes,
          ...attributes,
        })
      ).to.be.true;
    });

    it('logs the latency without attributes', () => {
      const eventName = 'ping_pong';
      const timeMs = 100;
      const spy = sinon.spy(statsCollector, 'metricsAddTime');
      statsCollector.logLatency(eventName, timeMs);
      expect(spy.calledOnceWith(`${eventNamePrefix}_${eventName}`, timeMs, logEventTimeAttributes))
        .to.be.true;
    });
  });

  describe('logging event', () => {
    let logEventAttributes: { [id: string]: string };

    beforeEach(() => {
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      logEventAttributes = {
        call_id: configuration.meetingId,
        client_type: CLIENT_TYPE,
      };
    });

    describe('logStateTimeout', () => {
      it('logs the state timeout', () => {
        const stateName = 'stopped';
        const attributes = { attr1: 'value1' };
        const spy = sinon.spy(statsCollector, 'metricsLogEvent');
        statsCollector.logStateTimeout(stateName, attributes);
        expect(
          spy.calledOnceWith('meeting_session_state_timeout', {
            ...logEventAttributes,
            ...attributes,
            state: `state_${stateName}`,
          })
        ).to.be.true;
      });
    });

    describe('logAudioEvent', () => {
      it('logs the audio event', () => {
        const event = AudioLogEvent.DeviceChanged;
        const attributes = { attr1: 'value1' };
        const spy = sinon.spy(statsCollector, 'metricsLogEvent');
        statsCollector.logAudioEvent(event, attributes);
        expect(
          spy.calledOnceWith(`audio_device_changed`, {
            ...logEventAttributes,
            ...attributes,
          })
        ).to.be.true;
      });
    });

    describe('logVideoEvent', () => {
      it('logs the video event', () => {
        const event = VideoLogEvent.InputAttached;
        const attributes = { attr1: 'value1' };
        const spy = sinon.spy(statsCollector, 'metricsLogEvent');
        statsCollector.logVideoEvent(event, attributes);
        expect(
          spy.calledOnceWith(`video_input_attached`, {
            ...logEventAttributes,
            ...attributes,
          })
        ).to.be.true;
      });
    });

    describe('logMeetingSessionStatus', () => {
      it('logs the meeting session status', () => {
        const status = new MeetingSessionStatus(MeetingSessionStatusCode.OK);
        const attributes = {
          status: `${status.statusCode()}`,
          status_code: `${status.statusCode()}`,
        };
        const spy = sinon.spy(statsCollector, 'metricsLogEvent');
        statsCollector.logMeetingSessionStatus(status);
        expect(spy.calledWith(`${status.statusCode()}`, logEventAttributes)).to.be.true;
        expect(
          spy.calledWith(`meeting_session_status`, {
            ...logEventAttributes,
            ...attributes,
          })
        ).to.be.true;
      });

      it('logs the meeting session status with failure events', () => {
        const status = new MeetingSessionStatus(
          MeetingSessionStatusCode.AudioAuthenticationRejected
        );
        const attributes = {
          status: `${status.statusCode()}`,
          status_code: `${status.statusCode()}`,
        };
        const spy = sinon.spy(statsCollector, 'metricsLogEvent');
        statsCollector.logMeetingSessionStatus(status);
        expect(spy.calledWith(`${status.statusCode()}`, logEventAttributes)).to.be.true;
        [
          'meeting_session_status',
          'meeting_session_stopped',
          'meeting_session_audio_failed',
          'meeting_session_failed',
        ].forEach(eventName => {
          expect(
            spy.calledWith(eventName, {
              ...logEventAttributes,
              ...attributes,
            })
          ).to.be.true;
        });
      });
    });

    describe('logLifecycleEvent', () => {
      it('logs the lifecycle event', () => {
        const spy = sinon.spy(statsCollector, 'metricsLogEvent');
        statsCollector.logLifecycleEvent(
          MeetingSessionLifecycleEvent.Connecting,
          MeetingSessionLifecycleEventCondition.ConnectingNew
        );
        expect(spy.calledOnce).to.be.true;
      });
    });
  });

  describe('metrics', () => {
    beforeEach(() => {
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
    });

    describe('Promise-based getStats', () => {
      it('starts and stops WebRTC metrics collection', done => {
        const spy = sinon.spy(audioVideoController.rtcPeerConnection, 'getStats');
        statsCollector = new StatsCollector(audioVideoController, logger, interval);
        statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
        new TimeoutScheduler(interval + 5).start(() => {
          statsCollector.stop();
          expect(spy.calledOnce).to.be.true;
          done();
        });
      });

      it('cannot get stats if the peer connection does not exist', done => {
        class TestObserver implements AudioVideoObserver {
          metricsDidReceive(_clientMetricReport: ClientMetricReport): void {
            done();
          }
        }
        class NoPeerAudioVideoController extends NoOpAudioVideoController {
          get rtcPeerConnection(): RTCPeerConnection | null {
            return null;
          }
        }
        audioVideoController = new NoPeerAudioVideoController();
        audioVideoController.addObserver(new TestObserver());
        statsCollector = new StatsCollector(audioVideoController, logger, interval);
        statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
        new TimeoutScheduler(interval + 5).start(() => {
          statsCollector.stop();
          done();
        });
      });

      it('fails to get stats from the peer connection', done => {
        let errorMessage: string;
        class TestLogger extends NoOpDebugLogger {
          error(msg: string): void {
            errorMessage = msg;
          }
        }
        statsCollector = new StatsCollector(audioVideoController, new TestLogger(), interval);

        domMockBehavior.rtcPeerConnectionGetStatsSucceeds = false;
        const spy = sinon.spy(audioVideoController.rtcPeerConnection, 'getStats');
        statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
        new TimeoutScheduler(interval + 5).start(() => {
          statsCollector.stop();
          expect(spy.calledOnce).to.be.true;
          expect(errorMessage.includes('Failed to getStats')).to.be.true;
          done();
        });
      });

      it('uses the default interval and cannot start more than once', () => {
        statsCollector = new StatsCollector(audioVideoController, logger);
        expect(statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger))).to.be
          .true;
        expect(statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger))).to.be
          .false;
        statsCollector.stop();
      });

      it('notifies observers', done => {
        class TestObserver implements AudioVideoObserver {
          metricsDidReceive(_clientMetricReport: ClientMetricReport): void {
            statsCollector.stop();
            done();
          }
        }
        audioVideoController.addObserver(new TestObserver());
        statsCollector = new StatsCollector(audioVideoController, logger, interval);
        statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
      });

      it('can have metric overriden', done => {
        class TestObserver implements AudioVideoObserver {
          metricsDidReceive(clientMetricReport: ClientMetricReport): void {
            statsCollector.stop();
            expect(clientMetricReport.getObservableMetricValue('test')).to.eq(10);
            done();
          }
        }
        audioVideoController.addObserver(new TestObserver());
        statsCollector = new StatsCollector(audioVideoController, logger, interval);
        statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
        statsCollector.overrideObservableMetric('test', 10);
      });
    });
  });

  describe('validators', () => {
    describe('isValidRawMetricReport', () => {
      it('checks type of raw metric report', () => {
        statsCollector = new StatsCollector(audioVideoController, logger, interval);
        statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
        expect(
          statsCollector.isValidStandardRawMetric({
            type: 'candidate-pair',
            state: 'succeeded',
          })
        ).to.be.true;
        expect(
          statsCollector.isValidStandardRawMetric({
            type: 'inbound-rtp',
          })
        ).to.be.true;
        expect(
          statsCollector.isValidStandardRawMetric({
            type: 'outbound-rtp',
          })
        ).to.be.true;
        expect(
          statsCollector.isValidStandardRawMetric({
            type: 'media-playout',
          })
        ).to.be.true;
        expect(
          statsCollector.isValidStandardRawMetric({
            type: 'remote-inbound-rtp',
          })
        ).to.be.true;
        expect(
          statsCollector.isValidStandardRawMetric({
            type: 'remote-outbound-rtp',
          })
        ).to.be.true;
        expect(
          statsCollector.isValidStandardRawMetric({
            type: 'media-source',
            kind: 'audio',
          })
        ).to.be.true;
        expect(
          statsCollector.isValidStandardRawMetric({
            type: 'media-source',
            kind: 'video',
          })
        ).to.be.true;

        statsCollector.stop();
      });
    });

    describe('isValidSsrc', () => {
      it('checks valid ssrc', done => {
        class TestVideoStreamIndex extends DefaultVideoStreamIndex {
          streamIdForSSRC(_ssrcId: number): number {
            return 1;
          }
        }
        statsCollector = new StatsCollector(audioVideoController, logger, interval);
        statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
        new TimeoutScheduler(interval + 5).start(() => {
          statsCollector.stop();
          expect(
            statsCollector.isValidSsrc({
              type: 'inbound-rtp',
              id: 'id',
              kind: 'video',
            })
          ).to.be.true;
          expect(
            statsCollector.isValidSsrc({
              type: 'outbound-rtp',
              id: 'id',
              kind: 'video',
            })
          ).to.be.true;
          expect(
            statsCollector.isValidSsrc({
              type: 'inbound-rtp',
              id: 'id',
              kind: 'audio',
            })
          ).to.be.true;
          expect(
            statsCollector.isValidSsrc({
              type: 'outbound-rtp',
              id: 'outbound',
              kind: 'video',
            })
          ).to.be.true;
          done();
        });
      });

      it('checks invalid ssrc', done => {
        class TestVideoStreamIndex extends DefaultVideoStreamIndex {
          streamIdForSSRC(_ssrcId: number): number {
            return 0;
          }
        }
        statsCollector = new StatsCollector(audioVideoController, logger, interval);
        statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
        new TimeoutScheduler(interval + 5).start(() => {
          statsCollector.stop();
          expect(
            statsCollector.isValidSsrc({
              type: 'inbound-rtp',
              id: 'id',
              kind: 'video',
            })
          ).to.be.false;
          done();
        });
      });
    });

    describe('filterRawMetricReports', () => {
      it('filters out invalid reports', done => {
        statsCollector = new StatsCollector(audioVideoController, logger, interval);
        statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
        new TimeoutScheduler(interval + 5).start(() => {
          expect(
            statsCollector.filterRawMetricReports([
              {
                type: 'invalid-type',
              },
            ])
          ).to.deep.equal([]);
          statsCollector.stop();
          done();
        });
      });
    });
  });

  describe('protobuf packaging', () => {
    it('global metric report', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCIceCandidatePair',
          type: 'candidate-pair',
          state: 'succeeded',
          availableIncomingBitrate: 1000,
        },
      ];

      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });

    it('stream metric report and videoStreamIndex has no stream', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPVideoStream',
          type: 'inbound-rtp',
          kind: 'video',
          packetsLost: 10,
        },
      ];

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });

    it('stream metric report and videoStreamIndex has streams', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }

        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPVideoStream',
          type: 'inbound-rtp',
          kind: 'video',
          packetsLost: 10,
          jitterBufferDelay: 100,
          decoderImplementation: 'FFmpeg',
        },
      ];

      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));

      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });

    it('add object metric when there is object type metrics and current value is undefined', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }

        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }

      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPVideoStream',
          type: 'outbound-rtp',
          kind: 'video',
          packetsLost: 10,
          jitterBufferDelay: 100,
          qualityLimitationDurations: {
            cpu: 1.0,
            other: 0.0,
          },
        },
      ];

      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));

      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });

    it('add object metric when there is object type metrics and current value is not undefined', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }

        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }

      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPVideoStream',
          type: 'outbound-rtp',
          kind: 'video',
          packetsLost: 10,
          jitterBufferDelay: 100,
          qualityLimitationDurations: {
            cpu: 1.0,
            other: 0.0,
          },
        },
      ];

      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.UPSTREAM;
      streamMetricReport.currentMetrics['packetsLost'] = 10;
      streamMetricReport.currentMetrics['jitterBufferDelay'] = 100;
      streamMetricReport.currentObjectMetrics['qualityLimitationDurations'] = {
        cpu: 1.0,
        other: 0.0,
      };

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));

      // @ts-ignore
      statsCollector.clientMetricReport.streamMetricReports[1] = streamMetricReport;

      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });

    it('add render resolution for downstream video stream', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }

        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }

        attendeeIdForStreamId(streamId: number): string {
          return `attendee-${streamId}`;
        }
      }

      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPVideoStream',
          type: 'inbound-rtp',
          kind: 'video',
          packetsLost: 10,
          jitterBufferDelay: 100,
          decoderImplementation: 'FFmpeg',
        },
      ];

      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.DOWNSTREAM;
      streamMetricReport.currentMetrics['packetsLost'] = 10;
      streamMetricReport.currentMetrics['jitterBufferDelay'] = 100;

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.videoTileResolutionDidChange('attendee-1', 1280, 720);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));

      // @ts-ignore
      statsCollector.clientMetricReport.streamMetricReports[1] = streamMetricReport;

      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.videoTileUnbound('attendee-1');
        statsCollector.stop();
        done();
      });
    });

    it('add capture resolution for upstream video stream', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }

        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }

        attendeeIdForStreamId(streamId: number): string {
          return `attendee-${streamId}`;
        }
      }

      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCOutboundRTPVideoStream',
          type: 'outbound-rtp',
          kind: 'video',
          ssrc: 1,
          packetsLost: 10,
          jitterBufferDelay: 100,
        },
        {
          id: 'MediaSource',
          type: 'media-source',
          kind: 'video',
          width: 1280,
          jitterBufferDelay: 720,
        },
      ];

      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.UPSTREAM;
      streamMetricReport.currentMetrics['packetsLost'] = 10;
      streamMetricReport.currentMetrics['jitterBufferDelay'] = 100;

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));

      // @ts-ignore
      statsCollector.clientMetricReport.streamMetricReports[1] = streamMetricReport;

      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });

    it('emit error when video source exists without uplink video stream', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([]);
        }
      }

      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPVideoStream',
          type: 'inbound-rtp',
          kind: 'video',
          ssrc: 1,
          packetsLost: 10,
          jitterBufferDelay: 100,
        },
        {
          id: 'MediaSource',
          type: 'media-source',
          kind: 'video',
          width: 1280,
          jitterBufferDelay: 720,
        },
      ];

      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.DOWNSTREAM;
      streamMetricReport.currentMetrics['packetsLost'] = 10;
      streamMetricReport.currentMetrics['jitterBufferDelay'] = 100;

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));

      // @ts-ignore
      statsCollector.clientMetricReport.streamMetricReports[1] = streamMetricReport;

      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });

    it('stream metric report and videoStreamIndex has streams and there are existing streamMetricReports', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }

        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }

      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPVideoStream',
          type: 'inbound-rtp',
          kind: 'video',
          packetsLost: 10,
          jitterBufferDelay: 100,
          decoderImplementation: 'FFmpeg',
        },
      ];

      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.streamId = 1;
      streamMetricReport.mediaType = ClientMetricReportMediaType.AUDIO;
      streamMetricReport.direction = ClientMetricReportDirection.UPSTREAM;
      streamMetricReport.currentMetrics['packetsLost'] = 10;
      streamMetricReport.currentMetrics['jitterBufferDelay'] = 100;
      streamMetricReport.currentStringMetrics['decoderImplementation'] = 'FFmpeg';
      streamMetricReport.currentStringMetrics['invalid-type'] = 'invalid-value';

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));

      // @ts-ignore
      statsCollector.clientMetricReport.streamMetricReports[1] = streamMetricReport;

      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });

    it('adds the metric frame from the stream metric report when videoStreamIndex has streams', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }

        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPVideoStream',
          type: 'inbound-rtp',
          kind: 'video',
          packetsLost: 10,
          jitterBufferDelay: 100,
        },
      ];

      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));

      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });

    it('adds the metric frame from the stream metric report when videoStreamIndex has streams and value in unknown type', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }

        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPVideoStream',
          type: 'inbound-rtp',
          kind: 'video',
          packetsLost: 10,
          jitterBufferDelay: 100,
          decoderImplementation: true,
        },
      ];

      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));

      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });

    it('cannot add the metric frame if the type does not exist in the metric spec', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCIceCandidatePair',
          type: 'candidate-pair',
          state: 'succeeded',
          availableIncomingBitrate: 1000,
        },
      ];
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });

    it('updates the report using the video upstream metrics map', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCIceCandidatePair',
          type: 'candidate-pair',
          state: 'succeeded',
          roundTripTime: 10,
        },
      ];

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        done();
      });
    });
    it('adds decoderLoss metric when concealedSamples and totalSamplesReceived are present', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }

      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPAudioStream',
          type: 'inbound-rtp',
          kind: 'audio',
          ssrc: 12345,
          concealedSamples: 500,
          totalSamplesReceived: 1000,
        },
      ];

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
      const spy = sinon.spy(signalingClient, 'sendClientMetrics');

      new TimeoutScheduler(interval + 5).start(() => {
        try {
          statsCollector.stop();

          const sentMetricFrame = spy.getCall(0).args[0] as SdkClientMetricFrame;

          const decoderLossMetric = sentMetricFrame.streamMetricFrames[0]?.metrics.find(
            metric => metric.type === SdkMetric.Type.RTC_SPK_FRACTION_DECODER_LOSS_PERCENT
          );

          expect(decoderLossMetric).to.exist;
          expect(decoderLossMetric.value).to.equal((500 / 1000) * 100);

          spy.restore();
          done();
        } catch (error) {
          spy.restore();
          done(error);
        }
      });
    });

    it('adds jitterBufferMs metric when jitterBufferDelay and jitterBufferEmittedCount are present', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }

      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPAudioStream',
          type: 'inbound-rtp',
          kind: 'audio',
          ssrc: 12345,
          jitterBufferDelay: 0.8,
          jitterBufferEmittedCount: 200,
        },
      ];

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
      const spy = sinon.spy(signalingClient, 'sendClientMetrics');

      new TimeoutScheduler(interval + 5).start(() => {
        try {
          statsCollector.stop();

          const sentMetricFrame = spy.getCall(0).args[0] as SdkClientMetricFrame;

          const jitterBufferMsMetric = sentMetricFrame.streamMetricFrames[0]?.metrics.find(
            metric => metric.type === SdkMetric.Type.RTC_SPK_JITTER_BUFFER_MS
          );

          expect(jitterBufferMsMetric).to.exist;
          expect(jitterBufferMsMetric.value).to.equal((0.8 / 200) * 1000);

          spy.restore();
          done();
        } catch (error) {
          spy.restore();
          done(error);
        }
      });
    });

    it('does not send decoderLoss metric when dependencies are missing', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }

      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPAudioStream',
          type: 'inbound-rtp',
          kind: 'audio',
          ssrc: 12345,
          totalSamplesReceived: 1000,
        },
      ];

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
      const spy = sinon.spy(signalingClient, 'sendClientMetrics');

      new TimeoutScheduler(interval + 5).start(() => {
        try {
          statsCollector.stop();

          const sentMetricFrame = spy.getCall(0).args[0] as SdkClientMetricFrame;

          const decoderLossMetric = sentMetricFrame.streamMetricFrames[0]?.metrics.find(
            metric => metric.type === SdkMetric.Type.RTC_SPK_FRACTION_DECODER_LOSS_PERCENT
          );

          expect(decoderLossMetric).to.not.exist;

          spy.restore();
          done();
        } catch (error) {
          spy.restore();
          done(error);
        }
      });
    });

    it('does not send jitterBufferMs metric when dependencies are missing', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }

      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPAudioStream',
          type: 'inbound-rtp',
          kind: 'audio',
          ssrc: 12345,
          jitterBufferDelay: 0.8,
        },
      ];

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
      const spy = sinon.spy(signalingClient, 'sendClientMetrics');

      new TimeoutScheduler(interval + 5).start(() => {
        try {
          statsCollector.stop();

          const sentMetricFrame = spy.getCall(0).args[0] as SdkClientMetricFrame;

          const jitterBufferMsMetric = sentMetricFrame.streamMetricFrames[0]?.metrics.find(
            metric => metric.type === SdkMetric.Type.RTC_SPK_JITTER_BUFFER_MS
          );

          expect(jitterBufferMsMetric).to.not.exist;

          spy.restore();
          done();
        } catch (error) {
          spy.restore();
          done(error);
        }
      });
    });
  });

  describe('videoTileRenderMetricsDidReceive', () => {
    it('ignores local video metrics (groupId 0)', () => {
      statsCollector.videoTileRenderMetricsDidReceive(0, { fps: 30, timestampMs: Date.now() });
      // Should not throw, just returns early
    });

    it('stores remote video FPS by groupId', () => {
      statsCollector.videoTileRenderMetricsDidReceive(1, { fps: 25, timestampMs: Date.now() });
      statsCollector.videoTileRenderMetricsDidReceive(2, { fps: 15, timestampMs: Date.now() });
      // Values are stored internally and used in metric reports
    });

    it('adds videoRemoteRenderFps to downstream metric report', done => {
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1]);
        }

        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }

        attendeeIdForStreamId(_streamId: number): string {
          return 'attendee-1';
        }

        groupIdForSSRC(_ssrcId: number): number {
          return 5;
        }
      }

      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPVideoStream',
          type: 'inbound-rtp',
          kind: 'video',
          packetsLost: 0,
          jitterBufferDelay: 0,
          decoderImplementation: 'FFmpeg',
        },
      ];

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.videoTileRenderMetricsDidReceive(5, { fps: 25, timestampMs: Date.now() });
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));

      const streamMetricReport = new StreamMetricReport();
      streamMetricReport.streamId = 1;
      streamMetricReport.groupId = 5;
      streamMetricReport.mediaType = ClientMetricReportMediaType.VIDEO;
      streamMetricReport.direction = ClientMetricReportDirection.DOWNSTREAM;
      // @ts-ignore
      statsCollector.clientMetricReport.streamMetricReports[1] = streamMetricReport;

      new TimeoutScheduler(interval + 5).start(() => {
        expect(streamMetricReport.currentMetrics['videoRemoteRenderFps']).to.equal(25);
        statsCollector.stop();
        done();
      });
    });

    it('cleans up remoteRenderFpsMap on videoTileUnbound with groupId', () => {
      statsCollector.videoTileRenderMetricsDidReceive(5, { fps: 25, timestampMs: Date.now() });
      statsCollector.videoTileUnbound('attendee-1', 5);
      // After unbind, the fps entry should be removed (no way to directly check the map,
      // but we verify it doesn't crash and the entry is cleaned)
    });
  });

  describe('videoTileDisplayDidChange', () => {
    class TestVideoStreamIndex extends DefaultVideoStreamIndex {
      streamIdForSSRC(_ssrcId: number): number {
        return 1;
      }

      attendeeIdForStreamId(_streamId: number): string {
        return 'attendee-1';
      }
    }

    // One report for the whole test, as StatsCollector keeps a stream's report across intervals.
    let report: StreamMetricReport;
    const reportOnce = (): StreamMetricReport => {
      // @ts-ignore
      statsCollector.addRenderResolutionToVideoDownstreamMetrics(report, 1);
      return report;
    };
    const tileDisplay = (
      overrides: Partial<ConstructorParameters<typeof VideoElementDisplay>[0]> = {}
    ): VideoElementDisplay =>
      new VideoElementDisplay({
        contentWidth: 1280,
        contentHeight: 720,
        boundingWidth: 640,
        boundingHeight: 360.4,
        intersectionPercent: 35,
        objectFit: VideoElementObjectFit.Cover,
        intrinsicLayout: true,
        isRendered: () => true,
        devicePixelRatio: () => 1.25,
        ...overrides,
      });

    beforeEach(() => {
      report = new StreamMetricReport();
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
    });

    afterEach(() => {
      statsCollector.stop();
    });

    it('copies the render size, size in device pixels, visible percent, object-fit and intrinsic layout of the bound tile', () => {
      expect(reportOnce().currentMetrics).to.deep.equal({});
      statsCollector.videoTileDisplayDidChange('attendee-1', tileDisplay());
      expect(reportOnce().currentMetrics).to.deep.equal({
        videoRenderWidth: 1280,
        videoRenderHeight: 720,
        videoRenderDevicePixelWidth: 800,
        videoRenderDevicePixelHeight: 451,
        videoRenderVisiblePercent: 35,
        videoRenderObjectFit: 2,
      });
      expect(report.currentBooleanMetrics).to.deep.equal({ videoRenderIntrinsicLayout: true });
    });

    it('stops reporting the values a tile no longer has, on the same report', () => {
      statsCollector.videoTileDisplayDidChange('attendee-1', tileDisplay());
      reportOnce();
      statsCollector.videoTileDisplayDidChange(
        'attendee-1',
        tileDisplay({
          contentWidth: undefined,
          contentHeight: undefined,
          boundingWidth: 0,
          boundingHeight: 0,
          intersectionPercent: 0,
          intrinsicLayout: false,
        })
      );
      expect(reportOnce().currentMetrics).to.deep.equal({
        videoRenderVisiblePercent: 0,
        videoRenderObjectFit: 2,
      });
      expect(report.currentBooleanMetrics).to.deep.equal({ videoRenderIntrinsicLayout: false });
      statsCollector.videoTileUnbound('attendee-1');
      expect(reportOnce().currentMetrics).to.deep.equal({});
      expect(report.currentBooleanMetrics).to.deep.equal({});
    });

    it('re-reads the device pixel ratio and visibility every report, without a new display', () => {
      let ratio = 1;
      let rendered = true;
      statsCollector.videoTileDisplayDidChange(
        'attendee-1',
        tileDisplay({
          boundingWidth: 640,
          boundingHeight: 360,
          intersectionPercent: 100,
          isRendered: () => rendered,
          devicePixelRatio: () => ratio,
        })
      );
      expect(reportOnce().currentMetrics).to.deep.include({
        videoRenderDevicePixelWidth: 640,
        videoRenderDevicePixelHeight: 360,
        videoRenderVisiblePercent: 100,
      });
      ratio = 2;
      rendered = false;
      expect(reportOnce().currentMetrics).to.deep.include({
        videoRenderDevicePixelWidth: 1280,
        videoRenderDevicePixelHeight: 720,
        videoRenderVisiblePercent: 0,
      });
    });

    it('ignores the resolution callback, which apps still receive', () => {
      statsCollector.videoTileResolutionDidChange('attendee-1', 1280, 720);
      expect(reportOnce().currentMetrics).to.deep.equal({});
    });
  });

  describe('video source frame rate', () => {
    const startWithUplinkVideo = (): StreamMetricReport => {
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
      const report = new StreamMetricReport();
      report.mediaType = ClientMetricReportMediaType.VIDEO;
      report.direction = ClientMetricReportDirection.UPSTREAM;
      // @ts-ignore
      statsCollector.clientMetricReport.streamMetricReports[1] = report;
      return report;
    };

    afterEach(() => {
      statsCollector.stop();
    });

    it('reports the media-source frame rate as the uplink input frame rate', () => {
      const report = startWithUplinkVideo();
      // @ts-ignore
      statsCollector.updateVideoSourceMetrics([
        { type: 'media-source', kind: 'video', width: 1280, height: 720, framesPerSecond: 24 },
      ]);
      expect(report.currentMetrics['videoInputFramesPerSecond']).to.equal(24);
      expect(report.currentMetrics['videoInputWidth']).to.equal(1280);
    });

    it('leaves the input frame rate out when the media-source has none', () => {
      const report = startWithUplinkVideo();
      // @ts-ignore
      statsCollector.updateVideoSourceMetrics([
        { type: 'media-source', kind: 'video', width: 1280, height: 720 },
      ]);
      expect(report.currentMetrics).to.not.have.property('videoInputFramesPerSecond');
    });
  });

  describe('stop', () => {
    it('stops without an error even if it has not started', done => {
      const spy = sinon.spy(audioVideoController.rtcPeerConnection, 'getStats');
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
      statsCollector.stop();
      statsCollector.stop();
      new TimeoutScheduler(interval + 5).start(() => {
        expect(spy.calledOnce).to.be.false;
        done();
      });
    });
  });

  describe('When it has a red recovery metric report', () => {
    it('adds it to stats report as audio inbound-rtp-red', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [];

      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(_clientMetricReport: ClientMetricReport): void {
          const rtcStatsReports = _clientMetricReport.customStatsReports;
          let foundReport = false;
          // @ts-ignore
          rtcStatsReports.forEach(report => {
            if (report.kind === 'audio') {
              if (report.type === 'inbound-rtp-red') {
                foundReport = true;
                expect(report.totalAudioPacketsExpected).to.equal(7);
                expect(report.totalAudioPacketsLost).to.equal(5);
                expect(report.totalAudioPacketsRecoveredRed).to.equal(3);
                expect(report.totalAudioPacketsRecoveredFec).to.equal(2);
              }
            }
          });
          expect(foundReport).to.be.true;
          statsCollector.stop();
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.recoveryMetricsDidReceive({
        currentTimestampMs: 1000,
        totalAudioPacketsExpected: 7,
        totalAudioPacketsLost: 5,
        totalAudioPacketsRecoveredRed: 3,
        totalAudioPacketsRecoveredFec: 2,
      } as RedundantAudioRecoveryMetricReport);
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
    });

    it('does not add it to stats report if already processed', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [];

      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(_clientMetricReport: ClientMetricReport): void {
          const rtcStatsReports = _clientMetricReport.customStatsReports;
          let foundReport = false;
          // @ts-ignore
          rtcStatsReports.forEach(report => {
            if (report.kind === 'audio') {
              if (report.type === 'inbound-rtp-red') {
                foundReport = true;
              }
            }
          });
          expect(foundReport).to.be.false;
          statsCollector.stop();
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.recoveryMetricsDidReceive({
        currentTimestampMs: 1000,
        totalAudioPacketsExpected: 7,
        totalAudioPacketsLost: 5,
        totalAudioPacketsRecoveredRed: 3,
        totalAudioPacketsRecoveredFec: 2,
      } as RedundantAudioRecoveryMetricReport);
      statsCollector['lastRedRecoveryMetricReportConsumedTimestampMs'] = 1000;
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
    });
  });

  describe('When it has an upstream video stream', () => {
    it('adds a custom metric for video codec degradation', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [];

      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(_clientMetricReport: ClientMetricReport): void {
          const rtcStatsReports = _clientMetricReport.customStatsReports;
          let foundReport = false;
          // @ts-ignore
          rtcStatsReports.forEach(report => {
            if (report.kind === 'video') {
              if (report.type === 'outbound-rtp') {
                foundReport = true;
                expect(report.ssrc).to.equal(1);
                expect(report.videoCodecDegradationHighEncodeCpu).to.equal(1);
                expect(report.videoCodecDegradationEncodeFailure).to.equal(2);
              }
            }
          });
          expect(foundReport).to.be.true;
          statsCollector.stop();
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }

        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCInboundRTPVideoStream',
          type: 'outbound-rtp',
          kind: 'video',
          packetsLost: 10,
          jitterBufferDelay: 100,
          qualityLimitationDurations: {
            cpu: 1.0,
            other: 0.0,
          },
        },
      ];
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
      statsCollector.videoCodecDegradationHighEncodeCpuDidReceive();
      statsCollector.videoCodecDegradationEncodeFailureDidReceive();
      statsCollector.videoCodecDegradationEncodeFailureDidReceive();
    });
  });

  describe('video end-to-end delay', () => {
    const NTP_EPOCH_TO_UNIX_EPOCH_MS = 2208988800000;

    class TestVideoStreamIndex extends DefaultVideoStreamIndex {
      streamIdForSSRC(ssrc: number): number {
        return ssrc === 4005 ? 0 : 1;
      }
    }

    function videoReceiver(
      sources: Partial<
        RTCRtpSynchronizationSource & { captureTimestamp: number; senderCaptureTimeOffset: number }
      >[],
      kind: string = 'video'
    ): RTCRtpReceiver {
      // @ts-ignore
      return { track: kind ? { kind } : null, getSynchronizationSources: () => sources };
    }

    function setReceivers(receivers: RTCRtpReceiver[]): sinon.SinonStub {
      const stub = sinon.stub().returns(receivers);
      // @ts-ignore
      (audioVideoController as TestAudioVideoController).testPeer.getReceivers = stub;
      return stub;
    }

    const delayedSource = {
      source: 4001,
      timestamp: 1_000_000_150,
      captureTimestamp: 999_995_020 + NTP_EPOCH_TO_UNIX_EPOCH_MS,
      senderCaptureTimeOffset: 5000,
    };

    function statsReports(withRoundTripTime: boolean): object[] {
      const reports: object[] = [
        { type: 'inbound-rtp', kind: 'video', ssrc: 4001, id: 'IN4001' },
        {
          type: 'remote-outbound-rtp',
          kind: 'video',
          ssrc: 4001,
          id: 'RO4001',
          timestamp: 1_000_000_110,
          remoteTimestamp: 1_000_000_000,
        },
        {
          type: 'remote-outbound-rtp',
          kind: 'video',
          ssrc: 4005,
          id: 'RO4005',
          timestamp: 1,
          remoteTimestamp: 1,
        },
        {
          type: 'remote-outbound-rtp',
          kind: 'audio',
          ssrc: 4006,
          id: 'RO4006',
          timestamp: 1,
          remoteTimestamp: 1,
        },
        { type: 'transport', id: 'T0' },
      ];
      if (withRoundTripTime) {
        reports.push(
          { type: 'transport', id: 'T1', selectedCandidatePairId: 'CP1' },
          { type: 'candidate-pair', id: 'CP1', state: 'succeeded', currentRoundTripTime: 0.02 }
        );
      }
      return reports;
    }

    function sentDelays(sendSpy: sinon.SinonSpy): number[] {
      const frame: SdkClientMetricFrame = sendSpy.lastCall.args[0];
      return frame.streamMetricFrames
        .flatMap(streamMetricFrame => streamMetricFrame.metrics)
        .filter(metric => metric.type === SdkMetric.Type.VIDEO_END_TO_END_DELAY_MS)
        .map(metric => metric.value);
    }

    function delayReports(clientMetricReport: ClientMetricReport): CustomStatsReport[] {
      return clientMetricReport.customStatsReports.filter(
        // @ts-ignore
        report => report.type === 'inbound-rtp-end-to-end-delay'
      );
    }

    it('adds the delay from capture to frame delivery for remote videos with capture timestamps', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = statsReports(true);
      setReceivers([
        videoReceiver([delayedSource]),
        videoReceiver([{ source: 4002, timestamp: 1 }]),
        videoReceiver([{ ...delayedSource, source: 4003, senderCaptureTimeOffset: undefined }]),
        videoReceiver([{ ...delayedSource, source: 4004 }]),
        videoReceiver([{ ...delayedSource, source: 4005 }]),
        videoReceiver([{ ...delayedSource, source: 4006 }], 'audio'),
        videoReceiver([{ ...delayedSource, source: 4007 }], null),
      ]);
      const sendSpy = sinon.spy(signalingClient, 'sendClientMetrics');

      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(clientMetricReport: ClientMetricReport): void {
          statsCollector.stop();
          const reports = delayReports(clientMetricReport);
          expect(reports.length).to.equal(1);
          expect(reports[0].ssrc).to.equal(4001);
          expect(reports[0].videoEndToEndDelayMs).to.equal(30);
          expect(
            clientMetricReport.getObservableVideoMetricValue('videoDownstreamEndToEndDelayMs', 4001)
          ).to.equal(30);
          expect(sentDelays(sendSpy)).to.deep.equal([30]);
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
    });

    it('drops the delay of a video whose source stops carrying capture timestamps', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = statsReports(true);
      const getReceivers = setReceivers([videoReceiver([delayedSource])]);
      getReceivers.onSecondCall().returns([videoReceiver([{ source: 4001, timestamp: 1 }])]);
      const sendSpy = sinon.spy(signalingClient, 'sendClientMetrics');

      let firstDelay: number;
      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(clientMetricReport: ClientMetricReport): void {
          const delay = clientMetricReport.getObservableVideoMetricValue(
            'videoDownstreamEndToEndDelayMs',
            4001
          );
          if (firstDelay === undefined) {
            firstDelay = delay;
            return;
          }
          statsCollector.stop();
          expect(firstDelay).to.equal(30);
          expect(delay).to.be.NaN;
          expect(sentDelays(sendSpy)).to.deep.equal([]);
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
    });

    it('does not add the delay without a round trip time', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = statsReports(false);
      const getReceivers = setReceivers([videoReceiver([delayedSource])]);

      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(clientMetricReport: ClientMetricReport): void {
          statsCollector.stop();
          expect(delayReports(clientMetricReport).length).to.equal(0);
          expect(getReceivers.called).to.be.false;
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
    });
  });

  describe('When it has encoded transform media metrics', () => {
    class TestVideoStreamIndex extends DefaultVideoStreamIndex {
      streamIdForSSRC(_ssrcId: number): number {
        return 1;
      }
    }

    it('adds transform metrics to stats report', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        { type: 'outbound-rtp', kind: 'audio', ssrc: 1001 },
        { type: 'inbound-rtp', kind: 'audio', ssrc: 2001 },
        { type: 'outbound-rtp', kind: 'video', ssrc: 3001 },
        { type: 'inbound-rtp', kind: 'video', ssrc: 4001 },
      ];

      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(_clientMetricReport: ClientMetricReport): void {
          const rtcStatsReports = _clientMetricReport.customStatsReports;
          const audioSenderReport = rtcStatsReports.find(
            // @ts-ignore
            report => report.type === 'outbound-rtp-transform' && report.kind === 'audio'
          );
          const audioReceiverReport = rtcStatsReports.find(
            // @ts-ignore
            report => report.type === 'inbound-rtp-transform' && report.kind === 'audio'
          );
          const videoSenderReport = rtcStatsReports.find(
            // @ts-ignore
            report => report.type === 'outbound-rtp-transform' && report.kind === 'video'
          );
          const videoReceiverReport = rtcStatsReports.find(
            // @ts-ignore
            report => report.type === 'inbound-rtp-transform' && report.kind === 'video'
          );

          expect(audioSenderReport).to.exist;
          expect(audioSenderReport.ssrc).to.equal(1001);
          expect(audioSenderReport.audioSentTransformPps).to.equal(100);

          expect(audioReceiverReport).to.exist;
          expect(audioReceiverReport.ssrc).to.equal(2001);
          expect(audioReceiverReport.audioReceivedTransformPps).to.equal(200);

          expect(videoSenderReport).to.exist;
          expect(videoSenderReport.ssrc).to.equal(3001);
          expect(videoSenderReport.videoSentTransformPps).to.equal(300);

          expect(videoReceiverReport).to.exist;
          expect(videoReceiverReport.ssrc).to.equal(4001);
          expect(videoReceiverReport.videoReceivedTransformPps).to.equal(400);

          statsCollector.stop();
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.encodedTransformMediaMetricsDidReceive({
        audioSendMetrics: { 1001: { ssrc: 1001, packetCount: 100, timestamp: 1000 } },
        audioReceiveMetrics: { 2001: { ssrc: 2001, packetCount: 200, timestamp: 1000 } },
        videoSendMetrics: { 3001: { ssrc: 3001, packetCount: 300, timestamp: 1000 } },
        videoReceiveMetrics: { 4001: { ssrc: 4001, packetCount: 400, timestamp: 1000 } },
      });
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
    });

    it('does not add transform metrics if no metrics received', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [];

      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(_clientMetricReport: ClientMetricReport): void {
          const rtcStatsReports = _clientMetricReport.customStatsReports;
          const transformReport = rtcStatsReports.find(
            // @ts-ignore
            report =>
              report.type === 'outbound-rtp-transform' || report.type === 'inbound-rtp-transform'
          );
          expect(transformReport).to.be.undefined;
          statsCollector.stop();
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      // Don't call encodedTransformMediaMetricsDidReceive
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
    });

    it('handles multiple streams per media type', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        { type: 'outbound-rtp', kind: 'audio', ssrc: 1001 },
        { type: 'outbound-rtp', kind: 'audio', ssrc: 1002 },
      ];

      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(_clientMetricReport: ClientMetricReport): void {
          const rtcStatsReports = _clientMetricReport.customStatsReports;
          const audioSenderReports = rtcStatsReports.filter(
            // @ts-ignore
            report => report.type === 'outbound-rtp-transform' && report.kind === 'audio'
          );

          expect(audioSenderReports.length).to.equal(2);
          const ssrcs = audioSenderReports.map((r: { ssrc: number }) => r.ssrc).sort();
          expect(ssrcs).to.deep.equal([1001, 1002]);

          statsCollector.stop();
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.encodedTransformMediaMetricsDidReceive({
        audioSendMetrics: {
          1001: { ssrc: 1001, packetCount: 100, timestamp: 1000 },
          1002: { ssrc: 1002, packetCount: 150, timestamp: 1000 },
        },
        audioReceiveMetrics: {},
        videoSendMetrics: {},
        videoReceiveMetrics: {},
      });
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
    });

    it('does not add transform metrics for streams missing from the WebRTC stats', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        { type: 'outbound-rtp', kind: 'audio', ssrc: 1001 },
        { type: 'inbound-rtp', kind: 'audio', ssrc: 2001 },
        { type: 'outbound-rtp', kind: 'video', ssrc: 3001 },
        { type: 'inbound-rtp', kind: 'video', ssrc: 4001 },
      ];

      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(_clientMetricReport: ClientMetricReport): void {
          statsCollector.stop();
          const transformSsrcs = _clientMetricReport.customStatsReports
            .filter(
              // @ts-ignore
              report =>
                report.type === 'outbound-rtp-transform' || report.type === 'inbound-rtp-transform'
            )
            .map((report: { ssrc: number }) => report.ssrc)
            .sort();
          expect(transformSsrcs).to.deep.equal([1001, 2001, 3001, 4001]);
          expect(Object.keys(_clientMetricReport.streamMetricReports).sort()).to.deep.equal([
            '1001',
            '2001',
            '3001',
            '4001',
          ]);
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.encodedTransformMediaMetricsDidReceive({
        audioSendMetrics: {
          1000: { ssrc: 1000, packetCount: 100, timestamp: 1000 },
          1001: { ssrc: 1001, packetCount: 100, timestamp: 1000 },
        },
        audioReceiveMetrics: {
          2000: { ssrc: 2000, packetCount: 200, timestamp: 1000 },
          2001: { ssrc: 2001, packetCount: 200, timestamp: 1000 },
        },
        videoSendMetrics: {
          3000: { ssrc: 3000, packetCount: 300, timestamp: 1000 },
          3001: { ssrc: 3001, packetCount: 300, timestamp: 1000 },
        },
        videoReceiveMetrics: {
          4000: { ssrc: 4000, packetCount: 400, timestamp: 1000 },
          4001: { ssrc: 4001, packetCount: 400, timestamp: 1000 },
        },
      });
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
    });

    it('reports the new audio sender after a reconnection replaces one that had stopped sending', done => {
      // SSRC 100 stops sending, then a reconnection replaces it with SSRC 900. The worker keeps
      // reporting SSRC 100, and SSRC 100 is the first upstream audio stream in key order.
      const oldSender = { type: 'outbound-rtp', kind: 'audio', ssrc: 100, packetsSent: 500 };
      const newSender = { type: 'outbound-rtp', kind: 'audio', ssrc: 900, packetsSent: 0 };
      domMockBehavior.rtcPeerConnectionGetStatsReports = [oldSender];
      let tick = 0;

      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(_clientMetricReport: ClientMetricReport): void {
          tick += 1;
          newSender.packetsSent += 50;
          if (tick === 2) {
            domMockBehavior.rtcPeerConnectionGetStatsReports = [newSender];
            statsCollector.encodedTransformMediaMetricsDidReceive({
              audioSendMetrics: {
                100: { ssrc: 100, packetCount: 500, timestamp: 1000 },
                900: { ssrc: 900, packetCount: 50, timestamp: 2000 },
              },
              audioReceiveMetrics: {},
              videoSendMetrics: {},
              videoReceiveMetrics: {},
            });
          }
          if (tick < 4) {
            return;
          }
          statsCollector.stop();
          expect(Object.keys(_clientMetricReport.streamMetricReports)).to.deep.equal(['900']);
          expect(_clientMetricReport.getObservableMetrics().audioPacketsSent).to.be.above(0);
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());

      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.encodedTransformMediaMetricsDidReceive({
        audioSendMetrics: { 100: { ssrc: 100, packetCount: 500, timestamp: 1000 } },
        audioReceiveMetrics: {},
        videoSendMetrics: {},
        videoReceiveMetrics: {},
      });
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
    });
  });

  describe('CPU pressure metric', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalScope = globalThis as any;
    let savedPressureObserver: unknown;
    let pressureCallback: ((records: { source: string; state: string }[]) => void) | undefined;

    beforeEach(() => {
      savedPressureObserver = globalScope.PressureObserver;
      pressureCallback = undefined;
      class FakePressureObserver {
        constructor(cb: (records: { source: string; state: string }[]) => void) {
          pressureCallback = cb;
        }
        observe(_source: string, _opts?: { sampleInterval?: number }): Promise<void> {
          return Promise.resolve();
        }
        unobserve(_source: string): void {}
        disconnect(): void {}
      }
      globalScope.PressureObserver = FakePressureObserver;
    });

    afterEach(() => {
      if (savedPressureObserver === undefined) {
        delete globalScope.PressureObserver;
      } else {
        globalScope.PressureObserver = savedPressureObserver;
      }
    });

    function findCpuPressureMetric(
      frame: SdkClientMetricFrame
    ): { type?: SdkMetric.Type; value?: number } | undefined {
      return frame.globalMetrics.find(m => m.type === SdkMetric.Type.CPU_PRESSURE_STATE);
    }

    it('forwards the latest CPU pressure state into the global metric frame', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [];
      const sendSpy = sinon.spy(signalingClient, 'sendClientMetrics');
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));

      // Wait for the monitor's observe() promise to resolve before delivering a sample.
      Promise.resolve().then(() => {
        expect(pressureCallback).to.exist;
        pressureCallback([{ source: 'cpu', state: 'serious' }]);

        new TimeoutScheduler(interval + 5).start(() => {
          statsCollector.stop();
          const metricFrames = sendSpy
            .getCalls()
            .map(c => c.args[0] as SdkClientMetricFrame)
            .filter(frame => findCpuPressureMetric(frame) !== undefined);
          expect(metricFrames.length).to.be.greaterThan(0);
          const metric = findCpuPressureMetric(metricFrames[metricFrames.length - 1]);
          expect(metric.value).to.equal(2);
          done();
        });
      });
    });

    it('omits the CPU pressure metric when no sample has been observed', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [];
      const sendSpy = sinon.spy(signalingClient, 'sendClientMetrics');
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));

      new TimeoutScheduler(interval + 5).start(() => {
        statsCollector.stop();
        const sentFrames = sendSpy.getCalls().map(c => c.args[0] as SdkClientMetricFrame);
        expect(sentFrames.length).to.be.greaterThan(0);
        for (const frame of sentFrames) {
          expect(findCpuPressureMetric(frame)).to.equal(undefined);
        }
        done();
      });
    });
  });

  describe('videoProcessorMetricsDidReceive', () => {
    it('stores video processor metrics', () => {
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      const metrics = {
        frameRate: 15,
        processors: [{ averageProcessLatency: 10.5, processorName: 'TestProcessor' }],
      };
      statsCollector.videoProcessorMetricsDidReceive(metrics);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((statsCollector as any).videoPipelineFrameRate).to.equal(15);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((statsCollector as any).videoProcessors[0].processorName).to.equal('TestProcessor');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((statsCollector as any).videoProcessors[0].averageProcessLatency).to.equal(10.5);
    });
  });

  describe('backgroundSegmentationInitializationMetricsDidReceive', () => {
    it('stores background segmentation metrics', () => {
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      statsCollector.backgroundSegmentationInitializationMetricsDidReceive({
        initializationStatus: BackgroundSegmentationInitializationStatus.SUCCESS,
        assetLoadingTimeMs: 150,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((statsCollector as any).backgroundSegmentationMetrics.length).to.equal(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((statsCollector as any).backgroundSegmentationMetrics[0].assetLoadingTimeMs).to.equal(
        150
      );
    });

    it('drops oldest when max exceeded', () => {
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      for (let i = 0; i < 55; i++) {
        statsCollector.backgroundSegmentationInitializationMetricsDidReceive({
          initializationStatus: BackgroundSegmentationInitializationStatus.SUCCESS,
          assetLoadingTimeMs: i,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((statsCollector as any).backgroundSegmentationMetrics.length).to.equal(50);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((statsCollector as any).backgroundSegmentationMetrics[0].assetLoadingTimeMs).to.equal(
        5
      );
    });
  });

  describe('backgroundSegmentationProcessorMetricsDidReceive', () => {
    it('stores the processor metrics', () => {
      statsCollector = new StatsCollector(audioVideoController, logger, interval);
      const report = {
        segmentationDurationMs: 12,
        effectRenderDurationMs: 5,
        framesPerSegmentation: 2,
        framesSubmitted: 30,
        framesSegmented: 15,
        estimatedCPUUsagePercentage: 10,
        modelType: 'selfie_general',
        delegateType: 'gpu',
        errorCount: 0,
      };
      statsCollector.backgroundSegmentationProcessorMetricsDidReceive(report);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((statsCollector as any).backgroundSegmentationProcessorMetric).to.deep.equal(report);
    });
  });

  describe('When it has background segmentation processor metrics', () => {
    it('adds custom metrics for background segmentation processor metrics', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [];

      class TestObserver implements AudioVideoObserver {
        metricsDidReceive(_clientMetricReport: ClientMetricReport): void {
          const rtcStatsReports = _clientMetricReport.customStatsReports;
          let foundReport = false;
          // @ts-ignore
          rtcStatsReports.forEach(report => {
            if (
              report.kind === 'video' &&
              report.type === 'outbound-rtp' &&
              report.videoBgSegSegmentationDurationMs !== undefined
            ) {
              foundReport = true;
              expect(report.ssrc).to.equal(1);
              expect(report.videoBgSegSegmentationDurationMs).to.equal(12);
              expect(report.videoBgSegEffectRenderDurationMs).to.equal(5);
              expect(report.videoBgSegFramesPerSegmentation).to.equal(2);
              expect(report.videoBgSegCpuUsagePercent).to.equal(10);
              expect(report.videoBgSegErrorCount).to.equal(0);
              expect(report.videoBgSegFramesSubmitted).to.equal(30);
              expect(report.videoBgSegFramesSegmented).to.equal(15);
              expect(report.videoBgSegModelType).to.equal('selfie_general');
              expect(report.videoBgSegDelegateType).to.equal('gpu');
              expect(report.videoBgSegInitializationDurationMs).to.equal(250);
              expect(report.videoBgSegInitializationFailure).to.equal(0);
            }
          });
          expect(foundReport).to.be.true;
          statsCollector.stop();
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        allStreams(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }

        streamIdForSSRC(_ssrcId: number): number {
          return 1;
        }
      }
      domMockBehavior.rtcPeerConnectionGetStatsReports = [
        {
          id: 'RTCOutboundRTPVideoStream',
          type: 'outbound-rtp',
          kind: 'video',
          ssrc: 1,
          packetsSent: 100,
          bytesSent: 50000,
        },
      ];
      statsCollector.start(signalingClient, new TestVideoStreamIndex(logger));
      statsCollector.backgroundSegmentationProcessorMetricsDidReceive({
        segmentationDurationMs: 12,
        effectRenderDurationMs: 5,
        framesPerSegmentation: 2,
        framesSubmitted: 30,
        framesSegmented: 15,
        estimatedCPUUsagePercentage: 10,
        modelType: 'selfie_general',
        delegateType: 'gpu',
        errorCount: 0,
        initializationDurationMs: 250,
        initializationFailure: 0,
      });
    });
  });
});
