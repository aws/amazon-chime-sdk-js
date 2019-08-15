// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenViewingSessionObserver from '../clientobserver/ScreenViewingSessionObserver';
import ScreenViewingSessionConnectionRequest from './ScreenViewingSessionConnectionRequest';

/**
 * [[ScreenViewingSession]] provides an interface for opening a screen viewing connection over WebSocket.
 */
export default interface ScreenViewingSession {
  withObserver(observer: ScreenViewingSessionObserver): ScreenViewingSession;

  /**
   * Opens a connection for screen viewing.
   */
  openConnection(request: ScreenViewingSessionConnectionRequest): Promise<Event>;

  /**
   * Closes an open connection.
   */
  closeConnection(): Promise<void>;

  /**
   * Sends data to the connection.
   */
  send(data: Uint8Array): void;
}
