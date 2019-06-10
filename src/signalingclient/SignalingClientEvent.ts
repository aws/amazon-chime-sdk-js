// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SdkSignalFrame } from '../signalingprotocol/SignalingProtocol.js';
import SignalingClient from './SignalingClient';
import SignalingClientEventType from './SignalingClientEventType';

/*
 * [[SignalingClientEvent]] stores an event that can be sent to observers of the SignalingClient.
 */
export default class SignalingClientEvent {
  timestampMs: number;

  /** Initializes a SignalingClientEvent with the given SignalingClientEventType.
   *
   * @param {SignalingClient} client Indicates the SignalingClient associated with the event.
   * @param {SignalingClientEventType} type Indicates the kind of event.
   * @param {SdkSignalFrame} message SdkSignalFrame if type is ReceivedSignalFrame
   */
  constructor(
    public client: SignalingClient,
    public type: SignalingClientEventType,
    public message: SdkSignalFrame
  ) {
    this.timestampMs = Date.now();
  }
}
