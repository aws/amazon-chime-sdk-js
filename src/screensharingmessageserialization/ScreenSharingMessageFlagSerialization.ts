// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenSharingMessageFlag from '../screensharingmessage/ScreenSharingMessageFlag';

export default interface ScreenSharingMessageFlagSerialization {
  /**
   * Serialize list of flags as number
   * @param {ScreenSharingMessageFlag[]} flags
   * @returns {number}
   */
  serialize(flags: ScreenSharingMessageFlag[]): number;

  /**
   * Deserialize number as list of flags
   * @param {number} byte
   * @returns {ScreenSharingMessageFlag[]}
   */
  deserialize(byte: number): ScreenSharingMessageFlag[];
}
