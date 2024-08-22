// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';
import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import Logger from '../logger/Logger';
import AutomaticVideoConfiguration from '../meetingsession/AutomaticVideoConfiguration';
import VideoCodecCapability from '../sdp/VideoCodecCapability';
import VideoUplinkTechnique from '../videouplinkbandwidthpolicy/VideoUplinkTechnique';
import DefaultTransceiverController from './DefaultTransceiverController';

export default class AutomaticTransceiverController extends DefaultTransceiverController {
  static readonly LOW_LEVEL_NAME: string = 'low';
  static readonly MID_LEVEL_NAME: string = 'mid';
  static readonly HIGH_LEVEL_NAME: string = 'hi';
  static readonly NAME_ARR_DECENDING = ['hi', 'mid', 'low'];
  static readonly BITRATE_ARR_ASCENDING = [1100, 400, 200];
  protected videoQualityControlParameterMap: Map<string, RTCRtpEncodingParameters> = new Map<
    string,
    RTCRtpEncodingParameters
  >();
  private videoEncodingTechniqueIndex = 0;

  constructor(
    logger: Logger,
    browserBehavior: BrowserBehavior,
    meetingSessionContext?: AudioVideoControllerState,
    private configuration?: AutomaticVideoConfiguration
  ) {
    super(logger, browserBehavior, meetingSessionContext);
    if (!this.configuration) {
      this.configuration = new AutomaticVideoConfiguration();
    }
    let scale = 1;
    if (!new DefaultBrowserBehavior().supportsScalableVideoCoding()) {
      // Remove SVC from the preferences if the browser does not support it.
      const svcIndex = this.configuration.videoEncodingTechniquePreferences.indexOf(
        VideoUplinkTechnique.ScalableVideoCoding
      );
      if (svcIndex >= 0) {
        this.configuration.videoEncodingTechniquePreferences.splice(svcIndex, 1);
      }
    }
    if (this.meetingSessionContext.videoUplinkBandwidthPolicy.setVideoUplinkTechnique) {
      this.meetingSessionContext.videoUplinkBandwidthPolicy.setVideoUplinkTechnique(
        this.configuration.videoEncodingTechniquePreferences[this.videoEncodingTechniqueIndex]
      );
    }
    for (let i = 0; i < AutomaticTransceiverController.NAME_ARR_DECENDING.length; i++) {
      const ridName = AutomaticTransceiverController.NAME_ARR_DECENDING[i];
      this.videoQualityControlParameterMap.set(ridName, {
        rid: ridName,
        scaleResolutionDownBy: scale,
        maxBitrate: AutomaticTransceiverController.BITRATE_ARR_ASCENDING[i] * 1000,
      });
      scale = scale * 2;
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
      for (const encoding of oldParam.encodings) {
        if (encoding.rid === AutomaticTransceiverController.LOW_LEVEL_NAME) {
          this.copyEncodingParams(
            encodingParamMap.get(AutomaticTransceiverController.LOW_LEVEL_NAME),
            encoding
          );
        }
        if (encoding.rid === AutomaticTransceiverController.MID_LEVEL_NAME) {
          this.copyEncodingParams(
            encodingParamMap.get(AutomaticTransceiverController.MID_LEVEL_NAME),
            encoding
          );
        }
        if (encoding.rid === AutomaticTransceiverController.HIGH_LEVEL_NAME) {
          this.copyEncodingParams(
            encodingParamMap.get(AutomaticTransceiverController.HIGH_LEVEL_NAME),
            encoding
          );
        }
      }
    }

    await sender.setParameters(oldParam);

    this.logVideoTransceiverParameters();
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

      if (this.meetingSessionContext?.audioProfile?.hasRedundancyEnabled()) {
        // This will perform additional necessary setup for the audio transceiver.
        this.setupAudioRedWorker();
      }
    }

    if (!this._localCameraTransceiver) {
      const encodingParams = Array.from(this.videoQualityControlParameterMap.values());
      this._localCameraTransceiver = this.addTransceiver('video', {
        direction: 'inactive',
        streams: [this.defaultMediaStream],
        sendEncodings: encodingParams,
      });
    }
  }

  protected logVideoTransceiverParameters(): void {
    const params = this._localCameraTransceiver.sender.getParameters();
    const encodings = params.encodings;
    let msg = 'simulcast: current encoding parameters \n';
    for (const encodingParam of encodings) {
      msg += `rid=${encodingParam.rid} maxBitrate=${encodingParam.maxBitrate} active=${encodingParam.active} scaleDownBy=${encodingParam.scaleResolutionDownBy} maxFrameRate = ${encodingParam.maxFramerate} \n`;
    }
    this.logger.info(msg);
  }

  protected copyEncodingParams(
    fromEncodingParams: RTCRtpEncodingParameters,
    toEncodingParams: RTCRtpEncodingParameters
  ): void {
    toEncodingParams.active = fromEncodingParams.active;
    toEncodingParams.maxBitrate = fromEncodingParams.maxBitrate;
    toEncodingParams.scaleResolutionDownBy = fromEncodingParams.scaleResolutionDownBy;
    toEncodingParams.maxFramerate = fromEncodingParams.maxFramerate;
    // @ts-ignore
    toEncodingParams.scalabilityMode = fromEncodingParams.scalabilityMode;
  }

  degradeVideoEncoding(cause: string): void {
    if (
      this.meetingSessionContext.prioritizedSendVideoCodecCapabilities !== undefined &&
      this.meetingSessionContext.prioritizedSendVideoCodecCapabilities.length > 1 &&
      !(
        this.meetingSessionContext.prioritizedSendVideoCodecCapabilities[0].equals(
          VideoCodecCapability.h264ConstrainedBaselineProfile()
        ) ||
        this.meetingSessionContext.prioritizedSendVideoCodecCapabilities[0].equals(
          VideoCodecCapability.vp8()
        )
      )
    ) {
      // We first try to downgrade the codec if there are alternative codecs available for the current video encoding technique.
      const newMeetingSupportedVideoSendCodecPreferences: VideoCodecCapability[] = this.supportedCodecsForVideoEncodeTechnique(
        this.configuration.videoEncodingTechniquePreferences[this.videoEncodingTechniqueIndex],
        this.meetingSessionContext.meetingSupportedVideoSendCodecPreferences
      );
      if (newMeetingSupportedVideoSendCodecPreferences.length > 0) {
        this.meetingSessionContext.logger.info(
          `Downgrading codec from ${this.meetingSessionContext.meetingSupportedVideoSendCodecPreferences[0].codecName} to ${newMeetingSupportedVideoSendCodecPreferences[0].codecName} due to ${cause}`
        );
        this.meetingSessionContext.degradedVideoSendCodecs.push(
          this.meetingSessionContext.meetingSupportedVideoSendCodecPreferences[0]
        );
        this.meetingSessionContext.meetingSupportedVideoSendCodecPreferences = newMeetingSupportedVideoSendCodecPreferences;

        if (
          this.meetingSessionContext.videoUplinkBandwidthPolicy.setMeetingSupportedVideoSendCodecs
        ) {
          this.meetingSessionContext.videoUplinkBandwidthPolicy.setMeetingSupportedVideoSendCodecs(
            this.meetingSessionContext.meetingSupportedVideoSendCodecPreferences,
            this.meetingSessionContext.videoSendCodecPreferences,
            this.meetingSessionContext.degradedVideoSendCodecs
          );
        }
        this.meetingSessionContext.audioVideoController.update({ needsRenegotiation: true });
      } else {
        this.degradeVideoEncodingTechinque();
      }
    } else {
      this.degradeVideoEncodingTechinque();
    }
  }

  private degradeVideoEncodingTechinque(): void {
    if (
      this.meetingSessionContext.videoUplinkBandwidthPolicy.setVideoUplinkTechnique &&
      this.videoEncodingTechniqueIndex + 1 <
        this.configuration.videoEncodingTechniquePreferences.length
    ) {
      this.meetingSessionContext.logger.info(
        `Degrading video encoding technique from ${
          this.configuration.videoEncodingTechniquePreferences[this.videoEncodingTechniqueIndex]
        } to ${
          this.configuration.videoEncodingTechniquePreferences[this.videoEncodingTechniqueIndex + 1]
        }`
      );
      const newMeetingSupportedVideoSendCodecPreferences = this.supportedCodecsForVideoEncodeTechnique(
        this.configuration.videoEncodingTechniquePreferences[this.videoEncodingTechniqueIndex + 1],
        this.meetingSessionContext.videoSendCodecPreferences
      );
      if (newMeetingSupportedVideoSendCodecPreferences.length === 0) {
        this.meetingSessionContext.logger.warn(
          `Degrading video encoding technique failed since there is no video codec to select.`
        );
        return;
      }
      this.videoEncodingTechniqueIndex += 1;

      // Reset the degraded video send codecs and set the new supported video send codec preferences.
      this.meetingSessionContext.degradedVideoSendCodecs = [];
      this.meetingSessionContext.meetingSupportedVideoSendCodecPreferences = newMeetingSupportedVideoSendCodecPreferences;
      this.meetingSessionContext.videoUplinkBandwidthPolicy.setVideoUplinkTechnique(
        this.configuration.videoEncodingTechniquePreferences[this.videoEncodingTechniqueIndex]
      );
      if (
        this.meetingSessionContext.videoUplinkBandwidthPolicy.setMeetingSupportedVideoSendCodecs
      ) {
        this.meetingSessionContext.videoUplinkBandwidthPolicy.setMeetingSupportedVideoSendCodecs(
          this.meetingSessionContext.meetingSupportedVideoSendCodecPreferences,
          this.meetingSessionContext.videoSendCodecPreferences,
          this.meetingSessionContext.degradedVideoSendCodecs
        );
      }
      this.meetingSessionContext.audioVideoController.update({ needsRenegotiation: true });
    }
  }

  private isVideoEncodeTechniqueSupported(
    codecName: string,
    technique: VideoUplinkTechnique
  ): boolean {
    switch (codecName) {
      case 'VP9':
        return true;
      case 'AV1':
        return true;
      default:
        return (
          technique === VideoUplinkTechnique.Simulcast ||
          technique === VideoUplinkTechnique.SingleCast
        );
    }
  }

  private supportedCodecsForVideoEncodeTechnique(
    technique: VideoUplinkTechnique,
    codecCandidates: VideoCodecCapability[]
  ): VideoCodecCapability[] {
    const supportedCodecs: VideoCodecCapability[] = [];
    for (const capability of this.meetingSessionContext.videoSendCodecPreferences) {
      if (
        codecCandidates.some(supportedCapability => capability.equals(supportedCapability)) &&
        !capability.equals(this.meetingSessionContext.prioritizedSendVideoCodecCapabilities[0]) &&
        !this.meetingSessionContext.degradedVideoSendCodecs.some(degradedCodec =>
          capability.equals(degradedCodec)
        )
      ) {
        if (this.isVideoEncodeTechniqueSupported(capability.codecName, technique))
          supportedCodecs.push(capability);
      }
    }
    return supportedCodecs;
  }
}
