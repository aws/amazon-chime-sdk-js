// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import Maybe from '../maybe/Maybe';
import PingPongObserver from '../pingpongobserver/PingPongObserver';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import SignalingClient from '../signalingclient/SignalingClient';
import SignalingClientEvent from '../signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../signalingclient/SignalingClientEventType';
import SignalingClientObserver from '../signalingclientobserver/SignalingClientObserver';
import {
  SdkPingPongFrame,
  SdkPingPongType,
  SdkSignalFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import PingPong from './PingPong';

/**
 * [[DefaultPingPong]] implements the PingPong and SignalingClientObserver interface.
 */
export default class DefaultPingPong implements SignalingClientObserver, PingPong {
  private observerQueue: Set<PingPongObserver> = new Set<PingPongObserver>();
  intervalScheduler: IntervalScheduler;
  pingTimestampLocalMs: number;
  pingId: number;
  consecutivePongsUnaccountedFor = 0;

  constructor(
    private signalingClient: SignalingClient,
    private intervalMs: number,
    private logger: Logger
  ) {
    this.intervalScheduler = new IntervalScheduler(this.intervalMs);
    this.pingId = 0;
  }

  addObserver(observer: PingPongObserver): void {
    this.logger.info('adding a ping-pong observer');
    this.observerQueue.add(observer);
  }

  removeObserver(observer: PingPongObserver): void {
    this.logger.info('removing a ping-pong observer');
    this.observerQueue.delete(observer);
  }

  forEachObserver(observerFunc: (observer: PingPongObserver) => void): void {
    for (const observer of this.observerQueue) {
      new AsyncScheduler().start(() => {
        if (this.observerQueue.has(observer)) {
          observerFunc(observer);
        }
      });
    }
  }

  start(): void {
    this.stop();
    this.signalingClient.registerObserver(this);
    if (this.signalingClient.ready()) {
      this.startPingInterval();
    }
  }

  stop(): void {
    this.stopPingInterval();
    this.signalingClient.removeObserver(this);
  }

  private startPingInterval(): void {
    this.intervalScheduler.start(() => {
      this.ping();
    });
    this.ping();
  }

  private stopPingInterval(): void {
    this.intervalScheduler.stop();
    this.pingId = 0;
    this.consecutivePongsUnaccountedFor = 0;
  }

  private ping(): void {
    if (this.consecutivePongsUnaccountedFor > 0) {
      this.logger.warn(`missed pong ${this.consecutivePongsUnaccountedFor} time(s)`);
      this.forEachObserver((observer: PingPongObserver) => {
        Maybe.of(observer.didMissPongs).map(f =>
          f.bind(observer)(this.consecutivePongsUnaccountedFor)
        );
      });
    }
    this.consecutivePongsUnaccountedFor += 1;
    this.pingId = (this.pingId + 1) & 0xffffffff;
    const ping = SdkPingPongFrame.create();
    ping.pingId = this.pingId;
    ping.type = SdkPingPongType.PING;
    this.pingTimestampLocalMs = this.signalingClient.pingPong(ping);
    this.logger.debug(() => {
      return `sent ping ${this.pingId}`;
    });
  }

  private pong(pingId: number): void {
    const pong = SdkPingPongFrame.create();
    pong.pingId = pingId;
    pong.type = SdkPingPongType.PONG;
    this.signalingClient.pingPong(pong);
  }

  handleSignalingClientEvent(event: SignalingClientEvent): void {
    switch (event.type) {
      case SignalingClientEventType.WebSocketOpen:
        this.startPingInterval();
        break;
      case SignalingClientEventType.WebSocketFailed:
      case SignalingClientEventType.WebSocketError:
        this.logger.warn(`stopped pinging (${SignalingClientEventType[event.type]})`);
        this.stopPingInterval();
        break;
      case SignalingClientEventType.WebSocketClosing:
      case SignalingClientEventType.WebSocketClosed:
        this.logger.info(`stopped pinging (${SignalingClientEventType[event.type]})`);
        this.stopPingInterval();
        break;
      case SignalingClientEventType.ReceivedSignalFrame:
        if (event.message.type !== SdkSignalFrame.Type.PING_PONG) {
          break;
        }
        if (event.message.pingPong.type === SdkPingPongType.PONG) {
          const pingId = event.message.pingPong.pingId;
          if (pingId !== this.pingId) {
            this.logger.warn(`unexpected ping id ${pingId} (expected ${this.pingId})`);
            break;
          }
          this.consecutivePongsUnaccountedFor = 0;
          let pongTimestampRemoteMs: number;
          if (typeof event.message.timestampMs === 'number') {
            pongTimestampRemoteMs = event.message.timestampMs;
          } else {
            break;
          }
          this.logger.debug(() => {
            return `received pong ${pingId} with timestamp ${pongTimestampRemoteMs}`;
          });
          const pongTimestampLocalMs = event.timestampMs;
          const pingPongLocalIntervalMs = pongTimestampLocalMs - this.pingTimestampLocalMs;
          const estimatedPingTimestampRemoteMs = Math.round(
            pongTimestampRemoteMs - pingPongLocalIntervalMs / 2
          );
          const estimatedClockSkewMs = this.pingTimestampLocalMs - estimatedPingTimestampRemoteMs;
          this.logger.info(
            `local clock skew estimate=${estimatedClockSkewMs}ms from ping-pong time=${pingPongLocalIntervalMs}ms`
          );
          this.forEachObserver((observer: PingPongObserver) => {
            Maybe.of(observer.didReceivePong).map(f =>
              f.bind(observer)(pingId, estimatedClockSkewMs, pingPongLocalIntervalMs)
            );
          });
        } else {
          this.pong(event.message.pingPong.pingId);
        }
        break;
    }
  }
}
