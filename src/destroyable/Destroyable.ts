// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * An interface for objects that require manual cleanup.
 */
export interface Destroyable {
  /**
   * Dispose of this instance. The instance cannot be used after this method has been called.
   */
  destroy(): Promise<void>;
}

/**
 * Type guard for `Destroyable`.
 *
 * @param x A value that might implement the `Destroyable` interface.
 * @returns Whether the value implements `Destroyable`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDestroyable(x: any): x is Destroyable {
  return x && 'destroy' in x;
}

export default Destroyable;
