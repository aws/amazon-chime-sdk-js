// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import ReconnectingPromisedWebSocketFactory from '../promisedwebsocket/ReconnectingPromisedWebSocketFactory';
import ProtocolScreenMessageDetailSerialization from '../screenmessagedetailserialization/ProtocolScreenMessageDetailSerialization';
import ScreenSharingMessageFlagSerializer from '../screensharingmessageserialization/ScreenSharingMessageFlagSerializer';
import ScreenSharingMessageSerialization from '../screensharingmessageserialization/ScreenSharingMessageSerialization';
import ScreenSharingMessageSerializer from '../screensharingmessageserialization/ScreenSharingMessageSerializer';
import ScreenSharingMessageTypeSerializer from '../screensharingmessageserialization/ScreenSharingMessageTypeSerializer';
import DefaultScreenSignalingSessionFactory from './DefaultScreenSignalingSessionFactory';
import ScreenSignalingSessionFactory from './ScreenSignalingSessionFactory';

export default class ScreenSignalingSessionContainer {
  private memo: ScreenSignalingSessionFactory | null = null;

  constructor(
    private webSocketFactory: ReconnectingPromisedWebSocketFactory,
    private logger: Logger
  ) {}

  screenSignalingSessionFactory(): ScreenSignalingSessionFactory {
    this.memo =
      this.memo ||
      new DefaultScreenSignalingSessionFactory(
        this.webSocketFactory,
        this.screenSharingMessageSerialization(),
        this.logger
      );
    return this.memo;
  }

  private screenSharingMessageSerialization(): ScreenSharingMessageSerialization {
    return new ScreenSharingMessageSerializer(
      new ScreenSharingMessageTypeSerializer(),
      new ScreenSharingMessageFlagSerializer(),
      new ProtocolScreenMessageDetailSerialization()
    );
  }
}
