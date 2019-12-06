// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/** @internal */
export default class GlobalMetricReport {
  previousMetrics: { [id: string]: number } = {};
  currentMetrics: { [id: string]: number } = {};
}
