// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DragAndZoomPresentationPolicy from '../presentation/policy/DragAndZoomPresentationPolicy';
import ScaleToFitPresentationPolicy from '../presentation/policy/ScaleToFitPresentationPolicy';
import ScreenViewingComponentContext from './context/ScreenViewingComponentContext';
import ScreenObserver from './observer/ScreenObserver';
import ScreenViewing from './ScreenViewing';
import ScreenViewingSessionConnectionRequest from './session/ScreenViewingSessionConnectionRequest';

export default class DefaultScreenViewing implements ScreenViewing {
  constructor(private componentContext: ScreenViewingComponentContext) {}

  open(request: ScreenViewingSessionConnectionRequest): Promise<void> {
    return this.componentContext.jpegDecoderController
      .init()
      .then(() => this.componentContext.signalingSession.open(request))
      .then(() => this.componentContext.viewingSession.openConnection(request))
      .then(() => {});
  }

  async close(): Promise<void> {
    await this.componentContext.signalingSession.close();
    await this.componentContext.viewingSession.closeConnection();
  }

  start(canvasContainer: HTMLDivElement): void {
    this.componentContext.viewer.start(canvasContainer);
  }

  stop(): void {
    this.componentContext.viewer.stop();
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
