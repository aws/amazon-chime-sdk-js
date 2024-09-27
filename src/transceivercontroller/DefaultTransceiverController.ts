// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioProfile from '../audioprofile/AudioProfile';
import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import RedundantAudioRecoveryMetricReport from '../clientmetricreport/RedundantAudioRecoveryMetricReport';
import Logger from '../logger/Logger';
import RedundantAudioEncoder from '../redundantaudioencoder/RedundantAudioEncoder';
import RedundantAudioEncoderWorkerCode from '../redundantaudioencoderworkercode/RedundantAudioEncoderWorkerCode';
import RedundantAudioRecoveryMetricsObserver from '../redundantaudiorecoverymetricsobserver/RedundantAudioRecoveryMetricsObserver';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import TransceiverController from './TransceiverController';

export default class DefaultTransceiverController
  implements TransceiverController, AudioVideoObserver {
  protected _localCameraTransceiver: RTCRtpTransceiver | null = null;
  protected _localAudioTransceiver: RTCRtpTransceiver | null = null;
  protected videoSubscriptions: number[] = [];
  protected defaultMediaStream: MediaStream | null = null;
  protected peer: RTCPeerConnection | null = null;
  protected streamIdToTransceiver: Map<number, RTCRtpTransceiver> = new Map();
  protected groupIdToTransceiver: Map<number, RTCRtpTransceiver> = new Map();
  private audioRedWorker: Worker | null = null;
  private audioRedWorkerURL: string | null = null;
  private audioMetricsHistory: Array<{
    timestampMs: number;
    totalPacketsSent: number;
    totalPacketsLost: number;
  }> = new Array();
  private redMetricsObservers: Set<RedundantAudioRecoveryMetricsObserver> = new Set<
    RedundantAudioRecoveryMetricsObserver
  >();
  private audioRedEnabled: boolean;
  private currentNumRedundantEncodings: number = 0;
  private lastRedHolddownTimerStartTimestampMs: number = 0;
  private lastHighPacketLossEventTimestampMs: number = 0;
  private lastAudioRedTurnOffTimestampMs: number = 0;
  private readonly maxAudioMetricsHistory: number = 20;
  private readonly audioRedPacketLossShortEvalPeriodMs = 5 * 1000; // 5s
  private readonly audioRedPacketLossLongEvalPeriodMs = 15 * 1000; // 15s
  private readonly audioRedHoldDownTimeMs: number = 5 * 60 * 1000; // 5m
  private readonly redRecoveryTimeMs: number = 1 * 60 * 1000; // 1m

  constructor(
    protected logger: Logger,
    protected browserBehavior: BrowserBehavior,
    protected meetingSessionContext?: AudioVideoControllerState
  ) {}

  async setEncodingParameters(
    encodingParamMap: Map<string, RTCRtpEncodingParameters>
  ): Promise<void> {
    if (!this._localCameraTransceiver || this._localCameraTransceiver.direction !== 'sendrecv') {
      return;
    }

    const sender = this._localCameraTransceiver.sender;
    if (!encodingParamMap || encodingParamMap.size === 0) {
      return;
    }
    const newEncodingParams = Array.from(encodingParamMap.values());

    const oldParam: RTCRtpSendParameters = sender.getParameters();
    if (!oldParam.encodings || oldParam.encodings.length === 0) {
      oldParam.encodings = newEncodingParams;
    } else {
      for (const existing of oldParam.encodings) {
        for (const changed of newEncodingParams) {
          if ((existing.rid || changed.rid) && existing.rid !== changed.rid) {
            continue;
          }
          let key: keyof RTCRtpEncodingParameters;
          for (key in changed) {
            // These properties can't be changed.
            if (key === 'rid' || key === 'codecPayloadType') {
              continue;
            }
            /* istanbul ignore else */
            if (changed.hasOwnProperty(key)) {
              (existing[key] as RTCRtpEncodingParameters[keyof RTCRtpEncodingParameters]) = changed[
                key
              ];
            }
          }
        }
      }
    }

    await sender.setParameters(oldParam);
  }

  localAudioTransceiver(): RTCRtpTransceiver {
    return this._localAudioTransceiver;
  }

  localVideoTransceiver(): RTCRtpTransceiver {
    return this._localCameraTransceiver;
  }

  async setVideoSendingBitrateKbps(bitrateKbps: number): Promise<void> {
    if (!this._localCameraTransceiver || this._localCameraTransceiver.direction !== 'sendrecv') {
      return;
    }
    const sender: RTCRtpSender = this._localCameraTransceiver.sender;
    if (!sender || bitrateKbps <= 0) {
      return;
    }
    const param: RTCRtpSendParameters = sender.getParameters();
    if (!param.encodings) {
      param.encodings = [{}];
    }
    for (const encodeParam of param.encodings) {
      encodeParam.maxBitrate = bitrateKbps * 1000;
    }
    await sender.setParameters(param);
  }

  setPeer(peer: RTCPeerConnection): void {
    this.peer = peer;
  }

  reset(): void {
    this.destroyAudioRedWorkerAndStates();
    this._localCameraTransceiver = null;
    this._localAudioTransceiver = null;
    this.videoSubscriptions = [];
    this.defaultMediaStream = null;
    this.peer = null;
  }

  useTransceivers(): boolean {
    return !!this.peer && typeof this.peer.getTransceivers !== 'undefined';
  }

  hasVideoInput(): boolean {
    if (!this._localCameraTransceiver || this._localCameraTransceiver.direction !== 'sendrecv')
      return false;

    return true;
  }

  trackIsVideoInput(track: MediaStreamTrack): boolean {
    if (!this._localCameraTransceiver) {
      return false;
    }
    return (
      track === this._localCameraTransceiver.sender.track ||
      track === this._localCameraTransceiver.receiver.track
    );
  }

  setupLocalTransceivers(): void {
    if (!this.useTransceivers()) {
      return;
    }

    if (!this.defaultMediaStream && typeof MediaStream !== 'undefined') {
      this.defaultMediaStream = new MediaStream();
    }

    if (!this._localAudioTransceiver) {
      this._localAudioTransceiver = this.peer.addTransceiver('audio', {
        direction: 'inactive',
        streams: [this.defaultMediaStream],
      });

      if (this.meetingSessionContext?.audioProfile?.hasRedundancyEnabled()) {
        // This will perform additional necessary setup for the audio transceiver.
        this.setupAudioRedWorker();
      }
    }

    if (!this._localCameraTransceiver) {
      this._localCameraTransceiver = this.addTransceiver('video', {
        direction: 'inactive',
        streams: [this.defaultMediaStream],
      });
    }
  }

  async replaceAudioTrack(track: MediaStreamTrack): Promise<boolean> {
    if (!this._localAudioTransceiver || this._localAudioTransceiver.direction !== 'sendrecv') {
      this.logger.info(`audio transceiver direction is not set up or not activated`);
      return false;
    }
    await this._localAudioTransceiver.sender.replaceTrack(track);
    return true;
  }

  async setAudioInput(track: MediaStreamTrack | null): Promise<void> {
    await this.setTransceiverInput(this._localAudioTransceiver, track);
    return;
  }

  async setVideoInput(track: MediaStreamTrack | null): Promise<void> {
    await this.setTransceiverInput(this._localCameraTransceiver, track);
    return;
  }

  updateVideoTransceivers(
    videoStreamIndex: VideoStreamIndex,
    videosToReceive: VideoStreamIdSet
  ): number[] {
    if (!this.useTransceivers()) {
      return videosToReceive.array();
    }

    // See https://blog.mozilla.org/webrtc/rtcrtptransceiver-explored/ for details on transceivers
    const transceivers: RTCRtpTransceiver[] = this.peer.getTransceivers();

    // Subscription index 0 is reserved for transmitting camera.
    // We mark inactive slots with 0 in the subscription array.
    this.videoSubscriptions = [0];
    videosToReceive = videosToReceive.clone();
    this.updateTransceivers(transceivers, videoStreamIndex, videosToReceive);
    this.logger.debug(() => {
      return this.debugDumpTransceivers();
    });
    return this.videoSubscriptions;
  }

  private updateTransceivers(
    transceivers: RTCRtpTransceiver[],
    videoStreamIndex: VideoStreamIndex,
    videosToReceive: VideoStreamIdSet
  ): void {
    const videosRemaining = videosToReceive.array();
    if (transceivers.length !== 0 && !transceivers[0].stop) {
      // This function and its usage can be removed once we raise Chrome browser requirements
      // to M88 (when `RTCRtpTransceiver.stop` was added)
      this.logger.info('Updating transceivers without `stop` function');
      this.updateTransceiverWithoutStop(transceivers, videoStreamIndex, videosRemaining);
    } else if (transceivers.length !== 0) {
      this.updateTransceiverWithStop(transceivers, videoStreamIndex, videosRemaining);
    }

    // Add transceivers for the remaining subscriptions
    for (const index of videosRemaining) {
      // @ts-ignore
      const transceiver = this.addTransceiver('video', {
        direction: 'recvonly',
        streams: [new MediaStream()],
      });
      this.streamIdToTransceiver.set(index, transceiver);
      this.groupIdToTransceiver.set(videoStreamIndex.groupIdForStreamId(index), transceiver);
      this.videoSubscriptions.push(index);
      this.logger.info(
        `adding transceiver mid: ${transceiver.mid} subscription: ${index} direction: recvonly`
      );
    }
  }

  private updateTransceiverWithStop(
    transceivers: RTCRtpTransceiver[],
    videoStreamIndex: VideoStreamIndex,
    videosRemaining: number[]
  ): void {
    // Begin counting out index in the the subscription array at 1 since the camera.
    // Always occupies position 0 (whether active or not).
    let n = 1;
    // Reset since otherwise there will be stale indexes corresponding to
    // stopped transceivers.
    this.videoSubscriptions = [0];

    for (const transceiver of transceivers) {
      if (
        transceiver === this._localCameraTransceiver ||
        !this.transceiverIsVideo(transceiver) ||
        !transceiver.mid
      ) {
        continue;
      }

      let reusingTranceiver = false;
      // See if we want this existing transceiver for a simulcast stream switch
      //
      // By convention with the service backend, msid is equal to the media section mid, prefixed with the string "v_";
      // we use this to get the stream ID for the track
      const streamId = videoStreamIndex.streamIdForTrack('v_' + transceiver.mid);
      if (transceiver.direction !== 'inactive' && streamId !== undefined) {
        for (const [index, recvStreamId] of videosRemaining.entries()) {
          // `streamId` may still be the same as `recvStreamId`
          if (videoStreamIndex.StreamIdsInSameGroup(streamId, recvStreamId)) {
            transceiver.direction = 'recvonly';
            this.videoSubscriptions[n] = recvStreamId;
            reusingTranceiver = true;

            this.streamIdToTransceiver.delete(streamId);
            this.streamIdToTransceiver.set(recvStreamId, transceiver);
            videosRemaining.splice(index, 1);
            break;
          }
        }
      }

      if (!reusingTranceiver) {
        this.videoSubscriptions[n] = 0;
        this.logger.info(
          `Stopping MID: ${transceiver.mid}, direction: ${transceiver.direction}, current direction: ${transceiver.currentDirection}`
        );
        // Clean up transceiver and mappings for streams that have been unsubscribed from.  Note we do not try to reuse
        // old inactive transceivers for new streams as Firefox will reuse the last frame from
        // that transceiver, and additionally we simply don't want to risk wiring up a transceiver
        // to the incorrect video stream for no real benefit besides possible a smaller SDP size.
        transceiver.stop(); // Note (as of Firefox 94): Firefox will keep these around forever
        for (const [streamId, previousTransceiver] of this.streamIdToTransceiver.entries()) {
          if (transceiver.mid === previousTransceiver.mid) {
            this.streamIdToTransceiver.delete(streamId);
            this.groupIdToTransceiver.delete(videoStreamIndex.groupIdForStreamId(streamId));
          }
        }
      }
      n += 1;
    }
  }

  // This function operates similarily to `updateTransceiverWithStop` with the following changes to account
  // for the fact RTCRtpTransceiver.stop is not available on all supported browsers:
  //  * We attempt to reuse inactive transceivers because libwebrtc will not remove them otherwise and
  //    the SDP will grow endlessly.
  //  * We mark unsubscribed transceivers as 'inactive' so that they can be reused. This requires using a
  //    second for loop.
  private updateTransceiverWithoutStop(
    transceivers: RTCRtpTransceiver[],
    videoStreamIndex: VideoStreamIndex,
    videosRemaining: number[]
  ): void {
    let n = 1;
    for (const transceiver of transceivers) {
      if (transceiver === this._localCameraTransceiver || !this.transceiverIsVideo(transceiver)) {
        continue;
      }
      this.videoSubscriptions[n] = 0;
      if (transceiver.direction !== 'inactive') {
        const streamId = videoStreamIndex.streamIdForTrack('v_' + transceiver.mid);
        if (streamId !== undefined) {
          for (const [index, recvStreamId] of videosRemaining.entries()) {
            if (videoStreamIndex.StreamIdsInSameGroup(streamId, recvStreamId)) {
              transceiver.direction = 'recvonly';
              this.videoSubscriptions[n] = recvStreamId;

              this.streamIdToTransceiver.delete(streamId);
              this.streamIdToTransceiver.set(recvStreamId, transceiver);
              videosRemaining.splice(index, 1);
              break;
            }
          }
        }
      }
      n += 1;
    }

    // Next fill in open slots and remove unused
    n = 1;
    for (const transceiver of transceivers) {
      if (transceiver === this._localCameraTransceiver || !this.transceiverIsVideo(transceiver)) {
        continue;
      }

      if (transceiver.direction === 'inactive' && videosRemaining.length > 0) {
        // Fill available slot
        transceiver.direction = 'recvonly';
        const streamId = videosRemaining.shift();
        this.videoSubscriptions[n] = streamId;
        this.streamIdToTransceiver.set(streamId, transceiver);
        this.groupIdToTransceiver.set(videoStreamIndex.groupIdForStreamId(streamId), transceiver);
      } else {
        // Remove if no longer subscribed
        if (this.videoSubscriptions[n] === 0) {
          transceiver.direction = 'inactive';
          for (const [streamId, previousTransceiver] of this.streamIdToTransceiver.entries()) {
            if (transceiver === previousTransceiver) {
              this.streamIdToTransceiver.delete(streamId);
              this.groupIdToTransceiver.delete(videoStreamIndex.groupIdForStreamId(streamId));
            }
          }
        }
      }
      n += 1;
    }
  }

  getMidForStreamId(streamId: number): string | undefined {
    return this.streamIdToTransceiver.get(streamId)?.mid;
  }

  setStreamIdForMid(mid: string, newStreamId: number): void {
    for (const [streamId, transceiver] of this.streamIdToTransceiver.entries()) {
      if (transceiver.mid === mid) {
        this.streamIdToTransceiver.delete(streamId);
        this.streamIdToTransceiver.set(newStreamId, transceiver);
        return;
      }
    }
  }

  getMidForGroupId(groupId: number): string | undefined {
    return this.groupIdToTransceiver.get(groupId)?.mid ?? undefined;
  }

  protected transceiverIsVideo(transceiver: RTCRtpTransceiver): boolean {
    return (
      (transceiver.receiver &&
        transceiver.receiver.track &&
        transceiver.receiver.track.kind === 'video') ||
      (transceiver.sender && transceiver.sender.track && transceiver.sender.track.kind === 'video')
    );
  }

  private debugDumpTransceivers(): string {
    let msg = '';
    let n = 0;

    for (const transceiver of this.peer.getTransceivers()) {
      if (!this.transceiverIsVideo(transceiver)) {
        continue;
      }
      msg += `transceiver index=${n} mid=${transceiver.mid} subscription=${this.videoSubscriptions[n]} direction=${transceiver.direction}\n`;
      n += 1;
    }
    return msg;
  }

  private async setTransceiverInput(
    transceiver: RTCRtpTransceiver | null,
    track: MediaStreamTrack
  ): Promise<void> {
    if (!transceiver) {
      return;
    }

    if (track) {
      transceiver.direction = 'sendrecv';
    } else {
      transceiver.direction = 'inactive';
    }

    await transceiver.sender.replaceTrack(track);
  }

  private forEachRedMetricsObserver(redMetricReport: RedundantAudioRecoveryMetricReport): void {
    for (const observer of this.redMetricsObservers) {
      AsyncScheduler.nextTick(() => {
        /* istanbul ignore else */
        // Since this executes asynchronously, we need to check if the observer has not been removed.
        if (this.redMetricsObservers.has(observer)) {
          observer.recoveryMetricsDidReceive(redMetricReport);
        }
      });
    }
  }

  private disableAudioRedundancy(): void {
    // Reset the audio profile with the configured bitrate and force redundancy to be false.
    this.meetingSessionContext.audioProfile = new AudioProfile(
      this.meetingSessionContext.audioProfile.audioBitrateBps,
      false
    );
    this.meetingSessionContext.audioVideoController.setAudioProfile(
      this.meetingSessionContext.audioProfile
    );
  }

  protected setupAudioRedWorker(): void {
    // @ts-ignore
    const supportsRTCScriptTransform = !!window.RTCRtpScriptTransform;
    // @ts-ignore
    const supportsInsertableStreams = !!RTCRtpSender.prototype.createEncodedStreams;

    if (supportsRTCScriptTransform) {
      // This is the prefered approach according to
      // https://github.com/w3c/webrtc-encoded-transform/blob/main/explainer.md.
      this.logger.info(
        '[AudioRed] Supports encoded insertable streams using RTCRtpScriptTransform'
      );
    } else if (supportsInsertableStreams) {
      this.logger.info('[AudioRed] Supports encoded insertable streams using TransformStream');
    } else {
      this.disableAudioRedundancy();
      // We need to recreate the peer connection without encodedInsertableStreams in the
      // peer connection config otherwise we would need to create pass through transforms
      // for all media streams. Throwing the error here and having AttackMediaInputTask throw the
      // error again will result in a full reconnect.
      throw new Error(
        '[AudioRed] Encoded insertable streams not supported. Recreating peer connection with audio redundancy disabled.'
      );
    }

    // Run the entire redundant audio worker setup in a `try` block to allow any errors to trigger a reconnect with
    // audio redundancy disabled.
    try {
      this.audioRedWorkerURL = URL.createObjectURL(
        new Blob([RedundantAudioEncoderWorkerCode], {
          type: 'application/javascript',
        })
      );
      this.logger.info(`[AudioRed] Redundant audio worker URL ${this.audioRedWorkerURL}`);
      this.audioRedWorker = new Worker(this.audioRedWorkerURL);
    } catch (error) {
      this.logger.error(`[AudioRed] Unable to create audio red worker due to ${error}`);
      URL.revokeObjectURL(this.audioRedWorkerURL);
      this.audioRedWorkerURL = null;
      this.audioRedWorker = null;

      this.disableAudioRedundancy();
      this.logger.info(`[AudioRed] Recreating peer connection with audio redundancy disabled`);

      // We need to recreate the peer connection without encodedInsertableStreams in the
      // peer connection config otherwise we would need to create pass through transforms
      // for all media streams. Throwing the error here and having AttackMediaInputTask throw the
      // error again will result in a full reconnect.
      throw error;
    }
    this.audioRedEnabled = true;

    // We cannot use console.log in production code and we cannot
    // transfer the logger object so we need the worker to post messages
    // to the main thread for logging
    this.audioRedWorker.onmessage = (event: MessageEvent) => {
      /* istanbul ignore else */
      if (event.data.type === 'REDWorkerLog') {
        this.logger.info(event.data.log);
      } /* istanbul ignore next */ else if (event.data.type === 'RedundantAudioEncoderStats') {
        const redMetricReport = new RedundantAudioRecoveryMetricReport();
        redMetricReport.currentTimestampMs = Date.now();
        redMetricReport.ssrc = event.data.ssrc;
        redMetricReport.totalAudioPacketsLost = event.data.totalAudioPacketsLost;
        redMetricReport.totalAudioPacketsExpected = event.data.totalAudioPacketsExpected;
        redMetricReport.totalAudioPacketsRecoveredRed = event.data.totalAudioPacketsRecoveredRed;
        redMetricReport.totalAudioPacketsRecoveredFec = event.data.totalAudioPacketsRecoveredFec;
        this.forEachRedMetricsObserver(redMetricReport);
      }
    };

    if (supportsRTCScriptTransform) {
      // @ts-ignore
      this._localAudioTransceiver.sender.transform = new RTCRtpScriptTransform(
        this.audioRedWorker,
        { type: 'SenderTransform' }
      );
      // @ts-ignore
      this._localAudioTransceiver.receiver.transform = new RTCRtpScriptTransform(
        this.audioRedWorker,
        { type: 'ReceiverTransform' }
      );
      // eslint-disable-next-line
    } else /* istanbul ignore else */ if (supportsInsertableStreams) {
      // @ts-ignore
      const sendStreams = this._localAudioTransceiver.sender.createEncodedStreams();
      // @ts-ignore
      const receiveStreams = this._localAudioTransceiver.receiver.createEncodedStreams();
      this.audioRedWorker.postMessage(
        {
          msgType: 'StartRedWorker',
          send: sendStreams,
          receive: receiveStreams,
        },
        [
          sendStreams.readable,
          sendStreams.writable,
          receiveStreams.readable,
          receiveStreams.writable,
        ]
      );
    }
    /* istanbul ignore next */
    this.meetingSessionContext?.audioVideoController.addObserver(this);
    /* istanbul ignore next */
    this.addRedundantAudioRecoveryMetricsObserver(this.meetingSessionContext?.statsCollector);
  }

  /**
   * Adds a transceiver to the peer connection and performs additional necessary setup.
   */
  protected addTransceiver(
    trackOrKind: string | MediaStreamTrack,
    init?: RTCRtpTransceiverInit
  ): RTCRtpTransceiver {
    const transceiver = this.peer.addTransceiver(trackOrKind, init);

    // @ts-ignore
    // Transforms need to be setup for every transceiver to allow media flow for the given transceiver if WebRTC Encoded
    // Transform (https://github.com/w3c/webrtc-encoded-transform/blob/main/explainer.md) is used.
    if (!this.peer.getConfiguration()?.encodedInsertableStreams || !this.audioRedWorker)
      return transceiver;

    // @ts-ignore
    const supportsRTCScriptTransform = !!window.RTCRtpScriptTransform;
    // @ts-ignore
    const supportsInsertableStreams = !!RTCRtpSender.prototype.createEncodedStreams;

    if (supportsRTCScriptTransform) {
      // @ts-ignore
      transceiver.sender.transform = new RTCRtpScriptTransform(this.audioRedWorker, {
        type: 'PassthroughTransform',
      });
      // @ts-ignore
      transceiver.receiver.transform = new RTCRtpScriptTransform(this.audioRedWorker, {
        type: 'PassthroughTransform',
      });
      // eslint-disable-next-line
    } else /* istanbul ignore else */ if (supportsInsertableStreams) {
      // @ts-ignore
      const sendStreams = transceiver.sender.createEncodedStreams();
      // @ts-ignore
      const receiveStreams = transceiver.receiver.createEncodedStreams();
      this.audioRedWorker.postMessage(
        {
          msgType: 'PassthroughTransform',
          send: sendStreams,
          receive: receiveStreams,
        },
        [
          sendStreams.readable,
          sendStreams.writable,
          receiveStreams.readable,
          receiveStreams.writable,
        ]
      );
    }

    return transceiver;
  }

  private destroyAudioRedWorkerAndStates(): void {
    if (this.audioRedWorker) {
      URL.revokeObjectURL(this.audioRedWorkerURL);
      this.audioRedWorkerURL = null;
      this.audioRedWorker.terminate()
      this.audioRedWorker = null;
      this.currentNumRedundantEncodings = 0;
      this.lastRedHolddownTimerStartTimestampMs = 0;
      this.lastAudioRedTurnOffTimestampMs = 0;
      this.lastHighPacketLossEventTimestampMs = 0;
      this.audioRedEnabled = true;
      /* istanbul ignore next */
      this.meetingSessionContext?.audioVideoController.removeObserver(this);
      /* istanbul ignore next */
      this.removeRedundantAudioRecoveryMetricsObserver(this.meetingSessionContext?.statsCollector);
    }
  }

  setAudioPayloadTypes(payloadTypeMap: Map<string, number>): void {
    if (this.audioRedWorker) {
      this.audioRedWorker.postMessage({
        msgType: 'RedPayloadType',
        payloadType: payloadTypeMap.get('red'),
      });

      this.audioRedWorker.postMessage({
        msgType: 'OpusPayloadType',
        payloadType: payloadTypeMap.get('opus'),
      });
    }
  }

  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    const { currentTimestampMs } = clientMetricReport;
    const rtcStatsReport = clientMetricReport.getRTCStatsReport();
    let receiverReportReceptionTimestampMs: number = 0;
    let currentTotalPacketsSent: number = 0;
    let currentTotalPacketsLost: number = 0;

    rtcStatsReport.forEach(report => {
      /* istanbul ignore else */
      if (report.kind === 'audio') {
        /* istanbul ignore else */
        if (report.type === 'outbound-rtp') {
          currentTotalPacketsSent = report.packetsSent;
        } /* istanbul ignore else */ else if (report.type === 'remote-inbound-rtp') {
          // Use the timestamp that the receiver report was received on the client side to get a more accurate time
          // interval for the metrics.
          receiverReportReceptionTimestampMs = report.timestamp;
          currentTotalPacketsLost = report.packetsLost;
        }
      }
    });

    // Since the timestamp from the server side is only updated when a new receiver report is generated, only add
    // metrics with new timestamps to our metrics history.
    //
    // Also, make sure that the total packets sent is greater than the most recent value in the history before consuming
    // to avoid divide-by-zero while calculating uplink loss percent.
    if (
      this.audioMetricsHistory.length === 0 ||
      (receiverReportReceptionTimestampMs >
        this.audioMetricsHistory[this.audioMetricsHistory.length - 1].timestampMs &&
        currentTotalPacketsSent >
          this.audioMetricsHistory[this.audioMetricsHistory.length - 1].totalPacketsSent)
    ) {
      // Note that although the total packets sent is updated anytime we get the WebRTC stats, we are only adding a new
      // metric for total packets sent when we receive a new receiver report. We only care about the total packets that
      // the server was expected to receive at the time that the latest `packetsLost` metric was calculated in order to
      // do our uplink loss calculation. Therefore, we only record the total packets sent when we receive a new receiver
      // report, which will give us an estimate of the number of packets that the server was supposed to receive at the
      // time when the latest `packetsLost` metric was calculated.
      this.audioMetricsHistory.push({
        timestampMs: receiverReportReceptionTimestampMs,
        totalPacketsSent: currentTotalPacketsSent,
        totalPacketsLost: currentTotalPacketsLost,
      });
    }

    // Remove the oldest metric report from our list
    if (this.audioMetricsHistory.length > this.maxAudioMetricsHistory) {
      this.audioMetricsHistory.shift();
    }

    // As the minimum RTCP frequency is about 1 every 5 seconds,
    // we are limited to using a minimum timewindow of 5 seconds.
    // This is because the cumulative packetsLost metric remains
    // the same for 5 consecutive client metric reports.
    const lossPercent5sTimewindow = this.lossPercent(this.audioRedPacketLossShortEvalPeriodMs);
    const lossPercent15sTimewindow = this.lossPercent(this.audioRedPacketLossLongEvalPeriodMs);

    // Taking the max loss percent between a short and long time window will allow
    // us to increase the number of encodings fast but will slowly decrease the
    // number of encodings on loss recovery.
    const maxLossPercent = Math.max(lossPercent5sTimewindow, lossPercent15sTimewindow);

    const [
      newNumRedundantEncodings,
      shouldTurnOffRed,
    ] = RedundantAudioEncoder.getNumRedundantEncodingsForPacketLoss(maxLossPercent);

    if (shouldTurnOffRed) {
      this.lastHighPacketLossEventTimestampMs = currentTimestampMs;
      /* istanbul ignore next */
      if (this.audioRedEnabled) {
        if (this.audioRedWorker) {
          this.audioRedWorker.postMessage({
            msgType: 'Disable',
          });
        }
        this.audioRedEnabled = false;
        this.lastAudioRedTurnOffTimestampMs = currentTimestampMs;
      }
      return;
    } else if (!this.audioRedEnabled) {
      const timeSinceRedOff = currentTimestampMs - this.lastAudioRedTurnOffTimestampMs;
      const timeSinceLastHighPacketLossEvent =
        currentTimestampMs - this.lastHighPacketLossEventTimestampMs;
      if (
        timeSinceRedOff >= this.audioRedPacketLossLongEvalPeriodMs &&
        timeSinceLastHighPacketLossEvent < this.redRecoveryTimeMs
      ) {
        // This is probably not a transient high packet loss spike.
        // We need to turn off RED for awhile to avoid congestion collapse.
        return;
      } else {
        // Enable red as we've completed the recovery wait time.
        /* istanbul ignore next */
        if (this.audioRedWorker) {
          this.audioRedWorker.postMessage({
            msgType: 'Enable',
          });
        }
        this.audioRedEnabled = true;
        this.maybeResetHoldDownTimer(currentTimestampMs);
      }
    }

    if (this.shouldUpdateAudioRedWorkerEncodings(currentTimestampMs, newNumRedundantEncodings)) {
      /* istanbul ignore next */
      if (this.audioRedWorker) {
        this.audioRedWorker.postMessage({
          msgType: 'UpdateNumRedundantEncodings',
          numRedundantEncodings: newNumRedundantEncodings,
        });
      }
    }
  }

  private maybeResetHoldDownTimer(currentTimestampMs: number): void {
    if (this.currentNumRedundantEncodings > 0) {
      this.lastRedHolddownTimerStartTimestampMs = currentTimestampMs;
    }
  }

  private lossPercent(timeWindowMs: number): number {
    if (this.audioMetricsHistory.length < 2) {
      return 0;
    }
    const latestReceiverReportTimestampMs: number = this.audioMetricsHistory[
      this.audioMetricsHistory.length - 1
    ].timestampMs;
    const currentTotalPacketsSent: number = this.audioMetricsHistory[
      this.audioMetricsHistory.length - 1
    ].totalPacketsSent;
    const currentTotalPacketsLost: number = this.audioMetricsHistory[
      this.audioMetricsHistory.length - 1
    ].totalPacketsLost;

    // Iterate backwards in the metrics history, from the report immediately preceeding
    // the latest one, until we find the first metric report whose timestamp differs
    // from the latest report by atleast timeWindowMs
    for (let i = this.audioMetricsHistory.length - 2; i >= 0; i--) {
      if (
        latestReceiverReportTimestampMs - this.audioMetricsHistory[i].timestampMs >=
        timeWindowMs
      ) {
        const lossDelta = currentTotalPacketsLost - this.audioMetricsHistory[i].totalPacketsLost;
        const sentDelta = currentTotalPacketsSent - this.audioMetricsHistory[i].totalPacketsSent;
        const lossPercent = 100 * (lossDelta / sentDelta);
        return Math.max(0, Math.min(lossPercent, 100));
      }
    }
    // If we are here, we don't have enough entries in history
    // to calculate the loss for the given time window
    return 0;
  }

  private shouldUpdateAudioRedWorkerEncodings(
    currentTimestampMs: number,
    newNumRedundantEncodings: number
  ): boolean {
    // If newNumRedundantEncodings is the same as the current
    // then we don't need to send a message to the red worker.
    if (this.currentNumRedundantEncodings === newNumRedundantEncodings) {
      this.maybeResetHoldDownTimer(currentTimestampMs);
      return false;
    }
    // If newNumRedundantEncodings is less than the current
    // check if we've cleared the hold down time and only
    // then allow the update to be sent to the red worker
    if (
      newNumRedundantEncodings < this.currentNumRedundantEncodings &&
      currentTimestampMs - this.lastRedHolddownTimerStartTimestampMs < this.audioRedHoldDownTimeMs
    ) {
      return false;
    }
    this.currentNumRedundantEncodings = newNumRedundantEncodings;
    this.maybeResetHoldDownTimer(currentTimestampMs);
    return true;
  }

  addRedundantAudioRecoveryMetricsObserver(observer: RedundantAudioRecoveryMetricsObserver): void {
    this.redMetricsObservers.add(observer);
  }

  removeRedundantAudioRecoveryMetricsObserver(
    observer: RedundantAudioRecoveryMetricsObserver
  ): void {
    this.redMetricsObservers.delete(observer);
  }
}
