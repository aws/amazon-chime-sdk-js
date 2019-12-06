// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Direction from './ClientMetricReportDirection';
import MediaType from './ClientMetricReportMediaType';

/** @internal */
export default class StreamMetricReport {
  streamId: number;
  mediaType: MediaType;
  direction: Direction;
  previousMetrics: { [id: string]: number } = {};
  currentMetrics: { [id: string]: number } = {};
}
