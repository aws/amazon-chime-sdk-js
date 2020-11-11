// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import { SdkMetric } from '../signalingprotocol/SignalingProtocol.js';
import ClientMetricReport from './ClientMetricReport';
import Direction from './ClientMetricReportDirection';
import MediaType from './ClientMetricReportMediaType';
import GlobalMetricReport from './GlobalMetricReport';
import StreamMetricReport from './StreamMetricReport';

export default class DefaultClientMetricReport implements ClientMetricReport {
  globalMetricReport: GlobalMetricReport = new GlobalMetricReport();
  streamMetricReports: { [id: number]: StreamMetricReport } = {};
  currentTimestampMs: number = 0;
  previousTimestampMs: number = 0;
  currentSsrcs: { [id: number]: number } = {};

  constructor(private logger: Logger) {}

  /**
   *  Metric transform functions
   */

  identityValue = (metricName?: string, ssrc?: number): number => {
    const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
    return Number(metricReport.currentMetrics[metricName]);
  };

  decoderLossPercent = (metricName?: string, ssrc?: number): number => {
    const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
    const decoderNormal =
      metricReport.currentMetrics['googDecodingNormal'] -
      (metricReport.previousMetrics['googDecodingNormal'] || 0);
    const decoderCalls =
      metricReport.currentMetrics['googDecodingCTN'] -
      (metricReport.previousMetrics['googDecodingCTN'] || 0);
    if (decoderCalls <= 0) {
      return 0;
    }
    const decoderAbnormal = decoderCalls - decoderNormal;
    if (decoderAbnormal <= 0) {
      return 0;
    }
    return (decoderAbnormal * 100) / decoderCalls;
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
    googActualEncBitrate: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_ACTUAL_ENCODER_BITRATE,
    },
    googAvailableSendBandwidth: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_AVAILABLE_SEND_BANDWIDTH,
    },
    googRetransmitBitrate: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_RETRANSMIT_BITRATE,
    },
    googAvailableReceiveBandwidth: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_AVAILABLE_RECEIVE_BANDWIDTH,
    },
    googTargetEncBitrate: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_TARGET_ENCODER_BITRATE,
    },
    googBucketDelay: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_BUCKET_DELAY_MS },
    googRtt: { transform: this.identityValue, type: SdkMetric.Type.STUN_RTT_MS },
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
    googJitterReceived: { transform: this.identityValue, type: SdkMetric.Type.RTC_MIC_JITTER_MS },
    jitter: { transform: this.secondsToMilliseconds, type: SdkMetric.Type.RTC_MIC_JITTER_MS },
    packetsSent: { transform: this.countPerSecond, type: SdkMetric.Type.RTC_MIC_PPS },
    bytesSent: { transform: this.bitsPerSecond, type: SdkMetric.Type.RTC_MIC_BITRATE },
    googRtt: { transform: this.identityValue, type: SdkMetric.Type.RTC_MIC_RTT_MS },
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
    packetsReceived: { transform: this.countPerSecond, type: SdkMetric.Type.RTC_SPK_PPS },
    packetsLost: {
      transform: this.packetLossPercent,
      type: SdkMetric.Type.RTC_SPK_FRACTION_PACKET_LOST_PERCENT,
      source: 'packetsReceived',
    },
    googJitterReceived: { transform: this.identityValue, type: SdkMetric.Type.RTC_SPK_JITTER_MS },
    jitter: { transform: this.secondsToMilliseconds, type: SdkMetric.Type.RTC_SPK_JITTER_MS },
    googDecodingCTN: { transform: this.countPerSecond },
    googDecodingNormal: {
      transform: this.decoderLossPercent,
      type: SdkMetric.Type.RTC_SPK_FRACTION_DECODER_LOSS_PERCENT,
      source: 'googDecodingCTN',
    },
    bytesReceived: { transform: this.bitsPerSecond, type: SdkMetric.Type.RTC_SPK_BITRATE },
    googCurrentDelayMs: {
      transform: this.identityValue,
      type: SdkMetric.Type.RTC_SPK_CURRENT_DELAY_MS,
    },
    googJitterBufferMs: {
      transform: this.identityValue,
      type: SdkMetric.Type.RTC_SPK_JITTER_BUFFER_MS,
    },
  };

  readonly videoUpstreamMetricMap: {
    [id: string]: {
      transform?: (metricName?: string, ssrc?: number) => number;
      type?: SdkMetric.Type;
      source?: string;
    };
  } = {
    googRtt: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_SENT_RTT_MS },
    googEncodeUsagePercent: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_ENCODE_USAGE_PERCENT,
    },
    googNacksReceived: {
      transform: this.countPerSecond,
      type: SdkMetric.Type.VIDEO_NACKS_RECEIVED,
    },
    nackCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_NACKS_RECEIVED },
    googPlisReceived: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_PLIS_RECEIVED },
    pliCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_PLIS_RECEIVED },
    googFirsReceived: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_FIRS_RECEIVED },
    firCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_FIRS_RECEIVED },
    googAvgEncodeMs: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_AVERAGE_ENCODE_MS,
    },
    googFrameRateInput: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_INPUT_FPS },
    framesEncoded: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_ENCODE_FPS },
    googFrameRateSent: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_SENT_FPS },
    framerateMean: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_SENT_FPS },
    packetsSent: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_SENT_PPS },
    packetsLost: {
      transform: this.packetLossPercent,
      type: SdkMetric.Type.VIDEO_SENT_FRACTION_PACKET_LOST_PERCENT,
      source: 'packetsSent',
    },
    bytesSent: { transform: this.bitsPerSecond, type: SdkMetric.Type.VIDEO_SENT_BITRATE },
    droppedFrames: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_DROPPED_FPS },
  };

  readonly videoDownstreamMetricMap: {
    [id: string]: {
      transform?: (metricName?: string, ssrc?: number) => number;
      type?: SdkMetric.Type;
      source?: string;
    };
  } = {
    googTargetDelayMs: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_TARGET_DELAY_MS,
    },
    googDecodeMs: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_DECODE_MS },
    googFrameRateOutput: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_OUTPUT_FPS },
    packetsReceived: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_RECEIVED_PPS },
    packetsLost: {
      transform: this.packetLossPercent,
      type: SdkMetric.Type.VIDEO_RECEIVED_FRACTION_PACKET_LOST_PERCENT,
      source: 'packetsReceived',
    },
    googRenderDelayMs: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_RENDER_DELAY_MS,
    },
    googFrameRateReceived: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_RECEIVED_FPS,
    },
    framerateMean: { transform: this.identityValue, type: SdkMetric.Type.VIDEO_RECEIVED_FPS },
    framesDecoded: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_DECODE_FPS },
    googNacksSent: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_NACKS_SENT },
    nackCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_NACKS_SENT },
    googFirsSent: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_FIRS_SENT },
    firCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_FIRS_SENT },
    googPlisSent: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_PLIS_SENT },
    pliCount: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_PLIS_SENT },
    bytesReceived: { transform: this.bitsPerSecond, type: SdkMetric.Type.VIDEO_RECEIVED_BITRATE },
    googCurrentDelayMs: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_CURRENT_DELAY_MS,
    },
    googJitterBufferMs: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_JITTER_BUFFER_MS,
    },
    discardedPackets: { transform: this.countPerSecond, type: SdkMetric.Type.VIDEO_DISCARDED_PPS },
    googJitterReceived: {
      transform: this.identityValue,
      type: SdkMetric.Type.VIDEO_RECEIVED_JITTER_MS,
    },
    jitter: {
      transform: this.secondsToMilliseconds,
      type: SdkMetric.Type.VIDEO_RECEIVED_JITTER_MS,
    },
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
      source: 'googDecodingNormal',
      media: MediaType.AUDIO,
      dir: Direction.DOWNSTREAM,
    },
    videoUpstreamBitrate: { source: 'bytesSent', media: MediaType.VIDEO, dir: Direction.UPSTREAM },
    videoPacketSentPerSecond: {
      source: 'packetsSent',
      media: MediaType.VIDEO,
      dir: Direction.UPSTREAM,
    },
    availableSendBandwidth: { source: 'googAvailableSendBandwidth' },
    availableReceiveBandwidth: { source: 'googAvailableReceiveBandwidth' },
    audioSpeakerDelayMs: {
      source: 'googCurrentDelayMs',
      media: MediaType.AUDIO,
      dir: Direction.DOWNSTREAM,
    },

    // new getStats() API
    availableIncomingBitrate: { source: 'availableIncomingBitrate' },
    availableOutgoingBitrate: { source: 'availableOutgoingBitrate' },

    nackCountReceivedPerSecond: {
      source: 'nackCount',
      media: MediaType.VIDEO,
      dir: Direction.UPSTREAM,
    },
    googNackCountReceivedPerSecond: {
      source: 'googNacksReceived',
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

  getObservableMetrics(): { [id: string]: number } {
    const metric: { [id: string]: number } = {};
    for (const metricName in this.observableMetricSpec) {
      metric[metricName] = this.getObservableMetricValue(metricName);
    }
    return metric;
  }

  /**
   * Utilities
   */

  clone(): DefaultClientMetricReport {
    const cloned = new DefaultClientMetricReport(this.logger);
    cloned.globalMetricReport = this.globalMetricReport;
    cloned.streamMetricReports = this.streamMetricReports;
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
