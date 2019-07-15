// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoCaptureAndEncodeParameters from './VideoCaptureAndEncodeParameters';
import VideoUplinkBandwidthPolicy from './VideoUplinkBandwidthPolicy';

/** NScaleVideoUplinkBandwidthPolicy implements capture and encode
 *  parameters that are nearly equivalent to those chosen by the
 *  traditional native clients, except for a modification to
 *  maxBandwidthKbps described below. */
export default class NScaleVideoUplinkBandwidthPolicy implements VideoUplinkBandwidthPolicy {
  private numParticipants: number = 0;
  private optimalParameters: VideoCaptureAndEncodeParameters;
  private parametersInEffect: VideoCaptureAndEncodeParameters;
  private idealMaxBandwidthKbps = 1400;
  private hasBandwidthPriority: boolean = false;

  constructor(private selfAttendeeId: string) {
    this.optimalParameters = new VideoCaptureAndEncodeParameters();
    this.parametersInEffect = new VideoCaptureAndEncodeParameters();
  }

  updateIndex(videoIndex: VideoStreamIndex): void {
    // the +1 for self is assuming that we intend to send video, since
    // the context here is VideoUplinkBandwidthPolicy
    this.numParticipants =
      videoIndex.numberOfVideoPublishingParticipantsExcludingSelf(this.selfAttendeeId) + 1;
    const p = new VideoCaptureAndEncodeParameters();
    p.captureWidth = this.captureWidth();
    p.captureHeight = this.captureHeight();
    p.captureFrameRate = this.captureFrameRate();
    p.maxEncodeBitrateKbps = this.maxBandwidthKbps();
    this.optimalParameters = p;
  }

  wantsResubscribe(): boolean {
    return !this.parametersInEffect.equal(this.optimalParameters);
  }

  chooseCaptureAndEncodeParameters(): VideoCaptureAndEncodeParameters {
    this.parametersInEffect = this.optimalParameters.clone();
    return this.parametersInEffect;
  }

  private captureWidth(): number {
    let width = 640;
    if (this.numParticipants > 4) {
      width = 320;
    }
    return width;
  }

  private captureHeight(): number {
    let height = 360;
    if (this.numParticipants > 4) {
      height = 180;
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
    if (this.numParticipants <= 2) {
      rate = this.idealMaxBandwidthKbps;
    } else if (this.numParticipants <= 4) {
      rate = (this.idealMaxBandwidthKbps * 2) / 3;
    } else {
      rate = ((544 / 11 + 14880 / (11 * this.numParticipants)) / 600) * this.idealMaxBandwidthKbps;
    }
    return Math.trunc(rate);
  }

  setIdealMaxBandwidthKbps(idealMaxBandwidthKbps: number): void {
    this.idealMaxBandwidthKbps = idealMaxBandwidthKbps;
  }

  setHasBandwidthPriority(hasBandwidthPriority: boolean): void {
    this.hasBandwidthPriority = hasBandwidthPriority;
  }
}
