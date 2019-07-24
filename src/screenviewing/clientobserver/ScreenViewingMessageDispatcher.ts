// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenViewingMessageHandler from '../messagehandler/ScreenViewingMessageHandler';
import ScreenPacketType from '../session/ScreenViewingPacketType';
import ScreenViewingSessionObserver from './ScreenViewingSessionObserver';

export default class ScreenViewingMessageDispatcher implements ScreenViewingSessionObserver {
  constructor(private messageHandler: ScreenViewingMessageHandler) {}

  didCloseWebSocket(_event: CloseEvent): void {}

  didReceiveWebSocketMessage(event: MessageEvent): void {
    const dataView: DataView = new DataView(event.data);
    const type: number = dataView.getUint8(0);
    switch (type) {
      case ScreenPacketType.ECHO_REQUEST:
        this.messageHandler.handleEchoRequest(dataView);
        return;
      case ScreenPacketType.SETUP:
        this.messageHandler.handleSetup(dataView);
        return;
      case ScreenPacketType.DELTA:
        this.messageHandler.handleDelta(dataView);
        return;
      case ScreenPacketType.SYNC:
        this.messageHandler.handleSync(dataView);
        return;
      case ScreenPacketType.NOSCREEN:
        this.messageHandler.handleNoScreen(dataView);
        return;
      case ScreenPacketType.ENDSCREEN:
        this.messageHandler.handleEndScreen(dataView);
        return;
      default:
        this.messageHandler.handleDefault(dataView);
    }
  }
}
