// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SessionStateControllerAction } from './SessionStateControllerAction';
import { SessionStateControllerState } from './SessionStateControllerState';
import { SessionStateControllerTransitionResult } from './SessionStateControllerTransitionResult';

/**
 * Manages [[SessionStateControllerState]] state transitions via
 * [[SessionStateControllerAction]] actions and ensures that the work functions
 * attached to the transition are sequenced properly.
 */
export default interface SessionStateController {
  /**
   * Performs the state transition action and if the transition is possible calls
   * the work function. If the transition is not currently possible, but could
   * become possible after the next transition then the action may be deferred.
   * For example, while in the Connecting state, if Stop is called this action
   * will be deferred until the Connected state is reached.
   */
  perform(
    action: SessionStateControllerAction,
    work: () => void
  ): SessionStateControllerTransitionResult;

  /**
   * Gets the current state.
   */
  state(): SessionStateControllerState;
}
