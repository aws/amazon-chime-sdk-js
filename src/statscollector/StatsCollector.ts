// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import { CustomStatsReport } from '../clientmetricreport/ClientMetricReport';
import Direction from '../clientmetricreport/ClientMetricReportDirection';
import MediaType from '../clientmetricreport/ClientMetricReportMediaType';
import RedundantAudioRecoveryMetricReport from '../clientmetricreport/RedundantAudioRecoveryMetricReport';
import StreamMetricReport from '../clientmetricreport/StreamMetricReport';
import Logger from '../logger/Logger';
import MeetingSessionLifecycleEvent from '../meetingsession/MeetingSessionLifecycleEvent';
import MeetingSessionLifecycleEventCondition from '../meetingsession/MeetingSessionLifecycleEventCondition';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import RedundantAudioRecoveryMetricsObserver from '../redundantaudiorecoverymetricsobserver/RedundantAudioRecoveryMetricsObserver';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import SignalingClient from '../signalingclient/SignalingClient';
import {
  SdkClientMetricFrame,
  SdkDimensionValue,
  SdkMetric,
  SdkStreamDimension,
  SdkStreamMetricFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import { Maybe } from '../utils/Types';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import AudioLogEvent from './AudioLogEvent';
import VideoLogEvent from './VideoLogEvent';

// eslint-disable-next-line
type RawMetricReport = any;

// eslint-disable-next-line
type StatsReportItem = any;

/**
 * [[StatsCollector]] gathers statistics and sends metrics.
 */
export default class StatsCollector implements RedundantAudioRecoveryMetricsObserver {
  private static readonly INTERVAL_MS = 1000;
  private static readonly CLIENT_TYPE = 'amazon-chime-sdk-js';

  private intervalScheduler: IntervalScheduler | null = null;
  private signalingClient: SignalingClient;
  private videoStreamIndex: VideoStreamIndex;
  private clientMetricReport: ClientMetricReport;
  private redRecoveryMetricReport: RedundantAudioRecoveryMetricReport = new RedundantAudioRecoveryMetricReport();
  private lastRedRecoveryMetricReportConsumedTimestampMs: number = 0;
  private videoCodecDegradationHighEncodeCpuCount: number = 0;
  private videoCodecDegradationEncodeFailureCount: number = 0;

  constructor(
    private audioVideoController: AudioVideoController,
    private logger: Logger,
    private readonly interval: number = StatsCollector.INTERVAL_MS
  ) {}

  // TODO: Update toAttribute() and toSuffix() methods to convert raw data to a required type.
  /**
   * Converts string to attribute format.
   */
  toAttribute(str: string): string {
    return this.toSuffix(str).substring(1);
  }

  /**
   * Converts string to suffix format.
   */
  private toSuffix(str: string): string {
    if (str.toLowerCase() === str) {
      // e.g. lower_case -> _lower_case
      return `_${str}`;
    } else if (str.toUpperCase() === str) {
      // e.g. UPPER_CASE -> _upper_case
      return `_${str.toLowerCase()}`;
    } else {
      // e.g. CamelCaseWithCAPS -> _camel_case_with_caps
      return str
        .replace(/([A-Z][a-z]+)/g, function ($1) {
          return `_${$1}`;
        })
        .replace(/([A-Z][A-Z]+)/g, function ($1) {
          return `_${$1}`;
        })
        .toLowerCase();
    }
  }

  // TODO: Implement metricsAddTime() and metricsLogEvent().
  metricsAddTime = (
    _name: string,
    _duration: number,
    _attributes?: { [id: string]: string }
  ): void => {};
  metricsLogEvent = (_name: string, _attributes: { [id: string]: string }): void => {};

  /**
   * Logs the latency.
   */
  logLatency(eventName: string, timeMs: number, attributes?: { [id: string]: string }): void {
    const event = this.toSuffix(eventName);
    this.logEventTime('meeting' + event, timeMs, attributes);
  }

  /**
   * Logs the state timeout.
   */
  logStateTimeout(stateName: string, attributes?: { [id: string]: string }): void {
    const state = this.toSuffix(stateName);
    this.logEvent('meeting_session_state_timeout', {
      ...attributes,
      state: `state${state}`,
    });
  }

  /**
   * Logs the audio event.
   */
  logAudioEvent(eventName: AudioLogEvent, attributes?: { [id: string]: string }): void {
    const event = 'audio' + this.toSuffix(AudioLogEvent[eventName]);
    this.logEvent(event, attributes);
  }

  /**
   * Logs the video event.
   */
  logVideoEvent(eventName: VideoLogEvent, attributes?: { [id: string]: string }): void {
    const event = 'video' + this.toSuffix(VideoLogEvent[eventName]);
    this.logEvent(event, attributes);
  }

  private logEventTime(
    eventName: string,
    timeMs: number,
    attributes: { [id: string]: string } = {}
  ): void {
    const finalAttributes = {
      ...attributes,
      call_id: this.audioVideoController.configuration.meetingId,
      client_type: StatsCollector.CLIENT_TYPE,
      metric_type: 'latency',
    };
    this.logger.debug(() => {
      return `[StatsCollector] ${eventName}: ${JSON.stringify(finalAttributes)}`;
    });
    this.metricsAddTime(eventName, timeMs, finalAttributes);
  }

  /**
   * Logs the session status.
   */
  logMeetingSessionStatus(status: MeetingSessionStatus): void {
    // TODO: Generate the status event name given the status code.
    const statusEventName = `${status.statusCode()}`;

    this.logEvent(statusEventName);
    const statusAttribute: { [id: string]: string } = {
      status: statusEventName,
      status_code: `${status.statusCode()}`,
    };
    this.logEvent('meeting_session_status', statusAttribute);
    if (status.isTerminal()) {
      this.logEvent('meeting_session_stopped', statusAttribute);
    }
    if (status.isAudioConnectionFailure()) {
      this.logEvent('meeting_session_audio_failed', statusAttribute);
    }
    if (status.isFailure()) {
      this.logEvent('meeting_session_failed', statusAttribute);
    }
  }

  /**
   * Logs the lifecycle event.
   */
  logLifecycleEvent(
    lifecycleEvent: MeetingSessionLifecycleEvent,
    condition: MeetingSessionLifecycleEventCondition
  ): void {
    const attributes: { [id: string]: string } = {
      lifecycle_event: `lifecycle${this.toSuffix(MeetingSessionLifecycleEvent[lifecycleEvent])}`,
      lifecycle_event_code: `${lifecycleEvent}`,
      lifecycle_event_condition: `condition${this.toSuffix(
        MeetingSessionLifecycleEventCondition[condition]
      )}`,
      lifecycle_event_condition_code: `${condition}`,
    };
    this.logEvent('meeting_session_lifecycle', attributes);
  }

  /**
   * Logs the events.
   */
  private logEvent(eventName: string, attributes: { [id: string]: string } = {}): void {
    const finalAttributes = {
      ...attributes,
      call_id: this.audioVideoController.configuration.meetingId,
      client_type: StatsCollector.CLIENT_TYPE,
    };
    this.logger.debug(() => {
      return `[StatsCollector] ${eventName}: ${JSON.stringify(finalAttributes)}`;
    });
    this.metricsLogEvent(eventName, finalAttributes);
  }

  /**
   * Starts collecting statistics.
   */
  start(signalingClient: SignalingClient, videoStreamIndex: VideoStreamIndex): boolean {
    if (this.intervalScheduler) {
      return false;
    }
    this.logger.info('Starting StatsCollector');
    this.signalingClient = signalingClient;
    this.videoStreamIndex = videoStreamIndex;
    this.clientMetricReport = new ClientMetricReport(
      this.logger,
      this.videoStreamIndex,
      this.audioVideoController.configuration.credentials.attendeeId
    );
    this.intervalScheduler = new IntervalScheduler(this.interval);
    this.intervalScheduler.start(async () => {
      await this.getStatsWrapper();
    });
    return true;
  }

  /*
   * Stops the stats collector.
   */
  stop(): void {
    this.logger.info('Stopping StatsCollector');
    if (this.intervalScheduler) {
      this.intervalScheduler.stop();
    }
    this.intervalScheduler = null;
  }

  /**
   * Convert raw metrics to client metric report.
   */
  private updateMetricValues(rawMetricReport: RawMetricReport, isStream: boolean): void {
    const metricReport = isStream
      ? this.clientMetricReport.streamMetricReports[Number(rawMetricReport.ssrc)]
      : this.clientMetricReport.globalMetricReport;

    let metricMap: {
      [id: string]: {
        transform?: (metricName?: string, ssrc?: number) => number;
        type?: SdkMetric.Type;
        source?: string;
      };
    };
    if (isStream) {
      metricMap = this.clientMetricReport.getMetricMap(
        (metricReport as StreamMetricReport).mediaType,
        (metricReport as StreamMetricReport).direction
      );
    } else {
      metricMap = this.clientMetricReport.getMetricMap();
    }

    for (const rawMetric in rawMetricReport) {
      if (rawMetric in metricMap) {
        if (typeof rawMetricReport[rawMetric] === 'number') {
          metricReport.previousMetrics[rawMetric] = metricReport.currentMetrics[rawMetric];
          metricReport.currentMetrics[rawMetric] = rawMetricReport[rawMetric];
        } else if (typeof rawMetricReport[rawMetric] === 'string') {
          metricReport.currentStringMetrics[rawMetric] = rawMetricReport[rawMetric];
        } else if (typeof rawMetricReport[rawMetric] === 'object') {
          metricReport.previousObjectMetrics[rawMetric] =
            metricReport.currentObjectMetrics[rawMetric] === undefined
              ? rawMetricReport[rawMetric]
              : metricReport.currentObjectMetrics[rawMetric];
          metricReport.currentObjectMetrics[rawMetric] = rawMetricReport[rawMetric];
        } else {
          this.logger.error(
            `Unknown metric value type ${typeof rawMetricReport[rawMetric]} for metric ${rawMetric}`
          );
        }
      }
    }
  }

  /**
   * Converts RawMetricReport to StreamMetricReport and GlobalMetricReport and stores them as clientMetricReport.
   */
  private processRawMetricReports(rawMetricReports: RawMetricReport[]): void {
    this.clientMetricReport.currentSsrcs = {};
    const timeStamp = Date.now();
    for (const rawMetricReport of rawMetricReports) {
      const isStream = this.isStreamRawMetricReport(rawMetricReport.type);
      if (isStream) {
        const existingStreamMetricReport = this.clientMetricReport.streamMetricReports[
          Number(rawMetricReport.ssrc)
        ];
        if (!existingStreamMetricReport) {
          const streamMetricReport = new StreamMetricReport();
          streamMetricReport.mediaType = this.getMediaType(rawMetricReport);
          streamMetricReport.direction = this.getDirectionType(rawMetricReport);
          if (
            streamMetricReport.mediaType === MediaType.VIDEO &&
            streamMetricReport.direction === Direction.UPSTREAM
          ) {
            streamMetricReport.streamId = this.videoStreamIndex.sendVideoStreamIdFromRid(
              rawMetricReport.rid
            );
          } else if (!this.videoStreamIndex.allStreams().empty()) {
            streamMetricReport.streamId = this.videoStreamIndex.streamIdForSSRC(
              Number(rawMetricReport.ssrc)
            );
            /* istanbul ignore else */
            if (this.videoStreamIndex.groupIdForSSRC !== undefined) {
              streamMetricReport.groupId = this.videoStreamIndex.groupIdForSSRC(
                Number(rawMetricReport.ssrc)
              );
            }
          }
          this.clientMetricReport.streamMetricReports[
            Number(rawMetricReport.ssrc)
          ] = streamMetricReport;
        } else {
          // Update stream ID in case we have overridden it locally in the case of remote video
          // updates completed without a negotiation
          if (
            existingStreamMetricReport.mediaType === MediaType.VIDEO &&
            existingStreamMetricReport.direction === Direction.UPSTREAM
          ) {
            existingStreamMetricReport.streamId = this.videoStreamIndex.sendVideoStreamIdFromRid(
              rawMetricReport.rid
            );
          } else {
            existingStreamMetricReport.streamId = this.videoStreamIndex.streamIdForSSRC(
              Number(rawMetricReport.ssrc)
            );
          }
        }
        this.clientMetricReport.currentSsrcs[Number(rawMetricReport.ssrc)] = 1;
      }
      this.updateMetricValues(rawMetricReport, isStream);
    }
    this.clientMetricReport.removeDestroyedSsrcs();
    this.clientMetricReport.previousTimestampMs = this.clientMetricReport.currentTimestampMs;
    this.clientMetricReport.currentTimestampMs = timeStamp;
    this.clientMetricReport.print();
  }

  /**
   *  Add stream metric dimension frames derived from metrics
   */
  private addStreamMetricDimensionFrames(
    streamMetricFrame: SdkStreamMetricFrame,
    streamMetricReport: StreamMetricReport
  ): void {
    const streamDimensionMap = this.clientMetricReport.getStreamDimensionMap();
    for (const metricName in streamMetricReport.currentStringMetrics) {
      if (metricName in streamDimensionMap) {
        const dimensionFrame = SdkStreamDimension.create();
        dimensionFrame.type = streamDimensionMap[metricName];
        const dimensionValue = SdkDimensionValue.create();
        dimensionValue.stringValue = streamMetricReport.currentStringMetrics[metricName];
        dimensionFrame.value = dimensionValue;
        streamMetricFrame.dimensions.push(dimensionFrame);
      }
    }
  }

  /**
   * Packages a metric into the MetricFrame.
   */
  private addMetricFrame(
    metricName: string,
    clientMetricFrame: SdkClientMetricFrame,
    metricSpec: {
      transform?: (metricName?: string, ssrc?: number) => number;
      type?: SdkMetric.Type;
      source?: string;
    },
    ssrc?: number
  ): void {
    const type = metricSpec.type;
    const transform = metricSpec.transform;
    const sourceMetric = metricSpec.source;
    const streamMetricFramesLength = clientMetricFrame.streamMetricFrames.length;
    const latestStreamMetricFrame =
      clientMetricFrame.streamMetricFrames[streamMetricFramesLength - 1];
    if (type) {
      const metricFrame = SdkMetric.create();
      metricFrame.type = type;
      metricFrame.value = sourceMetric
        ? transform(sourceMetric, ssrc)
        : transform(metricName, ssrc);
      ssrc
        ? latestStreamMetricFrame.metrics.push(metricFrame)
        : clientMetricFrame.globalMetrics.push(metricFrame);
    }
  }

  /**
   * Packages metrics in GlobalMetricReport into the MetricFrame.
   */
  private addGlobalMetricsToProtobuf(clientMetricFrame: SdkClientMetricFrame): void {
    const metricMap = this.clientMetricReport.getMetricMap();
    for (const metricName in this.clientMetricReport.globalMetricReport.currentMetrics) {
      this.addMetricFrame(metricName, clientMetricFrame, metricMap[metricName]);
    }
  }

  /**
   * Packages metrics in StreamMetricReport into the MetricFrame.
   */
  private addStreamMetricsToProtobuf(clientMetricFrame: SdkClientMetricFrame): void {
    for (const ssrc in this.clientMetricReport.streamMetricReports) {
      const streamMetricReport = this.clientMetricReport.streamMetricReports[ssrc];
      const streamMetricFrame = SdkStreamMetricFrame.create();
      streamMetricFrame.streamId = streamMetricReport.streamId;
      streamMetricFrame.metrics = [];
      this.addStreamMetricDimensionFrames(streamMetricFrame, streamMetricReport);
      clientMetricFrame.streamMetricFrames.push(streamMetricFrame);
      const metricMap = this.clientMetricReport.getMetricMap(
        streamMetricReport.mediaType,
        streamMetricReport.direction
      );

      for (const metricName in streamMetricReport.currentMetrics) {
        this.addMetricFrame(metricName, clientMetricFrame, metricMap[metricName], Number(ssrc));
      }

      for (const metricName in streamMetricReport.currentStringMetrics) {
        this.addMetricFrame(metricName, clientMetricFrame, metricMap[metricName], Number(ssrc));
      }

      for (const metricName in streamMetricReport.currentObjectMetrics) {
        this.addMetricFrame(metricName, clientMetricFrame, metricMap[metricName], Number(ssrc));
      }
    }
  }

  /**
   * Packages all metrics into the MetricFrame.
   */
  private makeClientMetricProtobuf(): SdkClientMetricFrame {
    const clientMetricFrame = SdkClientMetricFrame.create();
    clientMetricFrame.globalMetrics = [];
    clientMetricFrame.streamMetricFrames = [];
    this.addGlobalMetricsToProtobuf(clientMetricFrame);
    this.addStreamMetricsToProtobuf(clientMetricFrame);
    return clientMetricFrame;
  }

  /**
   * Sends the MetricFrame to media backend via ProtoBuf.
   */
  private sendClientMetricProtobuf(clientMetricFrame: SdkClientMetricFrame): void {
    this.signalingClient.sendClientMetrics(clientMetricFrame);
  }

  /**
   * Checks if the type of RawMetricReport is stream related.
   */
  private isStreamRawMetricReport(type: string): boolean {
    return [
      'inbound-rtp',
      'inbound-rtp-red',
      'outbound-rtp',
      'remote-inbound-rtp',
      'remote-outbound-rtp',
    ].includes(type);
  }

  /**
   * Returns the MediaType for a RawMetricReport.
   */
  private getMediaType(rawMetricReport: RawMetricReport): MediaType {
    return rawMetricReport.kind === 'audio' ? MediaType.AUDIO : MediaType.VIDEO;
  }

  /**
   * Returns the Direction for a RawMetricReport.
   */
  private getDirectionType(rawMetricReport: RawMetricReport): Direction {
    const { type } = rawMetricReport;
    return type === 'inbound-rtp' || type === 'remote-outbound-rtp' || type === 'inbound-rtp-red'
      ? Direction.DOWNSTREAM
      : Direction.UPSTREAM;
  }

  /**
   * Checks if a RawMetricReport belongs to certain types.
   */
  isValidStandardRawMetric(rawMetricReport: RawMetricReport): boolean {
    return (
      rawMetricReport.type === 'inbound-rtp' ||
      rawMetricReport.type === 'inbound-rtp-red' ||
      rawMetricReport.type === 'outbound-rtp' ||
      rawMetricReport.type === 'remote-inbound-rtp' ||
      rawMetricReport.type === 'remote-outbound-rtp' ||
      (rawMetricReport.type === 'candidate-pair' && rawMetricReport.state === 'succeeded') ||
      (rawMetricReport.type === 'media-source' && rawMetricReport.kind === 'audio')
    );
  }

  /**
   * Checks if a RawMetricReport is stream related.
   */
  isValidSsrc(rawMetricReport: RawMetricReport): boolean {
    let validSsrc = true;
    if (
      this.isStreamRawMetricReport(rawMetricReport.type) &&
      this.getDirectionType(rawMetricReport) === Direction.DOWNSTREAM &&
      this.getMediaType(rawMetricReport) === MediaType.VIDEO
    ) {
      validSsrc = this.videoStreamIndex.streamIdForSSRC(Number(rawMetricReport.ssrc)) > 0;
    }
    return validSsrc;
  }

  /**
   * Checks if a RawMetricReport is valid.
   */
  isValidRawMetricReport(rawMetricReport: RawMetricReport): boolean {
    return this.isValidStandardRawMetric(rawMetricReport) && this.isValidSsrc(rawMetricReport);
  }

  /**
   * Filters RawMetricReports and keeps the required parts.
   */
  filterRawMetricReports(rawMetricReports: RawMetricReport[]): RawMetricReport[] {
    const filteredRawMetricReports = [];
    for (const rawMetricReport of rawMetricReports) {
      if (this.isValidRawMetricReport(rawMetricReport)) {
        filteredRawMetricReports.push(rawMetricReport);
      }
    }
    return filteredRawMetricReports;
  }

  /**
   * Performs a series operation on RawMetricReport.
   */
  private handleRawMetricReports(rawMetricReports: RawMetricReport[]): void {
    const filteredRawMetricReports = this.filterRawMetricReports(rawMetricReports);
    this.logger.debug(() => {
      return `Filtered raw metrics : ${JSON.stringify(filteredRawMetricReports)}`;
    });

    // Add custom stats for reporting.
    const customStatsReports: CustomStatsReport[] = [];
    this.maybeAddRedRecoveryMetrics(customStatsReports);
    this.addVideoCodecDegradationMetrics(customStatsReports);
    this.clientMetricReport.customStatsReports = customStatsReports;
    filteredRawMetricReports.push(...customStatsReports);

    this.processRawMetricReports(filteredRawMetricReports);

    const clientMetricFrame = this.makeClientMetricProtobuf();
    this.sendClientMetricProtobuf(clientMetricFrame);
    this.audioVideoController.forEachObserver(observer => {
      Maybe.of(observer.metricsDidReceive).map(f =>
        f.bind(observer)(this.clientMetricReport.clone())
      );
    });
  }

  /**
   * Gets raw WebRTC metrics.
   */
  private async getStatsWrapper(): Promise<void> {
    if (!this.audioVideoController.rtcPeerConnection) {
      return;
    }

    const rawMetricReports: RawMetricReport[] = [];

    // @ts-ignore
    try {
      const report = await this.audioVideoController.rtcPeerConnection.getStats();
      this.clientMetricReport.rtcStatsReport = report;
      report.forEach((item: StatsReportItem) => {
        rawMetricReports.push(item);
      });
      this.handleRawMetricReports(rawMetricReports);
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  overrideObservableMetric(name: string, value: number): void {
    this.clientMetricReport.overrideObservableMetric(name, value);
  }
  /**
   * Receives the red recovery metrics from DefaultTransceiver.
   */
  recoveryMetricsDidReceive(metricReport: RedundantAudioRecoveryMetricReport): void {
    this.redRecoveryMetricReport = metricReport;
  }

  /**
   * Adds RED recovery metrics to the raw webrtc stats report.
   */
  private maybeAddRedRecoveryMetrics(customStatsReports: CustomStatsReport[]): void {
    if (
      this.redRecoveryMetricReport.currentTimestampMs ===
      this.lastRedRecoveryMetricReportConsumedTimestampMs
    ) {
      // We have already sent the latest RED metrics.
      return;
    }

    // @ts-ignore
    customStatsReports.push({
      kind: 'audio',
      type: 'inbound-rtp-red',
      ssrc: this.redRecoveryMetricReport.ssrc,
      timestamp: this.redRecoveryMetricReport.currentTimestampMs,
      totalAudioPacketsLost: this.redRecoveryMetricReport.totalAudioPacketsLost,
      totalAudioPacketsExpected: this.redRecoveryMetricReport.totalAudioPacketsExpected,
      totalAudioPacketsRecoveredRed: this.redRecoveryMetricReport.totalAudioPacketsRecoveredRed,
      totalAudioPacketsRecoveredFec: this.redRecoveryMetricReport.totalAudioPacketsRecoveredFec,
    });

    this.lastRedRecoveryMetricReportConsumedTimestampMs = this.redRecoveryMetricReport.currentTimestampMs;
  }

  /**
   * Receive video codec degradation event due to high encode CPU usage
   * from MonitorTask and increment counter
   */
  videoCodecDegradationHighEncodeCpuDidReceive(): void {
    this.videoCodecDegradationHighEncodeCpuCount += 1;
  }

  /**
   * Receive video codec degradation event due to hardware encoder failure
   * from MonitorTask and increment counter
   */
  videoCodecDegradationEncodeFailureDidReceive(): void {
    this.videoCodecDegradationEncodeFailureCount += 1;
  }

  private addVideoCodecDegradationMetrics(customStatsReports: CustomStatsReport[]): void {
    const videoUpstreamSsrc = this.clientMetricReport.getVideoUpstreamSsrc();
    if (videoUpstreamSsrc !== null) {
      customStatsReports.push({
        kind: 'video',
        type: 'outbound-rtp',
        ssrc: videoUpstreamSsrc,
        timestamp: Date.now(),
        videoCodecDegradationHighEncodeCpu: this.videoCodecDegradationHighEncodeCpuCount,
        videoCodecDegradationEncodeFailure: this.videoCodecDegradationEncodeFailureCount,
      });
    }
    this.videoCodecDegradationHighEncodeCpuCount = 0;
    this.videoCodecDegradationEncodeFailureCount = 0;
  }
}
