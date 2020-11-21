// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MessagingSessionObserver from '../messagingsessionobserver/MessagingSessionObserver';

export default interface MessagingSession {
  /**
   * Start a messaging session.
   */
  start(): void;

  /**
   * Stop a messaging session.
   */
  stop(): void;

  /**
   * Add an observer.
   */
  addObserver(observer: MessagingSessionObserver): void;

  /**
   * Remove an observer.
   */
  removeObserver(observer: MessagingSessionObserver): void;

  /**
   * Iterates through each observer, so that their notification functions may
   * be called.
   */
  forEachObserver(observerFunc: (observer: MessagingSessionObserver) => void): void;
}
