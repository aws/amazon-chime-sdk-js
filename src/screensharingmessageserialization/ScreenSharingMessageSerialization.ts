// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenSharingMessage from '../screensharingmessage/ScreenSharingMessage';

/**
 * [[ScreenSharingMessageSerialization]] Packet serialization interface
 */
export default interface ScreenSharingMessageSerialization {
  /**
   * Serializes the provided message as Uint8Array
   * @param {ScreenSharingMessage} packet
   * @returns {Uint8Array}
   */
  serialize(message: ScreenSharingMessage): Blob;

  /**
   * Deserializes the provided buffer as ScreenSharingMessage
   * @param {Uint8Array} buffer
   * @returns {ScreenSharingMessage}
   */
  deserialize(buffer: Uint8Array): ScreenSharingMessage;
}
