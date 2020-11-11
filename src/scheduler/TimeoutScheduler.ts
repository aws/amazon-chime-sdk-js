// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Scheduler from './Scheduler';
/**
 * [[TimeoutScheduler]] calls the callback once after timeoutMs milliseconds.
 */
export default class TimeoutScheduler implements Scheduler {
  // eslint-disable-next-line
  private timer: any = null;

  constructor(private timeoutMs: number) {}

  start(callback: () => void): void {
    this.stop();
    this.timer = setTimeout(() => {
      clearTimeout(this.timer);
      callback();
    }, this.timeoutMs);
  }

  stop(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
