// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Destroyable from '../destroyable/Destroyable';

/**
 * [[VideoFrameProcessorTimer]] defines a timer used in the context of video frame processing.
 */
export default interface VideoFrameProcessorTimer extends Destroyable {
  /**
   * Starts the timer with a specified delay and callback function.
   * @param delay The delay in milliseconds after which the callback function should be invoked.
   * @param callback The function to be called when the timer expires.
   */
  start(delay: number, callback: () => void): Promise<void>;
}
