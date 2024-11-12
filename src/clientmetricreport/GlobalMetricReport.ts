// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class GlobalMetricReport {
  previousMetrics: { [id: string]: number } = {};
  currentMetrics: { [id: string]: number } = {};
  // As metric values do not necessarily be number, this is a workaround in case metric value is string
  currentStringMetrics: { [id: string]: string } = {};
  previousObjectMetrics: { [id: string]: object } = {};
  currentObjectMetrics: { [id: string]: object } = {};
}
