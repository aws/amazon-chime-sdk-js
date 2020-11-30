// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MeetingReadinessCheckerConfiguration]] includes custom settings used for MeetingReadinessChecker
 */
export default class MeetingReadinessCheckerConfiguration {
  /**
   * Specify how long to wait for each check in a test.
   * If null, it will use the default value.
   */
  timeoutMs: number = 10000;

  /**
   * Specify the wait time before checking again when a check condition is not met.
   * If null, it will use the default value.
   */
  waitDurationMs: number = 3000;
}
