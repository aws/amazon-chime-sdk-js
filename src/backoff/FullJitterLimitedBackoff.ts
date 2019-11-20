// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import FullJitterBackoff from './FullJitterBackoff';

export default class FullJitterLimitedBackoff extends FullJitterBackoff {
  private attempts = 0;

  constructor(
    fixedWaitMs: number,
    shortBackoffMs: number,
    longBackoffMs: number,
    private limit: number
  ) {
    super(fixedWaitMs, shortBackoffMs, longBackoffMs);
  }

  nextBackoffAmountMs(): number {
    this.attempts++;
    if (this.attempts > this.limit) {
      throw new Error('retry limit exceeded');
    }
    return super.nextBackoffAmountMs();
  }
}
