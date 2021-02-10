// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import ClientMetricReportDirection from '../clientmetricreport/ClientMetricReportDirection';
import ClientMetricReportMediaType from '../clientmetricreport/ClientMetricReportMediaType';
import ClientVideoStreamReceivingReport from '../clientmetricreport/ClientVideoStreamReceivingReport';
import DefaultClientMetricReport from '../clientmetricreport/DefaultClientMetricReport';
import StreamMetricReport from '../clientmetricreport/StreamMetricReport';
import ConnectionHealthData from '../connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import ReconnectionHealthPolicy from '../connectionhealthpolicy/ReconnectionHealthPolicy';
import UnusableAudioWarningConnectionHealthPolicy from '../connectionhealthpolicy/UnusableAudioWarningConnectionHealthPolicy';
import Maybe from '../maybe/Maybe';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../meetingsession/MeetingSessionStatusCode';
import RemovableObserver from '../removableobserver/RemovableObserver';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import { ISdkBitrateFrame } from '../signalingprotocol/SignalingProtocol';
import AudioLogEvent from '../statscollector/AudioLogEvent';
import VideoLogEvent from '../statscollector/VideoLogEvent';
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
  private static DEFAULT_TIMEOUT_FOR_START_SENDING_VIDEO_MS: number = 30000;
  private static DEFAULT_DOWNLINK_CALLRATE_OVERSHOOT_FACTOR: number = 1.5;
  private static DEFAULT_DOWNLINK_CALLRATE_UNDERSHOOT_FACTOR: number = 0.5;
  private currentVideoDownlinkBandwidthEstimationKbps: number = 10000;
  private currentAvailableStreamAvgBitrates: ISdkBitrateFrame = null;
  private hasSignalingError: boolean = false;
  private presenceHandlerCalled: boolean = false;

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

  videoTileDidUpdate(_tileState: VideoTileState): void {
    this.context.maxVideoTileCount = Math.max(
      this.context.maxVideoTileCount,
      this.context.videoTileController.getAllVideoTiles().length
    );
  }

  videoSendHealthDidChange(bitrateKbps: number, packetsPerSecond: number): void {
    if (
      this.context.videoInputAttachedTimestampMs === 0 ||
      !this.context.videoTileController.hasStartedLocalVideoTile() ||
      !this.context.lastKnownVideoAvailability.canStartLocalVideo
    ) {
      return;
    }

    const tracks =
      this.context.activeVideoInput !== null ? this.context.activeVideoInput.getTracks() : null;
    if (!tracks || !tracks[0]) {
      return;
    }

    const durationMs = Date.now() - this.context.videoInputAttachedTimestampMs;
    if (packetsPerSecond > 0 || bitrateKbps > 0) {
      this.context.statsCollector.logVideoEvent(
        VideoLogEvent.SendingSuccess,
        this.context.videoDeviceInformation
      );
      this.context.statsCollector.logLatency(
        'video_start_sending',
        durationMs,
        this.context.videoDeviceInformation
      );
      this.context.videoInputAttachedTimestampMs = 0;
    } else if (durationMs > MonitorTask.DEFAULT_TIMEOUT_FOR_START_SENDING_VIDEO_MS) {
      this.context.statsCollector.logVideoEvent(
        VideoLogEvent.SendingFailed,
        this.context.videoDeviceInformation
      );
      this.context.videoInputAttachedTimestampMs = 0;
    }
  }

  videoReceiveBandwidthDidChange(newBandwidthKbps: number, oldBandwidthKbps: number): void {
    this.logger.debug(() => {
      return `receiving bandwidth changed from prev=${oldBandwidthKbps} Kbps to curr=${newBandwidthKbps} Kbps`;
    });
    this.currentVideoDownlinkBandwidthEstimationKbps = newBandwidthKbps;
  }

  private checkResubscribe(clientMetricReport: ClientMetricReport): boolean {
    const metricReport = clientMetricReport.getObservableMetrics();
    if (!metricReport) {
      return false;
    }
    const availableSendBandwidth =
      metricReport.availableSendBandwidth || metricReport.availableOutgoingBitrate;
    const nackCountPerSecond =
      metricReport.nackCountReceivedPerSecond || metricReport.googNackCountReceivedPerSecond;

    let needResubscribe = false;

    this.context.videoDownlinkBandwidthPolicy.updateMetrics(clientMetricReport);
    const resubscribeForDownlink = this.context.videoDownlinkBandwidthPolicy.wantsResubscribe();
    needResubscribe = needResubscribe || resubscribeForDownlink;
    if (resubscribeForDownlink) {
      this.context.videosToReceive = this.context.videoDownlinkBandwidthPolicy.chooseSubscriptions();
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
    const defaultClientMetricReport = clientMetricReport as DefaultClientMetricReport;
    if (!defaultClientMetricReport) {
      return;
    }

    if (this.checkResubscribe(clientMetricReport)) {
      this.context.audioVideoController.update();
    }

    if (!this.currentAvailableStreamAvgBitrates) {
      return;
    }

    const streamMetricReport = defaultClientMetricReport.streamMetricReports;
    if (!streamMetricReport) {
      return;
    }

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
      this.logger.debug(() => {
        return `Downlink video streams are not receiving enough data`;
      });
      this.context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        Maybe.of(observer.videoNotReceivingEnoughData).map(f =>
          f.bind(observer)(Array.from(videoReceivingBitrateMap.values()))
        );
      });
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
        this.context.eventController?.pushMeetingState('receivingAudioDropped');
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
    const videoSubscription: number[] = this.context.videoSubscriptions || [];

    let requiredBandwidthKbps = 0;
    this.currentAvailableStreamAvgBitrates = bitrates;

    this.logger.debug(() => {
      return `simulcast: bitrates from server ${JSON.stringify(bitrates)}`;
    });
    for (const bitrate of bitrates.bitrates) {
      if (videoSubscription.indexOf(bitrate.sourceStreamId) !== -1) {
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
      this.context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        Maybe.of(observer.estimatedDownlinkBandwidthLessThanRequired).map(f =>
          f.bind(observer)(this.currentVideoDownlinkBandwidthEstimationKbps, requiredBandwidthKbps)
        );
      });
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
        this.context.eventController?.pushMeetingState('signalingDropped');
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
      if (status.statusCode() !== MeetingSessionStatusCode.OK) {
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
    if (attendeeId === presentAttendeeId && present && !this.presenceHandlerCalled) {
      this.presenceHandlerCalled = true;
      this.context.attendeePresenceDurationMs = Date.now() - this.context.startAudioVideoTimestamp;
      /* istanbul ignore else */
      if (this.context.eventController) {
        this.context.eventController.publishEvent('attendeePresenceReceived', {
          attendeePresenceDurationMs: this.context.attendeePresenceDurationMs,
        });
      }
    }
  };
}
