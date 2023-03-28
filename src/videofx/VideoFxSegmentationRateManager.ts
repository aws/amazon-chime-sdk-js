// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import { RESOURCE_CONSTRAINTS } from './VideoFxConstants';

/**
 * [[VideoFxSegmentationRateManager]] Mechanism that can be used to maximize
 * frequency of the segmentation operations while maintaining a target amount
 * of resource utilization.
 */
export class VideoFxSegmentationRateManager {
  private logger: Logger;
  // Target segmentation percentage is defined as the amount of time spent performing
  // segmentations divided by the total duration of time that has passed
  private targetSegmentationCyclePercentage: number;
  private frameCountOverSamplingPeriod: number;
  private framesPerSegmentation: number;
  // Measure the start time of a single segmentation
  private frameSegmentationStartTime: number;
  // The running sum of single frame segmentation durations over a sampling period
  private totalSegmentationDurationOverSamplingPeriod: number;
  // The time that the segmentation period started
  private samplingPeriodStartTime: number;

  constructor(logger: Logger, targetSegmentationCycleTime: number) {
    this.logger = logger;
    // Max amount of compute we want to offer to action (converted from
    // percentage to decimal)
    this.targetSegmentationCyclePercentage = targetSegmentationCycleTime / 100;
    // Variables for recording timing within cycle
    this.frameCountOverSamplingPeriod = 0;
    this.totalSegmentationDurationOverSamplingPeriod = 0;
    this.samplingPeriodStartTime = performance.now();
    this.framesPerSegmentation = RESOURCE_CONSTRAINTS.SEGMENTATION_DEFAULT_FRAMES_PER_SEGMENTATION;
  }

  /**
   * Invoked on every frame to increment the running count of frames being processed
   */
  submitFrame(): void {
    this.frameCountOverSamplingPeriod++;
  }

  /**
   * Invoked on every frame to coordinate when the segmentation should be
   * executed so that we are maintaing a segmentation rate of once per every
   * framesPerSegmentation frames.
   * @returns boolean for whether or not we want to perform an action on the current
   * frame
   */
  shouldApplySegmentation(): boolean {
    return this.frameCountOverSamplingPeriod % this.framesPerSegmentation === 0;
  }

  /**
   * Starts the timing of the current action
   */
  startSegmentation(): void {
    this.frameSegmentationStartTime = performance.now();
  }

  /**
   * Invoked after the action to notify the compute manager. Afterwards the
   * manager will make adjustments to action rates to maintain a value below compute
   * ceiling
   */
  completeSegmentation(): void {
    this.totalSegmentationDurationOverSamplingPeriod +=
      performance.now() - this.frameSegmentationStartTime;
    // Check if the sampling period has ended. If so, check if frames per
    // segmentation needs to be updated
    if (
      this.frameCountOverSamplingPeriod >=
      RESOURCE_CONSTRAINTS.SEGMENTATION_SAMPLING_PERIOD_FRAME_COUNT
    ) {
      this.adjustFramesPerSegmentation(
        this.totalSegmentationDurationOverSamplingPeriod /
          (performance.now() - this.samplingPeriodStartTime)
      );
    }
  }

  /**
   * Increase or decrease the frames per segmentation so that we remain as performant as possible,
   * but also below the targetSegmentationCycleTime
   * @param currentSegmentationCycleTime Current ratio of frame processing allocated to a specific action
   */
  private adjustFramesPerSegmentation(currentSegmentationCycleTime: number): void {
    // Compute is too high -> increase action period (slow down)
    if (currentSegmentationCycleTime > this.targetSegmentationCyclePercentage) {
      this.framesPerSegmentation++;
      this.logger.info(
        `Segmentation cycle percentage above the configured maximal value. ` +
          `Decreasing segmentation rate to 1 segmentation per ` +
          `${this.framesPerSegmentation} frames`
      );
      // Compute is too low -> decrease action period (speed up)
    } else if (
      this.framesPerSegmentation > 1 &&
      currentSegmentationCycleTime < this.targetSegmentationCyclePercentage
    ) {
      this.framesPerSegmentation--;
      this.logger.info(
        `Segmentation cycle percentage below the configured maximal value. ` +
          `Increasing segmentation rate to 1 segmentation per ` +
          `${this.framesPerSegmentation} frames`
      );
    }
    // Reset for next compute sample/cycle
    this.totalSegmentationDurationOverSamplingPeriod = 0;
    this.frameCountOverSamplingPeriod = 0;
    this.samplingPeriodStartTime = performance.now();
  }
}
