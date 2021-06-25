// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import JSONIngestionEvent from './JSONIngestionEvent';

export default interface JSONIngestionBufferItem {
  event: JSONIngestionEvent;
  retryCount: number;
}
