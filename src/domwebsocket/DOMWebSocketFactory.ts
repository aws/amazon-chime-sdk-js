// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DOMWebSocket from './DOMWebSocket';

export default interface DOMWebSocketFactory {
  /**
   * Factory method that creates DOMWebSocket instance
   * @param {string} url
   * @param {string | string[] | null} protocols
   * @param {BinaryType} binaryType
   * @returns {DOMWebSocket}
   */
  create(url: string, protocols?: string | string[] | null, binaryType?: BinaryType): DOMWebSocket;
}
