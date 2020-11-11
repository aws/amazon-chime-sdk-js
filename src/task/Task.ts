// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
 * [[Task]] runs a stateful unit of work asynchronously until it completes
 * successfully, fails on its own, or is canceled.
 */
export default interface Task {
  /**
   * Describes the task for the purpose of logging.
   */
  name(): string;

  /**
   * Attempts to cancel the task. The task may still succeed if it is unable to
   * be canceled. If the task is canceled, then its [[run]] function will reject
   * the promise. If [[cancel]] is called before [[run]], then [[run]]
   * must immediately reject the returned promise. If [[cancel]] is called
   * after [[run]], then nothing happens.
   */
  cancel(): void;

  /**
   * Runs the unit of work until it either succeeds and fulfills the promise or
   * fails and rejects the promise. Where possible it should listen for the
   * cancellation signal, stop working, and reject the promise. If run is called
   * more than once, it should immediately reject the promise.
   */
  run(): Promise<void>;

  /**
   * Sets the parent of this task for the purpose of logging.
   */
  setParent(parentTask: Task): void;
}
