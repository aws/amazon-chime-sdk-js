// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[SessionStateControllerState]] reflects the current connection state of the session.
 */
export enum SessionStateControllerState {
  NotConnected,
  Connecting,
  Connected,
  Updating,
  Disconnecting,
}

export default SessionStateControllerState;
