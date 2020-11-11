// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DevicePixelRatioObserver from '../devicepixelratioobserver/DevicePixelRatioObserver';

/**
 * [[DevicePixelRatioMonitor]] manages device pixel ratio observers.
 */
export default interface DevicePixelRatioMonitor {
  /**
   * Registers a device pixel ratio observer to the observer queue.
   */
  registerObserver(observer: DevicePixelRatioObserver): void;

  /**
   * Removes a device pixel ratio observer from the observer queue.
   */
  removeObserver(observer: DevicePixelRatioObserver): void;
}
