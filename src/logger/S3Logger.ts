// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from './Logger';
import LogLevel from './LogLevel';
import S3LoggerOptions from './S3LoggerOptions';
import { S3LogWorkerCommand } from '../worker/S3LogWorker';

/**
 * `S3Logger` publishes log messages in batches to an S3 bucket using a Web Worker
 * for background processing. It handles log redaction, compression, and retry logic.
 *
 * Be sure to call {@link S3Logger.destroy} when you're done
 * with the logger in order to avoid leaks.
 */
export default class S3Logger implements Logger {  
  private logLevel: LogLevel;
  private eventListener: undefined | (() => void);
  private logWorker: Worker | null = null;
  private options: S3LoggerOptions;

  constructor(options: S3LoggerOptions = {}) {
    const { 
      logLevel = LogLevel.DEBUG,
    } = options;

    this.logLevel = logLevel;
    this.options = options;
    
    this.eventListener = () => {
      this.destroy();
    };

    this.initializeWorker();
    this.addEventListener();
  }

  private initializeWorker(): void {
    try {
      // Create worker from S3LogWorker class
      const workerBlob = new Blob([this.getWorkerScript()], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);
      this.logWorker = new Worker(workerUrl);

      this.logWorker.addEventListener('message', (e: MessageEvent) => {
        this.processMessage(e.data);
      });

      this.logWorker.addEventListener('error', (e: ErrorEvent) => {
        console.error('S3LogWorker error:', e.message);
      });

      this.logWorker.addEventListener('messageerror', (e: MessageEvent) => {
        console.error('S3LogWorker message error:', e.data);
      });

      // Initialize the worker with configuration
      this.logWorker.postMessage({
        command: S3LogWorkerCommand.INITIALIZE,
        config: {
          presignedUrlEndpoint: this.options.presignedUrl,
          meetingId: this.options.meetingId,
          attendeeId: this.options.attendeeId,
          joinToken: this.options.joinToken,
          maxEntries: this.options.maxEntries,
          maxBytes: this.options.maxBytes
        }
      });
    } catch (error) {
      console.error('Failed to initialize S3LogWorker:', error);
    }
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

  debug(msg: string): void {
    this.log(LogLevel.DEBUG, msg);
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

  private log(type: LogLevel, msg: string): void {
    if (type < this.logLevel) {
      return;
    }

    if (this.logWorker) {
      this.logWorker.postMessage({
        command: S3LogWorkerCommand.PUT_LOG,
        level: LogLevel[type],
        message: msg
      });
    }
  }

  /**
   * Trigger upload of all stored logs to S3
   */
  public uploadLogs(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.logWorker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (e: MessageEvent) => {
        const { command } = e.data;
        
        if (command === S3LogWorkerCommand.UPLOAD_COMPLETE) {
          this.logWorker?.removeEventListener('message', handleMessage);
          resolve();
        } else if (command === S3LogWorkerCommand.UPLOAD_FAILED) {
          this.logWorker?.removeEventListener('message', handleMessage);
          reject(new Error(e.data.error));
        }
      };

      this.logWorker.addEventListener('message', handleMessage);
      
      this.logWorker.postMessage({
        command: S3LogWorkerCommand.UPLOAD_LOGS,
        joinToken: this.options.joinToken
      });
    });
  }

  /**
   * Destroy the logger and clean up resources
   */
  public destroy(): void {
    this.removeEventListener();
    
    if (this.logWorker) {
      this.logWorker.postMessage({
        command: S3LogWorkerCommand.TERMINATE
      });
      this.logWorker = null;
    }
  }

  private processMessage = (data: any) => {
    switch (data.command) {
      case S3LogWorkerCommand.READY:
        // Worker is ready
        console.log('S3LogWorker initialized successfully');
        break;
      case S3LogWorkerCommand.ERROR:
        console.error('S3LogWorker error:', data.error);
        break;
      case S3LogWorkerCommand.TERMINATED:
        console.log('S3LogWorker terminated');
        break;
      case S3LogWorkerCommand.UPLOAD_COMPLETE:
        console.log('Log upload completed:', data.message);
        break;
      case S3LogWorkerCommand.UPLOAD_FAILED:
        console.error('Log upload failed:', data.error);
        break;
      default:
        return;
    }
  };
}
