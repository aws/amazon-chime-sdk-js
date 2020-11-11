// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[PingPongObserver]] implements callbacks for when [[PingPong]] pongs are
 * received or missed.
 */
export default interface PingPongObserver {
  /**
   * Called when a pong is received with the measured latency from the ping as
   * well as an estimate of the local clock skew compared to the server clock.
   */
  didReceivePong?(id: number, latencyMs: number, clockSkewMs: number): void;

  /**
   * Called when one or more pongs are missed in a row. This can be an
   * indication that the underlying connection has failed.
   */
  didMissPongs?(consecutiveMissed: number): void;
}
