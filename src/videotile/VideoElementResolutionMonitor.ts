// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { VideoElementFrameMetrics } from './VideoElementFrameMonitor';

/**
 * Observer for video element events including resolution changes, first-frame detection,
 * and render metrics.
 *
 * This interface has expanded beyond resolution and should eventually be renamed.
 */
export interface VideoElementResolutionObserver {
  /**
   * Called when the resolution of the video element changes.
   * @param newWidth The new width of the video element.
   * @param newHeight The new height of the video element.
   */
  videoElementResolutionChanged(newWidth: number, newHeight: number): void;

  /**
   * Called when the first video frame is rendered.
   * @param metadata The VideoFrameCallbackMetadata from requestVideoFrameCallback, if available
   */
  videoElementFirstFrameDidRender?(metadata?: VideoFrameCallbackMetadata): void;

  /**
   * Called periodically with video element render metrics (e.g. rendered FPS).
   * Only fires on browsers that support requestVideoFrameCallback.
   * @param metrics The collected metrics
   */
  videoElementMetricsDidReceive?(metrics: VideoElementFrameMetrics): void;
}

/**
 * [[VideoElementResolutionMonitor]] monitors a video element for resolution changes,
 * first-frame rendering, and render metrics.
 *
 * This interface has expanded beyond resolution and should eventually be renamed.
 */
export default interface VideoElementResolutionMonitor {
  /**
   * Registers an observer that will be notified when the resolution of the video element changes,
   * or when the video element is unbound.
   * @param observer An instance of VideoElementResolutionObserver that will receive update notifications.
   */
  registerObserver(observer: VideoElementResolutionObserver): void;

  /**
   * Removes a previously registered observer, stopping it from receiving any further notifications.
   * @param observer The observer to be removed from the notification queue.
   */
  removeObserver(observer: VideoElementResolutionObserver): void;
  /**
   * Binds a new HTMLVideoElement for monitoring. If a video element is already bound, it is unbound
   * and the new element is bound in its place. A null value just unbinds.
   * @param newElement The new HTMLVideoElement to be monitored, or null to unbind.
   */
  bindVideoElement(newElement: HTMLVideoElement | null): void;
}
