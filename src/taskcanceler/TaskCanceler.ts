// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
 * [[TaskCanceler]] cancel the task.
 */
export default interface TaskCanceler {
  /**
   * Cancel the task
   */
  cancel(): void;
}
