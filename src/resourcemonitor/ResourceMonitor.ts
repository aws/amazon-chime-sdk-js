// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[ResourceMonitor]] monitors resource consumption.
 * @internal
 */
export default interface ResourceMonitor {
  /**
   * Starts the resource monitor.
   */
  start(): void;

  /**
   * Stops the resource monitor.
   */
  stop(): void;
}
