// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[VideoFrameProcessorTimer]] defines a timer used in the context of video frame processing.
 */
export default interface VideoFrameProcessorTimer {
  /**
   * Starts the timer with a specified delay and callback function.
   * @param delay The delay in milliseconds after which the callback function should be invoked.
   * @param callback The function to be called when the timer expires.
   */
  start(delay: number, callback: () => void): void;

  /**
   * Destroys the timer, clearing any ongoing timeout or interval, and releasing any resources.
   */
  destroy(): void;
}
