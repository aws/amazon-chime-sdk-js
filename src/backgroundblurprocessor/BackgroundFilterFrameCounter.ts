// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import BackgroundBlurVideoFrameProcessorDelegate from './BackgroundBlurVideoFrameProcessorDelegate';

const FILTER_DURATION_FACTOR = 0.8;

/**
 * The frame counter tracks frame rates of video and segmentation.
 */
/** @internal */
export default class BackgroundFilterFrameCounter {
  private _processingFilter: boolean = true;

  private lastReportedEventTimestamp: number = 0;
  private lastFilterCompleteTimestamp: number = 0;
  private filterTotalMillis: number = 0;

  private filterCount: number = 0;
  private framerate: number = 0;
  private filterDurationNotifyMillis = 0;

  constructor(
    private delegate: BackgroundBlurVideoFrameProcessorDelegate,
    private reportingPeriodMillis: number,
    private filterCPUUtilization: number,
    private logger: Logger
  ) {
    this.setSegmentationDuration();
  }

  /**
   * Report events once per period.
   */
  private reportEvent(timestamp: number): void {
    const timeDiff = timestamp - this.lastReportedEventTimestamp;
    if (timeDiff >= this.reportingPeriodMillis) {
      const currentFilterCount = this.filterCount;
      const currentFilterTotalMillis = this.filterTotalMillis;

      this.filterCount = 0;
      this.filterTotalMillis = 0;
      this.lastReportedEventTimestamp = timestamp;

      // Do not send notification unless a valid framerate or segment count is set.
      if (this.framerate === 0 || currentFilterCount === 0) {
        return;
      }

      const avgFilterDurationMillis = Math.round(currentFilterTotalMillis / currentFilterCount);
      const framesDropped = Math.round(this.framerate * (timeDiff / 1000)) - currentFilterCount;
      const cpuUtilization = Math.round((100 * currentFilterTotalMillis) / timeDiff);

      if (avgFilterDurationMillis >= this.filterDurationNotifyMillis) {
        this.delegate.filterFrameDurationHigh({
          framesDropped,
          avgFilterDurationMillis,
          framerate: this.framerate,
          periodMillis: timeDiff,
        });
      }

      if (cpuUtilization >= this.filterCPUUtilization) {
        this.delegate.filterCPUUtilizationHigh({
          cpuUtilization,
          filterMillis: currentFilterTotalMillis,
          periodMillis: timeDiff,
        });
      }
    }
  }

  private setSegmentationDuration(): void {
    // allow filtering to take up to 80% of the expected frame duration
    this.filterDurationNotifyMillis = Math.round((1000 / this.framerate) * FILTER_DURATION_FACTOR);
  }

  frameReceived(framerate: number): void {
    if (framerate !== this.framerate) {
      this.framerate = framerate;
      this.logger.info(`frame counter setting frame rate to ${this.framerate}`);
      this.setSegmentationDuration();
    }
    const timestamp = Date.now();
    this.reportEvent(timestamp);
  }

  filterSubmitted(): void {
    this._processingFilter = true;
    this.lastFilterCompleteTimestamp = Date.now();
  }

  filterComplete(): void {
    this.filterTotalMillis += Date.now() - this.lastFilterCompleteTimestamp;
    this._processingFilter = false;
    this.filterCount++;
  }

  get processingSegment(): boolean {
    return this._processingFilter;
  }
}
