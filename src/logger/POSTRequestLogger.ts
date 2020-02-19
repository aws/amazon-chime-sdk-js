// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import LogLevel from '../logger/LogLevel';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';

export default class POSTRequestLogger implements Logger {
  private logCapture: string[] = [];
  private logSequenceNumber: number = 0;
  private lock = false;
  private intervalScheduler: IntervalScheduler;

  constructor(
    private name: string,
    private configuration: MeetingSessionConfiguration,
    private batchSize: number,
    private intervalMs: number,
    private baseURL: string,
    private level = LogLevel.INFO,
  ) {
    this.intervalScheduler = new IntervalScheduler(this.intervalMs);
    this.startLogPublishScheduler(this.batchSize);
    window.addEventListener('unload', () => {
      this.intervalScheduler.stop();
      const body = this.jsonStringify(this.logCapture);
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

  startLogPublishScheduler(batchSize: number): void {
    this.intervalScheduler.start(async () => {
      if (this.lock === true || this.logCapture.length === 0) {
        return;
      }
      this.lock = true;
      const batch = this.logCapture.slice(0, batchSize);
      const body = this.jsonStringify(batch);
      try {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          body,
        });
        if (response.status === 200) {
          this.logCapture = this.logCapture.slice(batch.length);
        }
      } catch (error) {
        console.warn('[POSTRequestLogger] ' + error.message);
      } finally {
        this.lock = false;
      }
    });
  }

  private jsonStringify(batch: string[]) : string {
    return JSON.stringify({
      meetingId: this.configuration.meetingId,
      attendeeId: this.configuration.credentials.attendeeId,
      appName: this.name,
      logs: batch,
    });
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