// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenSharingMessageType from '../screensharingmessage/ScreenSharingMessageType';

/**
 * [[ScreenSharingMessageTypeSerialization]] Packet type deserialization interface
 */
export default interface ScreenSharingMessageTypeSerialization {
  /**
   * Serializes ScreenSharingMessageType as a number (byte)
   * @param {ScreenSharingMessageType} type
   * @returns {number}
   */
  serialize(type: ScreenSharingMessageType): number;

  /**
   * Deserialize byte as ScreenSharingMessageType
   */
  deserialize(byte: number): ScreenSharingMessageType;
}
