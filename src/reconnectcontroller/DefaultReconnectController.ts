// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackoffPolicy from '../backoff/Backoff';
import TimeoutScheduler from '../scheduler/TimeoutScheduler';
import ReconnectController from './ReconnectController';
import PingPong from '../pingpong/PingPong';
import PingPongObserver from '../pingpongobserver/PingPongObserver';

export default class DefaultReconnectController implements ReconnectController, PingPongObserver {
  private shouldReconnect: boolean = true;
  private onlyRestartPeerConnection: boolean = false;
  private firstConnectionAttempted: boolean = false;
  private canReceivePongs: boolean = false;
  private firstConnectionAttemptTimestamp: number = 0;
  private lastConnectionAttemptTimestamp: number = 0;
  private _isFirstConnection: boolean = true;
  private pingPong: PingPong;
  private backoffTimer: TimeoutScheduler | null = null;
  private backoffCancel: () => void = null;

  constructor(private reconnectTimeoutMs: number, private backoffPolicy: BackoffPolicy) {
    this.reset();
  }

  private timeSpentReconnectingMs(): number {
    if (!this.firstConnectionAttempted) {
      return 0;
    }
    return Date.now() - this.firstConnectionAttemptTimestamp;
  }

  private timeSinceLastActiveMs(): number{
    if (!this.canReceivePongs) {
        return 0;
    }
    return Date.now() - this.lastConnectionAttemptTimestamp;
  }

  private hasPastReconnectDeadline(): boolean {
    const hasSpentTooMuchTimeReconnecting = this.timeSpentReconnectingMs() >= this.reconnectTimeoutMs;
    const hasBeenTooLongSinceConnected = this.timeSinceLastActiveMs() >= this.reconnectTimeoutMs;
    return hasSpentTooMuchTimeReconnecting || hasBeenTooLongSinceConnected;
  }

  didReceivePong(latencyMs: number, clockSkewMs: number): void {
    this.lastConnectionAttemptTimestamp = Date.now();
    this.canReceivePongs = true;
  }

  reset(): void {
    this.cancel();
    if (this.firstConnectionAttempted || this.canReceivePongs){
       this.pingPong.removeObserver(this);
       this.pingPong.stop();
       this.canReceivePongs = false;
    }
    this.shouldReconnect = true;
    this.onlyRestartPeerConnection = false;
    this.firstConnectionAttempted = false;
    this.firstConnectionAttemptTimestamp = 0;
    this.backoffPolicy.reset();
  }

  startedConnectionAttempt(isFirstConnection: boolean, pingPong: PingPong): void {
    this._isFirstConnection = isFirstConnection;
    if (!this.firstConnectionAttempted) {
      this.firstConnectionAttempted = true;
      this.firstConnectionAttemptTimestamp = Date.now();
      this.pingPong = pingPong;
      this.pingPong.addObserver(this);
      this.pingPong.start();
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