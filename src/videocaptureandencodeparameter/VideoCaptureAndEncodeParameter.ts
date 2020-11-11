// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[VideoCaptureAndEncodeParameter]] encapsulates video parameters for capturing and encoding
 */
export default interface VideoCaptureAndEncodeParameter {
  /**
   * Returns whether two [[VideoCaptureAndEncodeParameter]] are same
   */
  equal(other: VideoCaptureAndEncodeParameter): boolean;

  /**
   * Returns a clone of [[VideoCaptureAndEncodeParameter]]
   */
  clone(): VideoCaptureAndEncodeParameter;

  /**
   * Returns the desired width for camera capture
   */
  captureWidth(): number;

  /**
   * Returns the desired height for camera capture
   */
  captureHeight(): number;

  /**
   * Returns the desired frame rate for camera capture
   */
  captureFrameRate(): number;

  /**
   * Returns an ascending array of desired bitrates in Kilo-bps for video encoding.
   */
  encodeBitrates(): number[];

  /**
   * Returns an ascending array of widths for video encoding.
   */
  encodeWidths(): number[];

  /**
   * Returns an ascending array of heights for video encoding
   */
  encodeHeights(): number[];
}
