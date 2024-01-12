// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoController from '../../src/audiovideocontroller/AudioVideoController';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import ClientMetricReport from '../../src/clientmetricreport/ClientMetricReport';
import Direction from '../../src/clientmetricreport/ClientMetricReportDirection';
import MediaType from '../../src/clientmetricreport/ClientMetricReportMediaType';
import StreamMetricReport from '../../src/clientmetricreport/StreamMetricReport';
import Logger from '../../src/logger/Logger';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import VideoCodecCapability from '../../src/sdp/VideoCodecCapability';
import {
  SdkIndexFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
} from '../../src/signalingprotocol/SignalingProtocol';
import StatsCollector from '../../src/statscollector/StatsCollector';
import VideoEncodingMonitor from '../../src/videoencodingmonitor/VideoEncodingMonitor';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import VideoTile from '../../src/videotile/VideoTile';
import DefaultVideoTileController from '../../src/videotilecontroller/DefaultVideoTileController';
import DefaultVideoTileFactory from '../../src/videotilefactory/DefaultVideoTileFactory';
import CreateMeetingResponseMock from '../meetingsession/CreateMeetingResponseMock';

describe('VideoEncodingMonitor', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const logger = new NoOpDebugLogger();

  let context: AudioVideoControllerState;
  let videoEncodingMonitor: VideoEncodingMonitor;

  beforeEach(() => {
    context = new AudioVideoControllerState();
    context.meetingSessionConfiguration = new MeetingSessionConfiguration(
      CreateMeetingResponseMock.MeetingResponseMock,
      CreateMeetingResponseMock.AttendeeResponseMock
    );
    context.meetingSessionConfiguration.credentials.attendeeId = 'attendee-1';
    context.logger = logger;
    context.statsCollector = new TestStatsCollector(context.audioVideoController, context.logger);
    context.audioVideoController = new NoOpAudioVideoController();
    context.videoTileController = new TestVideoTileController(
      new DefaultVideoTileFactory(),
      context.audioVideoController,
      logger
    );
    videoEncodingMonitor = new VideoEncodingMonitor(context);
  });

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

  class TestVideoTileController extends DefaultVideoTileController {
    private testLocalTile: VideoTile | null = null;
    startLocalVideoTile(): number {
      this.testLocalTile = this.addVideoTile();
      this.testLocalTile.bindVideoStream('fake-id', true, context.activeVideoInput, 640, 480, 0);
      return this.testLocalTile.id();
    }

    getLocalVideoTile(): VideoTile {
      return this.testLocalTile;
    }
  }

  function prepareIndex(streamIds: number[]): DefaultVideoStreamIndex {
    const index: DefaultVideoStreamIndex = new DefaultVideoStreamIndex(new NoOpDebugLogger());
    const sources: SdkStreamDescriptor[] = [];
    for (const id of streamIds) {
      sources.push(
        new SdkStreamDescriptor({
          streamId: id,
          groupId: id,
          maxBitrateKbps: 100,
          mediaType: SdkStreamMediaType.VIDEO,
          attendeeId: `attendee-${id}`,
        })
      );
    }
    index.integrateIndexFrame(
      new SdkIndexFrame({
        atCapacity: false,
        sources: sources,
      })
    );
    return index;
  }

  describe('encodingMonitor', () => {
    it('should return when video tile is null', async () => {
      const index = prepareIndex([1, 2]);
      const clientMetricReport = new ClientMetricReport(new NoOpDebugLogger(), index, 'attendee-1');
      videoEncodingMonitor.encodingMonitor(clientMetricReport);
    });

    it('should return when there is no upstream video stream metrics', async () => {
      context.videoTileController.startLocalVideoTile();
      const index = prepareIndex([1, 2]);
      const clientMetricReport = new ClientMetricReport(new NoOpDebugLogger(), index, 'attendee-1');
      videoEncodingMonitor.encodingMonitor(clientMetricReport);
    });

    it('should not degrade codec when metrics are normal with hardware encoder', async () => {
      const index = prepareIndex([1, 2]);
      const clientMetricReport = new ClientMetricReport(new NoOpDebugLogger(), index, 'attendee-1');
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      const upstreamSsrc = 1;
      const upstreamReport = new StreamMetricReport();
      upstreamReport.mediaType = MediaType.VIDEO;
      upstreamReport.direction = Direction.UPSTREAM;
      upstreamReport.previousMetrics['totalEncodeTime'] = 1.0;
      upstreamReport.currentMetrics['totalEncodeTime'] = 1.1;
      upstreamReport.currentMetrics['framesPerSecond'] = 15;
      upstreamReport.previousMetrics['framesEncoded'] = 0;
      upstreamReport.currentMetrics['framesEncoded'] = 15;
      upstreamReport.currentStringMetrics['encoderImplementation'] = 'ExternalEncoder';
      upstreamReport.currentObjectMetrics['qualityLimitationDurations'] = {
        cpu: 0.0,
        other: 0.0,
      };
      upstreamReport.previousObjectMetrics['qualityLimitationDurations'] = {
        cpu: 0.0,
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[upstreamSsrc] = upstreamReport;

      context.videoTileController.startLocalVideoTile();
      for (let i = 0; i < 15; i++) {
        videoEncodingMonitor.encodingMonitor(clientMetricReport);
      }
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHighEncodeCpuCount).to.equal(0);
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHwEncodeFailureCount).to.equal(0);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHighEncodeCpuCnt).to.equal(0);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHwEncodeFailureCnt).to.equal(0);
    });

    it('should not degrade codec when metrics are normal with software encoder', async () => {
      const index = prepareIndex([1, 2]);
      const clientMetricReport = new ClientMetricReport(new NoOpDebugLogger(), index, 'attendee-1');
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      const upstreamSsrc = 1;
      const upstreamReport = new StreamMetricReport();
      upstreamReport.mediaType = MediaType.VIDEO;
      upstreamReport.direction = Direction.UPSTREAM;
      upstreamReport.previousMetrics['totalEncodeTime'] = 1.0;
      upstreamReport.currentMetrics['totalEncodeTime'] = 1.1;
      upstreamReport.currentMetrics['framesPerSecond'] = 15;
      upstreamReport.previousMetrics['framesEncoded'] = 0;
      upstreamReport.currentMetrics['framesEncoded'] = 15;
      upstreamReport.currentStringMetrics['encoderImplementation'] = 'OpenH264';
      upstreamReport.currentObjectMetrics['qualityLimitationDurations'] = {
        cpu: 0.0,
        other: 0.0,
      };
      upstreamReport.previousObjectMetrics['qualityLimitationDurations'] = {
        cpu: 0.0,
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[upstreamSsrc] = upstreamReport;

      context.videoTileController.startLocalVideoTile();
      for (let i = 0; i < 15; i++) {
        videoEncodingMonitor.encodingMonitor(clientMetricReport);
      }
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHighEncodeCpuCount).to.equal(0);
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHwEncodeFailureCount).to.equal(0);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHighEncodeCpuCnt).to.equal(0);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHwEncodeFailureCnt).to.equal(0);
    });

    it('should degrade codec when encode time is high with software encoder', async () => {
      const index = prepareIndex([1, 2]);
      const clientMetricReport = new ClientMetricReport(new NoOpDebugLogger(), index, 'attendee-1');
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      const upstreamSsrc = 1;
      const upstreamReport = new StreamMetricReport();
      upstreamReport.mediaType = MediaType.VIDEO;
      upstreamReport.direction = Direction.UPSTREAM;
      upstreamReport.previousMetrics['totalEncodeTime'] = 1.0;
      upstreamReport.currentMetrics['totalEncodeTime'] = 1.8;
      upstreamReport.currentMetrics['framesPerSecond'] = 15;
      upstreamReport.previousMetrics['framesEncoded'] = 0;
      upstreamReport.currentMetrics['framesEncoded'] = 15;
      upstreamReport.currentStringMetrics['encoderImplementation'] = 'OpenH264';
      upstreamReport.currentObjectMetrics['qualityLimitationDurations'] = {
        cpu: 0.0,
        other: 0.0,
      };
      upstreamReport.previousObjectMetrics['qualityLimitationDurations'] = {
        cpu: 0.0,
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[upstreamSsrc] = upstreamReport;

      context.videoTileController.startLocalVideoTile();
      for (let i = 0; i < 15; i++) {
        videoEncodingMonitor.encodingMonitor(clientMetricReport);
      }
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHighEncodeCpuCount).to.equal(1);
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHwEncodeFailureCount).to.equal(0);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHighEncodeCpuCnt).to.equal(4);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHwEncodeFailureCnt).to.equal(0);
    });

    it('should degrade codec when quality is limited due to CPU with software encoder', async () => {
      const index = prepareIndex([1, 2]);
      const clientMetricReport = new ClientMetricReport(new NoOpDebugLogger(), index, 'attendee-1');
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      const upstreamSsrc = 1;
      const upstreamReport = new StreamMetricReport();
      upstreamReport.mediaType = MediaType.VIDEO;
      upstreamReport.direction = Direction.UPSTREAM;
      upstreamReport.previousMetrics['totalEncodeTime'] = 1.0;
      upstreamReport.currentMetrics['totalEncodeTime'] = 1.1;
      upstreamReport.currentMetrics['framesPerSecond'] = 15;
      upstreamReport.previousMetrics['framesEncoded'] = 0;
      upstreamReport.currentMetrics['framesEncoded'] = 15;
      upstreamReport.currentStringMetrics['encoderImplementation'] = 'OpenH264';
      upstreamReport.currentObjectMetrics['qualityLimitationDurations'] = {
        cpu: 1.0,
        other: 0.0,
      };
      upstreamReport.previousObjectMetrics['qualityLimitationDurations'] = {
        cpu: 0.0,
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[upstreamSsrc] = upstreamReport;

      context.videoTileController.startLocalVideoTile();
      for (let i = 0; i < 15; i++) {
        videoEncodingMonitor.encodingMonitor(clientMetricReport);
      }
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHighEncodeCpuCount).to.equal(1);
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHwEncodeFailureCount).to.equal(0);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHighEncodeCpuCnt).to.equal(4);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHwEncodeFailureCnt).to.equal(0);
    });

    it('should degrade codec when hardware encoder fails', async () => {
      const index = prepareIndex([1, 2]);
      const clientMetricReport = new ClientMetricReport(new NoOpDebugLogger(), index, 'attendee-1');
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      const upstreamSsrc = 1;
      const upstreamReport = new StreamMetricReport();
      upstreamReport.mediaType = MediaType.VIDEO;
      upstreamReport.direction = Direction.UPSTREAM;
      upstreamReport.previousMetrics['totalEncodeTime'] = 1.0;
      upstreamReport.currentMetrics['totalEncodeTime'] = 1.1;
      upstreamReport.currentMetrics['framesPerSecond'] = 15;
      upstreamReport.previousMetrics['framesEncoded'] = 15;
      upstreamReport.currentMetrics['framesEncoded'] = 15;
      upstreamReport.currentStringMetrics['encoderImplementation'] = 'ExternalEncoder';
      upstreamReport.currentObjectMetrics['qualityLimitationDurations'] = {
        cpu: 0.0,
        other: 0.0,
      };
      upstreamReport.previousObjectMetrics['qualityLimitationDurations'] = {
        cpu: 0.0,
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[upstreamSsrc] = upstreamReport;

      context.videoTileController.startLocalVideoTile();
      for (let i = 0; i < 9; i++) {
        videoEncodingMonitor.encodingMonitor(clientMetricReport);
      }
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHighEncodeCpuCount).to.equal(0);
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHwEncodeFailureCount).to.equal(1);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHighEncodeCpuCnt).to.equal(0);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHwEncodeFailureCnt).to.equal(3);
    });

    it('should not degrade codec when input fps is 0', async () => {
      const index = prepareIndex([1, 2]);
      const clientMetricReport = new ClientMetricReport(new NoOpDebugLogger(), index, 'attendee-1');
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      const upstreamSsrc = 1;
      const upstreamReport = new StreamMetricReport();
      upstreamReport.mediaType = MediaType.VIDEO;
      upstreamReport.direction = Direction.UPSTREAM;
      upstreamReport.previousMetrics['totalEncodeTime'] = 1.0;
      upstreamReport.currentMetrics['totalEncodeTime'] = 1.1;
      upstreamReport.currentMetrics['framesPerSecond'] = 0;
      upstreamReport.previousMetrics['framesEncoded'] = 15;
      upstreamReport.currentMetrics['framesEncoded'] = 15;
      upstreamReport.currentStringMetrics['encoderImplementation'] = 'ExternalEncoder';
      upstreamReport.currentObjectMetrics['qualityLimitationDurations'] = {
        cpu: 0.0,
        other: 0.0,
      };
      upstreamReport.previousObjectMetrics['qualityLimitationDurations'] = {
        cpu: 0.0,
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[upstreamSsrc] = upstreamReport;

      context.videoTileController.startLocalVideoTile();
      for (let i = 0; i < 9; i++) {
        videoEncodingMonitor.encodingMonitor(clientMetricReport);
      }
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHighEncodeCpuCount).to.equal(0);
      // @ts-ignore
      expect(context.statsCollector.videoCodecDegradationHwEncodeFailureCount).to.equal(0);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHighEncodeCpuCnt).to.equal(0);
      // @ts-ignore
      expect(videoEncodingMonitor.continuousHwEncodeFailureCnt).to.equal(0);
    });
  });

  describe('degradeVideoCodec', () => {
    it('should ignore if meeting supported video send codec preferences is not defined', async () => {
      context.meetingSupportedVideoSendCodecPreferences = undefined;
      // @ts-ignore
      videoEncodingMonitor.degradeVideoCodec();
    });

    it('should ignore if meeting supported video send codec preferences have only one codec', async () => {
      context.meetingSupportedVideoSendCodecPreferences = [VideoCodecCapability.vp9Profile0()];
      // @ts-ignore
      videoEncodingMonitor.degradeVideoCodec();
    });

    it('should ignore if codec being used is H.264 CBP or VP8', async () => {
      context.meetingSupportedVideoSendCodecPreferences = [
        VideoCodecCapability.vp8(),
        VideoCodecCapability.h264ConstrainedBaselineProfile(),
      ];
      // @ts-ignore
      videoEncodingMonitor.degradeVideoCodec();
      context.meetingSupportedVideoSendCodecPreferences = [
        VideoCodecCapability.h264ConstrainedBaselineProfile(),
        VideoCodecCapability.vp8(),
      ];
      // @ts-ignore
      videoEncodingMonitor.degradeVideoCodec();
    });

    it('should degrade when there is more than one codec preferences', async () => {
      context.meetingSupportedVideoSendCodecPreferences = [
        VideoCodecCapability.vp9Profile0(),
        VideoCodecCapability.vp8(),
      ];
      context.videoSendCodecPreferences = [
        VideoCodecCapability.vp9Profile0(),
        VideoCodecCapability.vp8(),
      ];
      // @ts-ignore
      videoEncodingMonitor.degradeVideoCodec();
    });

    it('should ignore when there is no codec intersection', async () => {
      context.meetingSupportedVideoSendCodecPreferences = [
        VideoCodecCapability.vp9Profile0(),
        VideoCodecCapability.vp8(),
      ];
      context.videoSendCodecPreferences = [VideoCodecCapability.vp9Profile0()];
      // @ts-ignore
      videoEncodingMonitor.degradeVideoCodec();
    });
  });
});
