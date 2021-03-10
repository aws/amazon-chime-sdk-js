// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Scheduler from './Scheduler';

/**
 * [[IntervalScheduler]] calls the callback every intervalMs milliseconds.
 */
export default class IntervalScheduler implements Scheduler {
  timer: undefined | ReturnType<typeof setInterval>;

  constructor(private intervalMs: number) {}

  start(callback: () => void): void {
    this.stop();
    this.timer = setInterval(callback, this.intervalMs);
  }

  stop(): void {
    if (this.timer === undefined) {
      return;
    }
    clearInterval(this.timer);
    this.timer = undefined;
  }

  running(): boolean {
    return this.timer !== undefined;
  }
}
