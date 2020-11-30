// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Backoff from './Backoff';

/**
 * Implements the [Full Jitter algorithm](
 * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
 * and also allows for specifying a fixed wait added to the full jitter backoff
 * (which can be zero).
 */
export default class FullJitterBackoff implements Backoff {
  private currentRetry: number = 0;

  constructor(
    private fixedWaitMs: number,
    private shortBackoffMs: number,
    private longBackoffMs: number
  ) {
    if (this.fixedWaitMs < 0) {
      this.fixedWaitMs = 0;
    }
    if (this.shortBackoffMs < 0) {
      this.shortBackoffMs = 0;
    }
    if (this.longBackoffMs < 0) {
      this.longBackoffMs = 0;
    }
    this.reset();
  }

  reset(): void {
    this.currentRetry = 0;
  }

  nextBackoffAmountMs(): number {
    const fullJitterMs =
      Math.random() *
        Math.min(this.longBackoffMs, this.shortBackoffMs * Math.pow(2.0, this.currentRetry)) +
      this.fixedWaitMs;
    this.currentRetry += 1;
    return fullJitterMs;
  }
}
