// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackoffFactory from '../backoff/BackoffFactory';
import PromisedWebSocket from './PromisedWebSocket';
import PromisedWebSocketFactory from './PromisedWebSocketFactory';
import ReconnectingPromisedWebSocket from './ReconnectingPromisedWebSocket';

export default class ReconnectingPromisedWebSocketFactory implements PromisedWebSocketFactory {
  constructor(
    private promisedWebSocketFactory: PromisedWebSocketFactory,
    private backoffFactory: BackoffFactory,
    private reconnectRetryLimit: number
  ) {}

  create(
    url: string,
    protocols?: string | string[] | null,
    binaryType?: BinaryType
  ): PromisedWebSocket {
    return new ReconnectingPromisedWebSocket(
      url,
      protocols,
      binaryType,
      this.promisedWebSocketFactory,
      this.backoffFactory.createWithLimit(this.reconnectRetryLimit)
    );
  }
}
