// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[DevicePixelRatioSource]] provides an interface for the source
 * of the device pixel ratio.
 */
export default interface DevicePixelRatioSource {
  /**
   * Returns the current device pixel ratio.
   */
  devicePixelRatio(): number;
}
