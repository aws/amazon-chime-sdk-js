// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { RedundantAudioRecoveryMetricReport } from '../../src';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import ClientMetricReport from '../../src/clientmetricreport/ClientMetricReport';
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

  describe('When it has encoded transform media metrics', () => {
    it('adds transform metrics to stats report', done => {
      domMockBehavior.rtcPeerConnectionGetStatsReports = [];

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
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
    });

    it('does not add transform metrics if already processed', done => {
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
      statsCollector.encodedTransformMediaMetricsDidReceive({
        audioSendMetrics: { 1001: { ssrc: 1001, packetCount: 100, timestamp: 1000 } },
        audioReceiveMetrics: {},
        videoSendMetrics: {},
        videoReceiveMetrics: {},
      });
      // Set the last timestamp to match the current timestamp to simulate already processed
      statsCollector['lastEncodedTransformMediaMetricsTimestamp'] =
        statsCollector['encodedTransformMediaMetricsTimestamp'];
      statsCollector.start(signalingClient, new DefaultVideoStreamIndex(logger));
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
      domMockBehavior.rtcPeerConnectionGetStatsReports = [];

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
  });
});
