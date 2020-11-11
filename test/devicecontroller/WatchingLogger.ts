// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../../src/logger/Logger';
import LogLevel from '../../src/logger/LogLevel';

/**
 * A trivial logger that tracks log lines that matched an input.
 */
export default class WatchingLogger implements Logger {
  matches: string[] = [];

  constructor(private watchingFor: string | RegExp) {}

  private check(msg: string): void {
    if (msg.match(this.watchingFor)) {
      this.matches.push(msg);
    }
  }

  debug(debugFunction: string | (() => string)): void {
    const msg = typeof debugFunction === 'string' ? debugFunction : debugFunction();
    this.check(msg);
  }

  info(msg: string): void {
    this.check(msg);
  }

  warn(msg: string): void {
    this.check(msg);
  }

  error(msg: string): void {
    this.check(msg);
  }

  setLogLevel(_level: LogLevel): void {}

  getLogLevel(): LogLevel {
    return LogLevel.DEBUG;
  }
}
