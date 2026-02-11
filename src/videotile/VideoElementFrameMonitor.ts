// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Metrics collected from a video element's rendered frames.
 */
export interface VideoElementFrameMetrics {
  /**
   * Current frames per second.
   */
  fps: number;

  /**
   * Timestamp of the measurement in milliseconds since epoch.
   */
  timestampMs: number;
}

/**
 * Observer for frame-level events on a video element.
 */
export interface VideoElementFrameObserver {
  /**
   * Called when the first video frame is rendered.
   * @param metadata The VideoFrameCallbackMetadata, if available (only on browsers supporting requestVideoFrameCallback)
   */
  firstVideoElementFrameDidRender?(metadata?: VideoFrameCallbackMetadata): void;

  /**
   * Called periodically with render metrics (e.g. FPS).
   * Only fires on browsers that support requestVideoFrameCallback.
   * @param metrics The collected metrics
   */
  videoElementFrameMetricsDidReceive?(metrics: VideoElementFrameMetrics): void;
}

/**
 * Monitors a video element for first-frame rendering and ongoing FPS metrics.
 *
 * Internally uses requestVideoFrameCallback when available (Chrome/Edge) and
 * falls back to the 'resize' event for first-frame detection on other browsers.
 * FPS tracking is only available when requestVideoFrameCallback is supported.
 */
export default class VideoElementFrameMonitor {
  private static readonly METRICS_INTERVAL_MS = 1000;

  private element: HTMLVideoElement | null = null;
  private observer: VideoElementFrameObserver | null = null;
  private firstFrameRendered: boolean = false;

  // requestVideoFrameCallback-based tracking
  private videoFrameCallbackId: number | null = null;
  private metricsCallbackId: number | null = null;
  private frameCount: number = 0;
  private metricsWindowStartMs: number = 0;

  // Resize fallback
  private resizeListener: (() => void) | null = null;

  private get supportsVideoFrameCallback(): boolean {
    return this.element !== null && 'requestVideoFrameCallback' in this.element;
  }

  /**
   * Start monitoring the given element with the given observer.
   * Any previous monitoring is stopped first.
   */
  start(element: HTMLVideoElement, observer: VideoElementFrameObserver): void {
    this.stop();
    this.element = element;
    this.observer = observer;
    this.firstFrameRendered = false;
    this.startFirstFrameDetection();
  }

  /**
   * Stop monitoring and release all resources.
   */
  stop(): void {
    if (!this.element) {
      return;
    }
    this.stopMetricsTracking();
    if (this.videoFrameCallbackId !== null) {
      this.element.cancelVideoFrameCallback(this.videoFrameCallbackId);
      this.videoFrameCallbackId = null;
    }
    if (this.resizeListener) {
      this.element.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }
    this.element = null;
    this.observer = null;
  }

  private startFirstFrameDetection(): void {
    if (this.supportsVideoFrameCallback) {
      this.videoFrameCallbackId = this.element.requestVideoFrameCallback((_now, metadata) => {
        this.videoFrameCallbackId = null;
        this.onFirstFrame(metadata);
      });
    } else {
      this.resizeListener = (): void => {
        if (this.element.videoWidth > 0 && this.element.videoHeight > 0) {
          this.element.removeEventListener('resize', this.resizeListener);
          this.resizeListener = null;
          this.onFirstFrame();
        }
      };
      this.element.addEventListener('resize', this.resizeListener);
    }
  }

  private onFirstFrame(metadata?: VideoFrameCallbackMetadata): void {
    if (this.firstFrameRendered) return;
    this.firstFrameRendered = true;
    /* istanbul ignore next */
    this.observer?.firstVideoElementFrameDidRender?.(metadata);
    if (this.supportsVideoFrameCallback) {
      this.startMetricsTracking();
    }
  }

  private startMetricsTracking(): void {
    this.frameCount = 0;
    this.metricsWindowStartMs = Date.now();
    this.scheduleMetricsCallback();
  }

  private scheduleMetricsCallback(): void {
    if (!this.element) return;
    this.metricsCallbackId = this.element.requestVideoFrameCallback(() => {
      this.frameCount++;
      const now = Date.now();
      const elapsed = now - this.metricsWindowStartMs;
      if (elapsed >= VideoElementFrameMonitor.METRICS_INTERVAL_MS) {
        const fps = Math.round((this.frameCount * 1000) / elapsed);
        /* istanbul ignore next */
        this.observer?.videoElementFrameMetricsDidReceive?.({ fps, timestampMs: now });
        this.frameCount = 0;
        this.metricsWindowStartMs = now;
      }
      this.scheduleMetricsCallback();
    });
  }

  private stopMetricsTracking(): void {
    if (
      this.metricsCallbackId !== null &&
      this.element &&
      'cancelVideoFrameCallback' in this.element
    ) {
      this.element.cancelVideoFrameCallback(this.metricsCallbackId);
      this.metricsCallbackId = null;
    }
    this.frameCount = 0;
    this.metricsWindowStartMs = 0;
  }
}
