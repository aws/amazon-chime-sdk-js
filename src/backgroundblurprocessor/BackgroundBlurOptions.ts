// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';

/**
 * A set of options that can be supplied when creating a background blur video frame processor.
 */
export default interface BackgroundBlurOptions {
  /** A {@link Logger|Logger} to which log output will be written. */
  logger?: Logger;

  /** How often the video frame processor will report observed events. */
  reportingPeriodMillis?: number;

  /** The amount of blur that will be applied to a video stream. */
  blurStrength?: number;

  /**
   * The threshold CPU utilization percentage to trigger skipping background filter updates which will reduce the amount of CPU
   * used by background filtering. The valid values for this field are 0-100.
   *
   * For example, If the reporting period is set to 1000 ms and 500 ms was dedicated to processing the background filter, then
   * the CPU utilization for that reporting period is 50%. If {@link filterCPUUtilization} is set to 50 it will cause a
   * `filterCPUUtilizationHigh` event to be fired from the `BackgroundBlurVideoFrameProcessorObserver`.
   *
   */
  filterCPUUtilization?: number;
}
