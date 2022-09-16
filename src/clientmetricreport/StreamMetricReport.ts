// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Direction from './ClientMetricReportDirection';
import MediaType from './ClientMetricReportMediaType';

export default class StreamMetricReport {
  streamId: number;
  mediaType: MediaType;
  direction: Direction;
  previousMetrics: { [id: string]: number } = {};
  currentMetrics: { [id: string]: number } = {};
  // As metric values do not necessarily be number, this is a workaround in case metric value is string
  currentStringMetrics: { [id: string]: string } = {};
}
