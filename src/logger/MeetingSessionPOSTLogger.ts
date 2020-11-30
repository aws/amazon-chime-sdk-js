// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LogLevel from '../logger/LogLevel';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import Log from './Log';

export default class MeetingSessionPOSTLogger {
  private logCapture: Log[] = [];
  private sequenceNumber: number = 0;
  private lock = false;
  private intervalScheduler: IntervalScheduler;

  constructor(
    private name: string,
    private configuration: MeetingSessionConfiguration,
    private batchSize: number,
    private intervalMs: number,
    private url: string,
    private level = LogLevel.WARN
  ) {
    this.intervalScheduler = new IntervalScheduler(this.intervalMs);
    this.startLogPublishScheduler(this.batchSize);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const GlobalAny = global as any;
    GlobalAny['window']['addEventListener'] &&
      window.addEventListener('unload', () => {
        this.stop();
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

  getLogCaptureSize(): number {
    return this.logCapture.length;
  }

  startLogPublishScheduler(batchSize: number): void {
    this.intervalScheduler.start(async () => {
      if (this.lock === true || this.getLogCaptureSize() === 0) {
        return;
      }
      this.lock = true;
      const batch = this.logCapture.slice(0, batchSize);
      const body = this.makeRequestBody(batch);
      try {
        const response = await fetch(this.url, {
          method: 'POST',
          body,
        });
        if (response.status === 200) {
          this.logCapture = this.logCapture.slice(batch.length);
        }
      } catch (error) {
        console.warn('[MeetingSessionPOSTLogger] ' + error.message);
      } finally {
        this.lock = false;
      }
    });
  }

  stop(): void {
    this.intervalScheduler.stop();
    const body = this.makeRequestBody(this.logCapture);
    navigator.sendBeacon(this.url, body);
  }

  private makeRequestBody(batch: Log[]): string {
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
    this.logCapture.push(new Log(this.sequenceNumber, msg, date.getTime(), LogLevel[type]));
    this.sequenceNumber += 1;
  }
}
