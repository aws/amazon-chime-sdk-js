// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenSharingMessageFlag from '../screensharingmessage/ScreenSharingMessageFlag';
import ScreenSharingMessageFlagSerialization from './ScreenSharingMessageFlagSerialization';

export default class ScreenSharingMessageFlagSerializer
  implements ScreenSharingMessageFlagSerialization {
  private static readonly Broadcast = 1 << 0;
  private static readonly Local = 1 << 1;
  private static readonly Synthesized = 1 << 2;
  private static readonly Unicast = 1 << 3;

  serialize(flags: ScreenSharingMessageFlag[]): number {
    let n = 0;

    if (flags.includes(ScreenSharingMessageFlag.Broadcast)) {
      n |= ScreenSharingMessageFlagSerializer.Broadcast;
    }
    if (flags.includes(ScreenSharingMessageFlag.Local)) {
      n |= ScreenSharingMessageFlagSerializer.Local;
    }
    if (flags.includes(ScreenSharingMessageFlag.Synthesized)) {
      n |= ScreenSharingMessageFlagSerializer.Synthesized;
    }
    if (flags.includes(ScreenSharingMessageFlag.Unicast)) {
      n |= ScreenSharingMessageFlagSerializer.Unicast;
    }
    return n;
  }

  deserialize(byte: number): ScreenSharingMessageFlag[] {
    const flags = new Array<ScreenSharingMessageFlag>();

    if (this.isBitSet(byte, ScreenSharingMessageFlagSerializer.Broadcast)) {
      flags.push(ScreenSharingMessageFlag.Broadcast);
    }
    if (this.isBitSet(byte, ScreenSharingMessageFlagSerializer.Unicast)) {
      flags.push(ScreenSharingMessageFlag.Unicast);
    }
    if (this.isBitSet(byte, ScreenSharingMessageFlagSerializer.Local)) {
      flags.push(ScreenSharingMessageFlag.Local);
    }
    if (this.isBitSet(byte, ScreenSharingMessageFlagSerializer.Synthesized)) {
      flags.push(ScreenSharingMessageFlag.Synthesized);
    }

    return flags;
  }

  private isBitSet(byte: number, bit: number): boolean {
    return (byte & bit) === bit;
  }
}
