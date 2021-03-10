// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import TimeoutScheduler from './TimeoutScheduler';

/**
 * [[AsyncScheduler]] enqueues the callback for the soonest available run of the
 * event loop.
 */
export default class AsyncScheduler extends TimeoutScheduler {
  constructor() {
    super(0);
  }

  /**
   * Execute the provided callback on the next tick of the event loop.
   * This is semantically equivalent to
   *
   * ```typescript
   * new AsyncScheduler(callback).start();
   * ```
   *
   * but with less overhead.
   *
   * @param callback the code to run.
   */
  static nextTick(callback: () => void): void {
    setTimeout(callback, 0);
  }
}
