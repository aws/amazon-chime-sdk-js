// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoFrameProcessor from '../videoframeprocessor/VideoFrameProcessor';
import BackgroundBlurVideoFrameProcessorObserver from './BackgroundBlurVideoFrameProcessorObserver';

/**
 * Interface to define extra methods that need to be implemented for background blur processing
 */
export default interface BackgroundBlurProcessor extends VideoFrameProcessor {
  /**
   * Add an observer to receive notifications about Amazon background blur processor events.
   * See {@link BackgroundBlurVideoFrameProcessorObserver} for details.
   * If the observer has already been added, this method call has no effect.
   */
  addObserver(observer: BackgroundBlurVideoFrameProcessorObserver): void;

  /**
   * Remove an existing observer. If the observer has not been previously {@link
   * BackgroundBlurVideoFrameProcessorObserver.addObserver|added}, this method call has no effect.
   */
  removeObserver(observer: BackgroundBlurVideoFrameProcessorObserver): void;

  /**
   * This setter will allow setting the blur strength mid stream. The process method will use this
   * setting on the next frame that is processed.
   */
  setBlurStrength(blurStrength: number): void;

  /** @internal */
  /**
   * internal method to load assets like WASM files, web workers, and ML models.
   */
  loadAssets(): Promise<void>;
}
