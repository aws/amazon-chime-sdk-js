// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultJPEGDecoderController from '../../jpegdecoder/controller/DefaultJPEGDecoderController';
import ScreenViewingSessionObserver from '../clientobserver/ScreenViewingSessionObserver';
import ScreenViewingDeltaRenderer from '../deltarenderer/ScreenViewingDeltaRenderer';
import ScreenViewingDeltaSource from '../deltasource/ScreenViewingDeltaSource';
import ScreenViewingMessageHandler from '../messagehandler/ScreenViewingMessageHandler';
import ScreenViewingSession from '../session/ScreenViewingSession';
import SignalingSession from '../signalingsession/SignalingSession';
import ScreenViewingViewer from '../viewer/ScreenViewingViewer';

export interface ScreenViewingComponentProviders {
  sessionProvider?: (screenViewingSession: ScreenViewingSession) => ScreenViewingSession;
  deltaRendererProvider?: (deltaRenderer: ScreenViewingDeltaRenderer) => ScreenViewingDeltaRenderer;
  deltaSourceProvider?: (deltaSource: ScreenViewingDeltaSource) => ScreenViewingDeltaSource;
  jpegDecoderControllerProvider?: (
    jpegDecoderController: DefaultJPEGDecoderController
  ) => DefaultJPEGDecoderController;
  messageDispatcherProvider?: (
    messageDispatcher: ScreenViewingSessionObserver
  ) => ScreenViewingSessionObserver;
  messageHandlerProvider?: (
    messageHandler: ScreenViewingMessageHandler
  ) => ScreenViewingMessageHandler;
  signalingSession?: (signalingSession: SignalingSession) => SignalingSession;
  viewerProvider?: (viewerProvider: ScreenViewingViewer) => ScreenViewingViewer;
}

export default interface ScreenViewingComponentContext {
  viewingSession: ScreenViewingSession;
  deltaRenderer: ScreenViewingDeltaRenderer;
  deltaSource: ScreenViewingDeltaSource;
  jpegDecoderController: DefaultJPEGDecoderController;
  messageDispatcher: ScreenViewingSessionObserver;
  messageHandler: ScreenViewingMessageHandler;
  signalingSession: SignalingSession;
  viewer: ScreenViewingViewer;
}
