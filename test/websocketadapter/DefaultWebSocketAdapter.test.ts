// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpLogger from '../../src/logger/NoOpLogger';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import WebSocketReadyState from '../../src/websocketadapter/WebSocketReadyState';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultWebSocketAdapter', () => {
  let expect: Chai.ExpectStatic;
  let domMockBuilder: DOMMockBuilder | null = null;
  const socket: DefaultWebSocketAdapter = new DefaultWebSocketAdapter(new NoOpLogger());
  const testMessage = 'ᚻᛖ ᚳᚹᚫᚦ ᚦᚫᛏ ᚻᛖ ᛒᚢᛞᛖ ᚩᚾ ᚦᚫᛗ ᛚᚪᚾᛞᛖ ᚾᚩᚱᚦᚹᛖᚪᚱᛞᚢᛗ ᚹᛁᚦ ᚦᚪ ᚹᛖᛥᚫ';

  before(() => {
    domMockBuilder = new DOMMockBuilder();
    expect = chai.expect;
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  it('can be created', done => {
    const asyncWaitMs = 10;
    const behavior = new DOMMockBehavior();
    behavior.asyncWaitMs = asyncWaitMs;
    domMockBuilder = new DOMMockBuilder(behavior);
    socket.create('http://example.com', ['testProtocol']);
    expect(socket.readyState()).to.equal(WebSocketReadyState.Connecting);

    new TimeoutScheduler(asyncWaitMs + 10).start(() => {
      expect(socket.readyState()).to.equal(WebSocketReadyState.Open);
      done();
    });
  });

  it('can send a Uint8Array message', () => {
    domMockBuilder = new DOMMockBuilder();
    const spy = sinon.spy(WebSocket.prototype, 'send');
    socket.create('http://example.com', ['testProtocol']);
    const uint8ArrayMessage = new TextEncoder().encode(testMessage);
    socket.send(uint8ArrayMessage);
    expect(spy.calledWithExactly(uint8ArrayMessage.buffer)).to.be.true;
  });

  it('can send a string message', () => {
    domMockBuilder = new DOMMockBuilder();
    const spy = sinon.spy(WebSocket.prototype, 'send');
    socket.create('http://example.com', ['testProtocol']);
    socket.send(testMessage);
    expect(spy.calledWithExactly(testMessage)).to.be.true;
  });

  it('can send a string message', () => {
    domMockBuilder = new DOMMockBuilder();
    const spy = sinon.spy(WebSocket.prototype, 'send');
    socket.create('http://example.com', ['testProtocol']);
    socket.send('test');
    expect(spy.called).to.be.true;
  });

  it('fails to send a message', () => {
    const behavior = new DOMMockBehavior();
    behavior.webSocketSendSucceeds = false;
    domMockBuilder = new DOMMockBuilder(behavior);
    socket.create('http://example.com', ['testProtocol']);
    expect(socket.send(new Uint8Array(8))).to.be.false;
  });

  it('can call addEventListener on the websocket', () => {
    domMockBuilder = new DOMMockBuilder();
    const spy = sinon.spy(WebSocket.prototype, 'addEventListener');
    socket.create('http://example.com', ['testProtocol']);
    const handler = (_testEvent: Event): void => {};
    socket.addEventListener('testHandler', handler);
    expect(spy.calledWith('testHandler', handler)).to.be.true;
  });

  it('will call close on the websocket', done => {
    domMockBuilder = new DOMMockBuilder();
    const spy = sinon.spy(WebSocket.prototype, 'close');
    socket.create('http://example.com', ['testProtocol']);
    socket.close();
    expect(socket.readyState()).to.equal(WebSocketReadyState.Closing);
    expect(spy.called).to.be.true;

    socket.addEventListener('close', () => {
      expect(socket.readyState()).to.equal(WebSocketReadyState.Closed);
      done();
    });
  });
});
