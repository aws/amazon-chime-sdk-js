// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import PingPong from '../pingpong/PingPong';
import PingPongObserver from '../pingpongobserver/PingPongObserver';
import IdleMonitor from './IdleMonitor';

export default class DefaultIdleMonitor implements IdleMonitor, PingPongObserver {
  private canReceivePongs: boolean = false;
  private lastPongResponseSeen: number = Date.now();

  constructor(private pingPong: PingPong, private maxIdleTimeMs: number) {
    this.addToPingPongObserver(this.pingPong);
  }

  addToPingPongObserver(pingPong: PingPong): void {
    this.pingPong = pingPong;
    this.pingPong.addObserver(this);
  }

  removeIdleMonitorObserver(): void {
    this.canReceivePongs = false;
    this.pingPong.removeObserver(this);
  }

  private timeSinceLastActiveMs(): number {
    if (!this.canReceivePongs) {
      return 0;
    }
    return Date.now() - this.lastPongResponseSeen;
  }

  isIdle(): boolean {
    return this.timeSinceLastActiveMs() >= this.maxIdleTimeMs;
  }

  didReceivePong(_id: number, _latencyMs: number, _clockSkewMs: number): void {
    this.lastPongResponseSeen = Date.now();
    this.canReceivePongs = true;
  }
}
