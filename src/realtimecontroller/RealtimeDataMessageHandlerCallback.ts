// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import RealtimeDataMessage from './RealtimeDataMessage';

type RealtimeDataMessageHandlerCallback = (
  topic: string,
  data: RealtimeDataMessage,
  lifetimeMs?: number
) => void;

export default RealtimeDataMessageHandlerCallback;
