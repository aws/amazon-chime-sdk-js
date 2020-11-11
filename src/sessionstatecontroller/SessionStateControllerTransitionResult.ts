// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Indicates the result of an attempted state transition.
 */
export enum SessionStateControllerTransitionResult {
  /**
   * The transition was successful.
   */
  Transitioned,

  /**
   * No transition is available from the current state using that action.
   */
  NoTransitionAvailable,

  /**
   * The transition will be tried on the next state.
   */
  DeferredTransition,

  /**
   * An unexpected error occurred while transitioning to the next state.
   */
  TransitionFailed,
}

export default SessionStateControllerTransitionResult;
