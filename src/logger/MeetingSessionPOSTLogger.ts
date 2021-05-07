// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Destroyable } from '../destroyable/Destroyable';
import LogLevel from '../logger/LogLevel';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import Log from './Log';

/**
 * `MeetingSessionPOSTLogger` publishes log messages in batches to a URL
 * supplied during its construction.
 *
 * Be sure to call {@link MeetingSessionPOSTLogger.destroy} when you're done
 * with the logger in order to avoid leaks.
 */
export default class MeetingSessionPOSTLogger implements Destroyable {
  private logCapture: Log[] = [];
  private sequenceNumber: number = 0;
  private lock = false;
  private intervalScheduler: IntervalScheduler;
  private eventListener: undefined | (() => void);

  constructor(
    private name: string,
    private configuration: MeetingSessionConfiguration,
    private batchSize: number,
    private intervalMs: number,
    private url: string,
    private level = LogLevel.WARN,
    private headers?: Record<string, string>
  ) {
    this.startLogPublishScheduler(this.batchSize);

    this.eventListener = () => {
      this.stop();
    };

    this.addEventListener();
  }

  addEventListener(): void {
    if (!this.eventListener || !('window' in global) || !window.addEventListener) {
      return;
    }
    window.addEventListener('unload', this.eventListener);
  }

  removeEventListener(): void {
    if (!this.eventListener || !('window' in global) || !window.removeEventListener) {
      return;
    }
    window.removeEventListener('unload', this.eventListener);
  }

  debug(debugFunction: string | (() => string)): void {
    if (LogLevel.DEBUG < this.level) {
      return;
    }

    if (typeof debugFunction === 'string') {
      this.log(LogLevel.DEBUG, debugFunction);
    } else if (debugFunction) {
      this.log(LogLevel.DEBUG, debugFunction());
    } else {
      this.log(LogLevel.DEBUG, '' + debugFunction);
    }
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
    this.addEventListener();
    this.intervalScheduler?.stop();
    this.intervalScheduler = new IntervalScheduler(this.intervalMs);
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
          ...(this.headers
            ? {
                headers: this.headers,
              }
            : {}),
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
    // Clean up to avoid resource leaks.
    this.intervalScheduler?.stop();
    this.intervalScheduler = undefined;
    this.removeEventListener();

    const body = this.makeRequestBody(this.logCapture);
    navigator.sendBeacon(this.url, body);
  }

  /**
   * Permanently clean up the logger. A new logger must be created to
   * resume logging.
   */
  async destroy(): Promise<void> {
    this.intervalScheduler?.stop();
    this.intervalScheduler = undefined;
    this.removeEventListener();
    this.configuration = undefined;
    this.logCapture = [];
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
    const now = Date.now();

    // Handle undefined.
    this.logCapture.push(new Log(this.sequenceNumber, msg, now, LogLevel[type]));
    this.sequenceNumber += 1;
  }
}
