// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import SimulcastContentShareTransceiverController from '../transceivercontroller/SimulcastContentShareTransceiverController';
import DefaultVideoCaptureAndEncodeParameter from '../videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
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
  private enableUhdContent: boolean = false;
  private defaultHiTargetBitrateKbps: number = 1200;
  private defaultLowTargetBitrateKbps: number = 300;

  constructor(_logger: Logger, private encodingParams?: ContentShareSimulcastEncodingParameters) {}

  updateConnectionMetric(_metrics: ConnectionMetrics): void {}

  chooseMediaTrackConstraints(): MediaTrackConstraints {
    return undefined;
  }

  chooseEncodingParameters(): Map<string, RTCRtpEncodingParameters> {
    const newMap = new Map<string, RTCRtpEncodingParameters>();
    const toBps = 1000;
    const nameArr = SimulcastContentShareTransceiverController.NAME_ARR_DECENDING;
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
    return newMap;
  }

  updateIndex(_videoIndex: VideoStreamIndex): void {}

  wantsResubscribe(): boolean {
    return false;
  }

  chooseCaptureAndEncodeParameters(): DefaultVideoCaptureAndEncodeParameter {
    return undefined;
  }

  maxBandwidthKbps(): number {
    return this.enableUhdContent ? 2000 : 1200;
  }

  setIdealMaxBandwidthKbps(_idealMaxBandwidthKbps: number): void {}

  setHasBandwidthPriority(_hasBandwidthPriority: boolean): void {}

  setHighResolutionFeatureEnabled(enabled: boolean): void {
    this.enableUhdContent = enabled;
    this.defaultHiTargetBitrateKbps = enabled ? 2000 : 1200;
    this.defaultLowTargetBitrateKbps = enabled ? 500 : 300;
  }

  addObserver(_observer: SimulcastUplinkObserver): void {}

  removeObserver(_observer: SimulcastUplinkObserver): void {}

  forEachObserver(_observerFunc: (observer: SimulcastUplinkObserver) => void): void {}
}
