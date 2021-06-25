// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[EventBufferConfiguration]] contains necessary information to
 * configure buffer.
 */
export default class EventBufferConfiguration {
  /**
   * Events sending interval.
   * Default is 5000.
   */
  flushIntervalMs: number;

  /**
   * Number of buffer items to send in a request.
   * Default is 2.
   */
  flushSize: number;

  /**
   * Maximum buffer capacity in Kilobytes.
   * Default is 64Kb.
   */
  maxBufferCapacityKb: number;

  /**
   * Maximum buffer items allowed.
   * Default is 100.
   * Max buffer item capacity = (maxBufferCapacityKb * 1024) / totalBufferItems;
   */
  totalBufferItems: number;

  /**
   * Retrying limit when sending events.
   * Default is 15.
   */
  retryCountLimit: number;

  constructor(
    flushIntervalMs = 5000,
    flushSize = 2,
    maxBufferCapacityKb = 64,
    totalBufferItems = 100,
    retryCountLimit = 15
  ) {
    this.flushIntervalMs = flushIntervalMs;
    this.flushSize = flushSize;
    this.maxBufferCapacityKb = maxBufferCapacityKb;
    this.totalBufferItems = totalBufferItems;
    this.retryCountLimit = retryCountLimit;
  }
}
