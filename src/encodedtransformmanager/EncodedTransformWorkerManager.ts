// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DisabledEncodedTransformsConfiguration } from '../encodedtransformworker/EncodedTransformWorker';
import MediaMetricsTransformManager from './MediaMetricsEncodedTransformManager';
import RedundantAudioEncodedTransformManager from './RedundantAudioEncodedTransformManager';

/**
 * Observer interface for media transform manager events.
 */
export interface EncodedTransformWorkerManagerObserver {
  /**
   * Called when the encoded transform manager encounters a failure.
   */
  onEncodedTransformWorkerManagerFailed?(error: Error): void;
}

/**
 * Interface for managing media transforms across audio and video streams.
 * Implementations coordinate transform managers and handle Web Worker lifecycle.
 */
export default interface EncodedTransformWorkerManager {
  /**
   * Check if media transforms are enabled. If this class runs into any issue during a transform
   * it should disable itself.
   *
   * @returns true if transforms are enabled and supported
   */
  isEnabled(): boolean;

  /**
   * Start the manager and create the Web Worker
   *
   * @param disabledTransforms - Optional configuration to disable specific transforms.
   *                             By default all transforms are enabled (false = enabled).
   *                             - redundantAudio: When true, redundant audio encoding transform is disabled.
   */
  start(disabledTransforms?: DisabledEncodedTransformsConfiguration): Promise<void>;

  /**
   * Get the redundant audio encode transform manager for access to transform specific functionality
   */
  redundantAudioEncodeTransformManager(): RedundantAudioEncodedTransformManager | undefined;

  /**
   * Get the media metrics transform manager for access to transform specific functionality
   */
  metricsTransformManager(): MediaMetricsTransformManager | undefined;

  /**
   * Set up encoded transforms for an audio sender
   */
  setupAudioSenderTransform(sender: RTCRtpSender): void;

  /**
   * Set up encoded transforms for an audio receiver
   */
  setupAudioReceiverTransform(receiver: RTCRtpReceiver): void;

  /**
   * Set up encoded transforms for a video sender
   */
  setupVideoSenderTransform(sender: RTCRtpSender): void;

  /**
   * Set up encoded transforms for a video receiver
   */
  setupVideoReceiverTransform(receiver: RTCRtpReceiver): void;

  /**
   * Add an observer to receive transform manager events
   */
  addObserver(observer: EncodedTransformWorkerManagerObserver): void;

  /**
   * Remove an observer
   */
  removeObserver(observer: EncodedTransformWorkerManagerObserver): void;

  /**
   * Stop all transform managers and reset to initial state
   */
  stop(): Promise<void>;
}
