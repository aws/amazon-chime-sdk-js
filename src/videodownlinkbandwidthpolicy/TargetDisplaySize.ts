// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[TargetDisplaySize]] represents the max resolution that a video stream can have when simulcast is enabled in priority based downlink policy.
 * If there is only one stream being sent, then this field will get ignored.  Its values currently parallel [[SimulcastLayers]].
 */
export enum TargetDisplaySize {
  /**
   * Low resolution video stream.
   */
  Low,

  /**
   * Medium resolution video stream.
   */
  Medium,

  /**
   * High resolution video stream.
   */
  High,
}

export default TargetDisplaySize;
