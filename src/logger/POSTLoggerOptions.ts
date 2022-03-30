// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LogLevel from './LogLevel';

export default interface POSTLoggerOptions {
  /**
   * URL to send logs.
   */
  url: string;

  /**
   * Log batch size. Default value is 85.
   */
  batchSize?: number;

  /**
   * You can use `headers` to provide credentials when `POSTLogger` makes an HTTP POST request.
   * `POSTLogger` adds `headers` to all requests.
   */
  headers?: Record<string, string>;

  /**
   * Log sending interval. Default value is 2000ms.
   */
  intervalMs?: number;

  /**
   * Level of logging. Check [[LogLevel]] for more information.
   * Default value is `LogLevel.WARN`.
   */
  logLevel?: LogLevel;

  /**
   * Use `metadata` to send `meetingId`, `attendeeId`, or any other information.
   * `POSTLogger` includes this `metadata` as part of the request body when making the HTTP POST requests to your provided URL.
   */
  metadata?: Record<string, string>;
}
