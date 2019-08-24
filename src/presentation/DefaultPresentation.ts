// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DragEvent from '../dragobserver/DragEvent';
import DragType from '../dragobserver/DragType';
import PresentationPolicy, {
  PresentationContentPlacement,
  PresentationState,
  ZoomEvent,
} from './policy/PresentationPolicy';
import Presentation from './Presentation';
import PresentationBoxType from './PresentationBoxType';
import PresentationContentElement from './PresentationContentElement';
import PresentationSourceElement from './PresentationSourceElement';
import PresentationViewportElement from './PresentationViewportElement';

const CSS_OVERFLOW_HIDDEN = 'hidden';
const CSS_POSITION_ABSOLUTE = 'absolute';
const CSS_POSITION_RELATIVE = 'relative';

export default class DefaultPresentation implements Presentation {
  present(
    source: PresentationSourceElement,
    viewport: PresentationViewportElement,
    content: PresentationContentElement,
    policy: PresentationPolicy,
    zoomEvent?: ZoomEvent,
    dragEvent?: DragEvent
  ): void {
    const viewportAspectRatio: number = viewport.getDimensions()[0] / viewport.getDimensions()[1];
    const sourceAspectRatio: number = source.getDimensions()[0] / source.getDimensions()[1];
    const contentPlacement: PresentationContentPlacement = {
      dimensions: content.getDimensions(),
      translations: content.getTranslations(),
    };
    const state: PresentationState = {
      contentPlacement,
      sourceDimensions: source.getDimensions(),
      sourceAspectRatio: sourceAspectRatio,
      viewportDimensions: viewport.getDimensions(),
      viewportAspectRatio: viewportAspectRatio,
      scale: content.getDimensions()[0] / source.getDimensions()[0],
      boxType: DefaultPresentation.boxType(sourceAspectRatio, viewportAspectRatio),
      focus: {
        normalizedContentFocus: DefaultPresentation.contentFocus(contentPlacement, dragEvent),
        normalizedViewportFocus: DefaultPresentation.viewportFocus(
          viewport.getDimensions(),
          dragEvent
        ),
      },
    };
    const newPlacement: PresentationContentPlacement = policy.calculate(state, {
      zoom: zoomEvent,
      drag: dragEvent,
    });
    viewport.setPosition(CSS_POSITION_RELATIVE);
    viewport.setOverflow(CSS_OVERFLOW_HIDDEN);
    content.setPosition(CSS_POSITION_ABSOLUTE);
    content.setDimensions(newPlacement.dimensions);
    content.setTranslations(newPlacement.translations);
  }

  static cssPixels = (value: number): string => {
    return `${value}px`;
  };

  static boxType = (
    sourceAspectRatio: number,
    viewportAspectRatio: number
  ): PresentationBoxType => {
    if (sourceAspectRatio > viewportAspectRatio) {
      return PresentationBoxType.LETTER_BOX;
    }
    if (sourceAspectRatio < viewportAspectRatio) {
      return PresentationBoxType.PILLAR_BOX;
    }
    return PresentationBoxType.NONE;
  };

  static contentFocus = (
    contentPlacement: PresentationContentPlacement,
    dragEvent?: DragEvent
  ): [number, number] => {
    if (!dragEvent || dragEvent.type === DragType.END) {
      return [0.5, 0.5];
    }
    if (dragEvent.type === DragType.BEGIN) {
      return [
        (dragEvent.coords[0] - contentPlacement.translations[0]) / contentPlacement.dimensions[0],
        (dragEvent.coords[1] - contentPlacement.translations[1]) / contentPlacement.dimensions[1],
      ];
    }
    return [
      (dragEvent.last.coords[0] - contentPlacement.translations[0]) /
        contentPlacement.dimensions[0],
      (dragEvent.last.coords[1] - contentPlacement.translations[1]) /
        contentPlacement.dimensions[1],
    ];
  };

  static viewportFocus = (
    viewportDims: [number, number],
    dragEvent?: DragEvent
  ): [number, number] => {
    if (!dragEvent || dragEvent.type === DragType.END) {
      return [0.5, 0.5];
    }
    return [dragEvent.coords[0] / viewportDims[0], dragEvent.coords[1] / viewportDims[1]];
  };
}
