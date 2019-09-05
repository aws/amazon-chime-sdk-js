// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DragType from '../../dragobserver/DragType';
import PresentationPolicy, {
  PresentationContentPlacement,
  PresentationState,
  PresentationUpdateEvent,
  ZoomType,
} from './PresentationPolicy';
import ScaleToFitPresentationPolicy from './ScaleToFitPresentationPolicy';

export default class DragAndZoomPresentationPolicy implements PresentationPolicy {
  calculate = (
    state: PresentationState,
    updateEvent?: PresentationUpdateEvent
  ): PresentationContentPlacement => {
    const newContentDimensions: [
      number,
      number
    ] = DragAndZoomPresentationPolicy.getNewContentDimensions(
      state.contentPlacement.dimensions,
      state.sourceDimensions,
      updateEvent
    );

    if (
      DragAndZoomPresentationPolicy.shouldScaleToFit(
        newContentDimensions,
        state.viewportDimensions,
        updateEvent
      )
    ) {
      return new ScaleToFitPresentationPolicy().calculate(state);
    }
    if (updateEvent && updateEvent.drag && updateEvent.drag.type !== DragType.END) {
      // A drag event has occurred, the content placement's translations are dependent on the focus
      return {
        dimensions: newContentDimensions,
        translations: [
          state.focus.normalizedViewportFocus[0] * state.viewportDimensions[0] -
            state.focus.normalizedContentFocus[0] * newContentDimensions[0],
          state.focus.normalizedViewportFocus[1] * state.viewportDimensions[1] -
            state.focus.normalizedContentFocus[1] * newContentDimensions[1],
        ],
      };
    }
    // Dragging just ended or there's no dragging, center and remove whitespace
    return {
      dimensions: newContentDimensions,
      translations: [
        DragAndZoomPresentationPolicy.centerOrRemoveWhitespaceDim(
          newContentDimensions[0],
          state.contentPlacement.translations[0],
          state.viewportDimensions[0]
        ),
        DragAndZoomPresentationPolicy.centerOrRemoveWhitespaceDim(
          newContentDimensions[1],
          state.contentPlacement.translations[1],
          state.viewportDimensions[1]
        ),
      ],
    };
  };

  static centerOrRemoveWhitespaceDim = (
    contentDim: number,
    translation: number,
    viewportDim: number
  ): number => {
    if (contentDim <= viewportDim) {
      // The content placement's dimension is smaller than the viewport's, center it
      return viewportDim / 2 - contentDim / 2;
    }
    if (translation > 0) {
      // The content placement has a positive translation, make it flush against that border
      return 0;
    }
    const right = translation + contentDim;
    if (right < viewportDim) {
      // The content placement has a positive translation on the other side, make it flush against that border
      return viewportDim - contentDim;
    }
    // The content is zoomed such that there's no whitespace, retain the current translation
    return translation;
  };

  static shouldScaleToFit = (
    [newContentWidth, newContentHeight]: [number, number],
    [viewportWidth, viewportHeight]: [number, number],
    updateEvent?: PresentationUpdateEvent
  ): boolean => {
    // Should scale to fit if a reset zoom event occurred or, after applying a zoom event, the content width and height
    // are smaller than the viewport width and height
    return (
      (updateEvent && updateEvent.zoom && updateEvent.zoom.type === ZoomType.RESET) ||
      (newContentWidth <= viewportWidth && newContentHeight <= viewportHeight)
    );
  };

  static getNewContentDimensions(
    currentContentDims: [number, number],
    sourceDims: [number, number],
    updateEvent: PresentationUpdateEvent
  ): [number, number] {
    // If a zoom event is present, apply the zoom factor
    if (updateEvent && updateEvent.zoom && updateEvent.zoom.relativeFactor) {
      return currentContentDims.map(d => d * updateEvent.zoom.relativeFactor) as [number, number];
    }
    if (updateEvent && updateEvent.zoom && updateEvent.zoom.absoluteFactor) {
      return sourceDims.map(d => d * updateEvent.zoom.absoluteFactor) as [number, number];
    }
    return currentContentDims;
  }
}
