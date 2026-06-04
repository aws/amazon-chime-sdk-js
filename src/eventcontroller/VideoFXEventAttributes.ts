// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BlurStrength } from '../backgroundsegmentation/BackgroundSegmentationConstants';
import VideoFxBlurStrength from '../videofx/VideoFxBlurStrength';

/**
 * [[VideoFXEventAttributes]] describes the config of video effect event.
 */
export default interface VideoFXEventAttributes {
  backgroundBlurEnabled?: string;
  backgroundBlurStrength?: number | VideoFxBlurStrength | BlurStrength;
  backgroundReplacementEnabled?: string;
  backgroundFilterVersion?: number;
  backgroundFilterModelType?: string;
  backgroundFilterEffectType?: string;
  backgroundFilterErrorType?: string;
  backgroundFilterErrorMessage?: string;
}
