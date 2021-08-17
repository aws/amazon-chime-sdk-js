// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import ResourceMonitor from '../resourcemonitor/ResourceMonitor';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import IntervalScheduler from '../scheduler/IntervalScheduler';

/**
 * [[DefaultResourceMonitor]] uses an execution time of the setTimeout with a zero delay
 * to estimate resource consumption. If the execution time exceeds the given threshold,
 * this monitor outputs a log message.
 * @internal
 */
export default class DefaultResourceMonitor implements ResourceMonitor {
  private readonly intervalScheduler: IntervalScheduler;

  private count: number = 0;
  private timestampMs: number = 0;

  constructor(
    private readonly logger: Logger,
    private readonly dataPoints: number = 3,
    private readonly intervalMs: number = 5000,
    private readonly thresholdMs: number = 100,
    private readonly waitTimeMs: number = 30000
  ) {
    this.intervalScheduler = new IntervalScheduler(this.intervalMs);
  }

  start(): void {
    this.intervalScheduler.start(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      const start = performance.now();
      new AsyncScheduler().start(() => {
        const elapsed = performance.now() - start;
        this.logger.debug(`resource monitor: ${elapsed}`);

        if (elapsed >= this.thresholdMs) {
          this.count += 1;
        } else {
          this.count = 0;
        }

        if (this.count >= this.dataPoints && Date.now() - this.timestampMs > this.waitTimeMs) {
          this.logger.info('insufficient resources');
          this.timestampMs = Date.now();
        }
      });
    });
  }

  stop(): void {
    this.intervalScheduler.stop();
  }
}
