// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MessagingSessionObserver from '../messagingsessionobserver/MessagingSessionObserver';

export default interface MessagingSession {
  /**
   * Start a messaging session. This promise is fulfilled when messaging session is established successfully.
   * Promise is rejected when there are errors in communicating to messaging endpoint or connection is Unauthorized.
   */
  start(): Promise<void>;

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
