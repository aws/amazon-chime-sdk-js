// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AudioVideoObserver,
  ClientMetricReport,
  ClientMetricReportDirection,
  ClientMetricReportMediaType,
  DefaultClientMetricReport,
  Logger
} from 'amazon-chime-sdk-js'

export enum MediaQuality {
  Bad,
  Poor,
  Ok,
  Good,
  Unknown,
}

// Represents a range of the form [min, max)
class NumberRange {
  constructor(
    public min: number,
    public max: number,
  ) { }

  contains(value: number): boolean {
    return value >= this.min && value < this.max;
  }
}

class MediaMetricToQualityMap {
  constructor(private mapping: Map<MediaQuality, NumberRange>) { }

  qualityForMetric(value: number | undefined) {
    if (value === undefined) {
      return MediaQuality.Unknown;
    }
    for (const [quality, range] of this.mapping) {
      if (range.contains(value)) {
        return quality;
      }
    }
  }
}

const packetLossPercertMapping = new MediaMetricToQualityMap(new Map([
  [MediaQuality.Good, new NumberRange(0, 1)],
  [MediaQuality.Ok, new NumberRange(1, 5)],
  [MediaQuality.Poor, new NumberRange(5, 10)],
  [MediaQuality.Bad, new NumberRange(10, 100)],
]))

class RunningAverage {
  private sum = 0;
  private count = 0;

  add(value: number): void {
    this.sum += value;
    this.count += 1;
  }

  average(): number {
    if (this.count === 0) {
      return 0;
    }
    return this.sum / this.count;
  }
}
export class MediaMetricsMonitor implements AudioVideoObserver {
  // We do not want to track send/receive related metrics like uplink BWE
  // when we are not sending/receiving so expose these bool flags
  isSendingVideo = false;
  isReceivingVideo = false;

  // Only emit if the quality value has changes for multiple seconds (currently 2)
  private lastEmittedQuality = MediaQuality.Unknown;
  private consecutiveQualityChangeCount = 0;

  constructor(
    private aggregateQualityCallback: (quality: MediaQuality) => void,
    private logger: Logger,
    private selfAttendeeId: string) { }

  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    let individualMetricQualities = new Array<MediaQuality>();

    const globalMetrics = clientMetricReport.getObservableMetrics()

    // TODO: Threshold all these values. You probably want to smooth them out as well

    let availableOutgoingBitrate = undefined;
    if (!isNaN(globalMetrics.availableOutgoingBitrate)) {
      availableOutgoingBitrate = globalMetrics.availableOutgoingBitrate;
    } else {
      availableOutgoingBitrate = globalMetrics.availableSendBandwidth;
    }
    // Note (hensmi@): I do not recommend doing a simple threshold on receive bandwidth estimation statistics
    // as it is dependent on what others are sending (e.g. a content share may be a static image which is sent
    // at 5kbps. The browser will cap receive BWE at around 15kbps)
    let availableIncomingBitrate = undefined;
    if (!isNaN(globalMetrics.availableOutgoingBitrate)) {
      availableIncomingBitrate = globalMetrics.availableIncomingBitrate;
    } else {
      availableIncomingBitrate = globalMetrics.availableReceiveBandwidth;
    }

    const audioOutgoingPacketLossPercert = globalMetrics.audioPacketLossPercent;
    const audioIncomingPacketLossPercert = globalMetrics.audioPacketsReceivedFractionLoss;
    individualMetricQualities.push(packetLossPercertMapping.qualityForMetric(audioOutgoingPacketLossPercert))
    individualMetricQualities.push(packetLossPercertMapping.qualityForMetric(audioIncomingPacketLossPercert))

    let audioOutgoingJitter = undefined;
    let audioIncomingJitter = undefined;
    const defaultClientMetricReport = clientMetricReport as DefaultClientMetricReport;
    if (defaultClientMetricReport) {
      // TODO: Use normal metric retrieval method once it is released
      audioOutgoingJitter = getNonObservableMetricValue({
        source: 'jitter',
        media: ClientMetricReportMediaType.AUDIO,
        dir: ClientMetricReportDirection.UPSTREAM,
      }, defaultClientMetricReport);
      audioIncomingJitter = getNonObservableMetricValue({
        source: 'jitter',
        media: ClientMetricReportMediaType.AUDIO,
        dir: ClientMetricReportDirection.DOWNSTREAM,
      }, defaultClientMetricReport);
    }

    
    let videoOutgoingPacketLossPercent: number | undefined = undefined;
    let videoIncomingPacketLossPercent: number | undefined = undefined;
    if (clientMetricReport.getObservableVideoMetrics !== undefined) {
      const videoMetrics = clientMetricReport.getObservableVideoMetrics();
      let videoOutgoingPacketLossPercentRunningAverage = new RunningAverage();
      let videoIncomingPacketLossPercentRunningAverage = new RunningAverage();

      for (const [attendeeId, streams] of Object.entries(videoMetrics)) {
        for (const stream of Object.values(streams)) {
          for (const [metricName, value] of Object.entries(stream)) {
            if (metricName === 'videoUpstreamPacketLossPercent' && attendeeId === this.selfAttendeeId) {
              videoOutgoingPacketLossPercentRunningAverage.add(value as number);
            } else if (metricName === 'videoDownstreamPacketLossPercent' && attendeeId !== this.selfAttendeeId) {
              videoIncomingPacketLossPercentRunningAverage.add(value as number);
            }
          }
        }
      }

      videoOutgoingPacketLossPercent = videoOutgoingPacketLossPercentRunningAverage.average();
      videoIncomingPacketLossPercent = videoIncomingPacketLossPercentRunningAverage.average();
    }
    this.logger.info(`Processing metrics for aggregate quality score - \
      availableOutgoingBitrate:${availableOutgoingBitrate} \
      availableIncomingBitrate:${availableIncomingBitrate} \
      audioOutgoingPacketLossPercert:${audioOutgoingPacketLossPercert} \
      audioIncomingPacketLossPercert:${audioIncomingPacketLossPercert} \
      audioOutgoingJitter:${audioOutgoingJitter} \
      audioIncomingJitter:${audioIncomingJitter} \
      videoOutgoingPacketLossPercent:${videoOutgoingPacketLossPercent} \
      videoIncomingPacketLossPercent:${videoIncomingPacketLossPercent}`)

    if (this.isSendingVideo) {
      individualMetricQualities.push(packetLossPercertMapping.qualityForMetric(videoOutgoingPacketLossPercent))
    } else if (this.isReceivingVideo) {
      individualMetricQualities.push(packetLossPercertMapping.qualityForMetric(videoIncomingPacketLossPercent))
    }
    const minQuality = Math.min(...individualMetricQualities);

    if (minQuality !== this.lastEmittedQuality) {
      this.consecutiveQualityChangeCount += 1;

      if (this.consecutiveQualityChangeCount > 2) {
        this.logger.info(`Emitting aggregate quality score ${minQuality}, isSendingVideo:${this.isSendingVideo}, isReceivingVideo:${this.isReceivingVideo}`);
        this.aggregateQualityCallback(minQuality);
        this.lastEmittedQuality = minQuality;
        this.consecutiveQualityChangeCount = 0;
      }
    } else {
      this.consecutiveQualityChangeCount = 0;
    }
  }
}

// A workaround for the fact not all metrics are exposed. This basically duplicates 
// `DefaultClientMetricReport.getObservableMetricValue`.  We will add jitter to observable metrics in
// next release
function getNonObservableMetricValue(specification: any, report: DefaultClientMetricReport): number {
  const metricMap = report.getMetricMap(specification.media, specification.dir);
  const metricSpec = metricMap[specification.source];
  const transform = metricSpec.transform;
  const source = metricSpec.source;
  if (specification.hasOwnProperty('media')) {
    for (const ssrc in report.streamMetricReports) {
      const streamMetricReport = report.streamMetricReports[ssrc];
      if (
        specification.source in streamMetricReport.currentMetrics &&
        streamMetricReport.direction === specification.dir &&
        streamMetricReport.mediaType === specification.media
      ) {
        return source
          ? transform(source, Number(ssrc))
          : transform(specification.source, Number(ssrc));
      }
    }
  } else {
    return source ? transform(source) : transform(specification.source);
  }
  return 0;
}
