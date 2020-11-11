// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[SessionStateControllerAction]] is a state-changing action to perform.
 */
export enum SessionStateControllerAction {
  Connect,
  FinishConnecting,
  Update,
  FinishUpdating,
  Reconnect,
  Disconnect,
  Fail,
  FinishDisconnecting,
}

export default SessionStateControllerAction;
