// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import WebSocketReadyState from './WebSocketReadyState';

/** Adapter for WebSocket implementations */

export default interface WebSocketAdapter {
  /**
   * Opens a WebSocket connection to the URL with the given protocols.
   *
   * @param{string} url URL to connect to
   * @param{string[]} protocols Protocols to send when establishing the connection
   * @param{boolean} isSignedUrl whether the URL is signed
   */
  create(url: string, protocols: string[], isSignedUrl?: boolean): void;

  /**
   * Sends a raw byte message.
   *
   * @param{Uint8Array | string} Raw byte or string message to send
   * @return{boolean} Whether the data was queued for sending
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
   * @param{string} handler The handler being assigned.
   * @param{EventListener} eventListener
   */
  addEventListener(handler: string, eventListener: EventListener): void;

  /**
   * Returns the ready state.
   *
   * @return{WebSocketReadyState} The state of the WebSocketConnection
   */
  readyState(): WebSocketReadyState;
}
