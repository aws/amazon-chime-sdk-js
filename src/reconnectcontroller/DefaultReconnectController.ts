// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackoffPolicy from '../backoff/Backoff';
import IdleMonitor from '../idlemonitor/DefaultIdleMonitor';
import TimeoutScheduler from '../scheduler/TimeoutScheduler';
import ReconnectController from './ReconnectController';

export default class DefaultReconnectController implements ReconnectController {
  private shouldReconnect: boolean = true;
  private onlyRestartPeerConnection: boolean = false;
  private firstConnectionAttempted: boolean = false;
  private firstConnectionAttemptTimestamp: number = 0;
  private _isFirstConnection: boolean = true;
  private backoffTimer: TimeoutScheduler | null = null;
  private backoffCancel: () => void = null;
  private idleMonitor: IdleMonitor;

  constructor(private reconnectTimeoutMs: number, private backoffPolicy: BackoffPolicy) {
    this.reset();
  }

  private timeSpentReconnectingMs(): number {
    if (!this.firstConnectionAttempted) {
      return 0;
    }
    return Date.now() - this.firstConnectionAttemptTimestamp;
  }

  private hasPastReconnectDeadline(): boolean {
    const hasSpentTooMuchTimeReconnecting =
      this.timeSpentReconnectingMs() >= this.reconnectTimeoutMs;
    return hasSpentTooMuchTimeReconnecting || this.idleMonitor.isIdle();
  }

  reset(): void {
    this.cancel();
    this.shouldReconnect = true;
    this.onlyRestartPeerConnection = false;
    this.firstConnectionAttempted = false;
    this.firstConnectionAttemptTimestamp = 0;
    this.backoffPolicy.reset();
  }

  startedConnectionAttempt(isFirstConnection: boolean, idleMonitor: IdleMonitor): void {
    this._isFirstConnection = isFirstConnection;
    this.idleMonitor = idleMonitor;
    if (!this.firstConnectionAttempted) {
      this.firstConnectionAttempted = true;
      this.firstConnectionAttemptTimestamp = Date.now();
    }
  }

  hasStartedConnectionAttempt(): boolean {
    return this.firstConnectionAttempted;
  }

  isFirstConnection(): boolean {
    return this._isFirstConnection;
  }

  disableReconnect(): void {
    this.shouldReconnect = false;
  }

  enableRestartPeerConnection(): void {
    this.onlyRestartPeerConnection = true;
  }

  cancel(): void {
    this.disableReconnect();
    if (this.backoffTimer) {
      this.backoffTimer.stop();
      if (this.backoffCancel) {
        this.backoffCancel();
        this.backoffCancel = null;
      }
    }
  }

  retryWithBackoff(retryFunc: () => void, cancelFunc: () => void): boolean {
    const willRetry = this.shouldReconnect && !this.hasPastReconnectDeadline();
    if (willRetry) {
      this.backoffCancel = cancelFunc;
      this.backoffTimer = new TimeoutScheduler(this.backoffPolicy.nextBackoffAmountMs());
      this.backoffTimer.start(() => {
        this.backoffCancel = null;
        retryFunc();
      });
    }
    return willRetry;
  }

  shouldOnlyRestartPeerConnection(): boolean {
    return this.onlyRestartPeerConnection;
  }

  clone(): DefaultReconnectController {
    return new DefaultReconnectController(this.reconnectTimeoutMs, this.backoffPolicy);
  }
}
