// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger, LogLevel } from '../index';
import IntervalScheduler from '../scheduler/IntervalScheduler';

export default class POSTRequestLogger implements Logger {
  private logCapture: string[] = [];
  private logSequenceNumber: number = 0;
  private lock = false;
  private static BATCH_SIZES = 75;
  private intervalScheduler: IntervalScheduler;

  constructor(
    private name: string,
    private meetingId: string,
    private attendeeId: string,
    private intervalMs: number,
    private baseURL: string,
    private level = LogLevel.WARN,
  ) {
    this.intervalScheduler = new IntervalScheduler(this.intervalMs);
    window.addEventListener('unload', () => {
      this.intervalScheduler.stop();
      if(!navigator.sendBeacon){
        return
      }
      const body = JSON.stringify({
        meetingId: this.meetingId,
        attendeeId: this.attendeeId,
        appName: this.name,
        logs: this.logCapture
      });
      navigator.sendBeacon(this.baseURL, body);
    });
  }

  debug(debugFunction: () => string): void {
    if (LogLevel.DEBUG < this.level) {
      return;
    }
    this.log(LogLevel.DEBUG, debugFunction());
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

  setLogLevel(level: LogLevel): void {
    this.level = level;
  }

  getLogLevel(): LogLevel {
    return this.level;
  }

  async publishLogsCaller(flushAll: boolean): Promise<void> {
    if (flushAll === true && this.logCapture.length > 0) {
      this.intervalScheduler.stop();
      if (this.logCapture.length <= POSTRequestLogger.BATCH_SIZES){
        await this.publishLogs(this.logCapture.length);
      } else {
        const batchSize = Math.ceil(this.logCapture.length / POSTRequestLogger.BATCH_SIZES);
        for (let i = 0; i < batchSize; i++) {
          if (this.logCapture.length > 0) {
            await this.publishLogs(POSTRequestLogger.BATCH_SIZES);
          }
        }
      }
    }
    this.intervalScheduler.start(async () => {
      await this.publishLogs(POSTRequestLogger.BATCH_SIZES);
    });
  }

  async publishLogs(batchSize: number): Promise<void> {
    if (this.lock === true || this.logCapture.length === 0) {
      return;
    }
    this.lock = true;
    const batch = this.logCapture.slice(0, batchSize);
    const body = JSON.stringify({
      meetingId: this.meetingId,
      attendeeId: this.attendeeId,
      appName: this.name,
      logs: batch,
    });
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        body,
      });
      if (response.status === 200) {
        this.logCapture = this.logCapture.slice(batch.length);
      }
    } catch (error) {
      this.warn('[POSTRequestLogger] ' + error.message);
    } finally {
      this.lock = false;
    }
  }

  private log(type: LogLevel, msg: string): void {
    if (type < this.level) {
      return;
    }
    const date = new Date();
    const timestamp = date.toISOString();
    const logMessage = `${this.logSequenceNumber} ${timestamp} [${LogLevel[type]}] ${this.name} - ${msg}`;

    switch (type) {
      case LogLevel.ERROR:
        console.trace(logMessage);
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
    this.logCapture.push(
      JSON.stringify({
        logSequenceNumber: this.logSequenceNumber,
        logMessage: msg,
        timestamp: date.getTime(),
        logLevelType: LogLevel[type],
      })
    );
    this.logSequenceNumber += 1;
  }
}
