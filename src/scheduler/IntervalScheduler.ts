// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Scheduler from './Scheduler';

/**
 * [[IntervalScheduler]] calls the callback every intervalMs milliseconds.
 */
export default class IntervalScheduler implements Scheduler {
  // eslint-disable-next-line
  timer: any = null;

  constructor(private intervalMs: number) {}

  start(callback: () => void): void {
    this.stop();
    this.timer = setInterval(callback, this.intervalMs);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
    }
  }
}
