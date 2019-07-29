// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'mocha';

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import DefaultDOMWebSocket from '../../src/domwebsocket/DefaultDOMWebSocket';

describe('DefaultDOMWebSocket', () => {
  const subject = new DefaultDOMWebSocket(Substitute.for<WebSocket>());

  before(() => {
    chai.should();
  });

  describe('onopen', () => {
    const subject = new DefaultDOMWebSocket(Substitute.for<WebSocket>());

    describe('setter', () => {
      it('sets', () => {
        subject.onopen = (): void => {};
      });
    });

    describe('getter', () => {
      it('gets', () => {
        subject.onopen.should.be.null;
      });
    });
  });

  describe('onerror', () => {
    describe('setter', () => {
      it('sets', () => {
        subject.onerror = (): void => {};
      });
    });

    describe('getter', () => {
      it('gets', () => {
        subject.onerror.should.be.null;
      });
    });
  });

  describe('onclose', () => {
    describe('setter', () => {
      it('sets', () => {
        subject.onclose = (): void => {};
      });
    });

    describe('getter', () => {
      it('gets', () => {
        subject.onclose.should.be.null;
      });
    });
  });

  describe('onmessage', () => {
    describe('setter', () => {
      it('sets', () => {
        subject.onmessage = (): void => {};
      });
    });

    describe('getter', () => {
      it('gets', () => {
        subject.onmessage.should.be.null;
      });
    });
  });

  describe('#send', () => {
    it('sends', () => {
      const webSocket = Substitute.for<WebSocket>();
      const subject = new DefaultDOMWebSocket(webSocket);
      subject.send('data');
      webSocket.received().send('data');
    });
  });

  describe('#close', () => {
    it('closes', () => {
      const code = 1;
      const reason = 'none';
      const webSocket = Substitute.for<WebSocket>();
      const subject = new DefaultDOMWebSocket(webSocket);
      subject.close(code, reason);
    });
  });

  describe('#addEventListener', () => {
    it('adds event listener', () => {
      const type = 'error';
      const listener = (): void => {};
      const webSocket = Substitute.for<WebSocket>();
      const subject = new DefaultDOMWebSocket(webSocket);
      subject.addEventListener(type, listener);
      webSocket.received().addEventListener(type, listener);
    });
  });

  describe('#removeEventListener', () => {
    it('removes event listener', () => {
      const webSocket = Substitute.for<WebSocket>();
      const type = 'error';
      const listener = (): void => {};
      const subject = new DefaultDOMWebSocket(webSocket);
      subject.removeEventListener(type, listener);
      webSocket.received().removeEventListener(type, listener);
    });
  });

  describe('#dispatchEvent', () => {
    it('dispatches', () => {
      const event = Substitute.for<Event>();
      const webSocket = Substitute.for<WebSocket>();
      const subject = new DefaultDOMWebSocket(webSocket);
      webSocket.dispatchEvent(event).returns(true);
      subject.dispatchEvent(event).should.be.true;
      webSocket.received().dispatchEvent(event);
    });
  });
});
