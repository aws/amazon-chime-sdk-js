// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import FullJitterBackoffFactory from '../backoff/FullJitterBackoffFactory';
import DefaultDOMWebSocketFactory from '../domwebsocket/DefaultDOMWebSocketFactory';
import DefaultDragObserver from '../dragobserver/DefaultDragObserver';
import DragEvent from '../dragobserver/DragEvent';
import Logger from '../logger/Logger';
import Maybe from '../maybe/Maybe';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import DefaultPromisedWebSocketFactory from '../promisedwebsocket/DefaultPromisedWebSocketFactory';
import ReconnectingPromisedWebSocketFactory from '../promisedwebsocket/ReconnectingPromisedWebSocketFactory';
import ResizeObserverAdapterFactory from '../resizeobserveradapter/ResizeObserverAdapterFactory';
import ScreenSignalingSessionContainer from '../screensignalingsession/ScreenSignalingSessionContainer';
import DefaultScreenViewingComponentContext from '../screenviewing/context/DefaultScreenViewingComponentContext';
import DefaultScreenViewing from '../screenviewing/DefaultScreenViewing';
import ScreenObserver from '../screenviewing/observer/ScreenObserver';
import ScreenViewing from '../screenviewing/ScreenViewing';
import ScreenViewingSessionConnectionRequest from '../screenviewing/session/ScreenViewingSessionConnectionRequest';
import ScreenShareViewFacade from './ScreenShareViewFacade';

export default class DefaultScreenShareViewFacade implements ScreenShareViewFacade {
  private screenViewing: ScreenViewing;
  private dragObserverFactory = (
    window: Window,
    callback: (dragEvent: DragEvent) => void,
    element: HTMLElement
  ) => new DefaultDragObserver(window, element, callback);

  constructor(private configuration: MeetingSessionConfiguration, private logger: Logger) {
    const reconnectingWSFactory = new ReconnectingPromisedWebSocketFactory(
      new DefaultPromisedWebSocketFactory(new DefaultDOMWebSocketFactory()),
      new FullJitterBackoffFactory(1000, 100, 300),
      Maybe.of(configuration.screenSharingSessionOptions.reconnectRetryLimit).getOrElse(5)
    );
    this.screenViewing = new DefaultScreenViewing(
      new DefaultScreenViewingComponentContext(
        new ResizeObserverAdapterFactory(),
        this.dragObserverFactory,
        reconnectingWSFactory,
        new ScreenSignalingSessionContainer(
          reconnectingWSFactory,
          logger
        ).screenSignalingSessionFactory(),
        this.logger,
        {},
        window
      )
    );
  }

  open(): Promise<void> {
    const connectionRequest: ScreenViewingSessionConnectionRequest = new ScreenViewingSessionConnectionRequest(
      this.configuration.urls.screenViewingURL,
      this.configuration.urls.screenDataURL,
      this.configuration.credentials.joinToken,
      this.configuration.screenViewingTimeoutMs
    );
    return this.screenViewing.open(connectionRequest);
  }

  close(): Promise<void> {
    return this.screenViewing.close();
  }

  start(element: HTMLDivElement): Promise<void> {
    this.logger.warn(
      'ScreenShareViewFacade has been deprecated and will be removed ' +
        'beginning with version 2.0.0. Instead use the ' +
        'startContentShareFromScreenCapture() and stopContentShare() methods ' +
        'on the AudioVideoFacade.'
    );
    return this.screenViewing.start(element);
  }

  stop(): Promise<void> {
    return this.screenViewing.stop();
  }

  presentScaleToFit(): void {
    this.screenViewing.presentScaleToFit();
  }

  presentDragAndZoom(): void {
    this.screenViewing.presentDragAndZoom();
  }

  zoomIn(relativeZoomFactor?: number): void {
    this.screenViewing.zoomIn(relativeZoomFactor);
  }

  zoomOut(relativeZoomFactor?: number): void {
    this.screenViewing.zoomOut(relativeZoomFactor);
  }

  zoom(absoluteZoomFactor: number): void {
    this.screenViewing.zoom(absoluteZoomFactor);
  }

  zoomReset(): void {
    this.screenViewing.zoomReset();
  }

  registerObserver(observer: ScreenObserver): void {
    this.screenViewing.registerObserver(observer);
  }

  unregisterObserver(observer: ScreenObserver): void {
    this.screenViewing.unregisterObserver(observer);
  }
}
