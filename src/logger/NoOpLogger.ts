// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from './Logger';
import LogLevel from './LogLevel';

/**
 * [[NoOpLogger]] does not log any message.
 */
export default class NoOpLogger implements Logger {
  level: LogLevel;

  constructor(level = LogLevel.OFF) {
    this.level = level;
  }

  info(_msg: string): void {}

  warn(_msg: string): void {}

  error(_msg: string): void {}

  debug(debugFunction: string | (() => string)): void {
    if (LogLevel.DEBUG < this.level) {
      return;
    }
    if (typeof debugFunction !== 'string') {
      debugFunction();
    }
  }

  setLogLevel(level: LogLevel): void {
    this.level = level;
  }

  getLogLevel(): LogLevel {
    return this.level;
  }
}
