// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import WebSocketReadyState from './WebSocketReadyState';

/** Adapter for WebSocket implementations */

export default interface WebSocketAdapter {
  /**
   * Opens a WebSocket connection to the URL with the given protocols.
   *
   * @param url URL to connect to
   * @param protocols Protocols to send when establishing the connection
   * @param isSignedUrl whether the URL is signed
   */
  create(url: string, protocols: string[], isSignedUrl?: boolean): void;

  /**
   * Sends a raw byte message.
   *
   * @param send byte or string message to send
   * @returns Whether the data was queued for sending
   */
  send(message: Uint8Array | string): boolean;

  /**
   * Close the WebSocket connection.
   */
  close(code?: number, reason?: string): void;

  /**
   * Destroys internal reference to the WebSocket.
   */
  destroy(): void;

  /**
   * Add an event listener for one of the handler types.
   *
   * @param handler The handler being assigned.
   * @param eventListener The event listener to add.
   */
  addEventListener(handler: string, eventListener: EventListener): void;

  /**
   * Returns the ready state.
   *
   * @returns The state of the WebSocketConnection
   */
  readyState(): WebSocketReadyState;
}
