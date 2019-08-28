// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class VideoCaptureAndEncodeParameters {
  constructor(
    public captureWidth: number = 0,
    public captureHeight: number = 0,
    public captureFrameRate: number = 0,
    public maxEncodeBitrateKbps: number = 0
  ) {}

  equal(other: VideoCaptureAndEncodeParameters): boolean {
    return (
      other.captureWidth === this.captureWidth &&
      other.captureHeight === this.captureHeight &&
      other.captureFrameRate === this.captureFrameRate &&
      other.maxEncodeBitrateKbps === this.maxEncodeBitrateKbps
    );
  }

  clone(): VideoCaptureAndEncodeParameters {
    return new VideoCaptureAndEncodeParameters(
      this.captureWidth,
      this.captureHeight,
      this.captureFrameRate,
      this.maxEncodeBitrateKbps
    );
  }
}
