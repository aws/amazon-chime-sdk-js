// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoFxBlurStrength from '../videofx/VideoFxBlurStrength';

/**
 * [[VideoFXEventAttributes]] describes the config of video effect event.
 */
export default interface VideoFXEventAttributes {
  backgroundBlurEnabled?: string;
  backgroundBlurStrength?: number | VideoFxBlurStrength;
  backgroundReplacementEnabled?: string;
  backgroundFilterVersion?: number;
}
