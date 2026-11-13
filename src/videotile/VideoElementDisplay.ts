// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoElementObjectFit from './VideoElementObjectFit';

/**
 * [[VideoElementDisplay]] describes how a video element is displayed.
 */
export default interface VideoElementDisplay {
  /**
   * The width of the element on screen in CSS pixels, from `getBoundingClientRect`, which includes CSS transforms.
   * Multiply by `devicePixelRatio()` for device pixels.
   */
  boundingWidth: number;

  /**
   * The height of the element on screen in CSS pixels, from `getBoundingClientRect`, which includes CSS transforms.
   */
  boundingHeight: number;

  /**
   * The percent of the element inside the viewport at the last intersection change. 0 when the element is not
   * connected or its box is empty. It does not include `visibility` or `opacity`; see `isRendered`.
   */
  intersectionPercent: number;

  /**
   * The computed CSS `object-fit` of the element.
   */
  objectFit: VideoElementObjectFit;

  /**
   * Whether the element's content box equals the video's intrinsic size within 1 pixel, as when the element has no
   * size of its own.
   */
  intrinsicLayout: boolean;

  /**
   * Whether the element is rendered now, by `checkVisibility` with `opacity` and `visibility`. Those change without
   * a resize or intersection change, so read this when the value is used. It is a style check, not a layout read.
   */
  isRendered: () => boolean;

  /**
   * The device pixel ratio now. It changes without a resize, for example when the window moves to another
   * display, so read this when the value is used.
   */
  devicePixelRatio: () => number;
}
