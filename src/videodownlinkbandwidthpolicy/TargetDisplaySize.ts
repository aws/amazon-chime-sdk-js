// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[TargetDisplaySize]] represents the max resolution that a video stream can have when simulcast is enabled in priority based downlink policy.
 * If there is only one stream being sent, then this field will get ignored.  Its values currently parallel [[SimulcastLayers]].
 */
export enum TargetDisplaySize {
/**
 * Thumbnail resolution video stream, around 180p.
 */
Thumbnail,

/**
 * Low resolution video stream, around 240p.
 */
Low,

/**
 * Medium-low resolution video stream, around 360p.
 */
MediumLow,

/**
 * Medium resolution video stream, around 480p.
 */
Medium,

/**
 * Medium-high resolution video stream, around 540p.
 */
MediumHigh,

  /**
   * High resolution video stream, around 720p.
   */
  High,

/**
   * High resolution video stream, around 1080p.
   */
   VeryHigh,

  /**
   * Maximum resolution video stream. 2k, 4k, etc.
   */
  Maximum,
}

export function getTargetDisplaySizeForDimensions(width: number, height: number): TargetDisplaySize {
    const longerEdge = Math.max(width, height);
    
    if (longerEdge <= 320) {
        return TargetDisplaySize.Thumbnail;
    } else if (longerEdge <= 426) {
        return TargetDisplaySize.Low;
    } else if (longerEdge <= 640) {
        return TargetDisplaySize.MediumLow;
    } else if (longerEdge <= 854) {
        return TargetDisplaySize.Medium;
    } else if (longerEdge <= 960) {
        return TargetDisplaySize.MediumHigh;
    } else if (longerEdge <= 1280) {
        return TargetDisplaySize.High;
    } else if (longerEdge <= 1920) {
        return TargetDisplaySize.VeryHigh;
    } else {
        return TargetDisplaySize.Maximum;
    }
}

export function getDimensionsForTargetSize(targetSize: TargetDisplaySize): { width: number; height: number } {
    switch (targetSize) {
      case TargetDisplaySize.Thumbnail:
        return { width: 320, height: 180 }; // 180p
      case TargetDisplaySize.Low:
        return { width: 426, height: 240 }; // 240p
      case TargetDisplaySize.MediumLow:
        return { width: 640, height: 360 }; // 360p
      case TargetDisplaySize.Medium:
        return { width: 854, height: 480 }; // 480p
      case TargetDisplaySize.MediumHigh:
        return { width: 960, height: 540 }; // 540p
      case TargetDisplaySize.High:
        return { width: 1280, height: 720 }; // 720p
      case TargetDisplaySize.VeryHigh:
        return { width: 1920, height: 1080 }; // 1080p
      case TargetDisplaySize.Maximum:
        return { width: 3840, height: 2160 }; // 4K
      default:
        throw new Error('Unknown TargetDisplaySize');
    }
}


export default TargetDisplaySize;
