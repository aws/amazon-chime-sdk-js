// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenMessageDetail from '../screenmessagedetail/ScreenMessageDetail';
import ScreenMessageDetailSerialization from '../screenmessagedetailserialization/ScreenMessageDetailSerialization';
import ScreenSharingMessage from '../screensharingmessage/ScreenSharingMessage';
import ScreenSharingMessageType from '../screensharingmessage/ScreenSharingMessageType';
import ScreenSharingMessageFlagSerialization from './ScreenSharingMessageFlagSerialization';
import ScreenSharingMessageSerialization from './ScreenSharingMessageSerialization';
import ScreenSharingMessageTypeSerialization from './ScreenSharingMessageTypeSerialization';

export default class ScreenSharingMessageSerializer implements ScreenSharingMessageSerialization {
  private static detailedSignals = Array.of(
    ScreenSharingMessageType.StreamStart,
    ScreenSharingMessageType.StreamEnd,
    ScreenSharingMessageType.PresenterSwitch
  );

  constructor(
    private typeSerialization: ScreenSharingMessageTypeSerialization,
    private flagSerialization: ScreenSharingMessageFlagSerialization,
    private signalingDetailSerialization: ScreenMessageDetailSerialization
  ) {}

  serialize(message: ScreenSharingMessage): Blob {
    const type = this.typeSerialization.serialize(message.type);
    const flags = this.flagSerialization.serialize(message.flags);
    const header = Uint8Array.of(type, flags, 0x0, 0x0);
    return new Blob([header, message.data]);
  }

  deserialize(buffer: Uint8Array): ScreenSharingMessage {
    let signalingDetail: ScreenMessageDetail = null;
    const type = this.typeSerialization.deserialize(buffer[0]);
    const flags = this.flagSerialization.deserialize(buffer[1]);
    const data = buffer.slice(4, buffer.length);
    if (ScreenSharingMessageSerializer.detailedSignals.indexOf(type) > -1) {
      signalingDetail = this.signalingDetailSerialization.deserialize(data).getOrElse(null);
    }
    return {
      type: type,
      flags: flags,
      data: data,
      detail: signalingDetail,
    };
  }
}
