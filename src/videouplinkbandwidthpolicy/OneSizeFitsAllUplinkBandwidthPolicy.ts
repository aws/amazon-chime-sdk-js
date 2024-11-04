// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ExtendedBrowserBehavior from '../browserbehavior/ExtendedBrowserBehavior';
import Logger from '../logger/Logger';
import VideoCodecCapability from '../sdp/VideoCodecCapability';
import SimulcastLayers from '../simulcastlayers/SimulcastLayers';
import SimulcastTransceiverController from '../transceivercontroller/SimulcastTransceiverController';
import { Maybe } from '../utils/Types';
import DefaultVideoAndEncodeParameter from '../videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import BitrateParameters from './BitrateParameters';
import ConnectionMetrics from './ConnectionMetrics';
import SimulcastUplinkObserver from './SimulcastUplinkObserver';
import SimulcastUplinkPolicy from './SimulcastUplinkPolicy';
import VideoUplinkTechnique from './VideoUplinkTechnique';

const enum ActiveStreams {
  kHi,
  kHiAndLow,
  kHiAndMid,
  kHiMidAndLow,
}

/** OneSizeFitsAllUplinkPolicy implements capture and encode
 *  parameters that are nearly equivalent to those chosen by the
 *  traditional native clients, except for a modification to
 *  maxBandwidthKbps and scaleResolutionDownBy described below. */
export default class OneSizeFitsAllUplinkPolicy implements SimulcastUplinkPolicy {
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
  private newQualityMap = new Map<string, RTCRtpEncodingParameters>();
  private newActiveStreams: ActiveStreams = ActiveStreams.kHi;
  private currentQualityMap = new Map<string, RTCRtpEncodingParameters>();
  private activeStreamsToPublish: ActiveStreams;
  private transceiverController: SimulcastTransceiverController;
  private enableHighResolutionFeature: boolean = false;
  private uplinkTechnique: VideoUplinkTechnique = VideoUplinkTechnique.ScalableVideoCoding;
  private isUsingSVCCodec: boolean = true;
  private numParticipants: number = 0;
  private overrideTargetWidth: number | undefined = undefined;
  private overrideTargetHeight: number | undefined = undefined;
  private observerQueue: Set<SimulcastUplinkObserver> = new Set<SimulcastUplinkObserver>();

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
    this.currentQualityMap = this.fillEncodingParamWithBitrates([
      this.maxBandwidthKbps(),
      0,
      0,
    ], 1);
    this.newQualityMap = this.fillEncodingParamWithBitrates([
      this.maxBandwidthKbps(),
      0,
      0,
    ], 1);
  }

  updateConnectionMetric(_metrics: ConnectionMetrics): void {
    return;
  }

  chooseMediaTrackConstraints(): MediaTrackConstraints {
    return {};
  }

  chooseEncodingParameters(): Map<string, RTCRtpEncodingParameters> {
    this.currentQualityMap = this.newQualityMap;
    if (this.activeStreamsToPublish !== this.newActiveStreams) {
      this.activeStreamsToPublish = this.newActiveStreams;
      this.publishEncodingSimulcastLayer();
    }
    return this.currentQualityMap;
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
    return !this.encodingParametersEqual();
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
        scale = this.calculateBaseScaleFactor(settings);
        this.newQualityMap = this.calculateEncodingParameters(settings, scale);
      }
    }
    const enableSVC = this.uplinkTechnique == VideoUplinkTechnique.ScalableVideoCoding
      && this.numParticipants > 2
      && this.isUsingSVCCodec
    this.optimalParameters = new DefaultVideoAndEncodeParameter(
      this.captureWidth(),
      this.captureHeight(),
      this.captureFrameRate(),
      this.maxBandwidthKbps(),
      false,
      scale,
      enableSVC
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
    let rate = this.idealMaxBandwidthKbps;
    if (!this.hasBandwidthPriority) {
      if (this.getNumberOfPublishedVideoSources() <= 2) {
        rate = this.idealMaxBandwidthKbps;
      } else if (this.getNumberOfPublishedVideoSources() <= 4) {
        rate = (this.idealMaxBandwidthKbps * 2) / 3;
      } else {
        rate =
          ((544 / 11 + 14880 / (11 * this.getNumberOfPublishedVideoSources())) / 600) *
          this.idealMaxBandwidthKbps;
      }
    }
    if (this.overrideTargetWidth && this.overrideTargetHeight) {
      let overrideRateKbps = this.overrideTargetWidth * this.overrideTargetHeight * 1.6 / 1000 + 50;
      return Math.trunc(Math.min(rate, overrideRateKbps));
    }
    return Math.trunc(rate);
  }

  setIdealMaxBandwidthKbps(idealMaxBandwidthKbps: number): void {
    this.idealMaxBandwidthKbps = idealMaxBandwidthKbps;
  }

  setHasBandwidthPriority(hasBandwidthPriority: boolean): void {
    this.hasBandwidthPriority = hasBandwidthPriority;
  }

  setTransceiverController(transceiverController: SimulcastTransceiverController | undefined): void {
    this.transceiverController = transceiverController;
  }

  setVideoUplinkTechnique(technique: VideoUplinkTechnique): void {
    this.uplinkTechnique = technique
    this.logger?.info(`setVideoUplinkTechnique, ${technique}}`);
    this.updateOptimalParameters();
  }

  setHighResolutionFeatureEnabled(enabled: boolean): void {
    this.enableHighResolutionFeature = enabled;
  }

  private compareEncodingParameter(
    encoding1: RTCRtpEncodingParameters,
    encoding2: RTCRtpEncodingParameters
  ): boolean {
    return JSON.stringify(encoding1) === JSON.stringify(encoding2);
  }

  private encodingParametersEqual(): boolean {
    let different = false;
    for (const ridName of SimulcastTransceiverController.NAME_ARR_DECENDING) {
      different =
        different ||
        !this.compareEncodingParameter(
          this.newQualityMap.get(ridName),
          this.currentQualityMap.get(ridName)
        );
      if (different) {
        break;
      }
    }

    return !different;
  }

  private fillEncodingParamWithBitrates(
    bitratesKbps: number[],
    baseScaleFactor: number
  ): Map<string, RTCRtpEncodingParameters> {
    const newMap = new Map<string, RTCRtpEncodingParameters>();
    const toBps = 1000;
    const nameArr = SimulcastTransceiverController.NAME_ARR_DECENDING;
    const bitrateArr = bitratesKbps;
    const enableSVC = this.uplinkTechnique == VideoUplinkTechnique.ScalableVideoCoding
      && this.numParticipants > 2 && this.isUsingSVCCodec
    // Don't scale the single simulcast stream regardless of its layer.
    let scale = baseScaleFactor;
    for (let i = 0; i < nameArr.length; i++) {
      const ridName = nameArr[i];
      newMap.set(ridName, {
        rid: ridName,
        active: bitrateArr[i] > 0,
        scaleResolutionDownBy: Math.max(scale, baseScaleFactor),
        maxBitrate: bitrateArr[i] * toBps,
        // [TODO: shisuss] add scalability mode
        // @ts-ignore
        scalabilityMode: enableSVC ? 'L3T3' : 'L1T1',
      });
      scale = scale * 2;
    }

    return newMap;
  }

  private calculateBaseScaleFactor(setting: MediaTrackSettings): number {
    let scale = 1;
    let targetHeight = 720;
    if (
      setting.height !== undefined &&
      setting.width !== undefined &&
      this.scaleResolution &&
      !this.hasBandwidthPriority &&
      (this.getNumberOfPublishedVideoSources() > 2 || 
      (this.overrideTargetWidth && this.overrideTargetHeight))
    ) {
      targetHeight =
        OneSizeFitsAllUplinkPolicy.targetHeightArray[
          Math.min(
            this.getNumberOfPublishedVideoSources(),
            OneSizeFitsAllUplinkPolicy.targetHeightArray.length - 1
          )
        ][this.enableHighResolutionFeature ? 1 : 0];
      if (targetHeight == 0) {
        targetHeight = Math.min(setting.height, setting.width)
      }
      if (this.overrideTargetWidth && this.overrideTargetHeight) {
        targetHeight = Math.min(targetHeight, Math.min(this.overrideTargetWidth, this.overrideTargetHeight))
      }
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
    return scale
  }

  private calculateEncodingBitrates(): number[] {
    // bitrates parameter min is not used for now
    const bitrates: BitrateParameters[] = [
      new BitrateParameters(),
      new BitrateParameters(),
      new BitrateParameters(),
    ];

    if (this.uplinkTechnique == VideoUplinkTechnique.Simulcast) {
      const shouldDisableSimulcast = this.getNumberOfPublishedVideoSources() >= 0 && this.getNumberOfPublishedVideoSources() <= 2
      if (shouldDisableSimulcast) {
        this.newActiveStreams = ActiveStreams.kHi;
        bitrates[0].maxBitrateKbps = this.maxBandwidthKbps();
        bitrates[1].maxBitrateKbps = 0;
        bitrates[2].maxBitrateKbps = 0;
      } else if (this.getNumberOfPublishedVideoSources() <= 4) {
        this.newActiveStreams = ActiveStreams.kHiAndLow;
        bitrates[0].maxBitrateKbps = this.maxBandwidthKbps() * 0.8;
        bitrates[1].maxBitrateKbps = 0;
        bitrates[2].maxBitrateKbps = this.maxBandwidthKbps() * 0.2;
      } else {
        this.newActiveStreams = ActiveStreams.kHiAndMid;
        bitrates[0].maxBitrateKbps = this.maxBandwidthKbps() * 0.7;
        bitrates[1].maxBitrateKbps = this.maxBandwidthKbps() * 0.3;
        bitrates[2].maxBitrateKbps = 0;
      }
    } else {
      this.newActiveStreams = ActiveStreams.kHi;
      bitrates[0].maxBitrateKbps = this.maxBandwidthKbps();
      bitrates[1].maxBitrateKbps = 0;
      bitrates[2].maxBitrateKbps = 0;
    }
    return bitrates.map((v, _i, _a) => {
      return v.maxBitrateKbps;
    });
  }

  private calculateEncodingParameters(setting: MediaTrackSettings, scale: number): Map<string, RTCRtpEncodingParameters> {
    const bitrates = this.calculateEncodingBitrates();

    this.newQualityMap = this.fillEncodingParamWithBitrates(bitrates, scale);
    if (!this.encodingParametersEqual()) {
      this.logger.info(
        `simulcast: policy:calculateEncodingParameters numSources:${
          this.getNumberOfPublishedVideoSources()
        } newQualityMap: ${this.getQualityMapString(this.newQualityMap)}`
      );
    }
    return this.newQualityMap;
  }

  private getQualityMapString(params: Map<string, RTCRtpEncodingParameters>): string {
    let qualityString = '';
    params.forEach((value: RTCRtpEncodingParameters) => {
      qualityString += `{ rid: ${value.rid} active:${value.active} maxBitrate:${value.maxBitrate}}`;
    });
    return qualityString;
  }

  wantsVideoDependencyDescriptorRtpHeaderExtension(): boolean {
    return this.uplinkTechnique == VideoUplinkTechnique.ScalableVideoCoding;
  }

  setMeetingSupportedVideoSendCodecs(
    meetingSupportedVideoSendCodecPreferences: VideoCodecCapability[] | undefined,
    videoSendCodecPreferences: VideoCodecCapability[],
    degradedVideoSendCodecs: VideoCodecCapability[]
  ): void {
    const codecPreferences = meetingSupportedVideoSendCodecPreferences ?? videoSendCodecPreferences;
    const codecs: VideoCodecCapability[] = [];
    for (const codecPreference of codecPreferences) {
      if (!degradedVideoSendCodecs.some(degradedCodec =>
        codecPreference.equals(degradedCodec)
      )) {
        codecs.push(codecPreference);
      }
    }

    const isUsingSVCCodec =
      codecs.length > 0 &&
      OneSizeFitsAllUplinkPolicy.SVCCodecNames.includes(codecs[0].codecName);
    if (isUsingSVCCodec !== this.isUsingSVCCodec) {
      this.isUsingSVCCodec = isUsingSVCCodec;
      this.updateOptimalParameters();
    }
  }

  private getStreamCaptureSetting(): MediaTrackSettings | undefined {
    return this.transceiverController?.localVideoTransceiver()?.sender?.track?.getSettings();
  }

  private getNumberOfPublishedVideoSources(): number {
    /* istanbul ignore next: policy calculation is dependent on index so this is never undefined at time of use */
    return this.numberOfPublishedVideoSources ?? 0;
  }

  getEncodingSimulcastLayer(activeStreams: ActiveStreams): SimulcastLayers {
    switch (activeStreams) {
      case ActiveStreams.kHi:
        return SimulcastLayers.High;
      case ActiveStreams.kHiAndLow:
        return SimulcastLayers.LowAndHigh;
      case ActiveStreams.kHiAndMid:
        return SimulcastLayers.MediumAndHigh;
    }
  }

  private publishEncodingSimulcastLayer(): void {
    const simulcastLayers = this.getEncodingSimulcastLayer(this.activeStreamsToPublish);
    this.forEachObserver(observer => {
      Maybe.of(observer.encodingSimulcastLayersDidChange).map(f =>
        f.bind(observer)(simulcastLayers)
      );
    });
  }

  updateVideoEncodeResolution?(width: number, height: number): void {
    this.overrideTargetWidth = width;
    this.overrideTargetHeight = height;
    this.updateOptimalParameters();
  }

  addObserver(observer: SimulcastUplinkObserver): void {
    this.logger.info('adding simulcast uplink observer');
    this.observerQueue.add(observer);
  }

  removeObserver(observer: SimulcastUplinkObserver): void {
    this.logger.info('removing simulcast uplink observer');
    this.observerQueue.delete(observer);
  }

  forEachObserver(observerFunc: (observer: SimulcastUplinkObserver) => void): void {
    for (const observer of this.observerQueue) {
      observerFunc(observer);
    }
  }
}
