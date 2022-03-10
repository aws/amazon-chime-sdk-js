// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import { SdkMetric } from '../signalingprotocol/SignalingProtocol.js';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import Direction from './ClientMetricReportDirection';
import MediaType from './ClientMetricReportMediaType';
import GlobalMetricReport from './GlobalMetricReport';
import StreamMetricReport from './StreamMetricReport';

export default class DefaultClientMetricReport {
  globalMetricReport: GlobalMetricReport = new GlobalMetricReport();
  streamMetricReports: { [id: number]: StreamMetricReport } = {};
  rtcStatsReport: RTCStatsReport = {} as RTCStatsReport;
  currentTimestampMs: number = 0;
  previousTimestampMs: number = 0;
  currentSsrcs: { [id: number]: number } = {};

  constructor(
    private logger: Logger,
    private videoStreamIndex?: VideoStreamIndex,
    private selfAttendeeId?: string
  ) {}

  /**
   *  Metric transform functions
   */

  identityValue = (metricName?: string, ssrc?: number): number => {
    const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
    return Number(metricReport.currentMetrics[metricName]);
  };

  decoderLossPercent = (metricName?: string, ssrc?: number): number => {
    const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
    const concealedSamples =
      metricReport.currentMetrics['concealedSamples'] -
      (metricReport.previousMetrics['concealedSamples'] || 0);
    const totalSamplesReceived =
      metricReport.currentMetrics['totalSamplesReceived'] -
      (metricReport.previousMetrics['totalSamplesReceived'] || 0);
    if (totalSamplesReceived <= 0) {
      return 0;
    }
    const decoderAbnormal = totalSamplesReceived - concealedSamples;
    if (decoderAbnormal <= 0) {
      return 0;
    }
    return (concealedSamples / totalSamplesReceived) * 100;
  };

  packetLossPercent = (sourceMetricName?: string, ssrc?: number): number => {
    const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
    const sentOrReceived =
      metricReport.currentMetrics[sourceMetricName] -
      (metricReport.previousMetrics[sourceMetricName] || 0);
    const lost =
      metricReport.currentMetrics['packetsLost'] -
      (metricReport.previousMetrics['packetsLost'] || 0);
    const total = sentOrReceived + lost;
    if (total <= 0 || lost <= 0) {
      return 0;
    }
    return (lost * 100) / total;
  };

  jitterBufferMs = (metricName?: string, ssrc?: number): number => {
    const metricReport = this.streamMetricReports[ssrc];
    const jitterBufferDelay =
      metricReport.currentMetrics['jitterBufferDelay'] -
      (metricReport.previousMetrics['jitterBufferDelay'] || 0);
    const jitterBufferEmittedCount =
      metricReport.currentMetrics['jitterBufferEmittedCount'] -
      (metricReport.previousMetrics['jitterBufferEmittedCount'] || 0);
    if (jitterBufferDelay <= 0) {
      return 0;
    }
    if (jitterBufferEmittedCount <= 0) {
      return 0;
    }
    return (jitterBufferDelay / jitterBufferEmittedCount) * 1000;
  };

  countPerSecond = (metricName?: string, ssrc?: number): number => {
    const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
    let intervalSeconds = (this.currentTimestampMs - this.previousTimestampMs) / 1000;
    if (intervalSeconds <= 0) {
      return 0;
    }
    if (this.previousTimestampMs <= 0) {
      intervalSeconds = 1;
    }
    const diff =
      metricReport.currentMetrics[metricName] - (metricReport.previousMetrics[metricName] || 0);
    if (diff <= 0) {
      return 0;
    }
    return Math.trunc(diff / intervalSeconds);
  };

  bitsPerSecond = (metricName?: string, ssrc?: number): number => {
    const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
    let intervalSeconds = (this.currentTimestampMs - this.previousTimestampMs) / 1000;
    if (intervalSeconds <= 0) {
      return 0;
    }
    if (this.previousTimestampMs <= 0) {
      intervalSeconds = 1;
    }
    const diff =
      (metricReport.currentMetrics[metricName] - (metricReport.previousMetrics[metricName] || 0)) *
      8;
    if (diff <= 0) {
      return 0;
    }
    return Math.trunc(diff / intervalSeconds);
  };

  secondsToMilliseconds = (metricName?: string, ssrc?: number): number => {
    const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
    return Number(metricReport.currentMetrics[metricName] * 1000);
  };

  /**
   *  Canonical and derived metric maps
   */

  readonly globalMetricMap: {
    [id: string]: {
      transform?: (metricName?: string, ssrc?: number) => number;
      type?: SdkMetric.Type;
      source?: string;
    };
  } = {
    retransmittedBytesSent: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_RETRANSMIT_BITRATE,
    },
    totalEncodedBytesTarget: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_TARGET_ENCODER_BITRATE,
    },
    totalPacketSendDelay: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_BUCKET_DELAY_MS,
    },
    packetsDiscardedOnSend: {
      transform: this.countPerSecond,
      type: SdkMetric.Type.SOCKET_DISCARDED_PPS,
    },

    availableIncomingBitrate: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_AVAILABLE_RECEIVE_BANDWIDTH,
    },
    availableOutgoingBitrate: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_AVAILABLE_SEND_BANDWIDTH,
    },
    currentRoundTripTime: { transform: this.identityValue, type: SdkMetric.Type.STUN_RTT_MS },
  };

  readonly audioUpstreamMetricMap: {
    [id: string]: {
      transform?: (metricName?: string, ssrc?: number) => number;
      type?: SdkMetric.Type;
      source?: string;
    };
  } = {
    jitter: { transform: this.secondsToMilliseconds, type: SdkMetric.Type.RTC_MIC_JITTER_MS },
    packetsSent: { transform: this.countPerSecond, type: SdkMetric.Type.RTC_MIC_PPS },
    bytesSent: { transform: this.bitsPerSecond, type: SdkMetric.Type.RTC_MIC_BITRATE },
    roundTripTime: { transform: this.identityValue, type: SdkMetric.Type.RTC_MIC_RTT_MS },
    packetsLost: {
      transform: this.packetLossPercent,
      type: SdkMetric.Type.RTC_MIC_FRACTION_PACKET_LOST_PERCENT,
      source: 'packetsSent',
    },
  };

  readonly audioDownstreamMetricMap: {
    [id: string]: {
      transform?: (metricName?: string, ssrc?: number) => number;
      type?: SdkMetric.Type;
      source?: string;
    };
  } = {
    concealedSamples: {
      transform: this.countPerSecond,
    },
    totalSamplesReceived: {
      transform: this.countPerSecond,
    },
    decoderLoss: {
      transform: this.decoderLossPercent,
      type: SdkMetric.Type.RTC_SPK_FRACTION_DECODER_LOSS_PERCENT,
    },
    packetsReceived: { transform: this.countPerSecond, type: SdkMetric.Type.RTC_SPK_PPS },
    packetsLost: {
      transform: this.packetLossPercent,
      type: SdkMetric.Type.RTC_SPK_FRACTION_PACKET_LOST_PERCENT,
      source: 'packetsReceived',
    },
    jitter: { transform: this.secondsToMilliseconds, type: SdkMetric.Type.RTC_SPK_JITTER_MS },
    jitterBufferDelay: {
      transform: this.countPerSecond,
    },
    jitterBufferEmittedCount: {
      transform: this.countPerSecond,
    },
    jitterBufferMs: {
      transform: this.jitterBufferMs,
      type: SdkMetric.Type.RTC_SPK_JITTER_BUFFER_MS,
    },
    bytesReceived: { transform: this.bitsPerSecond, type: SdkMetric.Type.RTC_SPK_BITRATE },
  };

  readonly videoUpstreamMetricMap: {
    [id: string]: {
      transform?: (metricName?: string, ssrc?: number) => number;
      type?: SdkMetric.Type;
      source?: string;
    };
  } = {
    roundTripTime: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_SENT_RTT_MS },
    nackCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_NACKS_RECEIVED },
    pliCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_PLIS_RECEIVED },
    firCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_FIRS_RECEIVED },
    framesPerSecond: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_INPUT_FPS },
    framesEncoded: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_ENCODE_FPS },
    packetsSent: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_SENT_PPS },
    packetsLost: {
      transform: this.packetLossPercent,
      type: SdkMetric.Type.VIDEO_SENT_FRACTION_PACKET_LOST_PERCENT,
      source: 'packetsSent',
    },
    bytesSent: { transform: this.bitsPerSecond, type: SdkMetric.Type.VIDEO_SENT_BITRATE },
    qpSum: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_SENT_QP_SUM },
    frameHeight: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_ENCODE_HEIGHT },
    frameWidth: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_ENCODE_WIDTH },
  };

  readonly videoDownstreamMetricMap: {
    [id: string]: {
      transform?: (metricName?: string, ssrc?: number) => number;
      type?: SdkMetric.Type;
      source?: string;
    };
  } = {
    totalDecodeTime: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_DECODE_MS },
    packetsReceived: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_RECEIVED_PPS },
    packetsLost: {
      transform: this.packetLossPercent,
      type: SdkMetric.Type.VIDEO_RECEIVED_FRACTION_PACKET_LOST_PERCENT,
      source: 'packetsReceived',
    },
    framesReceived: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_RECEIVED_FPS,
    },
    framesDecoded: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_DECODE_FPS },
    nackCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_NACKS_SENT },
    firCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_FIRS_SENT },
    pliCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_PLIS_SENT },
    bytesReceived: { transform: this.bitsPerSecond, type: SdkMetric.Type.VIDEO_RECEIVED_BITRATE },
    jitter: {
      transform: this.secondsToMilliseconds,
      type: SdkMetric.Type.VIDEO_RECEIVED_JITTER_MS,
    },
    jitterBufferDelay: {
      transform: this.countPerSecond,
    },
    jitterBufferEmittedCount: {
      transform: this.countPerSecond,
    },
    jitterBufferMs: {
      transform: this.jitterBufferMs,
      type: SdkMetric.Type.VIDEO_JITTER_BUFFER_MS,
    },
    qpSum: {
      transform: this.countPerSecond,
      type: SdkMetric.Type.VIDEO_RECEIVED_QP_SUM,
    },
    frameHeight: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_DECODE_HEIGHT },
    frameWidth: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_DECODE_WIDTH },
  };

  getMetricMap(
    mediaType?: MediaType,
    direction?: Direction
  ): {
    [id: string]: {
      transform?: (metricName?: string, ssrc?: number) => number;
      type?: SdkMetric.Type;
      source?: string;
    };
  } {
    switch (mediaType) {
      case MediaType.AUDIO:
        switch (direction) {
          case Direction.UPSTREAM:
            return this.audioUpstreamMetricMap;
          case Direction.DOWNSTREAM:
            return this.audioDownstreamMetricMap;
        }
      case MediaType.VIDEO:
        switch (direction) {
          case Direction.UPSTREAM:
            return this.videoUpstreamMetricMap;
          case Direction.DOWNSTREAM:
            return this.videoDownstreamMetricMap;
        }
      default:
        return this.globalMetricMap;
    }
  }

  /**
   *  media Stream metrics
   */

  readonly observableVideoMetricSpec: {
    [id: string]: {
      source: string;
      media?: MediaType;
      dir?: Direction;
    };
  } = {
    videoUpstreamBitrate: {
      source: 'bytesSent',
      media: MediaType.VIDEO,
      dir: Direction.UPSTREAM,
    },
    videoUpstreamPacketsSent: {
      source: 'packetsSent',
      media: MediaType.VIDEO,
      dir: Direction.UPSTREAM,
    },
    videoUpstreamPacketLossPercent: {
      source: 'packetsLost',
      media: MediaType.VIDEO,
      dir: Direction.UPSTREAM,
    },
    videoUpstreamFramesEncodedPerSecond: {
      source: 'framesEncoded',
      media: MediaType.VIDEO,
      dir: Direction.UPSTREAM,
    },
    videoUpstreamFrameHeight: {
      source: 'frameHeight',
      media: MediaType.VIDEO,
      dir: Direction.UPSTREAM,
    },
    videoUpstreamFrameWidth: {
      source: 'frameWidth',
      media: MediaType.VIDEO,
      dir: Direction.UPSTREAM,
    },
    videoDownstreamBitrate: {
      source: 'bytesReceived',
      media: MediaType.VIDEO,
      dir: Direction.DOWNSTREAM,
    },
    videoDownstreamPacketLossPercent: {
      source: 'packetsLost',
      media: MediaType.VIDEO,
      dir: Direction.DOWNSTREAM,
    },
    videoDownstreamPacketsReceived: {
      source: 'packetsReceived',
      media: MediaType.VIDEO,
      dir: Direction.DOWNSTREAM,
    },
    videoDownstreamFramesDecodedPerSecond: {
      source: 'framesDecoded',
      media: MediaType.VIDEO,
      dir: Direction.DOWNSTREAM,
    },
    videoDownstreamFrameHeight: {
      source: 'frameHeight',
      media: MediaType.VIDEO,
      dir: Direction.DOWNSTREAM,
    },
    videoDownstreamFrameWidth: {
      source: 'frameWidth',
      media: MediaType.VIDEO,
      dir: Direction.DOWNSTREAM,
    },
  };

  /**
   * Observable metrics and related APIs
   */

  readonly observableMetricSpec: {
    [id: string]: {
      source: string;
      media?: MediaType;
      dir?: Direction;
    };
  } = {
    audioPacketsReceived: {
      source: 'packetsReceived',
      media: MediaType.AUDIO,
      dir: Direction.DOWNSTREAM,
    },
    audioPacketsReceivedFractionLoss: {
      source: 'packetsLost',
      media: MediaType.AUDIO,
      dir: Direction.DOWNSTREAM,
    },
    audioDecoderLoss: {
      source: 'decoderLoss',
      media: MediaType.AUDIO,
      dir: Direction.DOWNSTREAM,
    },
    audioPacketsSent: {
      source: 'packetsSent',
      media: MediaType.AUDIO,
      dir: Direction.UPSTREAM,
    },
    audioPacketLossPercent: {
      source: 'packetsLost',
      media: MediaType.AUDIO,
      dir: Direction.UPSTREAM,
    },
    videoUpstreamBitrate: { source: 'bytesSent', media: MediaType.VIDEO, dir: Direction.UPSTREAM },
    videoPacketSentPerSecond: {
      source: 'packetsSent',
      media: MediaType.VIDEO,
      dir: Direction.UPSTREAM,
    },
    audioSpeakerDelayMs: {
      source: 'jitterBufferMs',
      media: MediaType.AUDIO,
      dir: Direction.DOWNSTREAM,
    },
    availableOutgoingBitrate: { source: 'availableOutgoingBitrate' },
    availableIncomingBitrate: { source: 'availableIncomingBitrate' },
    nackCountReceivedPerSecond: {
      source: 'nackCount',
      media: MediaType.VIDEO,
      dir: Direction.UPSTREAM,
    },
  };

  getObservableMetricValue(metricName: string): number {
    const observableMetricSpec = this.observableMetricSpec[metricName];
    const metricMap = this.getMetricMap(observableMetricSpec.media, observableMetricSpec.dir);
    const metricSpec = metricMap[observableMetricSpec.source];
    const transform = metricSpec.transform;
    const source = metricSpec.source;
    if (observableMetricSpec.hasOwnProperty('media')) {
      for (const ssrc in this.streamMetricReports) {
        const streamMetricReport = this.streamMetricReports[ssrc];
        if (
          observableMetricSpec.source in streamMetricReport.currentMetrics &&
          streamMetricReport.direction === observableMetricSpec.dir &&
          streamMetricReport.mediaType === observableMetricSpec.media
        ) {
          return source
            ? transform(source, Number(ssrc))
            : transform(observableMetricSpec.source, Number(ssrc));
        }
      }
    } else {
      return source ? transform(source) : transform(observableMetricSpec.source);
    }
    return 0;
  }

  getObservableVideoMetricValue(metricName: string, ssrcNum: number): number {
    const observableVideoMetricSpec = this.observableVideoMetricSpec[metricName];
    const metricMap = this.getMetricMap(
      observableVideoMetricSpec.media,
      observableVideoMetricSpec.dir
    );
    const metricSpec = metricMap[observableVideoMetricSpec.source];
    const transform = metricSpec.transform;
    const source = metricSpec.source;
    const streamMetricReport = this.streamMetricReports[ssrcNum];
    if (
      streamMetricReport &&
      observableVideoMetricSpec.source in streamMetricReport.currentMetrics
    ) {
      return source
        ? transform(source, ssrcNum)
        : transform(observableVideoMetricSpec.source, ssrcNum);
    } else {
      return source ? transform(source) : transform(observableVideoMetricSpec.source);
    }
  }

  getObservableMetrics(): { [id: string]: number } {
    const metric: { [id: string]: number } = {};
    for (const metricName in this.observableMetricSpec) {
      metric[metricName] = this.getObservableMetricValue(metricName);
    }
    return metric;
  }

  getObservableVideoMetrics(): { [id: string]: { [id: string]: {} } } {
    const videoStreamMetrics: { [id: string]: { [id: string]: {} } } = {};
    if (!this.videoStreamIndex || !this.selfAttendeeId) {
      this.logger.error(
        'Need to define VideoStreamIndex and selfAttendeeId if using getObservableVideoMetrics API'
      );
      return videoStreamMetrics;
    }
    for (const ssrc in this.streamMetricReports) {
      if (this.streamMetricReports[ssrc].mediaType === MediaType.VIDEO) {
        const metric: { [id: string]: number } = {};
        for (const metricName in this.observableVideoMetricSpec) {
          if (
            this.observableVideoMetricSpec[metricName].dir ===
            this.streamMetricReports[ssrc].direction
          ) {
            const metricValue = this.getObservableVideoMetricValue(metricName, Number(ssrc));
            if (!isNaN(metricValue)) {
              metric[metricName] = metricValue;
            }
          }
        }
        const streamId = this.streamMetricReports[ssrc].streamId;
        const attendeeId = streamId
          ? this.videoStreamIndex.attendeeIdForStreamId(streamId)
          : this.selfAttendeeId;
        videoStreamMetrics[attendeeId] = videoStreamMetrics[attendeeId]
          ? videoStreamMetrics[attendeeId]
          : {};
        videoStreamMetrics[attendeeId][ssrc] = metric;
      }
    }
    return videoStreamMetrics;
  }

  getRTCStatsReport(): RTCStatsReport {
    return this.rtcStatsReport;
  }

  /**
   * Utilities
   */

  clone(): DefaultClientMetricReport {
    const cloned = new DefaultClientMetricReport(
      this.logger,
      this.videoStreamIndex,
      this.selfAttendeeId
    );
    cloned.globalMetricReport = this.globalMetricReport;
    cloned.streamMetricReports = this.streamMetricReports;
    cloned.rtcStatsReport = this.rtcStatsReport;
    cloned.currentTimestampMs = this.currentTimestampMs;
    cloned.previousTimestampMs = this.previousTimestampMs;
    return cloned;
  }

  print(): void {
    const clientMetricReport = {
      globalMetricReport: this.globalMetricReport,
      streamMetricReports: this.streamMetricReports,
      currentTimestampMs: this.currentTimestampMs,
      previousTimestampMs: this.previousTimestampMs,
    };
    this.logger.debug(() => {
      return `Client Metric Report: ${JSON.stringify(clientMetricReport)}`;
    });
  }

  removeDestroyedSsrcs(): void {
    for (const ssrc in this.streamMetricReports) {
      if (!this.currentSsrcs[ssrc]) {
        delete this.streamMetricReports[ssrc];
      }
    }
  }
}
