// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface FilterCPUUtilizationHighEvent {
  cpuUtilization: number;
  filterMillis: number;
  periodMillis: number;
}

export interface FilterFrameDurationHighEvent {
  framesDropped: number;
  avgFilterDurationMillis: number;
  framerate: number;
  periodMillis: number;
}

/**
 * An observer for the background blur video frame processor.
 *
 * Use {@link BackgroundBlurVideoFrameProcessor.addObserver} to register an
 * observer with the processor.
 */
export default interface BackgroundBlurVideoFrameProcessorObserver {
  /**
   * This event occurs when the amount of time it takes to apply the background blur is longer than expected. The
   * measurement is taken from the time the process method starts to when it returns. For example, if the video
   * is running at 15 frames per second and we are averaging more than 67 ms (1000 ms reporting period / 15 fps)
   * to apply background blur, then a very large portion of each frame's maximum processing time is taken up by
   * processing background blur.
   *
   * The observer will be called a maximum of once per {@link periodMillis}. In the event that the {@link avgFilterDurationMillis}
   * is larger than expected the builder can use this event as a trigger to disable the background blur.
   *
   * @param event
   * framesDropped: The expected amount of frames based on frame rate minus the actual number of frames.
   * avgFilterDurationMillis: The average amount of time that the processor took per frame in the reporting period.
   * framerate: The video frame rate set by the SDK.
   * periodMillis: The duration of the reporting period in milliseconds.
   */
  filterFrameDurationHigh?: (event: FilterFrameDurationHighEvent) => void;

  /**
   * This event occurs when the CPU utilization of background filtering exceeds the `filterCPUUtilization` defined
   * in the `BackgroundBlurOptions`.
   *
   * @param event
   * cpuUtilization: The percentage of time that was spent processing background filter divided by the total reporting period time;
   * filterMillis: Total time spent processing the background filter in milliseconds;
   * periodMillis: Total time in the reporting period in milliseconds;
   */
  filterCPUUtilizationHigh?: (event: FilterCPUUtilizationHighEvent) => void;
}
