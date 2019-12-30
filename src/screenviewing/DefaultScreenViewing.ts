// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DragAndZoomPresentationPolicy from '../presentation/policy/DragAndZoomPresentationPolicy';
import ScaleToFitPresentationPolicy from '../presentation/policy/ScaleToFitPresentationPolicy';
import ScreenViewingComponentContext from './context/ScreenViewingComponentContext';
import ScreenObserver from './observer/ScreenObserver';
import ScreenViewing from './ScreenViewing';
import ScreenViewingSessionConnectionRequest from './session/ScreenViewingSessionConnectionRequest';

export default class DefaultScreenViewing implements ScreenViewing {
  private request?: ScreenViewingSessionConnectionRequest;

  constructor(private componentContext: ScreenViewingComponentContext) {}

  /**
   * Opens the screen signaling connection
   * @param request
   */
  open(request: ScreenViewingSessionConnectionRequest): Promise<void> {
    this.request = request;
    return this.componentContext.jpegDecoderController
      .init()
      .then(() => this.componentContext.signalingSession.open(request))
      .then(() => {});
  }

  /**
   * Stops screen viewing and closes the screen signaling connection
   */
  close(): Promise<void> {
    return this.stop()
      .catch(() => {})
      .finally(() => {
        return this.componentContext.signalingSession.close();
      });
  }

  /**
   * Initializes the viewport and opens the screen viewing data connection
   * @param canvasContainer
   */
  start(canvasContainer: HTMLDivElement): Promise<void> {
    this.componentContext.viewer.start(canvasContainer);
    return this.componentContext.viewingSession.openConnection(this.request).then(() => {});
  }

  /**
   * Tears down the viewport and closes the screen viewing data connection
   */
  stop(): Promise<void> {
    this.componentContext.viewer.stop();
    return this.componentContext.viewingSession.closeConnection();
  }

  presentScaleToFit(): void {
    this.componentContext.deltaRenderer.changePresentationPolicy(
      new ScaleToFitPresentationPolicy()
    );
  }

  presentDragAndZoom(): void {
    this.componentContext.deltaRenderer.changePresentationPolicy(
      new DragAndZoomPresentationPolicy()
    );
  }

  zoomIn(relativeZoomFactor?: number): void {
    this.componentContext.deltaRenderer.zoomRelative(relativeZoomFactor || 1.25);
  }

  zoomOut(relativeZoomFactor?: number): void {
    this.componentContext.deltaRenderer.zoomRelative(relativeZoomFactor || 0.8);
  }

  zoom(absoluteZoomFactor: number): void {
    this.componentContext.deltaRenderer.zoomAbsolute(absoluteZoomFactor);
  }

  zoomReset(): void {
    this.componentContext.deltaRenderer.zoomReset();
  }

  registerObserver(observer: ScreenObserver): void {
    this.componentContext.signalingSession.registerObserver(observer);
  }

  unregisterObserver(observer: ScreenObserver): void {
    this.componentContext.signalingSession.unregisterObserver(observer);
  }
}
