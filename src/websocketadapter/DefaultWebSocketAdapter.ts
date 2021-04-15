// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import Versioning from '../versioning/Versioning';
import WebSocketAdapter from './WebSocketAdapter';
import WebSocketReadyState from './WebSocketReadyState';

export default class DefaultWebSocketAdapter implements WebSocketAdapter {
  private connection: WebSocket | undefined;

  constructor(private logger: Logger) {}

  create(url: string, protocols: string[], isSignedUrl?: boolean): void {
    this.connection = new WebSocket(isSignedUrl ? url : Versioning.urlWithVersion(url), protocols);
    this.connection.binaryType = 'arraybuffer';
  }

  send(message: Uint8Array | string): boolean {
    if (!this.connection) {
      this.logger.error('WebSocket not yet created or already destroyed.');
      return false;
    }

    try {
      if (message instanceof Uint8Array) {
        this.connection.send(message.buffer);
      } else {
        this.connection.send(message);
      }
      return true;
    } catch (err) {
      this.logger.debug(
        () =>
          `send error: ${err.message}, websocket state=${WebSocketReadyState[this.readyState()]}`
      );
      return false;
    }
  }

  close(code?: number, reason?: string): void {
    this.connection?.close(code, reason);
  }

  destroy(): void {
    this.connection = undefined;
  }

  addEventListener(handler: string, eventListener: EventListener): void {
    /* istanbul ignore if */
    if (!this.connection) {
      this.logger.warn('Cannot add event listener with no WebSocket connection.');
      return;
    }
    this.connection.addEventListener(handler, eventListener);
  }

  readyState(): WebSocketReadyState {
    if (!this.connection) {
      return WebSocketReadyState.None;
    }
    switch (this.connection.readyState) {
      case WebSocket.CONNECTING:
        return WebSocketReadyState.Connecting;
      case WebSocket.OPEN:
        return WebSocketReadyState.Open;
      case WebSocket.CLOSING:
        return WebSocketReadyState.Closing;
      case WebSocket.CLOSED:
        return WebSocketReadyState.Closed;
    }
  }
}
