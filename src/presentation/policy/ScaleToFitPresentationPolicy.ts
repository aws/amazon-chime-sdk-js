// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import PresentationBoxType from '../PresentationBoxType';
import PresentationPolicy, {
  PresentationContentPlacement,
  PresentationState,
} from './PresentationPolicy';

export default class ScaleToFitPresentationPolicy implements PresentationPolicy {
  calculate = (state: PresentationState): PresentationContentPlacement => {
    switch (state.boxType) {
      case PresentationBoxType.LETTER_BOX:
        const height = state.viewportDimensions[0] / state.sourceAspectRatio;
        return {
          dimensions: [state.viewportDimensions[0], height],
          translations: [0, state.viewportDimensions[1] / 2 - height / 2],
        };
      case PresentationBoxType.PILLAR_BOX:
        const width = state.viewportDimensions[1] * state.sourceAspectRatio;
        return {
          dimensions: [width, state.viewportDimensions[1]],
          translations: [state.viewportDimensions[0] / 2 - width / 2, 0],
        };
      case PresentationBoxType.NONE:
        return {
          dimensions: state.viewportDimensions,
          translations: [0, 0],
        };
    }
  };
}
