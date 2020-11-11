// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class VideoQualitySettings {
  videoWidth: number;
  videoHeight: number;
  videoFrameRate: number;
  videoMaxBandwidthKbps: number;

  constructor(
    videoWidth: number,
    videoHeight: number,
    videoFrameRate: number,
    videoMaxBandwidthKbps: number
  ) {
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
    this.videoFrameRate = videoFrameRate;
    this.videoMaxBandwidthKbps = videoMaxBandwidthKbps;
  }
}
