// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from './Logger';
import LogLevel from './LogLevel';

/**
 * ConsoleLogger writes logs with console
 *
 * ```typescript
 *   // working with the ConsoleLogger
 *   const logger = new ConsoleLogger('demo'); //default level is LogLevel.WARN
 *   logger.info('info');
 *   logger.debug('debug');
 *   logger.warn('warn');
 *   logger.error('error');
 *
 *   // setting logging levels
 *   const logger = new ConsoleLogger('demo', LogLevel.INFO)
 *   logger.debug(debugFunc()); // this will not show up
 *   logger.setLogLevel(LogLevel.DEBUG)
 *   logger.debug(debugFunc()); // this will show up
 *
 * ```
 */
export default class ConsoleLogger implements Logger {
  name: string;
  level: LogLevel;

  constructor(name: string, level = LogLevel.WARN) {
    this.name = name;
    this.level = level;
  }

  info(msg: string): void {
    this.log(LogLevel.INFO, msg);
  }

  warn(msg: string): void {
    this.log(LogLevel.WARN, msg);
  }

  error(msg: string): void {
    this.log(LogLevel.ERROR, msg);
  }

  debug(debugFunction: string | (() => string)): void {
    if (LogLevel.DEBUG < this.level) {
      return;
    }
    this.log(LogLevel.DEBUG, typeof debugFunction === 'string' ? debugFunction : debugFunction());
  }

  setLogLevel(level: LogLevel): void {
    this.level = level;
  }

  getLogLevel(): LogLevel {
    return this.level;
  }

  private log(type: LogLevel, msg: string): void {
    if (type < this.level) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${LogLevel[type]}] ${this.name} - ${msg}`;

    switch (type) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage.replace(/\\r\\n/g, '\n'));
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
    }
  }
}
