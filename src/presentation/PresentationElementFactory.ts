// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenViewingImageDimensions from '../screenviewing/messagehandler/ScreenViewingImageDimensions';
import PresentationContentElement from './PresentationContentElement';
import PresentationSourceElement from './PresentationSourceElement';
import PresentationViewportElement from './PresentationViewportElement';

export default class PresentationElementFactory {
  static createContent(element: HTMLElement, window: Window): PresentationContentElement {
    return {
      getPosition(): string {
        return element.style.position;
      },
      getDimensions(): [number, number] {
        return [
          parseFloat(window.getComputedStyle(element).width.replace('px', '')),
          parseFloat(window.getComputedStyle(element).height.replace('px', '')),
        ];
      },
      getTranslations(): [number, number] {
        return [
          parseFloat(window.getComputedStyle(element).left.replace('px', '')),
          parseFloat(window.getComputedStyle(element).top.replace('px', '')),
        ];
      },
      setPosition(position: string): void {
        element.style.position = position;
      },
      setDimensions([width, height]: [number, number]): void {
        element.style.width = width + 'px';
        element.style.height = height + 'px';
      },
      setTranslations([left, top]: [number, number]): void {
        element.style.left = left + 'px';
        element.style.top = top + 'px';
      },
    };
  }

  static createSource(imageDimensions: ScreenViewingImageDimensions): PresentationSourceElement {
    return {
      getDimensions(): [number, number] {
        return [imageDimensions.imageWidthPixels, imageDimensions.imageHeightPixels];
      },
    };
  }

  static createViewport(element: HTMLElement, window: Window): PresentationViewportElement {
    return {
      getDimensions(): [number, number] {
        return [
          parseFloat(window.getComputedStyle(element).width.replace('px', '')),
          parseFloat(window.getComputedStyle(element).height.replace('px', '')),
        ];
      },
      setOverflow(overflow: string): void {
        element.style.overflow = overflow;
      },
      setPosition(position: string): void {
        element.style.position = position;
      },
    };
  }
}
