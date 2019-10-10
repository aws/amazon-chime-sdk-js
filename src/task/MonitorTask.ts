// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import ConnectionHealthData from '../connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import ReconnectionHealthPolicy from '../connectionhealthpolicy/ReconnectionHealthPolicy';
import SignalStrengthBarsConnectionHealthPolicy from '../connectionhealthpolicy/SignalStrengthBarsConnectionHealthPolicy';
import UnusableAudioWarningConnectionHealthPolicy from '../connectionhealthpolicy/UnusableAudioWarningConnectionHealthPolicy';
import Maybe from '../maybe/Maybe';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../meetingsession/MeetingSessionStatusCode';
import RemovableObserver from '../removableobserver/RemovableObserver';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import AudioLogEvent from '../statscollector/AudioLogEvent';
import VideoLogEvent from '../statscollector/VideoLogEvent';
import BaseTask from './BaseTask';

/*
 * [[MonitorTask]] monitors connections using SignalingAndMetricsConnectionMonitor.
 */
export default class MonitorTask extends BaseTask
  implements AudioVideoObserver, RemovableObserver, SignalingClientObserver {
  protected taskName = 'MonitorTask';

  private reconnectionHealthPolicy: ReconnectionHealthPolicy;
  private unusableAudioWarningHealthPolicy: UnusableAudioWarningConnectionHealthPolicy;
  private signalStrengthBarsHealthPolicy: SignalStrengthBarsConnectionHealthPolicy;
  private prevSignalStrength: number = 1;

  private static DEFAULT_TIMEOUT_FOR_START_SENDING_VIDEO_MS: number = 30000;

  constructor(
    private context: AudioVideoControllerState,
    private initialConnectionHealthData: ConnectionHealthData
  ) {
    super(context.logger);
    this.reconnectionHealthPolicy = new ReconnectionHealthPolicy(
      context.logger,
      new ConnectionHealthPolicyConfiguration(),
      this.initialConnectionHealthData.clone()
    );
    this.unusableAudioWarningHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      new ConnectionHealthPolicyConfiguration(),
      this.initialConnectionHealthData.clone()
    );
    this.signalStrengthBarsHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      new ConnectionHealthPolicyConfiguration(),
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
    this.context.signalingClient.removeObserver(this);
  }

  async run(): Promise<void> {
    this.context.removableObservers.push(this);
    this.context.audioVideoController.addObserver(this);
    this.context.realtimeController.realtimeSubscribeToFatalError(this.realtimeFatalErrorCallback);
    this.context.realtimeController.realtimeSubscribeToLocalSignalStrengthChange(
      this.checkAndSendWeakSignalEvent
    );

    this.context.connectionMonitor.start();
    this.context.statsCollector.start(this.context.signalingClient, this.context.videoStreamIndex);
    this.context.signalingClient.registerObserver(this);
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
    if (this.context.videoDownlinkBandwidthPolicy) {
      this.logger.debug(() => {
        return `receiving bandwidth changed from prev=${oldBandwidthKbps} Kbps to curr=${newBandwidthKbps} Kbps`;
      });
      this.context.videoDownlinkBandwidthPolicy.updateAvailableBandwidth(newBandwidthKbps);

      const resubscribeForDownlink = this.context.videoDownlinkBandwidthPolicy.wantsResubscribe();
      if (resubscribeForDownlink) {
        this.context.videosToReceive = this.context.videoDownlinkBandwidthPolicy.chooseSubscriptions();
        this.logger.info(
          `trigger resubscribe for down=${resubscribeForDownlink}; videosToReceive=[${this.context.videosToReceive.array()}]`
        );
        this.context.audioVideoController.update();
      }
    }
  }

  connectionHealthDidChange(connectionHealthData: ConnectionHealthData): void {
    this.reconnectionHealthPolicy.update(connectionHealthData);
    const reconnectionValue = this.reconnectionHealthPolicy.healthIfChanged();
    if (reconnectionValue !== null) {
      this.logger.info(`reconnection health is now: ${reconnectionValue}`);
      if (reconnectionValue === 0) {
        this.context.audioVideoController.handleMeetingSessionStatus(
          new MeetingSessionStatus(MeetingSessionStatusCode.ConnectionHealthReconnect)
        );
      }
    }

    this.unusableAudioWarningHealthPolicy.update(connectionHealthData);
    const unusableAudioWarningValue = this.unusableAudioWarningHealthPolicy.healthIfChanged();
    if (unusableAudioWarningValue !== null) {
      this.logger.info(`unusable audio warning is now: ${unusableAudioWarningValue}`);
      if (unusableAudioWarningValue === 0) {
        if (this.context.videoTileController.haveVideoTilesWithStreams()) {
          this.context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
            Maybe.of(observer.connectionDidSuggestStopVideo).map(f => f.bind(observer)());
          });
        } else {
          this.context.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
            Maybe.of(observer.connectionDidBecomePoor).map(f => f.bind(observer)());
          });
        }
      }
    }

    this.signalStrengthBarsHealthPolicy.update(connectionHealthData);
    const signalStrengthBarsValue = this.signalStrengthBarsHealthPolicy.healthIfChanged();
    if (signalStrengthBarsValue !== null) {
      this.logger.info(`signal strength bars health is now: ${signalStrengthBarsValue}`);
    }
  }

  handleSignalingClientEvent(event: SignalingClientEvent): void {
    if (event.type !== SignalingClientEventType.ReceivedSignalFrame) {
      return;
    }

    const status = MeetingSessionStatus.fromSignalFrame(event.message);
    if (status.statusCode() !== MeetingSessionStatusCode.OK) {
      this.context.audioVideoController.handleMeetingSessionStatus(status);
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
      new MeetingSessionStatus(MeetingSessionStatusCode.RealtimeApiFailed)
    );
  };
}
