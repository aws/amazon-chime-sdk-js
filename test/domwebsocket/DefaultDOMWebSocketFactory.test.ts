// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'mocha';

import * as chai from 'chai';

import DefaultDOMWebSocket from '../../src/domwebsocket/DefaultDOMWebSocket';
import DefaultDOMWebSocketFactory from '../../src/domwebsocket/DefaultDOMWebSocketFactory';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultDOMWebSocketFactory', () => {
  before(() => {
    chai.should();
  });

  describe('#create', () => {
    describe('with binaryType', () => {
      it('is created', () => {
        const domMock = new DOMMockBuilder(new DOMMockBehavior());
        const subject = new DefaultDOMWebSocketFactory();
        subject
          .create('wss://host', 'foo=bar', 'arraybuffer')
          .should.be.instanceOf(DefaultDOMWebSocket);
        domMock.cleanup();
      });
    });

    describe('without binaryType', () => {
      it('is created', () => {
        const domMock = new DOMMockBuilder(new DOMMockBehavior());
        const subject = new DefaultDOMWebSocketFactory();
        subject.create('wss://host', 'foo=bar').should.be.instanceOf(DefaultDOMWebSocket);
        domMock.cleanup();
      });
    });
  });
});
