// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoFrameProcessor from './VideoFrameProcessor';
import VideoFrameProcessorPipelineObserver from './VideoFrameProcessorPipelineObserver';

/**
 * [[VideoFrameProcessorPipeline]] facilitates video processing by transforming a input `MediaStream`
 * with an array of {@link VideoFrameProcessor} to another `MediaStream`.
 * It invokes the execution of {@link VideoFrameProcessor} in interval specified by `framerate`.
 */
export default interface VideoFrameProcessorPipeline {
  /**
   * Sets the input for the pipeline. An active `MediaStream` will start the processing steps.
   * To stop the pipeline, `null` can be passed.
   * To switch `MediaSteam`, the pipeline must be stopped first.
   */
  setInputMediaStream(mediaStream: MediaStream): Promise<void>;

  /**
   * Returns the current input `MediaStream`.
   */
  getInputMediaStream(): Promise<MediaStream | null>;

  /**
   * Returns an active output stream.
   */
  getActiveOutputMediaStream(): MediaStream;

  /**
   * Stops the pipeline.
   */
  stop(): void;

  /**
   * Destroys the pipeline, processors, intermediate buffers and input stream.
   */
  destroy(): void;

  /**
   * Adds {@link VideoFrameProcessorPipelineObserver} observer to receive lifecycle and performance callback.
   */
  addObserver(observer: VideoFrameProcessorPipelineObserver): void;

  /**
   * Removes {@link VideoFrameProcessorPipelineObserver} observer.
   */
  removeObserver(observer: VideoFrameProcessorPipelineObserver): void;

  /**
   * Lists of processors to execute to produce output media stream.
   */
  processors: VideoFrameProcessor[];

  /**
   * The desired output frame rate.
   */
  framerate: number;

  /**
   * The output `MediaStream` as a result of processor executions.
   * It is possible, but unlikely, that this accessor will throw.
   */
  readonly outputMediaStream: MediaStream;
}
