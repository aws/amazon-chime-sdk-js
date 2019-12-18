// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'mocha';

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import DOMWebSocket from '../../src/domwebsocket/DOMWebSocket';
import DefaultPromisedWebSocket from '../../src/promisedwebsocket/DefaultPromisedWebSocket';
import DOMWebSocketMock from '../domwebsocketmock/DOMWebSocketMock';

describe('DefaultPromisedWebSocket', () => {
  before(() => {
    chai.should();
    chai.use(chaiAsPromised);
  });

  describe('url', () => {
    it('is delegated', () => {
      const webSocket = new DOMWebSocketMock();
      const subject = new DefaultPromisedWebSocket(webSocket);
      chai.expect(subject.url).to.eq(webSocket.url);
    });
  });

  describe('#open', () => {
    describe('without timeout', () => {
      it('is fulfilled', (done: Mocha.Done) => {
        const event = Substitute.for<Event>();
        const webSocket = new DOMWebSocketMock();
        const subject = new DefaultPromisedWebSocket(webSocket);
        subject.open(1000).should.eventually.be.fulfilled.and.notify(done);
        event.type.returns('open');
        webSocket.dispatchEvent(event);
      });
    });

    describe('with timeout', () => {
      it('is rejected', (done: Mocha.Done) => {
        const webSocket = new DOMWebSocketMock();
        const subject = new DefaultPromisedWebSocket(webSocket);
        subject.open(50).should.eventually.be.rejected.and.notify(done);
      });
    });

    describe('with error', () => {
      it('is rejected', (done: Mocha.Done) => {
        const event = Substitute.for<Event>();
        const webSocket = new DOMWebSocketMock();
        const subject = new DefaultPromisedWebSocket(webSocket);
        subject.open(1000).should.eventually.be.rejected.and.notify(done);
        event.type.returns('error');
        webSocket.dispatchEvent(event);
      });
    });
  });

  describe('#close', () => {
    describe('without timeout', () => {
      it('is fulfilled', (done: Mocha.Done) => {
        const event = Substitute.for<CloseEvent>();
        const webSocket = new DOMWebSocketMock();
        const subject = new DefaultPromisedWebSocket(webSocket);
        subject.close(1000).should.eventually.be.fulfilled.and.notify(done);
        event.type.returns('close');
        webSocket.dispatchEvent(event);
      });
    });

    describe('with timeout', () => {
      it('is rejected', (done: Mocha.Done) => {
        const webSocket = new DOMWebSocketMock();
        const subject = new DefaultPromisedWebSocket(webSocket);
        subject.close(50).should.eventually.be.rejected.and.notify(done);
      });
    });

    describe('with error', () => {
      it('is rejected', (done: Mocha.Done) => {
        const event = Substitute.for<ErrorEvent>();
        const webSocket = new DOMWebSocketMock();
        const subject = new DefaultPromisedWebSocket(webSocket);
        subject.close(50).should.eventually.be.rejected.and.notify(done);
        event.type.returns('error');
        webSocket.dispatchEvent(event);
      });
    });
  });

  describe('#send', () => {
    describe('without error', () => {
      it('is resolved', () => {
        const webSocket = new DOMWebSocketMock();
        const subject = new DefaultPromisedWebSocket(webSocket);
        subject.send('data');
      });
    });
  });

  describe('#onMessage', () => {
    describe('with callback', () => {
      it('is invoked', (done: Mocha.Done) => {
        const webSocket = new DOMWebSocketMock();
        const subject = new DefaultPromisedWebSocket(webSocket).onMessage(() => {
          done();
        });
        subject.open(1000).then(() => {
          const event = Substitute.for<MessageEvent>();
          event.type.returns('message');
          webSocket.dispatchEvent(event);
        });
        const event = Substitute.for<Event>();
        event.type.returns('open');
        webSocket.dispatchEvent(event);
      });
    });

    describe('without callback', () => {
      it('is not invoked', (done: Mocha.Done) => {
        const webSocket = new DOMWebSocketMock();
        const subject = new DefaultPromisedWebSocket(webSocket);
        subject.open(1000).then(() => {
          const event = Substitute.for<MessageEvent>();
          event.type.returns('message');
          webSocket.dispatchEvent(event);
          done();
        });
        const event = Substitute.for<Event>();
        event.type.returns('open');
        webSocket.dispatchEvent(event);
      });
    });
  });

  describe('#onClose', () => {
    describe('with callback', () => {
      it('is invoked', (done: Mocha.Done) => {
        const webSocket = new DOMWebSocketMock();
        const subject = new DefaultPromisedWebSocket(webSocket).onClose(() => {
          done();
        });
        subject.open(1000).then(() => {
          const event = Substitute.for<CloseEvent>();
          event.type.returns('close');
          webSocket.dispatchEvent(event);
        });
        const event = Substitute.for<Event>();
        event.type.returns('open');
        webSocket.dispatchEvent(event);
      });
    });

    describe('without callback', () => {
      it('is not invoked', (done: Mocha.Done) => {
        const webSocket = new DOMWebSocketMock();
        const subject = new DefaultPromisedWebSocket(webSocket);
        subject.open(1000).then(() => {
          const event = Substitute.for<CloseEvent>();
          event.type.returns('close');
          webSocket.dispatchEvent(event);
          done();
        });
        const event = Substitute.for<Event>();
        event.type.returns('open');
        webSocket.dispatchEvent(event);
      });
    });
  });

  describe('#dispatchEvent', () => {
    describe('with event listener', () => {
      const subject = new DefaultPromisedWebSocket(Substitute.for<DOMWebSocket>());

      it('is dispatched', (done: Mocha.Done) => {
        subject.addEventListener('event', () => {
          done();
        });
        const event = Substitute.for<Event>();
        event.type.returns('event');
        subject.dispatchEvent(event);
      });
    });

    describe('without event listener', () => {
      const subject = new DefaultPromisedWebSocket(Substitute.for<DOMWebSocket>());

      it('is not dispatched', () => {
        const event = Substitute.for<Event>();
        event.type.returns('event');
        subject.dispatchEvent(event);
      });
    });
  });

  describe('#addEventListener', () => {
    const listener = (): void => {};

    describe('with event listener', () => {
      const subject = new DefaultPromisedWebSocket(Substitute.for<DOMWebSocket>());

      before(() => {
        subject.addEventListener('test', listener);
      });

      it('is idempotent', () => {
        subject.addEventListener('test', listener);
      });
    });

    describe('without event listener', () => {
      const subject = new DefaultPromisedWebSocket(Substitute.for<DOMWebSocket>());

      it('is added', () => {
        subject.addEventListener('test', listener);
      });
    });
  });

  describe('#removeEventListener', () => {
    describe('with event listener', () => {
      const listener = (): void => {};
      const subject = new DefaultPromisedWebSocket(Substitute.for<DOMWebSocket>());

      before(() => {
        subject.addEventListener('event', listener);
      });

      it('is removed', () => {
        subject.removeEventListener('event', listener);
      });
    });

    describe('without event listener', () => {
      const subject = new DefaultPromisedWebSocket(Substitute.for<DOMWebSocket>());

      it('is idempotent', () => {
        subject.removeEventListener('event', () => {});
      });
    });
  });
});
