// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DragEvent from '../../dragobserver/DragEvent';
import PresentationBoxType from '../PresentationBoxType';

/**
 * [[PresentationContentPlacement]] describes the rectangular placement of the
 * content within its parent viewport.
 */
export interface PresentationContentPlacement {
  /**
   * The width and height of the content in CSS pixels.
   */
  dimensions: [number, number];

  /**
   * The left and top translations of the content in CSS pixels relative to the viewport
   */
  translations: [number, number];
}

/**
 * [[PresentationState]] represents everything known about the current placement
 * of the content within its parent viewport.
 */
export interface PresentationState {
  /**
   * The width and height of the viewport in CSS pixels.
   */
  viewportDimensions: [number, number];

  /**
   * The viewport width over height aspect ratio. For example if the viewport
   * has dimensions 640 x 480 then its aspect ratio is `1.33...`.
   */
  viewportAspectRatio: number;

  /**
   * The current content placement.
   */
  contentPlacement: PresentationContentPlacement;

  /**
   * The source width and height of the content.
   */
  sourceDimensions: [number, number];

  /**
   * The source width over height aspect ratio. For example if the content
   * has source dimensions 640 x 480 then its aspect ratio is `1.33...`.
   */
  sourceAspectRatio: number;

  /**
   * The size of the content relative to its source size. This is calculated
   * using the x-dimension, e.g. the content CSS pixel width divided by the
   * content source width. For example, if the source dimensions are 640 x 480
   * but the content CSS dimensions are currently 320 x 240 then the scale is
   * 0.5 (i.e. a zoom factor of 50%).
   */
  scale: number;

  /**
   * True if the source aspect ratio is greater than the viewport aspect ratio,
   * which indicates that a letterbox fit would be appropriate (gaps on top
   * and bottom) if the entire content is to be scaled to fit within the viewport.
   * Note that both [[letterBox]] and [[pillarBox]] will be false if the aspect
   * ratio of the source dimensions and the viewport match exactly.
   */
  boxType: PresentationBoxType;

  focus: {
    normalizedContentFocus: [number, number];
    normalizedViewportFocus: [number, number];
  };
}

export enum ZoomType {
  ZOOM,
  RESET,
  NONE,
}

export interface ZoomEvent {
  type: ZoomType;
  relativeFactor?: number;
  absoluteFactor?: number;
}

export interface PresentationUpdateEvent {
  drag?: DragEvent;
  zoom?: ZoomEvent;
}

export default interface PresentationPolicy {
  calculate: (
    state: PresentationState,
    updateEvent?: PresentationUpdateEvent
  ) => PresentationContentPlacement;
}
