// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoElementObjectFit from './VideoElementObjectFit';

/**
 * [[VideoElementDisplay]] describes how a video element is displayed.
 */
export default class VideoElementDisplay {
  /**
   * The width of the element's content box in CSS pixels, from the `ResizeObserver` content rect, which ignores
   * CSS transforms. Undefined when the content box is empty.
   */
  readonly contentWidth: number | undefined;

  /**
   * The height of the element's content box in CSS pixels, from the `ResizeObserver` content rect. Undefined when
   * the content box is empty.
   */
  readonly contentHeight: number | undefined;

  /**
   * The width of the element on screen in CSS pixels, from `getBoundingClientRect`, which includes CSS transforms.
   * 0 when the box is empty.
   */
  readonly boundingWidth: number;

  /**
   * The height of the element on screen in CSS pixels, from `getBoundingClientRect`. 0 when the box is empty.
   */
  readonly boundingHeight: number;

  /**
   * The percent of the element inside the viewport at the last intersection change. 0 when the element is not
   * connected or its box is empty. It does not include `visibility` or `opacity`; see `visiblePercent`.
   */
  readonly intersectionPercent: number;

  /**
   * The computed CSS `object-fit` of the element.
   */
  readonly objectFit: VideoElementObjectFit;

  /**
   * Whether the element's content box equals the video's intrinsic size within 1 pixel, as when the element has no
   * size of its own.
   */
  readonly intrinsicLayout: boolean;

  /**
   * Whether the element is rendered now, by `checkVisibility` with `opacity` and `visibility`.
   */
  readonly isRendered: () => boolean;

  /**
   * The device pixel ratio now.
   */
  readonly devicePixelRatio: () => number;

  constructor(
    display: Omit<VideoElementDisplay, 'devicePixelWidth' | 'devicePixelHeight' | 'visiblePercent'>
  ) {
    this.contentWidth = display.contentWidth;
    this.contentHeight = display.contentHeight;
    this.boundingWidth = display.boundingWidth;
    this.boundingHeight = display.boundingHeight;
    this.intersectionPercent = display.intersectionPercent;
    this.objectFit = display.objectFit;
    this.intrinsicLayout = display.intrinsicLayout;
    this.isRendered = display.isRendered;
    this.devicePixelRatio = display.devicePixelRatio;
  }

  /**
   * The on-screen width in device pixels, or undefined when the box is empty. The device pixel ratio is read on
   * each call, because it changes without a resize, for example when the window moves to another display.
   */
  devicePixelWidth(): number | undefined {
    return this.hasBox() ? Math.round(this.boundingWidth * this.devicePixelRatio()) : undefined;
  }

  /**
   * The on-screen height in device pixels, or undefined when the box is empty. The device pixel ratio is read on
   * each call.
   */
  devicePixelHeight(): number | undefined {
    return this.hasBox() ? Math.round(this.boundingHeight * this.devicePixelRatio()) : undefined;
  }

  /**
   * The percent of the element visible now: the intersection percent while `checkVisibility` passes, else 0.
   * `checkVisibility` is read on each call, because `opacity` and `visibility` change without a resize or
   * intersection change. It is a style check, not a layout read.
   */
  visiblePercent(): number {
    return this.isRendered() ? this.intersectionPercent : 0;
  }

  private hasBox(): boolean {
    return this.boundingWidth > 0 && this.boundingHeight > 0;
  }
}
