// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import SessionStateController from './SessionStateController';
import { SessionStateControllerAction } from './SessionStateControllerAction';
import { SessionStateControllerDeferPriority } from './SessionStateControllerDeferPriority';
import { SessionStateControllerState } from './SessionStateControllerState';
import { SessionStateControllerTransitionResult } from './SessionStateControllerTransitionResult';

export default class DefaultSessionStateController implements SessionStateController {
  constructor(private logger: Logger) {}

  perform(
    action: SessionStateControllerAction,
    work: () => void
  ): SessionStateControllerTransitionResult {
    const state = this.currentState;
    if (
      state === SessionStateControllerState.NotConnected &&
      action === SessionStateControllerAction.Connect
    ) {
      this.transition(SessionStateControllerState.Connecting, action);
    } else if (
      state === SessionStateControllerState.Connecting &&
      action === SessionStateControllerAction.Fail
    ) {
      this.transition(SessionStateControllerState.Disconnecting, action);
    } else if (
      state === SessionStateControllerState.Connecting &&
      action === SessionStateControllerAction.FinishConnecting
    ) {
      this.transition(SessionStateControllerState.Connected, action);
    } else if (
      state === SessionStateControllerState.Connected &&
      action === SessionStateControllerAction.Disconnect
    ) {
      this.transition(SessionStateControllerState.Disconnecting, action);
    } else if (
      state === SessionStateControllerState.Connected &&
      action === SessionStateControllerAction.Reconnect
    ) {
      this.transition(SessionStateControllerState.Connecting, action);
    } else if (
      state === SessionStateControllerState.Connected &&
      action === SessionStateControllerAction.Fail
    ) {
      this.transition(SessionStateControllerState.Disconnecting, action);
    } else if (
      state === SessionStateControllerState.Connected &&
      action === SessionStateControllerAction.Update
    ) {
      this.transition(SessionStateControllerState.Updating, action);
    } else if (
      state === SessionStateControllerState.Updating &&
      action === SessionStateControllerAction.Fail
    ) {
      this.transition(SessionStateControllerState.Disconnecting, action);
    } else if (
      state === SessionStateControllerState.Updating &&
      action === SessionStateControllerAction.FinishUpdating
    ) {
      this.transition(SessionStateControllerState.Connected, action);
    } else if (
      state === SessionStateControllerState.Disconnecting &&
      action === SessionStateControllerAction.FinishDisconnecting
    ) {
      this.transition(SessionStateControllerState.NotConnected, action);
    } else if (this.canDefer(action)) {
      this.logger.info(
        `deferring transition from ${SessionStateControllerState[this.currentState]} with ${
          SessionStateControllerAction[action]
        }`
      );
      this.deferAction(action, work);
      return SessionStateControllerTransitionResult.DeferredTransition;
    } else {
      this.logger.warn(
        `no transition found from ${SessionStateControllerState[this.currentState]} with ${
          SessionStateControllerAction[action]
        }`
      );
      return SessionStateControllerTransitionResult.NoTransitionAvailable;
    }
    try {
      work();
    } catch (e) {
      this.logger.error(
        `error during state ${SessionStateControllerState[this.currentState]} with action ${
          SessionStateControllerAction[action]
        }: ${e}`
      );
      this.logger.info(`rolling back transition to ${SessionStateControllerState[state]}`);
      this.currentState = state;
      return SessionStateControllerTransitionResult.TransitionFailed;
    }
    this.performDeferredAction();
    return SessionStateControllerTransitionResult.Transitioned;
  }

  state(): SessionStateControllerState {
    return this.currentState;
  }

  private currentState: SessionStateControllerState = SessionStateControllerState.NotConnected;
  private deferredAction: SessionStateControllerAction | null = null;
  private deferredWork: () => void | null = null;

  private transition(
    newState: SessionStateControllerState,
    action: SessionStateControllerAction
  ): void {
    this.logger.info(
      `transitioning from ${SessionStateControllerState[this.currentState]} to ${
        SessionStateControllerState[newState]
      } with ${SessionStateControllerAction[action]}`
    );
    this.currentState = newState;
  }

  private deferPriority(action: SessionStateControllerAction): SessionStateControllerDeferPriority {
    switch (action) {
      case SessionStateControllerAction.Disconnect:
        return SessionStateControllerDeferPriority.VeryHigh;
      case SessionStateControllerAction.Fail:
        return SessionStateControllerDeferPriority.High;
      case SessionStateControllerAction.Reconnect:
        return SessionStateControllerDeferPriority.Medium;
      case SessionStateControllerAction.Update:
        return SessionStateControllerDeferPriority.Low;
      default:
        return SessionStateControllerDeferPriority.DoNotDefer;
    }
  }

  private deferAction(action: SessionStateControllerAction, work: () => void): void {
    if (
      this.deferredAction !== null &&
      this.deferPriority(this.deferredAction) > this.deferPriority(action)
    ) {
      return;
    }
    this.deferredAction = action;
    this.deferredWork = work;
  }

  private canDefer(action: SessionStateControllerAction): boolean {
    return (
      this.deferPriority(action) !== SessionStateControllerDeferPriority.DoNotDefer &&
      (this.currentState === SessionStateControllerState.Connecting ||
        this.currentState === SessionStateControllerState.Updating)
    );
  }

  private performDeferredAction(): SessionStateControllerTransitionResult {
    if (!this.deferredAction) {
      return;
    }
    const deferredAction = this.deferredAction;
    const deferredWork = this.deferredWork;
    this.deferredAction = null;
    this.deferredWork = null;
    this.logger.info(`performing deferred action ${SessionStateControllerAction[deferredAction]}`);
    if (
      this.perform(deferredAction, deferredWork) !==
      SessionStateControllerTransitionResult.Transitioned
    ) {
      this.logger.info(
        `unable to perform deferred action ${
          SessionStateControllerAction[deferredAction]
        } in state ${SessionStateControllerState[this.currentState]}`
      );
    }
  }
}
