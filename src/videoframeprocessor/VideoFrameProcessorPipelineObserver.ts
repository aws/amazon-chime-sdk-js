// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[VideoFrameProcessorPipelineObserver]] is the observer for {@link VideoFrameProcessorPipeline} to receive lifecycle or performance callbacks.
 */
export default interface VideoFrameProcessorPipelineObserver {
  /**
   * `processingDidStart` will be called when {@link VideoFrameProcessorPipeline} starts streaming.
   */
  processingDidStart?(): void;

  /**
   * `processingDidFailToStart` will be called when {@link VideoFrameProcessorPipeline} could not start streaming due to runtime errors.
   */
  processingDidFailToStart?(): void;

  /**
   * `processingDidStop` will be called when {@link VideoFrameProcessorPipeline} stops streaming expectedly.
   */
  processingDidStop?(): void;

  /**
   * `processingLatencyTooHigh` will be called when the execution of {@link VideoFrameProcessorPipeline} slows the frame rate down by half.
   */
  processingLatencyTooHigh?(latencyMs: number): void;
}
