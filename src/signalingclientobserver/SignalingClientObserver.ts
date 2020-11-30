// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SignalingClientEvent from '../signalingclient/SignalingClientEvent';

/**
 * Instances of [[SignalingClientObserver]] can be registered with a
 * [[SignalingClient]] to receive notifications of events.
 */
export default interface SignalingClientObserver {
  /** Handles the events from the SignalingClient this observer is registered with.
   *
   * @param {SignalingClientEvent} event The event being notified.
   */
  handleSignalingClientEvent(event: SignalingClientEvent): void;
}
