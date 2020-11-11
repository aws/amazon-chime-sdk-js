// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Instances of [[DevicePixelRatioObserver]] can be registered with a
 * [[DevicePixelRatioMonitor]] to receive callbacks for a change in the HTML window's
 * device pixel ratio.
 */
export default interface DevicePixelRatioObserver {
  /**
   * Called when the device pixel ratio monitor detects a change in the
   * HTML window's device pixel ratio. This can happen if the window is dragged
   * to a monitor with a different hi-dpi characteristics.
   */
  devicePixelRatioChanged(newDevicePixelRatio: number): void;
}
