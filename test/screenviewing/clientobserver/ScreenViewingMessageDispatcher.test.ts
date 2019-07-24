// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenViewingMessageDispatcher from '../../../src/screenviewing/clientobserver/ScreenViewingMessageDispatcher';
import ScreenViewingMessageHandler from '../../../src/screenviewing/messagehandler/ScreenViewingMessageHandler';
import ScreenPacketType from '../../../src/screenviewing/session/ScreenViewingPacketType';

describe('ScreenViewingMessageDispatcher', () => {
  const noOpMessageHandler: ScreenViewingMessageHandler = {
    handleDefault(): void {},
    handleDelta(): void {},
    handleEchoRequest(_view: DataView): void {},
    handleEndScreen(): void {},
    handleNoScreen(): void {},
    handleSetup(): void {},
    handleSync(): void {},
  };
  const noOpDispatcher: ScreenViewingMessageDispatcher = new ScreenViewingMessageDispatcher(
    noOpMessageHandler
  );

  describe('webSocketDidReceive', () => {
    it('dispatches echo request message', (done: MochaDone) => {
      const dispatcher: ScreenViewingMessageDispatcher = new ScreenViewingMessageDispatcher({
        ...noOpMessageHandler,
        handleEchoRequest(_view: DataView): void {
          done();
        },
      });

      const event: {} = { data: Uint8Array.of(ScreenPacketType.ECHO_REQUEST).buffer };
      dispatcher.didReceiveWebSocketMessage(event as MessageEvent);
    });

    it('dispatches setup message', (done: MochaDone) => {
      const dispatcher: ScreenViewingMessageDispatcher = new ScreenViewingMessageDispatcher({
        ...noOpMessageHandler,
        handleSetup(_view: DataView): void {
          done();
        },
      });

      const event: {} = { data: Uint8Array.of(ScreenPacketType.SETUP).buffer };
      dispatcher.didReceiveWebSocketMessage(event as MessageEvent);
    });

    it('dispatches delta message', (done: MochaDone) => {
      const dispatcher: ScreenViewingMessageDispatcher = new ScreenViewingMessageDispatcher({
        ...noOpMessageHandler,
        handleDelta(_view: DataView): void {
          done();
        },
      });

      const event: {} = { data: Uint8Array.of(ScreenPacketType.DELTA).buffer };
      dispatcher.didReceiveWebSocketMessage(event as MessageEvent);
    });

    it('dispatches sync message', (done: MochaDone) => {
      const dispatcher: ScreenViewingMessageDispatcher = new ScreenViewingMessageDispatcher({
        ...noOpMessageHandler,
        handleSync(_view: DataView): void {
          done();
        },
      });

      const event: {} = { data: Uint8Array.of(ScreenPacketType.SYNC).buffer };
      dispatcher.didReceiveWebSocketMessage(event as MessageEvent);
    });

    it('dispatches no screen message', (done: MochaDone) => {
      const dispatcher: ScreenViewingMessageDispatcher = new ScreenViewingMessageDispatcher({
        ...noOpMessageHandler,
        handleNoScreen(_view: DataView): void {
          done();
        },
      });

      const event: {} = { data: Uint8Array.of(ScreenPacketType.NOSCREEN).buffer };
      dispatcher.didReceiveWebSocketMessage(event as MessageEvent);
    });

    it('dispatches end screen message', (done: MochaDone) => {
      const dispatcher: ScreenViewingMessageDispatcher = new ScreenViewingMessageDispatcher({
        ...noOpMessageHandler,
        handleEndScreen(_view: DataView): void {
          done();
        },
      });

      const event: {} = { data: Uint8Array.of(ScreenPacketType.ENDSCREEN).buffer };
      dispatcher.didReceiveWebSocketMessage(event as MessageEvent);
    });

    it('dispatches default messages', (done: MochaDone) => {
      const dispatcher: ScreenViewingMessageDispatcher = new ScreenViewingMessageDispatcher({
        ...noOpMessageHandler,
        handleDefault(): void {
          done();
        },
      });

      const event: {} = { data: Uint8Array.of(0x00).buffer };
      dispatcher.didReceiveWebSocketMessage(event as MessageEvent);
    });
  });

  describe('webSocketDidClose', () => {
    it('no-ops', () => {
      noOpDispatcher.didCloseWebSocket(null);
    });
  });
});
