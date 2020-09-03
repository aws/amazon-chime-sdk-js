// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import Maybe from '../maybe/Maybe';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import SimulcastLayers from '../simulcastlayers/SimulcastLayers';
import SimulcastTransceiverController from '../transceivercontroller/SimulcastTransceiverController';
import DefaultVideoAndEncodeParameter from '../videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import VideoStreamDescription from '../videostreamindex/VideoStreamDescription';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import BitrateParameters from './BitrateParameters';
import SimulcastUplinkObserver from './SimulcastUplinkObserver';
import VideoUplinkBandwidthPolicy from './VideoUplinkBandwidthPolicy';

const enum ActiveStreams {
  kHiAndLow,
  kMidAndLow,
  kLow,
}

/**
 * [[SimulcastUplinkPolicy]] determines capture and encode
 *  parameters that reacts to estimated uplink bandwidth
 */
export default class SimulcastUplinkPolicy implements VideoUplinkBandwidthPolicy {
  static readonly defaultUplinkBandwidthKbps: number = 1200;
  static readonly startupDurationMs: number = 6000;
  static readonly holdDownDurationMs: number = 4000;
  static readonly defaultMaxFrameRate = 15;

  // Current rough estimates where webrtc disables streams
  static readonly kHiDisabledRate = 700;
  static readonly kMidDisabledRate = 240;

  private numParticipants: number = 0;
  private optimalParameters: DefaultVideoAndEncodeParameter;
  private parametersInEffect: DefaultVideoAndEncodeParameter;

  private newQualityMap = new Map<string, RTCRtpEncodingParameters>();
  private currentQualityMap = new Map<string, RTCRtpEncodingParameters>();
  private newActiveStreams: ActiveStreams = ActiveStreams.kHiAndLow;
  private currentActiveStreams: ActiveStreams = ActiveStreams.kHiAndLow;
  private lastUplinkBandwidthKbps: number = SimulcastUplinkPolicy.defaultUplinkBandwidthKbps;

  private startTimeMs: number = 0;
  private lastUpdatedMs: number = Date.now();

  private videoIndex: VideoStreamIndex | null = null;

  private currLocalDescriptions: VideoStreamDescription[] = [];
  private nextLocalDescriptions: VideoStreamDescription[] = [];

  private activeSimulcastLayers: SimulcastLayers;
  private observerQueue: Set<SimulcastUplinkObserver> = new Set<SimulcastUplinkObserver>();

  constructor(private selfAttendeeId: string, private logger: Logger) {
    this.optimalParameters = new DefaultVideoAndEncodeParameter(0, 0, 0, 0, true);
    this.parametersInEffect = new DefaultVideoAndEncodeParameter(0, 0, 0, 0, true);

    this.lastUplinkBandwidthKbps = SimulcastUplinkPolicy.defaultUplinkBandwidthKbps;

    this.currentQualityMap = this.fillEncodingParamWithBitrates([300, 0, 1200]);
    this.newQualityMap = this.fillEncodingParamWithBitrates([300, 0, 1200]);
  }

  updateConnectionMetric({
    uplinkKbps = 0,
  }: {
    uplinkKbps?: number;
  } = {}): void {
    if (isNaN(uplinkKbps)) {
      return;
    }

    // Check if startup period in order to ignore estimate when video first enabled.
    // If only audio was active then the estimate will be very low
    if (this.startTimeMs === 0) {
      this.startTimeMs = Date.now();
    }
    if (Date.now() - this.startTimeMs < SimulcastUplinkPolicy.startupDurationMs) {
      this.lastUplinkBandwidthKbps = SimulcastUplinkPolicy.defaultUplinkBandwidthKbps;
    } else {
      this.lastUplinkBandwidthKbps = uplinkKbps;
    }
    this.logger.debug(() => {
      return `simulcast: uplink policy update metrics ${this.lastUplinkBandwidthKbps}`;
    });

    let holdTime = SimulcastUplinkPolicy.holdDownDurationMs;
    if (this.currentActiveStreams === ActiveStreams.kLow) {
      holdTime = SimulcastUplinkPolicy.holdDownDurationMs * 2;
    } else if (
      (this.currentActiveStreams === ActiveStreams.kMidAndLow &&
        uplinkKbps <= SimulcastUplinkPolicy.kMidDisabledRate) ||
      (this.currentActiveStreams === ActiveStreams.kHiAndLow &&
        uplinkKbps <= SimulcastUplinkPolicy.kHiDisabledRate)
    ) {
      holdTime = SimulcastUplinkPolicy.holdDownDurationMs / 2;
    }
    if (Date.now() < this.lastUpdatedMs + holdTime) {
      return;
    }

    this.newQualityMap = this.calculateEncodingParameters(false);
  }

  private calculateEncodingParameters(
    numParticipantsChanged: boolean
  ): Map<string, RTCRtpEncodingParameters> {
    // bitrates parameter min is not used for now
    let newBitrates: BitrateParameters[] = [
      new BitrateParameters(),
      new BitrateParameters(),
      new BitrateParameters(),
    ];

    let hysteresisIncrease = 0,
      hysteresisDecrease = 0;
    if (this.currentActiveStreams === ActiveStreams.kHiAndLow) {
      hysteresisIncrease = 2400;
      hysteresisDecrease = SimulcastUplinkPolicy.kHiDisabledRate;
    } else if (this.currentActiveStreams === ActiveStreams.kMidAndLow) {
      hysteresisIncrease = 1000;
      hysteresisDecrease = SimulcastUplinkPolicy.kMidDisabledRate;
    } else {
      hysteresisIncrease = 300;
      hysteresisDecrease = 0;
    }

    if (
      numParticipantsChanged ||
      this.lastUplinkBandwidthKbps >= hysteresisIncrease ||
      this.lastUplinkBandwidthKbps <= hysteresisDecrease
    ) {
      if (
        this.numParticipants <= 4 &&
        this.lastUplinkBandwidthKbps >= SimulcastUplinkPolicy.kHiDisabledRate
      ) {
        // 320x192+ (640x384)  + 1280x768
        this.newActiveStreams = ActiveStreams.kHiAndLow;
        newBitrates[0].maxBitrateKbps = 300;
        newBitrates[1].maxBitrateKbps = 0;
        newBitrates[2].maxBitrateKbps = 1200;
      } else if (this.lastUplinkBandwidthKbps >= SimulcastUplinkPolicy.kMidDisabledRate) {
        // 320x192 + 640x384 + (1280x768)
        this.newActiveStreams = ActiveStreams.kMidAndLow;
        newBitrates[0].maxBitrateKbps = this.lastUplinkBandwidthKbps >= 350 ? 200 : 150;
        newBitrates[1].maxBitrateKbps = this.numParticipants <= 6 ? 600 : 350;
        newBitrates[2].maxBitrateKbps = 0;
      } else {
        // 320x192 + 640x384 + (1280x768)
        this.newActiveStreams = ActiveStreams.kLow;
        newBitrates[0].maxBitrateKbps = 300;
        newBitrates[1].maxBitrateKbps = 0;
        newBitrates[2].maxBitrateKbps = 0;
      }
      const bitrates: number[] = newBitrates.map((v, _i, _a) => {
        return v.maxBitrateKbps;
      });

      this.newQualityMap = this.fillEncodingParamWithBitrates(bitrates);
      if (!this.encodingParametersEqual()) {
        this.logger.info(
          `simulcast: policy:calculateEncodingParameters bw:${
            this.lastUplinkBandwidthKbps
          } numSources:${this.numParticipants} newQualityMap: ${this.getQualityMapString(
            this.newQualityMap
          )}`
        );
      }
    }
    return this.newQualityMap;
  }

  chooseMediaTrackConstraints(): MediaTrackConstraints {
    // Changing MediaTrackConstraints causes a restart of video input and possible small
    // scaling changes.  Always use 720p for now
    let trackConstraint: MediaTrackConstraints;
    trackConstraint = {
      width: { ideal: 1280 },
      height: { ideal: 768 },
      frameRate: { ideal: 15 },
    };
    return trackConstraint;
  }

  chooseEncodingParameters(): Map<string, RTCRtpEncodingParameters> {
    this.currentQualityMap = this.newQualityMap;
    this.currentActiveStreams = this.newActiveStreams;
    this.publishEncodingSimulcastLayers();
    return this.currentQualityMap;
  }

  updateIndex(videoIndex: VideoStreamIndex): void {
    // the +1 for self is assuming that we intend to send video, since
    // the context here is VideoUplinkBandwidthPolicy
    const numParticipants =
      videoIndex.numberOfVideoPublishingParticipantsExcludingSelf(this.selfAttendeeId) + 1;
    const numParticipantsChanged = numParticipants !== this.numParticipants;
    this.numParticipants = numParticipants;
    this.optimalParameters = new DefaultVideoAndEncodeParameter(
      this.captureWidth(),
      this.captureHeight(),
      this.captureFrameRate(),
      this.maxBandwidthKbps(),
      false
    );
    this.videoIndex = videoIndex;
    this.newQualityMap = this.calculateEncodingParameters(numParticipantsChanged);
  }

  wantsResubscribe(): boolean {
    let constraintDiff = !this.encodingParametersEqual();

    this.nextLocalDescriptions = this.videoIndex.localStreamDescriptions();
    for (let i = 0; i < this.nextLocalDescriptions.length; i++) {
      const streamId = this.nextLocalDescriptions[i].streamId;
      if (streamId !== 0 && !!streamId) {
        const prevIndex = this.currLocalDescriptions.findIndex(val => {
          return val.streamId === streamId;
        });
        if (prevIndex !== -1) {
          if (
            this.nextLocalDescriptions[i].disabledByWebRTC !==
            this.currLocalDescriptions[prevIndex].disabledByWebRTC
          ) {
            constraintDiff = true;
          }
        }
      }
    }

    if (constraintDiff) {
      this.lastUpdatedMs = Date.now();
    }

    this.currLocalDescriptions = this.nextLocalDescriptions;
    return constraintDiff;
  }

  private compareEncodingParameter(
    encoding1: RTCRtpEncodingParameters,
    encoding2: RTCRtpEncodingParameters
  ): boolean {
    return JSON.stringify(encoding1) === JSON.stringify(encoding2);
  }

  private encodingParametersEqual(): boolean {
    let different = false;
    for (const ridName of SimulcastTransceiverController.NAME_ARR_ASCENDING) {
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

  chooseCaptureAndEncodeParameters(): DefaultVideoAndEncodeParameter {
    // should deprecate in this policy
    this.parametersInEffect = this.optimalParameters.clone();
    return this.parametersInEffect.clone();
  }

  private captureWidth(): number {
    // should deprecate in this policy
    const width = 1280;
    return width;
  }

  private captureHeight(): number {
    // should deprecate in this policy
    let height = 768;
    return height;
  }

  private captureFrameRate(): number {
    // should deprecate in this policy
    return 15;
  }

  maxBandwidthKbps(): number {
    // should deprecate in this policy
    return 1400;
  }

  setIdealMaxBandwidthKbps(_idealMaxBandwidthKbps: number): void {
    // should deprecate in this policy
  }

  setHasBandwidthPriority(_hasBandwidthPriority: boolean): void {
    // should deprecate in this policy
  }

  private fillEncodingParamWithBitrates(
    bitratesKbps: number[]
  ): Map<string, RTCRtpEncodingParameters> {
    const newMap = new Map<string, RTCRtpEncodingParameters>();
    const toBps = 1000;
    const nameArr = SimulcastTransceiverController.NAME_ARR_ASCENDING;
    const bitrateArr = bitratesKbps;

    let scale = 4;
    for (let i = 0; i < nameArr.length; i++) {
      const ridName = nameArr[i];
      newMap.set(ridName, {
        rid: ridName,
        active: bitrateArr[i] > 0 ? true : false,
        scaleResolutionDownBy: scale,
        maxBitrate: bitrateArr[i] * toBps,
      });
      scale = scale / 2;
    }

    return newMap;
  }

  private getQualityMapString(params: Map<string, RTCRtpEncodingParameters>): string {
    let qualityString = '';
    const localDescriptions = this.videoIndex.localStreamDescriptions();
    if (localDescriptions.length === 3) {
      params.forEach((value: RTCRtpEncodingParameters) => {
        let disabledByWebRTC = false;
        if (value.rid === 'low') disabledByWebRTC = localDescriptions[0].disabledByWebRTC;
        else if (value.rid === 'mid') disabledByWebRTC = localDescriptions[1].disabledByWebRTC;
        else disabledByWebRTC = localDescriptions[2].disabledByWebRTC;
        qualityString += `{ rid: ${value.rid} active:${value.active} disabledByWebRTC: ${disabledByWebRTC} maxBitrate:${value.maxBitrate}}`;
      });
    }
    return qualityString;
  }

  getEncodingSimulcastLayers(): SimulcastLayers {
    switch (this.currentActiveStreams) {
      case ActiveStreams.kHiAndLow:
        this.activeSimulcastLayers = SimulcastLayers.LowAndHigh;
        break;
      case ActiveStreams.kMidAndLow:
        this.activeSimulcastLayers = SimulcastLayers.LowAndMedium;
        break;
      case ActiveStreams.kLow:
        this.activeSimulcastLayers = SimulcastLayers.Low;
        break;
      default:
        this.logger.debug(
          () =>
            `currentActiveStreams: ${this.currentActiveStreams}  did not match any enum values of ActiveStreams`
        );
    }
    return this.activeSimulcastLayers;
  }

  private publishEncodingSimulcastLayers(): void {
    this.activeSimulcastLayers = this.getEncodingSimulcastLayers();
    this.forEachObserver(observer => {
      Maybe.of(observer.encodingSimulcastLayersDidChange).map(f =>
        f.bind(observer)(this.activeSimulcastLayers)
      );
    });
  }

  addObserver(observer: SimulcastUplinkObserver): void {
    this.logger.info('adding simulcast uplink observer');
    this.observerQueue.add(observer);
  }

  removeObserver(observer: SimulcastUplinkObserver): void {
    this.logger.info('removing simulcast uplink observer');
    this.observerQueue.delete(observer);
  }

  private forEachObserver(observerFunc: (observer: SimulcastUplinkObserver) => void): void {
    for (const observer of this.observerQueue) {
      new AsyncScheduler().start(() => {
        if (this.observerQueue.has(observer)) {
          observerFunc(observer);
        }
      });
    }
  }
}
