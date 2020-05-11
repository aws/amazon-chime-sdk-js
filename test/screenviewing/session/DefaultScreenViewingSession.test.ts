// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import LogLevel from '../../../src/logger/LogLevel';
import NoOpLogger from '../../../src/logger/NoOpLogger';
import PromisedWebSocket from '../../../src/promisedwebsocket/PromisedWebSocket';
import ReconnectingPromisedWebSocketFactory from '../../../src/promisedwebsocket/ReconnectingPromisedWebSocketFactory';
import ScreenViewingSessionObserver from '../../../src/screenviewing/clientobserver/ScreenViewingSessionObserver';
import DefaultScreenViewingSession from '../../../src/screenviewing/session/DefaultScreenViewingSession';
import ScreenViewingSessionConnectionRequest from '../../../src/screenviewing/session/ScreenViewingSessionConnectionRequest';
import PromisedWebSocketMock from '../../promisedwebsocketmock/PromisedWebSocketMock';

describe('DefaultScreenViewingSession', () => {
  const timeoutMs = 1000;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  const request = Substitute.for<ScreenViewingSessionConnectionRequest>();

  before(() => {
    chai.should();
    chai.use(chaiAsPromised);
    request.timeoutMs.returns(timeoutMs);
  });

  describe('#openConnection', () => {
    it('fails when theres an open connection', (done: MochaDone) => {
      const websocket: SubstituteOf<PromisedWebSocket> = Substitute.for();
      websocket.open(Arg.any()).returns(Promise.resolve(Substitute.for()));

      const webSocketFactory = Substitute.for<ReconnectingPromisedWebSocketFactory>();
      webSocketFactory.create(Arg.all()).returns(websocket);

      const session = new DefaultScreenViewingSession(webSocketFactory, logger);

      session
        .openConnection(request)
        .then(() => session.openConnection(request))
        .catch(() => done());
    });

    it('is fulfilled', (done: Mocha.Done) => {
      const webSocketFactory = Substitute.for<ReconnectingPromisedWebSocketFactory>();
      const webSocket = new PromisedWebSocketMock();
      webSocketFactory.create(Arg.all()).returns(webSocket);
      const subject = new DefaultScreenViewingSession(webSocketFactory, logger);
      subject.openConnection(request).should.eventually.be.fulfilled.and.notify(done);
    });
  });

  describe('#closeConnection', () => {
    const request = Substitute.for<ScreenViewingSessionConnectionRequest>();

    before(() => {
      request.timeoutMs.returns(timeoutMs);
    });

    describe('with open', () => {
      it('is fulfilled', (done: Mocha.Done) => {
        const webSocketFactory = Substitute.for<ReconnectingPromisedWebSocketFactory>();
        const webSocket = new PromisedWebSocketMock();
        webSocketFactory.create(Arg.all()).returns(webSocket);
        const subject = new DefaultScreenViewingSession(webSocketFactory, logger);
        subject.openConnection(request).then(() => {
          subject.closeConnection().should.eventually.be.fulfilled.and.notify(done);
        });
      });
    });

    describe('without open', () => {
      it('is rejected', (done: Mocha.Done) => {
        const webSocketFactory = Substitute.for<ReconnectingPromisedWebSocketFactory>();
        const webSocket = new PromisedWebSocketMock();
        webSocketFactory.create(Arg.all()).returns(webSocket);
        const subject = new DefaultScreenViewingSession(webSocketFactory, logger);
        subject.closeConnection().should.eventually.be.rejected.and.notify(done);
      });
    });
  });

  describe('#send', () => {
    it('is void', () => {
      const webSocketFactory = Substitute.for<ReconnectingPromisedWebSocketFactory>();
      const webSocket = Substitute.for<PromisedWebSocket>();
      webSocketFactory.create(Arg.all()).returns(webSocket);
      const subject = new DefaultScreenViewingSession(webSocketFactory, logger);
      const data = Substitute.for<Uint8Array>();
      data.byteLength.returns(1);
      webSocket.open(Arg.any()).returns(Promise.resolve(Substitute.for<Event>()));
      subject.openConnection(request).then(() => {
        const data = Substitute.for<Uint8Array>();
        data.byteLength.returns(1);
        subject.send(data);
      });
    });
  });

  describe('listeners', () => {
    describe('message', () => {
      it('is dispatched', (done: Mocha.Done) => {
        const webSocketFactory = Substitute.for<ReconnectingPromisedWebSocketFactory>();
        const webSocket = new PromisedWebSocketMock();
        webSocketFactory.create(Arg.all()).returns(webSocket);
        const subject = new DefaultScreenViewingSession(webSocketFactory, logger);
        const observer: ScreenViewingSessionObserver = {
          didReceiveWebSocketMessage(_event: MessageEvent): void {
            done();
          },
          didCloseWebSocket(_event: CloseEvent): void {},
        };
        subject
          .withObserver(observer)
          .openConnection(request)
          .then(() => {
            const event = Substitute.for<MessageEvent>();
            event.type.returns('message');
            webSocket.dispatchEvent(event);
          });
      });
    });

    describe('close', () => {
      it('is dispatched', (done: Mocha.Done) => {
        const webSocketFactory = Substitute.for<ReconnectingPromisedWebSocketFactory>();
        const webSocket = new PromisedWebSocketMock();
        webSocketFactory.create(Arg.all()).returns(webSocket);
        const subject = new DefaultScreenViewingSession(webSocketFactory, logger);
        const observer: ScreenViewingSessionObserver = {
          didReceiveWebSocketMessage(_event: MessageEvent): void {},
          didCloseWebSocket(_event: CloseEvent): void {
            done();
          },
        };
        subject
          .withObserver(observer)
          .openConnection(request)
          .then(() => {
            const event = Substitute.for<CloseEvent>();
            event.type.returns('close');
            webSocket.dispatchEvent(event);
          });
      });
    });
  });
});
