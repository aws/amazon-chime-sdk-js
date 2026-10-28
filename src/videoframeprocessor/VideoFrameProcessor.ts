// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Destroyable from '../destroyable/Destroyable';
import EventController from '../eventcontroller/EventController';
import VideoFrameBuffer from './VideoFrameBuffer';

/**
 * [[VideoFrameProcessor]] is defined as a unit of video processing.
 * It transforms an array of {@link VideoFrameBuffer} and produces an array of {@link VideoFrameBuffer}.
 * It can be chained together to be used with {@link VideoFrameProcessorPipeline}.
 */
export default interface VideoFrameProcessor extends Destroyable {
  /**
   * Processes the array of {@link VideoFrameBuffer} and returns an array of {@link VideoFrameBuffer}.
   */
  process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]>;

  /**
   * Destroys the processor.
   */
  destroy(): Promise<void>;

  /**
   * Set the {@link EventController} to the VideoFrameProcessor
   * @param eventController
   */
  setEventController?(eventController: EventController): void;

  /**
   * Optional. Processes the frames of `input` and resolves with the processed video track.
   * {@link DefaultVideoTransformDevice} calls it instead of {@link process} when every processor
   * implements it.
   *
   * - Rejects if processing cannot start.
   * - Calling it again with a new input, before {@link stopTransformTrack}, resolves with the same
   *   output track.
   * - Does not stop `input`, and processes the black frames of a disabled `input` like any other.
   * - When processing fails for good, end the output track (so that it fires `ended`); the device
   *   then calls {@link stopTransformTrack} and continues with {@link process}.
   */
  transformTrack?(input: MediaStreamTrack): Promise<MediaStreamTrack>;

  /**
   * Optional companion of {@link transformTrack}: stops processing and ends the output track.
   * {@link process} works again once the returned promise resolves.
   */
  stopTransformTrack?(): Promise<void>;
}
