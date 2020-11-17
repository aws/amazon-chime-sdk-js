// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[Backoff]] defines how long to wait before the next retry. Implementations
 * of [[Backoff]] provide custom algorithms for calculating the backoff amount.
 */
export default interface Backoff {
  /*
   * Resets the backoff state to the first retry.
   */
  reset(): void;

  /*
   * Returns the wait period in milliseconds before the next retry and
   * increments the retry index as a side-effect.
   */
  nextBackoffAmountMs(): number;
}
