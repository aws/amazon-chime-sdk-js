// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class VideoQualitySettings {
  videoWidth: number;
  videoHeight: number;
  videoFrameRate: number;

  static readonly VideoDisabled: VideoQualitySettings = new VideoQualitySettings(0, 0, 0);
  static readonly VideoResolutionHD: VideoQualitySettings = new VideoQualitySettings(1280, 720, 30);
  static readonly VideoResolutionFHD: VideoQualitySettings = new VideoQualitySettings(
    1920,
    1080,
    30
  );
  static readonly VideoResolutionUHD: VideoQualitySettings = new VideoQualitySettings(
    3840,
    2160,
    30
  );

  constructor(videoWidth: number, videoHeight: number, videoFrameRate: number) {
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
    this.videoFrameRate = videoFrameRate;
  }

  equals(other: this): boolean {
    return (
      this.videoWidth === other.videoWidth &&
      this.videoHeight === other.videoHeight &&
      this.videoFrameRate === other.videoFrameRate
    );
  }
}
