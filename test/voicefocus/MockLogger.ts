// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as sinon from 'sinon';

import Logger from '../../src/logger/Logger';
import LogLevel from '../../src/logger/LogLevel';

export class MockLogger implements Logger {
  private level: LogLevel = LogLevel.DEBUG;
  warn = sinon.spy();
  debug = sinon.spy();
  info = sinon.spy();
  error = sinon.spy();

  setLogLevel(level: LogLevel): void {
    this.level = level;
  }

  getLogLevel(): LogLevel {
    return this.level;
  }
}
