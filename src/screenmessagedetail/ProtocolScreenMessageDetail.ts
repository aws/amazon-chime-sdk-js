// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ISdkScreenSignalingMessage } from '../screensignalingprotocol/ScreenSignalingProtocol';
import ScreenMessageDetail from './ScreenMessageDetail';

export default class ProtobufScreenMessageDetail implements ScreenMessageDetail {
  constructor(private message: ISdkScreenSignalingMessage) {}

  get attendeeId(): string {
    return this.message.attendeeId;
  }
}
