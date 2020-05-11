// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import Logger from '../../src/logger/Logger';
import PromisedWebSocket from '../../src/promisedwebsocket/PromisedWebSocket';
import PromisedWebSocketFactory from '../../src/promisedwebsocket/PromisedWebSocketFactory';
import ScreenSharingMessageSerialization from '../../src/screensharingmessageserialization/ScreenSharingMessageSerialization';
import DefaultScreenSignalingSession from '../../src/screensignalingsession/DefaultScreenSignalingSession';
import DefaultScreenSignalingSessionFactory from '../../src/screensignalingsession/DefaultScreenSignalingSessionFactory';

describe('DefaultScreenSignalingSessionFactory', () => {
  const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
  const subject = new DefaultScreenSignalingSessionFactory(
    webSocketFactory,
    Substitute.for<ScreenSharingMessageSerialization>(),
    Substitute.for<Logger>()
  );

  before(() => {
    webSocketFactory.create(Arg.all()).returns(Substitute.for<PromisedWebSocket>());
  });

  describe('#create', () => {
    it('is created', () => {
      chai
        .expect(subject.create('ws://foo', 'foo'))
        .to.be.instanceOf(DefaultScreenSignalingSession);
    });
  });
});
