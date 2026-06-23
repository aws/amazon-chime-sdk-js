// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Effect types supported by background segmentation processor
 */
export enum ProcessorEffect {
  BLUR = 'blur',
  IMAGE_REPLACEMENT = 'image-replacement',
  COLOR_REPLACEMENT = 'color-replacement',
}

/**
 * Blur strength levels for background blur effect.
 */
export enum BlurStrength {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Model types supported by background segmentation processor
 */
export enum ModelType {
  SELFIE_GENERAL = 'selfie_general',
  SELFIE_MULTICLASS = 'selfie_multiclass',
}

/**
 * Configuration for background segmentation processor with mutually exclusive effect properties.
 */
export type BackgroundSegmentationVideoFrameProcessorConfig =
  | {
      type: ProcessorEffect.BLUR;
      blurStrength?: BlurStrength;
      replacementImageURL?: never;
      replacementColor?: never;
    }
  | {
      type: ProcessorEffect.IMAGE_REPLACEMENT;
      blurStrength?: never;
      replacementImageURL: string;
      replacementColor?: never;
    }
  | {
      type: ProcessorEffect.COLOR_REPLACEMENT;
      blurStrength?: never;
      replacementImageURL?: never;
      // Must be a valid hex value or an accepted color string for the HTML canvas fillStyle method
      replacementColor: string;
    };
