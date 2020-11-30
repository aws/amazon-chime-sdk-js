// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import Logger from '../logger/Logger';
import DefaultTransceiverController from './DefaultTransceiverController';

export default class SimulcastTransceiverController extends DefaultTransceiverController {
  static readonly LOW_LEVEL_NAME: string = 'low';
  static readonly MID_LEVEL_NAME: string = 'mid';
  static readonly HIGH_LEVEL_NAME: string = 'hi';
  static readonly NAME_ARR_ASCENDING = ['low', 'mid', 'hi'];
  static readonly BITRATE_ARR_ASCENDING = [200, 400, 1100];
  private videoQualityControlParameterMap: Map<string, RTCRtpEncodingParameters> = new Map<
    string,
    RTCRtpEncodingParameters
  >();

  constructor(logger: Logger, browserBehavior: BrowserBehavior) {
    super(logger, browserBehavior);
    let scale = 4;
    for (let i = 0; i < SimulcastTransceiverController.NAME_ARR_ASCENDING.length; i++) {
      const ridName = SimulcastTransceiverController.NAME_ARR_ASCENDING[i];
      this.videoQualityControlParameterMap.set(ridName, {
        rid: ridName,
        scaleResolutionDownBy: scale,
        maxBitrate: SimulcastTransceiverController.BITRATE_ARR_ASCENDING[i] * 1000,
      });
      scale = scale / 2;
    }
  }

  async setEncodingParameters(
    encodingParamMap: Map<string, RTCRtpEncodingParameters>
  ): Promise<void> {
    if (!this._localCameraTransceiver || this._localCameraTransceiver.direction !== 'sendrecv') {
      return;
    }

    const sender = this._localCameraTransceiver.sender;
    const newEncodingParams = Array.from(encodingParamMap.values());
    if (newEncodingParams.length <= 0) {
      return;
    }

    const oldParam: RTCRtpSendParameters = sender.getParameters();
    if (!oldParam.encodings) {
      oldParam.encodings = newEncodingParams;
    } else {
      for (let i = 0; i < oldParam.encodings.length; i++) {
        if (oldParam.encodings[i].rid === SimulcastTransceiverController.LOW_LEVEL_NAME) {
          oldParam.encodings[i].maxBitrate = encodingParamMap.get(
            SimulcastTransceiverController.LOW_LEVEL_NAME
          ).maxBitrate;
          oldParam.encodings[i].active = encodingParamMap.get(
            SimulcastTransceiverController.LOW_LEVEL_NAME
          ).active;
        }
        if (oldParam.encodings[i].rid === SimulcastTransceiverController.MID_LEVEL_NAME) {
          oldParam.encodings[i].maxBitrate = encodingParamMap.get(
            SimulcastTransceiverController.MID_LEVEL_NAME
          ).maxBitrate;
          oldParam.encodings[i].active = encodingParamMap.get(
            SimulcastTransceiverController.MID_LEVEL_NAME
          ).active;
        }
        if (oldParam.encodings[i].rid === SimulcastTransceiverController.HIGH_LEVEL_NAME) {
          oldParam.encodings[i].maxBitrate = encodingParamMap.get(
            SimulcastTransceiverController.HIGH_LEVEL_NAME
          ).maxBitrate;
          oldParam.encodings[i].active = encodingParamMap.get(
            SimulcastTransceiverController.HIGH_LEVEL_NAME
          ).active;
        }
      }
    }

    await sender.setParameters(oldParam);

    this.logVideoTransceiverParameters();
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

  async setVideoSendingBitrateKbps(_bitrateKbps: number): Promise<void> {
    return;
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
      const encodingParams = Array.from(this.videoQualityControlParameterMap.values());
      this._localCameraTransceiver = this.peer.addTransceiver('video', {
        direction: 'inactive',
        streams: [this.defaultMediaStream],
        sendEncodings: encodingParams,
      });
    }
  }

  private logVideoTransceiverParameters(): void {
    const params = this._localCameraTransceiver.sender.getParameters();
    const encodings = params.encodings;
    let msg = 'simulcast: current encoding parameters \n';
    for (const encodingParam of encodings) {
      msg += `rid=${encodingParam.rid} maxBitrate=${encodingParam.maxBitrate} active=${encodingParam.active} \n`;
    }
    this.logger.info(msg);
  }
}
