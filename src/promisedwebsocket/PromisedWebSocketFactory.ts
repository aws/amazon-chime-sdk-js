// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import PromisedWebSocket from './PromisedWebSocket';

export default interface PromisedWebSocketFactory {
  create(
    url: string,
    protocols?: string | string[] | null,
    binaryType?: BinaryType
  ): PromisedWebSocket;
}
