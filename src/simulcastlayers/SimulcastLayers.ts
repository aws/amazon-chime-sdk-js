// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[SimulcastLayers]] represents simulcast layers for selected simulcast video streams.
 */
export enum SimulcastLayers {
  /**
   * Low resolution video stream.
   */
  Low,
  /**
   * Low and medium resolution video streams.
   */
  LowAndMedium,
  /**
   * Low and high resolution video streams.
   */
  LowAndHigh,
  /**
   * Medium resolution video stream.
   */
  Medium,
  /**
   * Medium and high resolution video streams.
   */
  MediumAndHigh,
  /**
   * High resolution video stream.
   */
  High,
}

export default SimulcastLayers;
