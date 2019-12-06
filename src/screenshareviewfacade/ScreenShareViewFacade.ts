// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenObserver from '../screenviewing/observer/ScreenObserver';

export default interface ScreenShareViewFacade {
  /**
   * Opens the connections, must be called after the ScreenShareViewFacade is constructed
   */
  open(): Promise<void>;

  /**
   * Closes screen viewing connection
   */
  close(): Promise<void>;

  /**
   * Starts viewing the screen share within an HTML element. Note that an
   * HTMLCanvas will be placed inside of this element.
   */
  start(element: HTMLDivElement): void;

  /**
   * Stops viewing the screen share.
   */
  stop(): void;

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
   */
  zoom(absoluteZoomFactor: number): void;

  /**
   * Resets zoom
   */
  zoomReset(): void;

  /**
   * Registers an observer
   */
  registerObserver(observer: ScreenObserver): void;

  /**
   * Unregisters an observer
   */
  unregisterObserver(observer: ScreenObserver): void;
}
