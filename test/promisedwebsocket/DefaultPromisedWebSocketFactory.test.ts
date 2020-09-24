// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import 'mocha';

import DOMWebSocket from '../../src/domwebsocket/DOMWebSocket';
import DOMWebSocketFactory from '../../src/domwebsocket/DOMWebSocketFactory';
import DefaultPromisedWebSocket from '../../src/promisedwebsocket/DefaultPromisedWebSocket';
import DefaultPromisedWebSocketFactory from '../../src/promisedwebsocket/DefaultPromisedWebSocketFactory';

describe('DefaultPromisedWebSocketFactory', () => {
  before(() => {
    chai.should();
  });

  describe('#create', () => {
    it('is created', () => {
      const url = 'wss://host';
      const protocols = 'foo=bar';
      const binaryType: BinaryType = 'arraybuffer';
      const webSocketFactory = Substitute.for<DOMWebSocketFactory>();
      const subject = new DefaultPromisedWebSocketFactory(webSocketFactory);
      webSocketFactory.create(url, protocols, binaryType).returns(Substitute.for<DOMWebSocket>());
      subject.create(url, protocols).should.be.instanceOf(DefaultPromisedWebSocket);
    });
  });
});
