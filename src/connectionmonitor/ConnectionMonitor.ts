// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[ConnectionMonitor]] updates health data based on incoming metrics.
 */
export default interface ConnectionMonitor {
  /**
   * Starts the ConnectionMonitor.
   */
  start(): void;

  /**
   * Stops the ConnectionMonitor.
   */
  stop(): void;
}
