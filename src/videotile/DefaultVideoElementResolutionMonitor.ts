// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoElementFrameMonitor from './VideoElementFrameMonitor';
import VideoElementResolutionMonitor, {
  VideoElementResolutionObserver,
} from './VideoElementResolutionMonitor';

export default class DefaultVideoElementResolutionMonitor implements VideoElementResolutionMonitor {
  private observerQueue = new Set<VideoElementResolutionObserver>();
  private resizeObserver: ResizeObserver;
  private element: HTMLVideoElement | null = null;
  private frameMonitor: VideoElementFrameMonitor = new VideoElementFrameMonitor();

  constructor() {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        for (const observer of this.observerQueue) {
          observer.videoElementResolutionChanged(width, height);
        }
      }
    });
  }

  registerObserver(observer: VideoElementResolutionObserver): void {
    this.observerQueue.add(observer);
  }

  removeObserver(observer: VideoElementResolutionObserver): void {
    this.observerQueue.delete(observer);
  }

  bindVideoElement(newElement: HTMLVideoElement | null): void {
    if (this.element === newElement) {
      return;
    }
    if (this.element) {
      this.resizeObserver.unobserve(this.element);
      this.frameMonitor.stop();
    }
    this.element = newElement;
    if (this.element) {
      this.resizeObserver.observe(this.element);
      this.frameMonitor.start(this.element, {
        firstVideoElementFrameDidRender: (metadata?: VideoFrameCallbackMetadata): void => {
          for (const observer of this.observerQueue) {
            observer.videoElementFirstFrameDidRender?.(metadata);
          }
        },
        videoElementFrameMetricsDidReceive: (metrics): void => {
          for (const observer of this.observerQueue) {
            observer.videoElementMetricsDidReceive?.(metrics);
          }
        },
      });
    }
  }
}
