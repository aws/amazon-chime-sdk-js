// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import Logger from '../logger/Logger';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import TransceiverController from './TransceiverController';

export default class DefaultTransceiverController implements TransceiverController {
  protected _localCameraTransceiver: RTCRtpTransceiver | null = null;
  protected _localAudioTransceiver: RTCRtpTransceiver | null = null;
  protected videoSubscriptions: number[] = [];
  protected defaultMediaStream: MediaStream | null = null;
  protected peer: RTCPeerConnection | null = null;
  protected streamIdToTransceiver: Map<number, RTCRtpTransceiver> = new Map();

  constructor(protected logger: Logger, protected browserBehavior: BrowserBehavior) {}

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

  static async setVideoSendingBitrateKbpsForSender(
    sender: RTCRtpSender,
    bitrateKbps: number,
    _logger: Logger
  ): Promise<void> {
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

  static async replaceAudioTrackForSender(
    sender: RTCRtpSender,
    track: MediaStreamTrack
  ): Promise<boolean> {
    if (!sender) {
      return false;
    }

    await sender.replaceTrack(track);
    return true;
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
    await DefaultTransceiverController.setVideoSendingBitrateKbpsForSender(
      sender,
      bitrateKbps,
      this.logger
    );
  }

  setPeer(peer: RTCPeerConnection): void {
    this.peer = peer;
  }

  reset(): void {
    this._localCameraTransceiver = null;
    this._localAudioTransceiver = null;
    this.videoSubscriptions = [];
    this.defaultMediaStream = null;
    this.peer = null;
  }

  useTransceivers(): boolean {
    if (!this.peer || !this.browserBehavior.requiresUnifiedPlan()) {
      return false;
    }

    return typeof this.peer.getTransceivers !== 'undefined';
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
    }

    if (!this._localCameraTransceiver) {
      this._localCameraTransceiver = this.peer.addTransceiver('video', {
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
      const transceiver = this.peer.addTransceiver('video', {
        direction: 'recvonly',
        streams: [new MediaStream()],
      });
      this.streamIdToTransceiver.set(index, transceiver);
      this.videoSubscriptions.push(index);
      this.logger.info(
        `adding transceiver mid: ${transceiver.mid} subscription: ${index} direction: recvonly`
      );
    }

    this.logger.info(`returning direction: blah ${this.videoSubscriptions}`);
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
      this.logger.info(
        `Inspecting for MID: ${transceiver.mid}, direction: ${transceiver.direction}, current direction: ${transceiver.currentDirection}`
      );

      if (
        transceiver === this._localCameraTransceiver ||
        !this.transceiverIsVideo(transceiver) ||
        !transceiver.mid
      ) {
        continue;
      }
      this.logger.info(
        `Moving forwards with MID: ${transceiver.mid}, direction: ${transceiver.direction}, current direction: ${transceiver.currentDirection}`
      );

      let reusingTranceiver = false;
      // See if we want this existing transceiver
      // by convention with the video host, msid is equal to the media section mid, prefixed with the string "v_"
      // we use this to get the streamId for the track
      const streamId = videoStreamIndex.streamIdForTrack('v_' + transceiver.mid);
      if (transceiver.direction !== 'inactive' && streamId !== undefined) {
        for (const [index, recvStreamId] of videosRemaining.entries()) {
          // `streamId` may still be the same as `recvStreamId`
          if (videoStreamIndex.StreamIdsInSameGroup(streamId, recvStreamId)) {
            this.logger.info(
              `Found stream in same group ${streamId} ~= ${recvStreamId} MID: ${transceiver.mid}, direction: ${transceiver.direction}, current direction: ${transceiver.currentDirection}`
            );

            transceiver.direction = 'recvonly';
            this.videoSubscriptions[n] = recvStreamId;
            reusingTranceiver = true;

            this.streamIdToTransceiver.delete(streamId);
            this.streamIdToTransceiver.set(recvStreamId, transceiver);
            videosRemaining.splice(index, 1);
            break;
          }
        }
      } else {
        this.logger.info(
          `Could not find stream ID for MID: ${transceiver.mid}, direction: ${transceiver.direction}, current direction: ${transceiver.currentDirection}`
        );
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
      } else {
        // Remove if no longer subscribed
        if (this.videoSubscriptions[n] === 0) {
          transceiver.direction = 'inactive';
          for (const [streamId, previousTransceiver] of this.streamIdToTransceiver.entries()) {
            if (transceiver === previousTransceiver) {
              this.streamIdToTransceiver.delete(streamId);
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
}
