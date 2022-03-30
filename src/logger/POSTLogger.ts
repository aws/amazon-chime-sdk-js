// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Destroyable } from '../destroyable/Destroyable';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import Log from './Log';
import Logger from './Logger';
import LogLevel from './LogLevel';
import POSTLoggerOptions from './POSTLoggerOptions';

/**
 * `POSTLogger` publishes log messages in batches to a URL
 * supplied during its construction.
 *
 * Be sure to call {@link POSTLogger.destroy} when you're done
 * with the logger in order to avoid leaks.
 */
export default class POSTLogger implements Logger, Destroyable {
  private static readonly BATCH_SIZE = 1000;
  private static readonly INTERVAL_MS = 15000;
  private url: string;
  private batchSize: number;
  private eventListener: undefined | (() => void);
  private headers: Record<string, string>;
  private intervalMs: number;
  private intervalScheduler: IntervalScheduler;
  private logCapture: Log[] = [];
  private logLevel: LogLevel;
  private lock = false;
  private sequenceNumber: number = 0;
  metadata: Record<string, string>;

  constructor(options: POSTLoggerOptions) {
    const {
      url,
      batchSize = POSTLogger.BATCH_SIZE,
      intervalMs = POSTLogger.INTERVAL_MS,
      logLevel = LogLevel.WARN,
      metadata,
      headers,
    } = options;
    this.url = url;
    this.batchSize = batchSize;
    this.intervalMs = intervalMs;
    this.logLevel = logLevel;
    this.metadata = metadata;
    this.headers = headers;

    this.start();

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
    if (LogLevel.DEBUG < this.logLevel) {
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

  setLogLevel(logLevel: LogLevel): void {
    this.logLevel = logLevel;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  getLogCaptureSize(): number {
    return this.logCapture.length;
  }

  private start(): void {
    this.addEventListener();
    this.intervalScheduler = new IntervalScheduler(this.intervalMs);
    this.intervalScheduler.start(async () => {
      if (this.lock === true || this.getLogCaptureSize() === 0) {
        return;
      }
      this.lock = true;
      const batch = this.logCapture.slice(0, this.batchSize);
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
        console.warn('[POSTLogger] ' + error.message);
      } finally {
        this.lock = false;
      }
    });
  }

  private stop(): void {
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
    this.stop();
    this.metadata = undefined;
    this.headers = undefined;
    this.logCapture = [];
    this.sequenceNumber = 0;
    this.lock = false;
    this.batchSize = 0;
    this.intervalMs = 0;
    this.url = undefined;
  }

  private makeRequestBody(batch: Log[]): string {
    return JSON.stringify({
      ...this.metadata,
      logs: batch,
    });
  }

  private log(type: LogLevel, msg: string): void {
    if (type < this.logLevel) {
      return;
    }
    const now = Date.now();

    // Handle undefined.
    this.logCapture.push(new Log(this.sequenceNumber, msg, now, LogLevel[type]));
    this.sequenceNumber += 1;
  }
}
