// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Backoff from './Backoff';

export default interface BackoffFactory {
  /**
   * Backoff factory method
   * @returns {Backoff}
   */
  create(): Backoff;

  /**
   * Limited factory method
   * @returns {Backoff}
   */
  createWithLimit(limit: number): Backoff;
}
