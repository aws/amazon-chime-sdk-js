// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import Logger from '../logger/Logger';
import SimulcastTransceiverController from './SimulcastTransceiverController';

export default class SimulcastContentShareTransceiverController extends SimulcastTransceiverController {
  static readonly NAME_ARR_ASCENDING = ['low', 'hi'];
  static readonly BITRATE_ARR_ASCENDING = [300, 1200];

  constructor(logger: Logger, browserBehavior: BrowserBehavior) {
    super(logger, browserBehavior);
    let scale = 2;
    this.videoQualityControlParameterMap = new Map<string, RTCRtpEncodingParameters>();
    for (let i = 0; i < SimulcastContentShareTransceiverController.NAME_ARR_ASCENDING.length; i++) {
      const ridName = SimulcastContentShareTransceiverController.NAME_ARR_ASCENDING[i];
      this.videoQualityControlParameterMap.set(ridName, {
        rid: ridName,
        scaleResolutionDownBy: scale,
        maxBitrate: SimulcastContentShareTransceiverController.BITRATE_ARR_ASCENDING[i] * 1000,
      });
      scale = scale / 2;
    }
  }

  // Note: `scaleResolutionDownBy` has only been tested with values 1, 2, and 4.
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
          this.copyEncodingParams(
            encodingParamMap.get(SimulcastTransceiverController.LOW_LEVEL_NAME),
            oldParam.encodings[i]
          );
        }
        if (oldParam.encodings[i].rid === SimulcastTransceiverController.HIGH_LEVEL_NAME) {
          this.copyEncodingParams(
            encodingParamMap.get(SimulcastTransceiverController.HIGH_LEVEL_NAME),
            oldParam.encodings[i]
          );
        }
      }
    }

    await sender.setParameters(oldParam);

    this.logVideoTransceiverParameters();
  }
}
