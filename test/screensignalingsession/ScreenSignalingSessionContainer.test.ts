// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import Logger from '../../src/logger/Logger';
import ReconnectingPromisedWebSocketFactory from '../../src/promisedwebsocket/ReconnectingPromisedWebSocketFactory';
import DefaultScreenSignalingSessionFactory from '../../src/screensignalingsession/DefaultScreenSignalingSessionFactory';
import ScreenSignalingSessionContainer from '../../src/screensignalingsession/ScreenSignalingSessionContainer';

describe('ScreenSignalingSessionContainer', () => {
  describe('#create', () => {
    it('is created', () => {
      const webSocketFactory = Substitute.for<ReconnectingPromisedWebSocketFactory>();
      const logger = Substitute.for<Logger>();
      const subject = new ScreenSignalingSessionContainer(webSocketFactory, logger);
      chai
        .expect(subject.screenSignalingSessionFactory())
        .to.be.instanceOf(DefaultScreenSignalingSessionFactory);
      chai
        .expect(subject.screenSignalingSessionFactory())
        .to.be.instanceOf(DefaultScreenSignalingSessionFactory);
    });
  });
});
