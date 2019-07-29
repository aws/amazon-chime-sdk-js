// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface DOMWebSocket extends EventTarget {
  onopen: EventListener | null;
  onerror: EventListener | null;
  onclose: EventListener | null;
  onmessage: EventListener | null;
  /**
   * Send (enqueue) data
   * @param {string | ArrayBuffer | Blob | ArrayBufferView} data
   */
  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void;

  /**
   * Closes the connection
   * @param {number} code
   * @param {string} reason
   */
  close(code?: number, reason?: string): void;
}
