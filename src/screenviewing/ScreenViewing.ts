// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenObserver from './observer/ScreenObserver';
import ScreenViewingSessionConnectionRequest from './session/ScreenViewingSessionConnectionRequest';

export default interface ScreenViewing {
  /**
   * Returns a task for initializing the screen viewing components
   */
  open(request: ScreenViewingSessionConnectionRequest): Promise<void>;

  /**
   * Closes the screen viewing
   */
  close(): Promise<void>;

  /**
   * Starts the screen viewing given a div to create a canvas within
   * @param canvasContainer
   */
  start(canvasContainer: HTMLDivElement): Promise<void>;

  /**
   * Stops the screen viewing
   */
  stop(): Promise<void>;

  /**
   * Changes the presentation policy to scale-to-fit
   */
  presentScaleToFit(): void;

  /**
   * Changes the presentation policy to allow dragging and zooming
   */
  presentDragAndZoom(): void;

  /**
   * Zooms in
   */
  zoomIn(relativeZoomFactor?: number): void;

  /**
   * Zooms out
   */
  zoomOut(relativeZoomFactor?: number): void;

  /**
   * Zooms
   * @param absoluteZoomFactor
   */
  zoom(absoluteZoomFactor: number): void;

  /**
   * Resets zoom
   */
  zoomReset(): void;

  /**
   * Registers signaling observer
   * @param observer
   */
  registerObserver(observer: ScreenObserver): void;

  /**
   * Unregisters signaling observer
   * @param observer
   */
  unregisterObserver(observer: ScreenObserver): void;
}
