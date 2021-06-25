// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import JSONIngestionPayloadItem from './JSONIngestionPayloadItem';

export default interface JSONIngestionEvent {
  type: string;
  v: number;
  payloads: JSONIngestionPayloadItem[];
}
