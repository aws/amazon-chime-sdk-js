// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[VideoQualityAdaptationPreference]] represents options in how to degrade/reduce quality when end-users
 * encounter network constraints that limit the bandwidth available to the SDK. Different resolutions and
 * framerates have different but sometimes similar bitrates (e.g. a 480p/30fps stream may have similar bitrate
 * to 720p/15fps), so the prefence selected will impact the visual experience of end-users on impairment and recovery,
 * as not all resolution/framerate combinations will be used.
 *
 * The SDK will follow the same path of resolution/framerate choices in recovery as it will during constraint.
 *
 * This preference will have no effect unless the sender is encoding in a way such that there
 * are both variable framerate and resolution options available. See the
 * [Priority based downlink policy guide](https://aws.github.io/amazon-chime-sdk-js/modules/prioritybased_downlink_policy.html)
 * for more detailed information and diagrams.
 */
export enum VideoQualityAdaptationPreference {
  /**
   * Compromises between reducing resolution and framerate, with a slight preference towards framerate
   * as framerate changes may be possible without a keyframe request to the sender. This value
   * should be used in most use cases.
   */
  Balanced,

  /**
   * Give preference to framerate under network constraint. This can be used, e.g.
   * if the receiver is known to be displaying the video at a low resolution.
   */
  MaintainFramerate,

  /**
   * Give preference to resolution under network constraint. This can be used, e.g.
   * for screen share, or camera feed from a conference room or class room, that
   * is displayed on a large screen
   */
  MaintainResolution,
}

export default VideoQualityAdaptationPreference;
