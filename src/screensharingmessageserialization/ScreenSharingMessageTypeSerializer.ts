// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenSharingMessageType from '../screensharingmessage/ScreenSharingMessageType';
import ScreenSharingMessageTypeSerialization from './ScreenSharingMessageTypeSerialization';

/**
 * [[ScreenSharingMessageTypeSerializer]] Default ScreenSharingMessageTypeSerialization implementation
 */
export default class ScreenSharingMessageTypeSerializer
  implements ScreenSharingMessageTypeSerialization {
  private static readonly fromNumberMap = new Map<number, ScreenSharingMessageType>([
    [0x02, ScreenSharingMessageType.KeyRequest],
    [0x03, ScreenSharingMessageType.StreamStart],
    [0x04, ScreenSharingMessageType.StreamEnd],
    [0x05, ScreenSharingMessageType.StreamStop],
    [0x06, ScreenSharingMessageType.HeartbeatRequestType],
    [0x07, ScreenSharingMessageType.HeartbeatResponseType],
    [0x0d, ScreenSharingMessageType.WebM],
    [0x10, ScreenSharingMessageType.PresenterSwitch],
  ]);

  private static readonly fromTypeMap = new Map<ScreenSharingMessageType, number>(
    Array.from(ScreenSharingMessageTypeSerializer.fromNumberMap).map(
      entry => entry.reverse() as [ScreenSharingMessageType, number]
    )
  );

  serialize(type: ScreenSharingMessageType): number {
    if (ScreenSharingMessageTypeSerializer.fromTypeMap.has(type)) {
      return ScreenSharingMessageTypeSerializer.fromTypeMap.get(type);
    }
    return 0;
  }

  deserialize(byte: number): ScreenSharingMessageType {
    if (ScreenSharingMessageTypeSerializer.fromNumberMap.has(byte)) {
      return ScreenSharingMessageTypeSerializer.fromNumberMap.get(byte);
    }
    return ScreenSharingMessageType.UnknownType;
  }
}
