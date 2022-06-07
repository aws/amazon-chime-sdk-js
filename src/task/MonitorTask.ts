// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import ClientMetricReportDirection from '../clientmetricreport/ClientMetricReportDirection';
import ClientMetricReportMediaType from '../clientmetricreport/ClientMetricReportMediaType';
import ClientVideoStreamReceivingReport from '../clientmetricreport/ClientVideoStreamReceivingReport';
import StreamMetricReport from '../clientmetricreport/StreamMetricReport';
import ConnectionHealthData from '../connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import ReconnectionHealthPolicy from '../connectionhealthpolicy/ReconnectionHealthPolicy';
import UnusableAudioWarningConnectionHealthPolicy from '../connectionhealthpolicy/UnusableAudioWarningConnectionHealthPolicy';
import AudioVideoEventAttributes from '../eventcontroller/AudioVideoEventAttributes';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../meetingsession/MeetingSessionStatusCode';
import RemovableObserver from '../removableobserver/RemovableObserver';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import { ISdkBitrateFrame, SdkSignalFrame } from '../signalingprotocol/SignalingProtocol';
import AudioLogEvent from '../statscollector/AudioLogEvent';
import { Maybe } from '../utils/Types';
import VideoTileState from '../videotile/VideoTileState';
import BaseTask from './BaseTask';

/*
 * [[MonitorTask]] monitors connections using SignalingAndMetricsConnectionMonitor.
 */
export default class MonitorTask
  extends BaseTask
  implements AudioVideoObserver, RemovableObserver, SignalingClientObserver {
  protected taskName = 'MonitorTask';

  private reconnectionHealthPolicy: ReconnectionHealthPolicy;
  private unusableAudioWarningHealthPolicy: UnusableAudioWarningConnectionHealthPolicy;
  private prevSignalStrength: number = 1;
  private static DEFAULT_DOWNLINK_CALLRATE_OVERSHOOT_FACTOR: number = 2.0;
  private static DEFAULT_DOWNLINK_CALLRATE_UNDERSHOOT_FACTOR: number = 0.2;
  private currentVideoDownlinkBandwidthEstimationKbps: number = 10000;
  private currentAvailableStreamAvgBitrates: ISdkBitrateFrame = null;
  private hasSignalingError: boolean = false;
  private presenceHandlerCalled: boolean = false;

  // See comment above invocation of `pauseResubscribeCheck` in `DefaultAudioVideoController`
  // for explanation.
  private isResubscribeCheckPaused: boolean = false;
  private pendingMetricsReport: ClientMetricReport | undefined = undefined;

  constructor(
    private context: AudioVideoControllerState,
    connectionHealthPolicyConfiguration: ConnectionHealthPolicyConfiguration,
    private initialConnectionHealthData: ConnectionHealthData
  ) {
    super(context.logger);
    this.reconnectionHealthPolicy = new ReconnectionHealthPolicy(
      context.logger,
      { ...connectionHealthPolicyConfiguration },
      this.initialConnectionHealthData.clone()
    );
    this.unusableAudioWarningHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      { ...connectionHealthPolicyConfiguration },
      this.initialConnectionHealthData.clone()
    );
  }

  removeObserver(): void {
    this.context.audioVideoController.removeObserver(this);
    this.context.realtimeController.realtimeUnsubscribeToFatalError(
      this.realtimeFatalErrorCallback
    );
    this.context.realtimeController.realtimeUnsubscribeToLocalSignalStrengthChange(
      this.checkAndSendWeakSignalEvent
    );
    this.context.realtimeController.realtimeUnsubscribeToAttendeeIdPresence(
      this.realtimeAttendeeIdPresenceHandler
    );
    this.context.signalingClient.removeObserver(this);
  }

  async run(): Promise<void> {
    this.context.removableObservers.push(this);
    this.context.audioVideoController.addObserver(this);
    this.context.realtimeController.realtimeSubscribeToFatalError(this.realtimeFatalErrorCallback);
    this.context.realtimeController.realtimeSubscribeToLocalSignalStrengthChange(
      this.checkAndSendWeakSignalEvent
    );
    this.context.realtimeController.realtimeSubscribeToAttendeeIdPresence(
      this.realtimeAttendeeIdPresenceHandler
    );

    this.context.connectionMonitor.start();
    this.context.statsCollector.start(this.context.signalingClient, this.context.videoStreamIndex);
    this.context.signalingClient.registerObserver(this);
  }

  pauseResubscribeCheck(): void {
    this.isResubscribeCheckPaused = true;
  }

  resumeResubscribeCheck(): void {
    if (!this.isResubscribeCheckPaused) {
      // Do not recheck subcribe if it wasn't paused to begin with.
      return;
    }
    this.isResubscribeCheckPaused = false;
    if (this.pendingMetricsReport) {
      this.context.logger.info('Resuming resubscribe check with pending metrics report');
      if (this.checkResubscribe(this.pendingMetricsReport)) {
        this.context.audioVideoController.update({ needsRenegotiation: false });
      }
    }
  }

  videoTileDidUpdate(_tileState: VideoTileState): void {
    this.context.maxVideoTileCount = Math.max(
      this.context.maxVideoTileCount,
      this.context.videoTileController.getAllVideoTiles().length
    );
  }

  private checkResubscribe(clientMetricReport: ClientMetricReport): boolean {
    if (this.isResubscribeCheckPaused) {
      this.context.logger.info(
        'Resubscribe check is paused, setting incoming client metric report as pending'
      );
      this.pendingMetricsReport = clientMetricReport;
      return;
    } else {
      this.pendingMetricsReport = undefined;
    }

    const metricReport = clientMetricReport.getObservableMetrics();
    if (!metricReport) {
      return false;
    }

    const availableSendBandwidth = metricReport.availableOutgoingBitrate;
    const nackCountPerSecond = metricReport.nackCountReceivedPerSecond;

    let needResubscribe = false;

    this.context.videoDownlinkBandwidthPolicy.updateMetrics(clientMetricReport);
    const resubscribeForDownlink = this.context.videoDownlinkBandwidthPolicy.wantsResubscribe();
    needResubscribe = needResubscribe || resubscribeForDownlink;
    if (resubscribeForDownlink) {
      const videoSubscriptionIdSet = this.context.videoDownlinkBandwidthPolicy.chooseSubscriptions();
      // Same logic as in `ReceiveVideoStreamIndexTask`, immediately truncating rather then truncating on subscribe
      // avoids any issues with components (e.g. transceiver controller) along the way.
      this.context.videosToReceive = videoSubscriptionIdSet.truncate(
        this.context.videoSubscriptionLimit
      );

      if (videoSubscriptionIdSet.size() > this.context.videosToReceive.size()) {
        this.logger.warn(
          `Video receive limit exceeded. Limiting the videos to ${this.context.videosToReceive.size()}. Please consider using AllHighestVideoBandwidthPolicy or VideoPriorityBasedPolicy along with chooseRemoteVideoSources api to select the video sources to be displayed.`
        );
      }
      this.logger.info(
        `trigger resubscribe for down=${resubscribeForDownlink}; videosToReceive=[${this.context.videosToReceive.array()}]`
      );
    }

    if (this.context.videoTileController.hasStartedLocalVideoTile()) {
      this.context.videoUplinkBandwidthPolicy.updateConnectionMetric({
        uplinkKbps: availableSendBandwidth / 1000,
        nackCountPerSecond: nackCountPerSecond,
      });
      const resubscribeForUplink = this.context.videoUplinkBandwidthPolicy.wantsResubscribe();
      needResubscribe = needResubscribe || resubscribeForUplink;
      if (resubscribeForUplink) {
        this.logger.info(
          `trigger resubscribe for up=${resubscribeForUplink}; videosToReceive=[${this.context.videosToReceive.array()}]`
        );
        this.context.videoUplinkBandwidthPolicy.chooseEncodingParameters();
        this.context.videoUplinkBandwidthPolicy.chooseMediaTrackConstraints();
      }
    }

    return needResubscribe;
  }

  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    const defaultClientMetricReport = clientMetricReport as ClientMetricReport;
    if (!defaultClientMetricReport) {
      return;
    }

    if (this.checkResubscribe(clientMetricReport)) {
      this.context.audioVideoController.update({ needsRenegotiation: false });
    }

    if (!this.currentAvailableStreamAvgBitrates) {
      return;
    }

    const streamMetricReport = defaultClientMetricReport.streamMetricReports;
    if (!streamMetricReport) {
      return;
    }

    const metricReport = clientMetricReport.getObservableMetrics();

    this.currentVideoDownlinkBandwidthEstimationKbps = metricReport.availableIncomingBitrate;

    const downlinkVideoStream: Map<number, StreamMetricReport> = new Map<
      number,
      StreamMetricReport
    >();
    const videoReceivingBitrateMap = new Map<string, ClientVideoStreamReceivingReport>();

    // TODO: move those logic to stats collector.
    for (const ssrc in streamMetricReport) {
      if (
        streamMetricReport[ssrc].mediaType === ClientMetricReportMediaType.VIDEO &&
        streamMetricReport[ssrc].direction === ClientMetricReportDirection.DOWNSTREAM
      ) {
        downlinkVideoStream.set(streamMetricReport[ssrc].streamId, streamMetricReport[ssrc]);
      }
    }

    let fireCallback = false;
    for (const bitrate of this.currentAvailableStreamAvgBitrates.bitrates) {
      if (downlinkVideoStream.has(bitrate.sourceStreamId)) {
        const report = downlinkVideoStream.get(bitrate.sourceStreamId);
        const attendeeId = this.context.videoStreamIndex.attendeeIdForStreamId(
          bitrate.sourceStreamId
        );
        if (!attendeeId) {
          continue;
        }
        const newReport = new ClientVideoStreamReceivingReport();
        const prevBytesReceived = report.previousMetrics['bytesReceived'];
        const currBytesReceived = report.currentMetrics['bytesReceived'];
        if (!prevBytesReceived || !currBytesReceived) {
          continue;
        }

        const receivedBitrate = ((currBytesReceived - prevBytesReceived) * 8) / 1000;

        newReport.expectedAverageBitrateKbps = bitrate.avgBitrateBps / 1000;
        newReport.receivedAverageBitrateKbps = receivedBitrate;
        newReport.attendeeId = attendeeId;
        if (
          receivedBitrate <
          (bitrate.avgBitrateBps / 1000) * MonitorTask.DEFAULT_DOWNLINK_CALLRATE_UNDERSHOOT_FACTOR
        ) {
          fireCallback = true;
        }
        videoReceivingBitrateMap.set(attendeeId, newReport);
      }
    }
    if (fireCallback) {
      this.logger.info(
        `One or more video streams are not receiving expected amounts of data ${JSON.stringify(
          Array.from(videoReceivingBitrateMap.values())
        )}`
      );
    }
  }

  connectionHealthDidChange(connectionHealthData: ConnectionHealthData): void {
    if (connectionHealthData.consecutiveMissedPongs === 0) {
      if (this.context.reconnectController) {
        this.context.reconnectController.setLastActiveTimestampMs(Date.now());
      }
    }

    this.reconnectionHealthPolicy.update(connectionHealthData);
    const reconnectionValue = this.reconnectionHealthPolicy.healthIfChanged();
    if (reconnectionValue !== null) {
      this.logger.info(`reconnection health is now: ${reconnectionValue}`);
      if (reconnectionValue === 0) {
        this.context.audioVideoController.handleMeetingSessionStatus(
          new MeetingSessionStatus(MeetingSessionStatusCode.ConnectionHealthReconnect),
          null
        );
      }
    }

    this.unusableAudioWarningHealthPolicy.update(connectionHealthData);
    const unusableAudioWarningValue = this.unusableAudioWarningHealthPolicy.healthIfChanged();
    if (unusableAudioWarningValue !== null) {
      this.logger.info(`unusable audio warning is now: ${unusableAudioWarningValue}`);
      if (unusableAudioWarningValue === 0) {
        this.context.poorConnectionCount += 1;
        const attributes = this.generateAudioVideoEventAttributes();
        this.context.eventController?.publishEvent('receivingAudioDropped', attributes);
        if (this.context.videoTileController.haveVideoTilesWithStreams()) {
          this.context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
            Maybe.of(observer.connectionDidSuggestStopVideo).map(f => f.bind(observer)());
          });
        } else {
          this.context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
            Maybe.of(observer.connectionDidBecomePoor).map(f => f.bind(observer)());
          });
        }
      } else {
        this.context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
          Maybe.of(observer.connectionDidBecomeGood).map(f => f.bind(observer)());
        });
      }
    }
  }

  private handleBitrateFrame(bitrates: ISdkBitrateFrame): void {
    let requiredBandwidthKbps = 0;
    this.currentAvailableStreamAvgBitrates = bitrates;

    this.logger.debug(() => {
      return `simulcast: bitrates from server ${JSON.stringify(bitrates)}`;
    });
    for (const bitrate of bitrates.bitrates) {
      if (this.context.videosToReceive.contain(bitrate.sourceStreamId)) {
        requiredBandwidthKbps += bitrate.avgBitrateBps;
      }
    }
    requiredBandwidthKbps /= 1000;

    if (
      this.currentVideoDownlinkBandwidthEstimationKbps *
        MonitorTask.DEFAULT_DOWNLINK_CALLRATE_OVERSHOOT_FACTOR <
      requiredBandwidthKbps
    ) {
      this.logger.info(
        `Downlink bandwidth pressure is high: estimated bandwidth ${this.currentVideoDownlinkBandwidthEstimationKbps}Kbps, required bandwidth ${requiredBandwidthKbps}Kbps`
      );
    }
  }

  handleSignalingClientEvent(event: SignalingClientEvent): void {
    // Don't add two or more consecutive "signalingDropped" states.
    if (
      (event.type === SignalingClientEventType.WebSocketClosed &&
        (event.closeCode === 4410 || (event.closeCode >= 4500 && event.closeCode < 4600))) ||
      event.type === SignalingClientEventType.WebSocketError ||
      event.type === SignalingClientEventType.WebSocketFailed
    ) {
      if (!this.hasSignalingError) {
        const attributes = this.generateAudioVideoEventAttributes();
        this.context.eventController?.publishEvent('signalingDropped', attributes);
        this.hasSignalingError = true;
      }
    } else if (event.type === SignalingClientEventType.WebSocketOpen) {
      this.hasSignalingError = false;
    }

    if (event.type === SignalingClientEventType.ReceivedSignalFrame) {
      if (!!event.message.bitrates) {
        const bitrateFrame: ISdkBitrateFrame = event.message.bitrates;
        this.context.videoStreamIndex.integrateBitratesFrame(bitrateFrame);
        this.context.videoDownlinkBandwidthPolicy.updateIndex(this.context.videoStreamIndex);
        this.handleBitrateFrame(event.message.bitrates);
      }
      const status = MeetingSessionStatus.fromSignalFrame(event.message);
      // Primary meeting join ack status will be handled by `PromoteToPrimaryMeetingTask`
      if (
        event.message.type !== SdkSignalFrame.Type.PRIMARY_MEETING_JOIN_ACK &&
        status.statusCode() !== MeetingSessionStatusCode.OK
      ) {
        this.context.audioVideoController.handleMeetingSessionStatus(status, null);
      }
    }
  }

  private checkAndSendWeakSignalEvent = (signalStrength: number): void => {
    const isCurrentSignalBad = signalStrength < 1;
    const isPrevSignalBad = this.prevSignalStrength < 1;
    const signalStrengthEventType = isCurrentSignalBad
      ? !isPrevSignalBad
        ? AudioLogEvent.RedmicStartLoss
        : null
      : isPrevSignalBad
      ? AudioLogEvent.RedmicEndLoss
      : null;

    if (signalStrengthEventType) {
      this.context.statsCollector.logAudioEvent(signalStrengthEventType);
    }

    this.prevSignalStrength = signalStrength;
  };

  private realtimeFatalErrorCallback = (error: Error): void => {
    this.logger.error(`realtime error: ${error}: ${error.stack}`);
    this.context.audioVideoController.handleMeetingSessionStatus(
      new MeetingSessionStatus(MeetingSessionStatusCode.RealtimeApiFailed),
      error
    );
  };

  private realtimeAttendeeIdPresenceHandler = (
    presentAttendeeId: string,
    present: boolean
  ): void => {
    const attendeeId = this.context.meetingSessionConfiguration.credentials.attendeeId;
    this.logger.info(`attendeePresenceReceived: ${attendeeId}`);
    if (attendeeId === presentAttendeeId && present && !this.presenceHandlerCalled) {
      this.presenceHandlerCalled = true;
      this.context.attendeePresenceDurationMs = Date.now() - this.context.startAudioVideoTimestamp;
      this.context.eventController?.publishEvent('attendeePresenceReceived', {
        attendeePresenceDurationMs: this.context.attendeePresenceDurationMs,
      });
    }
  };

  private generateAudioVideoEventAttributes = (): AudioVideoEventAttributes => {
    const {
      signalingOpenDurationMs,
      poorConnectionCount,
      startTimeMs,
      iceGatheringDurationMs,
      attendeePresenceDurationMs,
      meetingStartDurationMs,
    } = this.context;
    const attributes: AudioVideoEventAttributes = {
      maxVideoTileCount: this.context.maxVideoTileCount,
      meetingDurationMs: startTimeMs === null ? 0 : Math.round(Date.now() - startTimeMs),
      signalingOpenDurationMs,
      iceGatheringDurationMs,
      attendeePresenceDurationMs,
      poorConnectionCount,
      meetingStartDurationMs,
    };
    return attributes;
  };
}
