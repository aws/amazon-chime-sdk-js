// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Eq, PartialOrd } from '../utils/Types';
import TargetDisplaySize from './TargetDisplaySize';
import VideoQualityAdaptationPreference from './VideoQualityAdaptationPreference';

export default class VideoPreference implements Eq, PartialOrd {
  /**
   * The desired maximum simulcast layers to receive.
   */
  targetSize: TargetDisplaySize;

  /**
   * The preference on how to select between resolution and framerate on network constraint.
   *
   * This preference will have no effect unless the sender is encoding in a way such that there
   * are both variable framerate and resolution options available.
   */
  degradationPreference: VideoQualityAdaptationPreference;

  /** Initializes a [[VideoPreference]] with the given properties.
   *
   * @param attendeeId Attendee ID of the client
   * @param priority The relative priority of this attendee against others.
   * @param targetSize The desired maximum simulcast layers to receive.
   * @param degradationPreference The preference on how to select between resolution and framerate on network constraint
   */
  constructor(
    public attendeeId: string,
    public priority: number,
    targetSize?: TargetDisplaySize,
    degradationPreference?: VideoQualityAdaptationPreference
  ) {
    this.targetSize = targetSize !== undefined ? targetSize : TargetDisplaySize.Maximum;
    this.degradationPreference =
      degradationPreference !== undefined
        ? degradationPreference
        : VideoQualityAdaptationPreference.Balanced;
  }

  partialCompare(other: this): number {
    return this.priority - other.priority;
  }

  equals(other: this): boolean {
    return (
      this.attendeeId === other.attendeeId &&
      this.targetSize === other.targetSize &&
      this.priority === other.priority &&
      this.degradationPreference === other.degradationPreference
    );
  }

  clone(): VideoPreference {
    return new VideoPreference(
      this.attendeeId,
      this.priority,
      this.targetSize,
      this.degradationPreference
    );
  }

  private static readonly VERY_LOW_BITRATE_KBPS = 150;
  private static readonly LOW_BITRATE_KBPS = 300;
  private static readonly MID_BITRATE_KBPS = 600;
  private static readonly HIGH_BITRATE_KBPS = 1500;
  private static readonly MAXIMUM_BITRATE_KBPS = 10000;

  targetSizeToBitrateKbps(targetSize: TargetDisplaySize): number {
    switch (targetSize) {
      case TargetDisplaySize.Maximum:
        return VideoPreference.MAXIMUM_BITRATE_KBPS;
      case TargetDisplaySize.VeryHigh:
      case TargetDisplaySize.High:
        return VideoPreference.HIGH_BITRATE_KBPS;
      case TargetDisplaySize.MediumHigh:
      case TargetDisplaySize.Medium:
        return VideoPreference.MID_BITRATE_KBPS;
      case TargetDisplaySize.MediumLow:
      case TargetDisplaySize.Low:
        return VideoPreference.LOW_BITRATE_KBPS;
      case TargetDisplaySize.Thumbnail:
          return VideoPreference.VERY_LOW_BITRATE_KBPS;
    }
  }
}
