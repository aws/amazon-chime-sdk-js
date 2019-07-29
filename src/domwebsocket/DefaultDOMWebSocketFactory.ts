// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Versioning from '../versioning/Versioning';
import DefaultDOMWebSocket from './DefaultDOMWebSocket';
import DOMWebSocket from './DOMWebSocket';
import DOMWebSocketFactory from './DOMWebSocketFactory';

export default class DefaultDOMWebSocketFactory implements DOMWebSocketFactory {
  create(url: string, protocols?: string | string[] | null, binaryType?: BinaryType): DOMWebSocket {
    const webSocket = new WebSocket(Versioning.urlWithVersion(url), protocols);
    if (binaryType !== undefined) {
      webSocket.binaryType = binaryType;
    }
    return new DefaultDOMWebSocket(webSocket);
  }
}
