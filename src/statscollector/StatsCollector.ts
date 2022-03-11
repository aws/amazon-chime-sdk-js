// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import Direction from '../clientmetricreport/ClientMetricReportDirection';
import MediaType from '../clientmetricreport/ClientMetricReportMediaType';
import StreamMetricReport from '../clientmetricreport/StreamMetricReport';
import Logger from '../logger/Logger';
import MeetingSessionLifecycleEvent from '../meetingsession/MeetingSessionLifecycleEvent';
import MeetingSessionLifecycleEventCondition from '../meetingsession/MeetingSessionLifecycleEventCondition';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import SignalingClient from '../signalingclient/SignalingClient';
import {
  SdkClientMetricFrame,
  SdkMetric,
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
export default class StatsCollector {
  private static readonly INTERVAL_MS = 1000;
  private static readonly CLIENT_TYPE = 'amazon-chime-sdk-js';

  private intervalScheduler: IntervalScheduler | null = null;
  private signalingClient: SignalingClient;
  private videoStreamIndex: VideoStreamIndex;
  private clientMetricReport: ClientMetricReport;

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
        metricReport.previousMetrics[rawMetric] = metricReport.currentMetrics[rawMetric];
        metricReport.currentMetrics[rawMetric] = rawMetricReport[rawMetric];
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
          if (!this.videoStreamIndex.allStreams().empty()) {
            streamMetricReport.streamId = this.videoStreamIndex.streamIdForSSRC(
              Number(rawMetricReport.ssrc)
            );
          }
          this.clientMetricReport.streamMetricReports[
            Number(rawMetricReport.ssrc)
          ] = streamMetricReport;
        } else {
          // Update stream ID in case we have overridden it locally in the case of remote video
          // updates completed without a negotiation
          existingStreamMetricReport.streamId = this.videoStreamIndex.streamIdForSSRC(
            Number(rawMetricReport.ssrc)
          );
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
      clientMetricFrame.streamMetricFrames.push(streamMetricFrame);
      const metricMap = this.clientMetricReport.getMetricMap(
        streamMetricReport.mediaType,
        streamMetricReport.direction
      );
      for (const metricName in streamMetricReport.currentMetrics) {
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
   * Sends the MetricFrame to Tincan via ProtoBuf.
   */
  private sendClientMetricProtobuf(clientMetricFrame: SdkClientMetricFrame): void {
    this.signalingClient.sendClientMetrics(clientMetricFrame);
  }

  /**
   * Checks if the type of RawMetricReport is stream related.
   */
  private isStreamRawMetricReport(type: string): boolean {
    return ['inbound-rtp', 'outbound-rtp', 'remote-inbound-rtp', 'remote-outbound-rtp'].includes(
      type
    );
  }

  /**
   * Returns the MediaType for a RawMetricReport.
   */
  private getMediaType(rawMetricReport: RawMetricReport): MediaType {
    return rawMetricReport.mediaType === 'audio' ? MediaType.AUDIO : MediaType.VIDEO;
  }

  /**
   * Returns the Direction for a RawMetricReport.
   */
  private getDirectionType(rawMetricReport: RawMetricReport): Direction {
    return rawMetricReport.id.toLowerCase().indexOf('send') !== -1 ||
      rawMetricReport.id.toLowerCase().indexOf('outbound') !== -1 ||
      rawMetricReport.type === 'outbound-rtp'
      ? Direction.UPSTREAM
      : Direction.DOWNSTREAM;
  }

  /**
   * Checks if a RawMetricReport belongs to certain types.
   */
  isValidStandardRawMetric(rawMetricReport: RawMetricReport): boolean {
    return (
      rawMetricReport.type === 'inbound-rtp' ||
      rawMetricReport.type === 'outbound-rtp' ||
      rawMetricReport.type === 'remote-inbound-rtp' ||
      rawMetricReport.type === 'remote-outbound-rtp' ||
      (rawMetricReport.type === 'candidate-pair' && rawMetricReport.state === 'succeeded')
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
}
