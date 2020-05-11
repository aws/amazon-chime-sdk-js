// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface PromisedWebSocket extends EventTarget {
  readonly url: string;

  /**
   * Opens the connection
   * @param {number} timeoutMs
   * @returns {Promise<Event>}
   */
  open(timeoutMs: number): Promise<Event>;

  /**
   * Closes the connection
   * @param {number} timeoutMs
   * @returns {Promise<Event>}
   */
  close(timeoutMs: number, code?: number, reason?: string): Promise<Event>;

  /**
   * Sends the provided data
   * @param {string | ArrayBufferLike | Blob | ArrayBufferView} data
   * @returns {Promise<void>}
   */
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
}
