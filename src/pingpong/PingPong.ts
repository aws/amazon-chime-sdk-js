// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import PingPongObserver from '../pingpongobserver/PingPongObserver';

/**
 * [[PingPong]] sends ping-pongs across the signaling connection via the
 * [[SignalingClient]]. It measures the round-trip time between the client ping
 * and server pong and acts as a heartbeat to keep the underlying WebSocket
 * connection alive.
 */
export default interface PingPong {
  /**
   * Adds observer to receive callbacks for pong events.
   */
  addObserver(observer: PingPongObserver): void;

  /**
   * Removes observer to stop receiving callbacks for pong events.
   */
  removeObserver(observer: PingPongObserver): void;

  /**
   * Iterates through each observer, so that their notification functions may
   * be called.
   */
  forEachObserver(observerFunc: (observer: PingPongObserver) => void): void;

  /**
   * Starts sending pings on an interval and receiving pongs.
   */
  start(): void;

  /**
   * Stops ping-pongs.
   */
  stop(): void;
}
