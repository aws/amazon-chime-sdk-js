// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoFrameProcessor from '../videoframeprocessor/VideoFrameProcessor';
import BackgroundReplacementVideoFrameProcessorObserver from './BackgroundReplacementVideoFrameProcessorObserver';

/**
 * Interface to define extra methods that need to be implemented for background replacement processing
 */
export default interface BackgroundReplacementProcessor extends VideoFrameProcessor {
  /**
   * Add an observer to receive notifications about Amazon background replacement processor events.
   * See {@link BackgroundReplacementVideoFrameProcessorObserver} for details.
   * If the observer has already been added, this method call has no effect.
   */
  addObserver(observer: BackgroundReplacementVideoFrameProcessorObserver): void;

  /**
   * Remove an existing observer. If the observer has not been previously {@link
   * BackgroundReplacementVideoFrameProcessorObserver.addObserver|added}, this method call has no effect.
   */
  removeObserver(observer: BackgroundReplacementVideoFrameProcessorObserver): void;

  /**
   * The method will allow the builder to update the image blob mid stream.
   * @param blob
   */
  setImageBlob(blob: Blob): Promise<void>;

  /** @internal */
  /**
   * internal method to load assets like WASM files, web workers, and ML models.
   */
  loadAssets(): Promise<void>;
}
