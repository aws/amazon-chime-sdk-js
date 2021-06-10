// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[EventBuffer]] is responsible to store and send events to the
 * ingestion service endpoint.
 */
export default interface EventBuffer<T> {
  /**
   * Adds an event to the buffer.
   * An error is thrown if the event buffer is full.
   * @param item to add to the buffer.
   */
  addItem(item: T): Promise<void>;

  /**
   * Starts sending events.
   */
  start(): void;

  /**
   * Stops sending events.
   */
  stop(): void;
}
