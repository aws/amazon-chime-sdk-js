// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoUplinkTechnique from '../videouplinkbandwidthpolicy/VideoUplinkTechnique';

/**
 * [[AutomaticVideoConfiguration]] contains the information for automatic video
 * feature selection and adaptation.
 */
export default class AutomaticVideoConfiguration {
  /**
   * Whether to enable low power mode to avoid encoding techniques that only
   * work with software encoding.
   */
  enableLowPowerMode: boolean = false;

  /**
   * Order of preference for video encoding techniques.
   */
  videoEncodingTechniquePreferences: VideoUplinkTechnique[];

  /**
   * Whether to use the priority-based downlink policy by default.
   * When set to true, the downlink policy will be set to PriorityBasedDownlinkPolicy
   * if no other policy is specified in meeting session configuration.
   */
  usePriorityBasedDownlinkPolicyByDefault = true;

  constructor(
    enableLowPowerMode?: boolean,
    videoEncodingTechniquePreferences?: VideoUplinkTechnique[]
  ) {
    if (enableLowPowerMode !== undefined) {
      this.enableLowPowerMode = enableLowPowerMode;
    }
    if (videoEncodingTechniquePreferences !== undefined) {
      this.videoEncodingTechniquePreferences = videoEncodingTechniquePreferences;
    } else {
      this.videoEncodingTechniquePreferences = this.enableLowPowerMode
        ? [VideoUplinkTechnique.Simulcast, VideoUplinkTechnique.SingleCast]
        : [
            VideoUplinkTechnique.ScalableVideoCoding,
            VideoUplinkTechnique.Simulcast,
            VideoUplinkTechnique.SingleCast,
          ];
    }
  }
}
