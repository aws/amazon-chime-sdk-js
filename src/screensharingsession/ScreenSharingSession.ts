// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenSharingSessionObserver from './ScreenSharingSessionObserver';

export default interface ScreenSharingSession {
  /**
   * Opens the screen sharing session
   */
  open(timeoutMs: number): Promise<Event>;

  /**
   * Closes the screen sharing session
   * @param {number} timeoutMs
   * @returns {Promise<Event>}
   */
  close(timeoutMs: number): Promise<Event>;

  /**
   * Start screen sharing
   */
  start(sourceId?: string): Promise<void>;

  /**
   * Stop screen sharing
   */
  stop(): Promise<void>;

  /**
   *
   * @param {ScreenSharingSessionObserver} observer
   */
  registerObserver(observer: ScreenSharingSessionObserver): ScreenSharingSession;

  /**
   *
   * @param {ScreenSharingSessionObserver} observer
   */
  deregisterObserver(observer: ScreenSharingSessionObserver): ScreenSharingSession;
}
