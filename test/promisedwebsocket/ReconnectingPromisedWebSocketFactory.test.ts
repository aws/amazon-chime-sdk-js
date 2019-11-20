// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import BackoffFactory from '../../src/backoff/BackoffFactory';
import PromisedWebSocketFactory from '../../src/promisedwebsocket/PromisedWebSocketFactory';
import ReconnectingPromisedWebSocket from '../../src/promisedwebsocket/ReconnectingPromisedWebSocket';
import ReconnectingPromisedWebSocketFactory from '../../src/promisedwebsocket/ReconnectingPromisedWebSocketFactory';

describe('ReconnectingPromisedWebSocketFactory', () => {
  describe('#create', () => {
    it('is created', () => {
      const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
      const subject = new ReconnectingPromisedWebSocketFactory(
        webSocketFactory,
        Substitute.for<BackoffFactory>(),
        5
      );
      chai.expect(subject.create('ws://foo')).to.be.instanceOf(ReconnectingPromisedWebSocket);
    });
  });
});
