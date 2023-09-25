// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoQualitySettings from '../devicecontroller/VideoQualitySettings';

/**
 * [[MeetingFeatures]] contains the information meeting features.
 */
export default class MeetingFeatures {
  // Maximum resolution level allowed for camera videos in the meeting
  videoMaxResolution: VideoQualitySettings;

  // Maximum resolution level allowed for content share in the meeting
  contentMaxResolution: VideoQualitySettings;

  constructor(
    videoMaxResolution: VideoQualitySettings = VideoQualitySettings.VideoResolutionHD,
    contentMaxResolution: VideoQualitySettings = VideoQualitySettings.VideoResolutionFHD
  ) {
    this.videoMaxResolution = videoMaxResolution;
    this.contentMaxResolution = contentMaxResolution;
  }

  /**
   * Returns a deep copy of meeting features.
   */
  clone(): MeetingFeatures {
    return new MeetingFeatures(this.videoMaxResolution, this.contentMaxResolution);
  }
}
