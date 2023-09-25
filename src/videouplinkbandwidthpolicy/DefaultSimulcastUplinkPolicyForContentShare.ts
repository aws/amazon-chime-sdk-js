// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import SimulcastContentShareTransceiverController from '../transceivercontroller/SimulcastContentShareTransceiverController';
import DefaultVideoCaptureAndEncodeParameter from '../videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import VideoStreamDescription from '../videostreamindex/VideoStreamDescription';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import ConnectionMetrics from './ConnectionMetrics';
import ContentShareSimulcastEncodingParameters from './ContentShareSimulcastEncodingParameters';
import SimulcastUplinkObserver from './SimulcastUplinkObserver';
import SimulcastUplinkPolicy from './SimulcastUplinkPolicy';

/**
 * [[DefaultSimulcastUplinkPolicyForContentShare]] sets the capture and encode
 *  parameters based on constructor input parameters
 */
export default class DefaultSimulcastUplinkPolicyForContentShare implements SimulcastUplinkPolicy {
  private videoIndex: VideoStreamIndex | null = null;
  private currLocalDescriptions: VideoStreamDescription[] = [];
  private nextLocalDescriptions: VideoStreamDescription[] = [];
  private enableUhdContent: boolean = false;
  private defaultHiTargetBitrateKbps: number = 1200;
  private defaultLowTargetBitrateKbps: number = 300;

  constructor(
    private logger: Logger,
    private encodingParams?: ContentShareSimulcastEncodingParameters
  ) {}

  updateConnectionMetric(_metrics: ConnectionMetrics): void {
    // Noop
  }

  chooseMediaTrackConstraints(): MediaTrackConstraints {
    // Changing MediaTrackConstraints causes a restart of video input and possible small
    // scaling changes.  Always use 720p for now
    return undefined;
  }

  chooseEncodingParameters(): Map<string, RTCRtpEncodingParameters> {
    const newMap = new Map<string, RTCRtpEncodingParameters>();
    const toBps = 1000;
    const nameArr = SimulcastContentShareTransceiverController.NAME_ARR_ASCENDING;
    newMap.set(nameArr[0], {
      rid: nameArr[0],
      active: true,
      scaleResolutionDownBy: this.encodingParams?.low?.scaleResolutionDownBy || 2,
      maxBitrate:
        (this.encodingParams?.low?.maxBitrateKbps || this.defaultLowTargetBitrateKbps) * toBps,
      maxFramerate: this.encodingParams?.low?.maxFramerate || 5,
    });
    newMap.set(nameArr[1], {
      rid: nameArr[1],
      active: true,
      scaleResolutionDownBy: this.encodingParams?.high?.scaleResolutionDownBy || 1,
      maxBitrate:
        (this.encodingParams?.high?.maxBitrateKbps || this.defaultHiTargetBitrateKbps) * toBps,
      maxFramerate: this.encodingParams?.high?.maxFramerate,
    });
    this.getQualityMapString(newMap);
    return newMap;
  }

  updateIndex(videoIndex: VideoStreamIndex): void {
    this.videoIndex = videoIndex;
  }

  wantsResubscribe(): boolean {
    let constraintDiff = false;

    this.nextLocalDescriptions = this.videoIndex?.localStreamDescriptions();
    for (let i = 0; i < this.nextLocalDescriptions?.length; i++) {
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
    this.currLocalDescriptions = this.nextLocalDescriptions;
    return constraintDiff;
  }

  chooseCaptureAndEncodeParameters(): DefaultVideoCaptureAndEncodeParameter {
    // should deprecate in this policy
    return undefined;
  }

  maxBandwidthKbps(): number {
    // should deprecate in this policy
    return this.enableUhdContent ? 2000 : 1200;
  }

  setIdealMaxBandwidthKbps(_idealMaxBandwidthKbps: number): void {
    // should deprecate in this policy
  }

  setHasBandwidthPriority(_hasBandwidthPriority: boolean): void {
    // should deprecate in this policy
  }

  setHighResolutionFeatureEnabled(enabled: boolean): void {
    this.enableUhdContent = enabled;
    this.defaultHiTargetBitrateKbps = enabled ? 2000 : 1200;
    this.defaultLowTargetBitrateKbps = enabled ? 500 : 300;
  }

  private getQualityMapString(params: Map<string, RTCRtpEncodingParameters>): void {
    let qualityString = '';
    const localDescriptions = this.videoIndex?.localStreamDescriptions();
    if (localDescriptions?.length > 0) {
      params.forEach((value: RTCRtpEncodingParameters) => {
        let disabledByWebRTC = false;
        if (value.rid === 'low') disabledByWebRTC = localDescriptions[0].disabledByWebRTC;
        else disabledByWebRTC = localDescriptions[1].disabledByWebRTC;
        qualityString += `{ rid: ${value.rid} active:${value.active} disabledByWebRTC: ${disabledByWebRTC} maxBitrate:${value.maxBitrate} scaleResolutionDownBy:${value.scaleResolutionDownBy} maxFrameRate:${value.maxFramerate}`;
      });
      this.logger.info(
        `simulcast: content policy:chooseEncodingParameters newQualityMap: ${qualityString}`
      );
    }
  }

  addObserver(_observer: SimulcastUplinkObserver): void {}

  removeObserver(_observer: SimulcastUplinkObserver): void {}

  forEachObserver(_observerFunc: (observer: SimulcastUplinkObserver) => void): void {}
}
