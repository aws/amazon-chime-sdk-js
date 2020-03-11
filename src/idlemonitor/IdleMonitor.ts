// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import PingPong from '../pingpong/PingPong';

/**
 * [[ReconnectController]] describes the status about the meeting session connection and makes decisions
 * based on the controller implementation.
 */
export default interface IdleMonitor {
  /**
   * Returns true or false based on the idle condition
   */
  isIdle(): boolean;

  /**
   * Add IdleMonitor to the list of PingPong observers
   */
  addToPingPongObserver(_pingPong: PingPong): void;

  /**
   * Remove IdleMonitor from the list of PingPong observers
   */
  removeIdleMonitorObserver(): void;
}
