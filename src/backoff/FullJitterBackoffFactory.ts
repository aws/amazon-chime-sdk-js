// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Backoff from './Backoff';
import BackoffFactory from './BackoffFactory';
import FullJitterBackoff from './FullJitterBackoff';
import FullJitterLimitedBackoff from './FullJitterLimitedBackoff';

export default class FullJitterBackoffFactory implements BackoffFactory {
  constructor(
    private fixedWaitMs: number,
    private shortBackoffMs: number,
    private longBackoffMs: number
  ) {}

  create(): Backoff {
    return new FullJitterBackoff(this.fixedWaitMs, this.shortBackoffMs, this.longBackoffMs);
  }

  createWithLimit(limit: number): Backoff {
    return new FullJitterLimitedBackoff(
      this.fixedWaitMs,
      this.shortBackoffMs,
      this.longBackoffMs,
      limit
    );
  }
}
