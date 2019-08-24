// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DragEvent from '../dragobserver/DragEvent';
import PresentationPolicy, { ZoomEvent } from './policy/PresentationPolicy';
import PresentationContentElement from './PresentationContentElement';
import PresentationSourceElement from './PresentationSourceElement';
import PresentationViewportElement from './PresentationViewportElement';

export default interface Presentation {
  /**
   * Present the content from the source to the viewport with the presentation policy
   */
  present(
    source: PresentationSourceElement,
    viewport: PresentationViewportElement,
    content: PresentationContentElement,
    policy: PresentationPolicy,
    zoomEvent?: ZoomEvent,
    dragEvent?: DragEvent
  ): void;
}
