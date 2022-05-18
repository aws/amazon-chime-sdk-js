// #!usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const chalk = require('chalk');

const error = chalk.red;
const info = chalk.blue;
const warn = chalk.yellow;
const success = chalk.green;

const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
};

class Log {
  constructor(msg, logLevel) {
    this.msg = msg;
    if (!!logLevel) {
      this.logLevel = logLevel;
    } else {
      this.logLevel = LogLevel.INFO;
    }
  }
}

class Logger {
  constructor(name, logLevel = LogLevel.INFO) {
    this.logs = [];
    this.name = name;
    this.logLevel = logLevel;
  }

  async printLogs() {
    for (let i = 0; i < this.logs.length; i++) {
      if (this.logs[i]) {
        this.log(this.logs[i].msg, this.logs[i].logLevel);
      }
    }
    this.logs = [];
  }

  pushLogs(msg, logLevel = LogLevel.INFO) {
    this.logs.push(new Log(msg, logLevel));
  }

  setLogLevel(logLevel) {
    this.logLevel = logLevel;
  }

  getLogLevel() {
    return this.logLevel;
  }

  log(msg, logLevel) {
    if (!logLevel) {
      logLevel = this.logLevel;
    }
    const timestamp = new Date();
    const logMessage = `${timestamp} [${logLevel}] ${this.name} - ${msg}`;

    switch (logLevel) {
      case LogLevel.ERROR:
        console.log(error(logMessage));
        break;
      case LogLevel.WARN:
        console.log(warn(logMessage));
        break;
      case LogLevel.INFO:
        console.log(info(logMessage));
        break;
      case LogLevel.SUCCESS:
        console.log(success(logMessage));
        break;
    }
  }
}

module.exports = {
  Log,
  LogLevel,
  Logger,
};
