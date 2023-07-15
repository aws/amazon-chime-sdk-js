// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoFxBlurStrength from './VideoFxBlurStrength';

/**
 * [[VideoFxConfig]] describes the configuration of desired video effects that should be
 * applied to a video stream by the [[VideoFxProcessor]]. Either backgroundBlur or backgroundReplacement
 * may be enabled, but not both.
 */
export interface VideoFxConfig {
  /**
   * Configuration for background blur, either enabled or disabled. If enabled, a strength
   * value of type BlurStrength as defined above must be specified.
   */
  backgroundBlur: {
    isEnabled: boolean;
    strength: VideoFxBlurStrength;
  };
  /**
   * Configuration for background replacement, either enabled or disabled. If enabled, an
   * image URL may be specified for the replacement background. If backgroundImageURL is null,
   * the color specified as defaultColor is used as the replacement background. defaultColor
   * must be a valid hex value or an accepted color string for the HTML canvas fillStyle method.
   */
  backgroundReplacement: {
    isEnabled: boolean;
    backgroundImageURL: string | undefined;
    defaultColor: string | undefined;
  };
}

export default VideoFxConfig;
