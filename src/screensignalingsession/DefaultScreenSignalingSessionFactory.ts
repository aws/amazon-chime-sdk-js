// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import PromisedWebSocketFactory from '../promisedwebsocket/PromisedWebSocketFactory';
import ScreenSharingMessageSerialization from '../screensharingmessageserialization/ScreenSharingMessageSerialization';
import DefaultScreenSignalingSession from './DefaultScreenSignalingSession';
import ScreenSignalingSession from './ScreenSignalingSession';
import ScreenSignalingSessionFactory from './ScreenSignalingSessionFactory';

export default class DefaultScreenSignalingSessionFactory implements ScreenSignalingSessionFactory {
  constructor(
    private webSocketFactory: PromisedWebSocketFactory,
    private messageSerialization: ScreenSharingMessageSerialization,
    private logger: Logger
  ) {}

  create(url: string, sessionToken: string): ScreenSignalingSession {
    const protocols = [DefaultScreenSignalingSession.SessionKey, sessionToken];
    return new DefaultScreenSignalingSession(
      this.webSocketFactory.create(url, protocols, 'arraybuffer'),
      this.messageSerialization,
      this.logger
    );
  }
}
