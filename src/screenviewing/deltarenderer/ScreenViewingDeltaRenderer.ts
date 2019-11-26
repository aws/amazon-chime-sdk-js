// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import PresentationPolicy from '../../presentation/policy/PresentationPolicy';
import ScreenViewingImageDimensions from '../messagehandler/ScreenViewingImageDimensions';

export default interface ScreenViewingDeltaRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  syncBuffer: Uint8Array[][];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jpegDataArrays: Uint8Array[][];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hasRendered: boolean[][];
  imageDimensions: ScreenViewingImageDimensions;
  lastResizeAndSyncTime: number;

  /**
   * Builds the viewer.
   * @param imageDimensions
   */
  buildViewer(imageDimensions: ScreenViewingImageDimensions): void;

  /**
   * Syncs the renderer.
   */
  resizeAndSync(): void;

  setViewport(viewport: HTMLElement): void;

  hideViewport(): void;

  revealViewport(): void;

  changePresentationPolicy(policy: PresentationPolicy): void;

  close(): void;

  zoomRelative(relativeZoomFactor: number): void;

  zoomAbsolute(absoluteZoomFactor: number): void;

  zoomReset(): void;
}
