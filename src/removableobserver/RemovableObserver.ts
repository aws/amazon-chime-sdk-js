// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[RemovableObserver]] provides a callback for any cleanup logic.
 */
export default interface RemovableObserver {
  /**
   * Executes any cleanup logic.
   */
  removeObserver(): void;
}
