// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoElementDisplay from './VideoElementDisplay';
import VideoElementFrameMonitor from './VideoElementFrameMonitor';
import VideoElementObjectFit from './VideoElementObjectFit';
import VideoElementResolutionMonitor, {
  VideoElementResolutionObserver,
} from './VideoElementResolutionMonitor';

const OBJECT_FITS: { [objectFit: string]: VideoElementObjectFit } = {
  fill: VideoElementObjectFit.Fill,
  contain: VideoElementObjectFit.Contain,
  cover: VideoElementObjectFit.Cover,
  none: VideoElementObjectFit.None,
  'scale-down': VideoElementObjectFit.ScaleDown,
};

// Report the visible percent in steps of 5.
const VISIBILITY_THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

export default class DefaultVideoElementResolutionMonitor implements VideoElementResolutionMonitor {
  private observerQueue = new Set<VideoElementResolutionObserver>();
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver | null = null;
  private element: HTMLVideoElement | null = null;
  private frameMonitor: VideoElementFrameMonitor = new VideoElementFrameMonitor();
  // Null until the IntersectionObserver reports the bound element, so no display is reported before.
  private intersectionRatio: number | null = null;
  private hasEmptyContentBox = false;
  private boundingWidth = 0;
  private boundingHeight = 0;
  private objectFit = VideoElementObjectFit.Fill;
  private intrinsicLayout = false;
  // False until the first resize callback for the bound element, so no display is reported with default layout.
  private hasLayout = false;
  private reportedDisplay: string | null = null;
  // IntersectionObserver ignores `visibility` and `opacity`; `checkVisibility` ignores the viewport and clipping.
  private isRendered = (): boolean => {
    const element = this.element;
    if (!element) {
      return false;
    }
    return (
      typeof element.checkVisibility !== 'function' ||
      element.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    );
  };

  constructor() {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        for (const observer of this.observerQueue) {
          observer.videoElementResolutionChanged(width, height);
        }
        // The display is reported only where IntersectionObserver is available.
        if (this.intersectionObserver) {
          this.readLayout(width, height);
          this.reportDisplay();
        }
      }
    });
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            this.intersectionRatio = entry.intersectionRatio;
            this.boundingWidth = entry.boundingClientRect.width;
            this.boundingHeight = entry.boundingClientRect.height;
            this.reportDisplay();
          }
        },
        { threshold: VISIBILITY_THRESHOLDS }
      );
    }
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
      this.intersectionObserver?.unobserve(this.element);
      this.frameMonitor.stop();
    }
    this.element = newElement;
    this.intersectionRatio = null;
    this.hasEmptyContentBox = false;
    this.boundingWidth = 0;
    this.boundingHeight = 0;
    this.objectFit = VideoElementObjectFit.Fill;
    this.intrinsicLayout = false;
    this.hasLayout = false;
    this.reportedDisplay = null;
    if (this.element) {
      this.resizeObserver.observe(this.element);
      this.intersectionObserver?.observe(this.element);
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

  // Reads what changes only with layout, so only from the resize callback.
  private readLayout(contentWidth: number, contentHeight: number): void {
    if (!this.element) {
      return;
    }
    this.hasLayout = true;
    this.hasEmptyContentBox = contentWidth === 0 || contentHeight === 0;
    const { width, height } = this.element.getBoundingClientRect();
    this.boundingWidth = width;
    this.boundingHeight = height;
    const { videoWidth, videoHeight } = this.element;
    this.intrinsicLayout =
      videoWidth > 0 &&
      videoHeight > 0 &&
      Math.abs(contentWidth - videoWidth) <= 1 &&
      Math.abs(contentHeight - videoHeight) <= 1;
    if (typeof getComputedStyle === 'function') {
      this.objectFit =
        OBJECT_FITS[getComputedStyle(this.element).objectFit] ?? VideoElementObjectFit.Fill;
    }
  }

  private reportDisplay(): void {
    if (this.intersectionRatio === null || !this.hasLayout || !this.element) {
      return;
    }
    const emptyBox =
      this.hasEmptyContentBox || this.boundingWidth === 0 || this.boundingHeight === 0;
    const intersecting = this.element.isConnected && !emptyBox;
    const display: VideoElementDisplay = {
      boundingWidth: emptyBox ? 0 : this.boundingWidth,
      boundingHeight: emptyBox ? 0 : this.boundingHeight,
      intersectionPercent: intersecting ? Math.round(this.intersectionRatio * 100) : 0,
      objectFit: this.objectFit,
      intrinsicLayout: this.intrinsicLayout,
      isRendered: this.isRendered,
    };
    const key = JSON.stringify(display);
    if (key === this.reportedDisplay) {
      return;
    }
    this.reportedDisplay = key;
    for (const observer of this.observerQueue) {
      observer.videoElementDisplayDidChange?.(display);
    }
  }
}
