// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LogLevel from './LogLevel';

/**
 * [[Logger]] defines how to write logs for different logging level.
 */
export default interface Logger {
  /**
   * Calls [[debugFunction]] only if the log level is debug and emits the
   * resulting string. Use the debug level to dump large or verbose messages
   * that could slow down performance.
   */
  debug(debugFunction: string | (() => string)): void;

  /**
   * Emits an info message if the log level is equal to or lower than info level.
   */
  info(msg: string): void;

  /**
   * Emits a warning message if the log level is equal to or lower than warn level.
   */
  warn(msg: string): void;

  /**
   * Emits an error message if the log level is equal to or lower than error level.
   */
  error(msg: string): void;

  /**
   * Sets the log level.
   */
  setLogLevel(level: LogLevel): void;

  /**
   * Gets the current log level.
   */
  getLogLevel(): LogLevel;
}
