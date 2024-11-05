// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ExtendedBrowserBehavior from '../browserbehavior/ExtendedBrowserBehavior';
import Logger from '../logger/Logger';
import VideoCodecCapability from '../sdp/VideoCodecCapability';
import TransceiverController from '../transceivercontroller/TransceiverController';
import DefaultVideoAndEncodeParameter from '../videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import ConnectionMetrics from './ConnectionMetrics';
import VideoUplinkBandwidthPolicy from './VideoUplinkBandwidthPolicy';

/** NScaleVideoUplinkBandwidthPolicy implements capture and encode
 *  parameters that are nearly equivalent to those chosen by the
 *  traditional native clients, except for a modification to
 *  maxBandwidthKbps and scaleResolutionDownBy described below. */
export default class NScaleVideoUplinkBandwidthPolicy implements VideoUplinkBandwidthPolicy {
  static readonly encodingMapKey = 'video';
  // 0, 1, 2 have dummy value as we keep the original resolution if we have less than 2 videos.
  // For each video cource, we define a target height for low resoultion and high resolution,
  // respectively. This is corresponding to the meeting feature specified for the meeting.
  static readonly targetHeightArray = [
    [0, 0], // 0
    [0, 0], // 1
    [0, 0], // 2
    [540, 720], // 3
    [540, 720], // 4
    [480, 540], // 5
    [480, 540], // 6
    [480, 540], // 7
    [480, 540], // 8
    [360, 480], // 9
    [360, 480], // 10
    [360, 480], // 11
    [360, 480], // 12
    [270, 360], // 13
    [270, 360], // 14
    [270, 360], // 15
    [270, 360], // 16
    [180, 270], // 17
    [180, 270], // 18
    [180, 270], // 19
    [180, 270], // 20
    [180, 270], // 21
    [180, 270], // 22
    [180, 270], // 23
    [180, 270], // 24
    [180, 270], // 25
  ];
  static readonly SVCCodecNames: string[] = ['VP9'];

  private numberOfPublishedVideoSources: number | undefined = undefined;
  private optimalParameters: DefaultVideoAndEncodeParameter;
  private parametersInEffect: DefaultVideoAndEncodeParameter;
  private idealMaxBandwidthKbps = 1500;
  private hasBandwidthPriority: boolean = false;
  private encodingParamMap = new Map<string, RTCRtpEncodingParameters>();
  private transceiverController: TransceiverController;
  private enableHighResolutionFeature: boolean = false;
  private enableSVC: boolean = false;
  private isUsingSVCCodec: boolean = true;
  private numParticipants: number = 0;

  constructor(
    private selfAttendeeId: string,
    private scaleResolution: boolean = true,
    private logger: Logger | undefined = undefined,
    private browserBehavior: ExtendedBrowserBehavior | undefined = undefined
  ) {
    this.reset();
  }

  reset(): void {
    // Don't reset `idealMaxBandwidthKbps` or `hasBandwidthPriority` which are set via builder API paths
    this.numberOfPublishedVideoSources = undefined;
    this.optimalParameters = new DefaultVideoAndEncodeParameter(0, 0, 0, 0, false);
    this.parametersInEffect = new DefaultVideoAndEncodeParameter(0, 0, 0, 0, false);
    this.encodingParamMap.set(NScaleVideoUplinkBandwidthPolicy.encodingMapKey, {
      maxBitrate: 0,
    });
  }

  updateConnectionMetric(_metrics: ConnectionMetrics): void {
    return;
  }

  chooseMediaTrackConstraints(): MediaTrackConstraints {
    return {};
  }

  chooseEncodingParameters(): Map<string, RTCRtpEncodingParameters> {
    return new Map<string, RTCRtpEncodingParameters>();
  }

  updateIndex(videoIndex: VideoStreamIndex): void {
    let hasLocalVideo = true;
    if (this.transceiverController) {
      hasLocalVideo = this.transceiverController.hasVideoInput();
    }
    // the +1 for self is assuming that we intend to send video, since
    // the context here is VideoUplinkBandwidthPolicy
    const numberOfPublishedVideoSources =
      videoIndex.numberOfVideoPublishingParticipantsExcludingSelf(this.selfAttendeeId) +
      (hasLocalVideo ? 1 : 0);
    const numParticipants = videoIndex.numberOfParticipants();
    if (
      this.numParticipants === numParticipants &&
      this.numberOfPublishedVideoSources === numberOfPublishedVideoSources
    ) {
      this.logger?.debug('Skipping update index; Number of participants has not changed');
      return;
    }
    this.numberOfPublishedVideoSources = numberOfPublishedVideoSources;
    this.numParticipants = numParticipants;

    this.updateOptimalParameters();
  }

  wantsResubscribe(): boolean {
    return !this.parametersInEffect.equal(this.optimalParameters);
  }

  chooseCaptureAndEncodeParameters(): DefaultVideoAndEncodeParameter {
    this.parametersInEffect = this.optimalParameters.clone();
    return this.parametersInEffect.clone();
  }

  private updateOptimalParameters(): void {
    let scale = 1;
    if (this.transceiverController) {
      const settings = this.getStreamCaptureSetting();
      if (settings) {
        const encodingParams = this.calculateEncodingParameters(settings);
        scale = encodingParams.scaleResolutionDownBy;
      }
    }
    this.optimalParameters = new DefaultVideoAndEncodeParameter(
      this.captureWidth(),
      this.captureHeight(),
      this.captureFrameRate(),
      this.maxBandwidthKbps(),
      false,
      scale,
      this.enableSVC && this.numParticipants > 2 && this.isUsingSVCCodec
    );
  }

  private captureWidth(): number {
    let width = 640;
    if (this.getNumberOfPublishedVideoSources() > 4) {
      width = 320;
    }
    return width;
  }

  private captureHeight(): number {
    let height = 384;
    if (this.getNumberOfPublishedVideoSources() > 4) {
      height = 192;
    }
    return height;
  }

  private captureFrameRate(): number {
    return 15;
  }

  maxBandwidthKbps(): number {
    if (this.hasBandwidthPriority) {
      return Math.trunc(this.idealMaxBandwidthKbps);
    }
    let rate = 0;
    if (this.getNumberOfPublishedVideoSources() <= 2) {
      rate = this.idealMaxBandwidthKbps;
    } else if (this.getNumberOfPublishedVideoSources() <= 4) {
      rate = (this.idealMaxBandwidthKbps * 2) / 3;
    } else {
      rate =
        ((544 / 11 + 14880 / (11 * this.getNumberOfPublishedVideoSources())) / 600) *
        this.idealMaxBandwidthKbps;
    }
    return Math.trunc(rate);
  }

  setIdealMaxBandwidthKbps(idealMaxBandwidthKbps: number): void {
    this.idealMaxBandwidthKbps = idealMaxBandwidthKbps;
  }

  setHasBandwidthPriority(hasBandwidthPriority: boolean): void {
    this.hasBandwidthPriority = hasBandwidthPriority;
  }

  setTransceiverController(transceiverController: TransceiverController | undefined): void {
    this.transceiverController = transceiverController;
  }

  setSVCEnabled(enable: boolean): void {
    this.enableSVC = enable;
    this.logger?.info(`setSVCEnabled, enable: ${enable}}`);
  }

  setHighResolutionFeatureEnabled(enabled: boolean): void {
    this.enableHighResolutionFeature = enabled;
  }

  async updateTransceiverController(): Promise<void> {
    const settings = this.getStreamCaptureSetting();
    if (!settings) {
      return;
    }
    const encodingParams: RTCRtpEncodingParameters = this.calculateEncodingParameters(settings);
    if (this.shouldUpdateEndcodingParameters(encodingParams)) {
      this.encodingParamMap.set(NScaleVideoUplinkBandwidthPolicy.encodingMapKey, encodingParams);
      this.transceiverController.setEncodingParameters(this.encodingParamMap);
    }
  }

  private shouldUpdateEndcodingParameters(encoding: RTCRtpEncodingParameters): boolean {
    const transceiverEncoding = this.transceiverController
      .localVideoTransceiver()
      .sender.getParameters()?.encodings?.[0];

    /* istanbul ignore next: transceiverEncoding?.scaleResolutionDownBy cannot be covered */
    return (
      encoding.maxBitrate !== transceiverEncoding?.maxBitrate ||
      encoding.scaleResolutionDownBy !== transceiverEncoding?.scaleResolutionDownBy ||
      // @ts-ignore
      encoding?.scalabilityMode !== transceiverEncoding?.scalabilityMode
    );
  }

  private calculateEncodingParameters(setting: MediaTrackSettings): RTCRtpEncodingParameters {
    const maxBitrate = this.maxBandwidthKbps() * 1000;
    let scale = 1;
    let targetHeight = 720;
    if (
      setting.height !== undefined &&
      setting.width !== undefined &&
      this.scaleResolution &&
      !this.hasBandwidthPriority &&
      this.getNumberOfPublishedVideoSources() > 2
    ) {
      targetHeight =
        NScaleVideoUplinkBandwidthPolicy.targetHeightArray[
          Math.min(
            this.getNumberOfPublishedVideoSources(),
            NScaleVideoUplinkBandwidthPolicy.targetHeightArray.length - 1
          )
        ][this.enableHighResolutionFeature ? 1 : 0];
      //Workaround for issue https://github.com/aws/amazon-chime-sdk-js/issues/2002
      if (targetHeight === 480 && this.browserBehavior?.disable480pResolutionScaleDown()) {
        targetHeight = 360;
      }
      scale = Math.max(Math.min(setting.height, setting.width) / targetHeight, 1);
      this.logger?.info(
        `Resolution scale factor is ${scale} for capture resolution ${setting.width}x${
          setting.height
        }. New dimension is ${setting.width / scale}x${setting.height / scale}`
      );
    }

    if (this.enableSVC) {
      let scalabilityMode: string;
      if ((this.numParticipants >= 0 && this.numParticipants < 3) || !this.isUsingSVCCodec) {
        scalabilityMode = 'L1T1';
      } else {
        // We do not limit the number of layers depending on input resolution, however Chrome will drop anything below around 135p.
        scalabilityMode = 'L3T3';
      }
      this.logger?.info(
        `calculateEncodingParameters: SVC: ${this.enableSVC}    participants: ${
          this.numParticipants
        }     publishers: ${this.getNumberOfPublishedVideoSources()}     bitrate: ${maxBitrate}  targetHeight: ${targetHeight}  scalabilityMode: ${scalabilityMode}   isUsingSVCCodec: ${
          this.isUsingSVCCodec
        }`
      );
      return {
        scaleResolutionDownBy: scale,
        maxBitrate: maxBitrate,
        // @ts-ignore
        scalabilityMode: scalabilityMode,
      };
    } else {
      return {
        scaleResolutionDownBy: scale,
        maxBitrate: maxBitrate,
      };
    }
  }

  private getStreamCaptureSetting(): MediaTrackSettings | undefined {
    return this.transceiverController?.localVideoTransceiver()?.sender?.track?.getSettings();
  }

  private getNumberOfPublishedVideoSources(): number {
    /* istanbul ignore next: policy calculation is dependent on index so this is never undefined at time of use */
    return this.numberOfPublishedVideoSources ?? 0;
  }

  wantsVideoDependencyDescriptorRtpHeaderExtension(): boolean {
    return this.enableSVC;
  }

  setMeetingSupportedVideoSendCodecs(
    meetingSupportedVideoSendCodecPreferences: VideoCodecCapability[] | undefined,
    videoSendCodecPreferences: VideoCodecCapability[]
  ): void {
    const codecs = meetingSupportedVideoSendCodecPreferences ?? videoSendCodecPreferences;

    const isUsingSVCCodec =
      codecs.length > 0 &&
      NScaleVideoUplinkBandwidthPolicy.SVCCodecNames.includes(codecs[0].codecName);
    if (isUsingSVCCodec !== this.isUsingSVCCodec) {
      this.isUsingSVCCodec = isUsingSVCCodec;
      this.updateOptimalParameters();
    }
  }
}
