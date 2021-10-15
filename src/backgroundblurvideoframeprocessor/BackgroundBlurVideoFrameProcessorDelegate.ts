// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackgroundBlurVideoFrameProcessorObserver from './BackgroundBlurVideoFrameProcessorObserver';

/** @internal */
export default class BackgroundBlurVideoFrameProcessorDelegate {
  private observers: Set<BackgroundBlurVideoFrameProcessorObserver> = new Set();

  addObserver(observer: BackgroundBlurVideoFrameProcessorObserver): void {
    this.observers.add(observer);
  }

  removeObserver(observer: BackgroundBlurVideoFrameProcessorObserver): void {
    this.observers.delete(observer);
  }

  filterFrameDurationHigh(event: {
    framesDropped: number;
    avgFilterDurationMillis: number;
    framerate: number;
    periodMillis: number;
  }): void {
    for (const observer of this.observers) {
      observer.filterFrameDurationHigh?.call(observer, event);
    }
  }
}
