// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DOMWebSocketFactory from '../domwebsocket/DOMWebSocketFactory';
import DefaultPromisedWebSocket from './DefaultPromisedWebSocket';
import PromisedWebSocket from './PromisedWebSocket';
import PromisedWebSocketFactory from './PromisedWebSocketFactory';

export default class DefaultPromisedWebSocketFactory implements PromisedWebSocketFactory {
  constructor(private webSocketFactory: DOMWebSocketFactory) {}

  create(
    url: string,
    protocols?: string | string[] | null,
    binaryType?: BinaryType
  ): PromisedWebSocket {
    return new DefaultPromisedWebSocket(this.webSocketFactory.create(url, protocols, binaryType));
  }
}
