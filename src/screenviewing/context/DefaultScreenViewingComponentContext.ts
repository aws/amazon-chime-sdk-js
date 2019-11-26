// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DragObserverFactory } from '../../dragobserver/DragObserver';
import DefaultJPEGDecoderController from '../../jpegdecoder/controller/DefaultJPEGDecoderController';
import Logger from '../../logger/Logger';
import ReconnectingPromisedWebSocketFactory from '../../promisedwebsocket/ReconnectingPromisedWebSocketFactory';
import ResizeObserverAdapterFactory from '../../resizeobserveradapter/ResizeObserverAdapterFactory';
import ScreenMessageDetail from '../../screenmessagedetail/ScreenMessageDetail';
import ScreenSignalingSessionFactory from '../../screensignalingsession/ScreenSignalingSessionFactory';
import ScreenViewingMessageDispatcher from '../clientobserver/ScreenViewingMessageDispatcher';
import ScreenViewingSessionObserver from '../clientobserver/ScreenViewingSessionObserver';
import DefaultScreenViewingDeltaRenderer from '../deltarenderer/DefaultScreenViewingDeltaRenderer';
import ScreenViewingDeltaRenderer from '../deltarenderer/ScreenViewingDeltaRenderer';
import DefaultScreenViewingDeltaSource from '../deltasource/DefaultScreenViewingDeltaSource';
import ScreenViewingDeltaSource from '../deltasource/ScreenViewingDeltaSource';
import DefaultScreenViewingMessageHandler from '../messagehandler/DefaultScreenViewingMessageHandler';
import ScreenViewingMessageHandler from '../messagehandler/ScreenViewingMessageHandler';
import DefaultScreenViewingSession from '../session/DefaultScreenViewingSession';
import ScreenViewingSession from '../session/ScreenViewingSession';
import DefaultSignalingSession from '../signalingsession/DefaultSignalingSession';
import SignalingSession from '../signalingsession/SignalingSession';
import DefaultScreenViewingViewer from '../viewer/DefaultScreenViewingViewer';
import ScreenViewingViewer from '../viewer/ScreenViewingViewer';
import ScreenViewingComponentContext, {
  ScreenViewingComponentProviders,
} from './ScreenViewingComponentContext';

export default class DefaultScreenViewingComponentContext implements ScreenViewingComponentContext {
  readonly viewingSession: ScreenViewingSession;
  readonly deltaRenderer: ScreenViewingDeltaRenderer;
  readonly deltaSource: ScreenViewingDeltaSource;
  readonly jpegDecoderController: DefaultJPEGDecoderController;
  readonly messageDispatcher: ScreenViewingSessionObserver;
  readonly messageHandler: ScreenViewingMessageHandler;
  readonly signalingSession: SignalingSession;
  readonly viewer: ScreenViewingViewer;

  constructor(
    resizeObserverAdapterFactory: ResizeObserverAdapterFactory,
    dragObserverFactory: DragObserverFactory,
    reconnectingWSFactory: ReconnectingPromisedWebSocketFactory,
    screenSignalingSessionFactory: ScreenSignalingSessionFactory,
    logger: Logger,
    providers?: ScreenViewingComponentProviders,
    window?: Window
  ) {
    const session: ScreenViewingSession = this.createSession(
      reconnectingWSFactory,
      logger,
      providers
    );
    const jpegDecoderController: DefaultJPEGDecoderController = this.createJPEGDecoderController(
      logger,
      providers
    );
    const deltaRenderer: ScreenViewingDeltaRenderer = this.createDeltaRenderer(
      jpegDecoderController,
      logger,
      window,
      resizeObserverAdapterFactory,
      dragObserverFactory,
      providers
    );
    const deltaSource: ScreenViewingDeltaSource = this.createDeltaSource(
      deltaRenderer,
      logger,
      providers
    );
    const viewer: ScreenViewingViewer = this.createViewer(deltaRenderer, logger, providers);
    const messageHandler: ScreenViewingMessageHandler = this.createMessageHandler(
      session,
      deltaRenderer,
      deltaSource,
      viewer,
      logger,
      providers
    );
    const messageDispatcher: ScreenViewingSessionObserver = this.createMessageDispatcher(
      messageHandler,
      providers
    );
    const signalingSession: SignalingSession = this.createSignalingSession(
      screenSignalingSessionFactory,
      providers
    );
    signalingSession.registerObserver({
      streamDidStart(_screenMessageDetail: ScreenMessageDetail): void {
        deltaRenderer.revealViewport();
      },
      streamDidStop(_screenMessageDetail: ScreenMessageDetail): void {
        deltaRenderer.hideViewport();
      },
    });

    this.viewingSession = session.withObserver(messageDispatcher);
    this.deltaRenderer = deltaRenderer;
    this.deltaSource = deltaSource;
    this.jpegDecoderController = jpegDecoderController;
    this.messageDispatcher = messageDispatcher;
    this.messageHandler = messageHandler;
    this.signalingSession = signalingSession;
    this.viewer = viewer;
  }

  private createSession(
    reconnectingWSFactory: ReconnectingPromisedWebSocketFactory,
    logger: Logger,
    providers?: ScreenViewingComponentProviders
  ): ScreenViewingSession {
    const screenViewingSession = new DefaultScreenViewingSession(reconnectingWSFactory, logger);
    return (
      (providers && providers.sessionProvider && providers.sessionProvider(screenViewingSession)) ||
      screenViewingSession
    );
  }

  private createDeltaRenderer(
    jpegDecoderController: DefaultJPEGDecoderController,
    logger: Logger,
    window: Window,
    resizeObserverAdapterFactory: ResizeObserverAdapterFactory,
    dragObserverFactory: DragObserverFactory,
    providers?: ScreenViewingComponentProviders
  ): ScreenViewingDeltaRenderer {
    const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
      jpegDecoderController,
      logger,
      window,
      resizeObserverAdapterFactory,
      dragObserverFactory
    );
    return (
      (providers &&
        providers.deltaRendererProvider &&
        providers.deltaRendererProvider(deltaRenderer)) ||
      deltaRenderer
    );
  }

  private createDeltaSource(
    deltaRenderer: ScreenViewingDeltaRenderer,
    logger: Logger,
    providers?: ScreenViewingComponentProviders
  ): ScreenViewingDeltaSource {
    const deltaSource: ScreenViewingDeltaSource = new DefaultScreenViewingDeltaSource(
      deltaRenderer,
      logger
    );
    return (
      (providers && providers.deltaSourceProvider && providers.deltaSourceProvider(deltaSource)) ||
      deltaSource
    );
  }

  private createJPEGDecoderController(
    logger: Logger,
    providers?: ScreenViewingComponentProviders
  ): DefaultJPEGDecoderController {
    const jpegDecoderController: DefaultJPEGDecoderController = new DefaultJPEGDecoderController(
      logger,
      65536
    );
    return (
      (providers &&
        providers.jpegDecoderControllerProvider &&
        providers.jpegDecoderControllerProvider(jpegDecoderController)) ||
      jpegDecoderController
    );
  }

  private createMessageDispatcher(
    messageHandler: ScreenViewingMessageHandler,
    providers?: ScreenViewingComponentProviders
  ): ScreenViewingSessionObserver {
    const messageDispatcher: ScreenViewingMessageDispatcher = new ScreenViewingMessageDispatcher(
      messageHandler
    );
    return (
      (providers &&
        providers.messageDispatcherProvider &&
        providers.messageDispatcherProvider(messageDispatcher)) ||
      messageDispatcher
    );
  }

  private createMessageHandler(
    session: ScreenViewingSession,
    deltaRenderer: ScreenViewingDeltaRenderer,
    deltaSource: ScreenViewingDeltaSource,
    viewer: ScreenViewingViewer,
    logger: Logger,
    providers?: ScreenViewingComponentProviders
  ): ScreenViewingMessageHandler {
    const messageHandler: ScreenViewingMessageHandler = new DefaultScreenViewingMessageHandler(
      session,
      deltaRenderer,
      deltaSource,
      viewer,
      logger
    );
    return (
      (providers &&
        providers.messageHandlerProvider &&
        providers.messageHandlerProvider(messageHandler)) ||
      messageHandler
    );
  }

  private createViewer(
    deltaRenderer: ScreenViewingDeltaRenderer,
    logger: Logger,
    providers?: ScreenViewingComponentProviders
  ): ScreenViewingViewer {
    const viewer: ScreenViewingViewer = new DefaultScreenViewingViewer(deltaRenderer, logger);
    return (providers && providers.viewerProvider && providers.viewerProvider(viewer)) || viewer;
  }

  private createSignalingSession(
    screenSignalingSessionFactory: ScreenSignalingSessionFactory,
    providers?: ScreenViewingComponentProviders
  ): SignalingSession {
    const signalingSession: SignalingSession = new DefaultSignalingSession(
      screenSignalingSessionFactory
    );
    return (
      (providers && providers.signalingSession && providers.signalingSession(signalingSession)) ||
      signalingSession
    );
  }
}
