// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import ClientMetricReportDirection from '../clientmetricreport/ClientMetricReportDirection';
import ClientMetricReportMediaType from '../clientmetricreport/ClientMetricReportMediaType';
import StreamMetricReport from '../clientmetricreport/StreamMetricReport';
import ConnectionHealthPolicy from '../connectionhealthpolicy/BaseConnectionHealthPolicy';
import ConnectionHealthData from '../connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import ReconnectionHealthPolicy from '../connectionhealthpolicy/ReconnectionHealthPolicy';
import SendingAudioFailureConnectionHealthPolicy from '../connectionhealthpolicy/SendingAudioFailureConnectionHealthPolicy';
import UnusableAudioWarningConnectionHealthPolicy from '../connectionhealthpolicy/UnusableAudioWarningConnectionHealthPolicy';
import AudioVideoEventAttributes from '../eventcontroller/AudioVideoEventAttributes';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../meetingsession/MeetingSessionStatusCode';
import RemovableObserver from '../removableobserver/RemovableObserver';
import VideoCodecCapability from '../sdp/VideoCodecCapability';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import {
  ISdkBitrateFrame,
  SdkNotificationFrame,
  SdkSignalFrame,
} from '../signalingprotocol/SignalingProtocol';
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
  private sendingAudioFailureHealthPolicy: SendingAudioFailureConnectionHealthPolicy;
  private prevSignalStrength: number = 1;
  private currentAvailableStreamAvgBitrates: ISdkBitrateFrame = null;
  private hasSignalingError: boolean = false;
  private presenceHandlerCalled: boolean = false;

  // See comment above invocation of `pauseResubscribeCheck` in `DefaultAudioVideoController`
  // for explanation.
  private isResubscribeCheckPaused: boolean = false;
  private pendingMetricsReport: ClientMetricReport | undefined = undefined;
  private isMeetingConnected: boolean = false;
  private videoEncodingHealthPolicies: ConnectionHealthPolicy[] = [];

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
    this.sendingAudioFailureHealthPolicy = new SendingAudioFailureConnectionHealthPolicy(
      context.logger,
      { ...connectionHealthPolicyConfiguration },
      this.initialConnectionHealthData.clone()
    );
    for (const policy of connectionHealthPolicyConfiguration.videoEncodingHealthPolicies) {
      this.videoEncodingHealthPolicies.push(
        new policy(
          { ...connectionHealthPolicyConfiguration },
          this.initialConnectionHealthData.clone()
        )
      );
    }
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
      }
    }

    return needResubscribe;
  }

  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    if (this.checkResubscribe(clientMetricReport)) {
      this.context.audioVideoController.update({ needsRenegotiation: false });
    }

    if (!this.currentAvailableStreamAvgBitrates) {
      return;
    }

    const streamMetricReport = clientMetricReport.streamMetricReports;
    const downlinkVideoStream: Map<number, StreamMetricReport> = new Map<
      number,
      StreamMetricReport
    >();

    // TODO: move those logic to stats collector.
    for (const ssrc in streamMetricReport) {
      if (
        streamMetricReport[ssrc].mediaType === ClientMetricReportMediaType.VIDEO &&
        streamMetricReport[ssrc].direction === ClientMetricReportDirection.DOWNSTREAM
      ) {
        downlinkVideoStream.set(streamMetricReport[ssrc].streamId, streamMetricReport[ssrc]);
      }
    }
  }

  connectionHealthDidChange(connectionHealthData: ConnectionHealthData): void {
    if (connectionHealthData.consecutiveMissedPongs === 0) {
      if (this.context.reconnectController) {
        this.context.reconnectController.setLastActiveTimestampMs(Date.now());
      }
    }

    this.applyHealthPolicy(this.reconnectionHealthPolicy, connectionHealthData, () => {
      this.context.audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.ConnectionHealthReconnect),
        null
      );
    });

    this.applyHealthPolicy(
      this.unusableAudioWarningHealthPolicy,
      connectionHealthData,
      () => {
        this.context.poorConnectionCount += 1;
        const attributes = this.generateAudioVideoEventAttributesForReceivingAudioDropped();
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
      },
      () => {
        this.context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
          Maybe.of(observer.connectionDidBecomeGood).map(f => f.bind(observer)());
        });
      }
    );

    for (const policy of this.videoEncodingHealthPolicies) {
      this.applyHealthPolicy(policy, connectionHealthData, () => {
        this.degradeVideoCodec(policy.name);
        switch (policy.name) {
          case 'Video Encoding CPU Health':
            this.context.statsCollector.videoCodecDegradationHighEncodeCpuDidReceive();
            break;
          case 'Video Encoding framerate Health':
            this.context.statsCollector.videoCodecDegradationEncodeFailureDidReceive();
            break;
        }
      });
    }

    if (this.isMeetingConnected) {
      this.applyHealthPolicy(
        this.sendingAudioFailureHealthPolicy,
        connectionHealthData,
        () => {
          const attributes = this.generateBaseAudioVideoEventAttributes();
          this.context.eventController?.publishEvent('sendingAudioFailed', attributes);
        },
        () => {
          const attributes = this.generateBaseAudioVideoEventAttributes();
          this.context.eventController?.publishEvent('sendingAudioRecovered', attributes);
        }
      );
    }
  }

  audioVideoDidStart(): void {
    this.isMeetingConnected = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  audioVideoDidStartConnecting(reconnecting: boolean): void {
    // The expectation here is that the flag will be set to true again when audioVideoDidStart() is eventually called.
    this.isMeetingConnected = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
    this.isMeetingConnected = false;
  }

  private applyHealthPolicy(
    healthPolicy: ConnectionHealthPolicy,
    connectionHealthData: ConnectionHealthData,
    unhealthyCallback?: () => void,
    healthyCallback?: () => void
  ): void {
    healthPolicy.update(connectionHealthData);
    const healthValue = healthPolicy.healthIfChanged();
    if (healthValue !== null) {
      this.logger.info(`${healthPolicy.name} value is now ${healthValue}`);
      if (healthValue <= healthPolicy.minimumHealth()) {
        Maybe.of(unhealthyCallback).map(f => f.bind(this)());
      } else {
        Maybe.of(healthyCallback).map(f => f.bind(this)());
      }
    }
  }

  private handleBitrateFrame(bitrates: ISdkBitrateFrame): void {
    this.currentAvailableStreamAvgBitrates = bitrates;

    if (bitrates.serverAvailableOutgoingBitrate > 0) {
      this.logger.info(
        `Received server side estimation of available incoming bitrate ${bitrates.serverAvailableOutgoingBitrate}kbps`
      );
      // This value will be included in the 'Bitrates' signaling message if we are using
      // server side remote video quality adaption, since if that is the case we will
      // be using TWCC and will therefore not likely have an estimate on the client
      // for available incoming bitrate
      this.context.statsCollector.overrideObservableMetric(
        'availableIncomingBitrate',
        bitrates.serverAvailableOutgoingBitrate * 1000
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
        const attributes = this.generateAudioVideoEventAttributesForReceivingAudioDropped();
        this.context.eventController?.publishEvent('signalingDropped', attributes);
        this.hasSignalingError = true;
      }
    } else if (event.type === SignalingClientEventType.WebSocketOpen) {
      this.hasSignalingError = false;
    }

    if (event.type === SignalingClientEventType.ReceivedSignalFrame) {
      if (event.message.type === SdkSignalFrame.Type.NOTIFICATION) {
        switch (event.message.notification.level) {
          case SdkNotificationFrame.NotificationLevel.INFO:
            this.logger.info(
              `Received notification from server: ${event.message.notification.message}`
            );
            break;
          case SdkNotificationFrame.NotificationLevel.WARNING:
            this.logger.warn(`Received warning from server: ${event.message.notification.message}`);
            break;
          case SdkNotificationFrame.NotificationLevel.ERROR:
            this.logger.error(`Received error from server: ${event.message.notification.message}`);
            break;
          default:
            this.logger.error(
              `Received notification from server with unknown level ${event.message.notification.level}: ${event.message.notification.message}`
            );
            break;
        }
        return;
      }
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

  private generateBaseAudioVideoEventAttributes = (): AudioVideoEventAttributes => {
    const {
      signalingOpenDurationMs,
      startTimeMs,
      iceGatheringDurationMs,
      attendeePresenceDurationMs,
      meetingStartDurationMs,
    } = this.context;
    return {
      meetingDurationMs: startTimeMs === null ? 0 : Math.round(Date.now() - startTimeMs),
      signalingOpenDurationMs,
      iceGatheringDurationMs,
      attendeePresenceDurationMs,
      meetingStartDurationMs,
    };
  };

  private generateAudioVideoEventAttributesForReceivingAudioDropped = (): AudioVideoEventAttributes => {
    const baseAttributes = this.generateBaseAudioVideoEventAttributes();
    return {
      ...baseAttributes,
      maxVideoTileCount: this.context.maxVideoTileCount,
      poorConnectionCount: this.context.poorConnectionCount,
    };
  };

  /**
   * Degrade video codec to an alternative codec
   */
  private degradeVideoCodec(cause: string): void {
    // Degrade video codec if there are other codec options and current codec is not H264 CBP or VP8
    if (
      this.context.meetingSupportedVideoSendCodecPreferences !== undefined &&
      this.context.meetingSupportedVideoSendCodecPreferences.length > 1 &&
      !(
        this.context.meetingSupportedVideoSendCodecPreferences[0].equals(
          VideoCodecCapability.h264ConstrainedBaselineProfile()
        ) ||
        this.context.meetingSupportedVideoSendCodecPreferences[0].equals(VideoCodecCapability.vp8())
      )
    ) {
      const newMeetingSupportedVideoSendCodecPreferences: VideoCodecCapability[] = [];
      for (const capability of this.context.videoSendCodecPreferences) {
        if (!capability.equals(this.context.meetingSupportedVideoSendCodecPreferences[0])) {
          newMeetingSupportedVideoSendCodecPreferences.push(capability);
        }
      }
      if (newMeetingSupportedVideoSendCodecPreferences.length > 0) {
        this.context.logger.info(
          `Downgrading codec from ${this.context.meetingSupportedVideoSendCodecPreferences[0].codecName} to ${newMeetingSupportedVideoSendCodecPreferences[0].codecName} due to ${cause}`
        );
        this.context.videoSendCodecsBlocklisted.push(
          this.context.meetingSupportedVideoSendCodecPreferences[0]
        );
        this.context.meetingSupportedVideoSendCodecPreferences = newMeetingSupportedVideoSendCodecPreferences;
        this.context.audioVideoController.update({ needsRenegotiation: true });
      } else {
        this.context.logger.warn(
          'Degrading video codec failed since there is no alternative codec to select'
        );
      }
    }
  }
}
