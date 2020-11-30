// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ConnectionHealthData from './ConnectionHealthData';

/* A ConnectionHealthPolicy reduces the current state of a ConnectionHealthData
   object into a single number between a min and max range.*/
export default interface ConnectionHealthPolicy {
  /**
   * The minimum possible value.
   */
  minimumHealth(): number;

  /**
   * The maximum possible value.
   */
  maximumHealth(): number;

  /**
   * Updates the policy with the latest data.
   */
  update(connectionHealthData: ConnectionHealthData): void;

  /**
   * The current value per this policy for the given connection health data.
   */
  health(): number;

  /**
   * Whether the current value is considered healthy for the given connection health data.
   */
  healthy(): boolean;

  /**
   * The value per this policy or null if it has not changed since the last call.
   */
  healthIfChanged(): number | null;
}
