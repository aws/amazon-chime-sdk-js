// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import Logger from '../../src/logger/Logger';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import PromisedWebSocket from '../../src/promisedwebsocket/PromisedWebSocket';
import ScreenSharingMessage from '../../src/screensharingmessage/ScreenSharingMessage';
import ScreenSharingMessageType from '../../src/screensharingmessage/ScreenSharingMessageType';
import ScreenSharingMessageSerialization from '../../src/screensharingmessageserialization/ScreenSharingMessageSerialization';
import DefaultScreenSignalingSession from '../../src/screensignalingsession/DefaultScreenSignalingSession';
import ScreenSignalingSessionEventType from '../../src/screensignalingsession/ScreenSignalingSessionEventType';
import CustomEventMock from '../customeventmock/CustomEventMock';
import PromisedWebSocketMock from '../promisedwebsocketmock/PromisedWebSocketMock';

describe('DefaultScreenSignalingSession', () => {
  const webSocket = Substitute.for<PromisedWebSocket>();
  const timeoutMs = 100;
  const messageSerialization = Substitute.for<ScreenSharingMessageSerialization>();
  const subject = new DefaultScreenSignalingSession(
    webSocket,
    messageSerialization,
    Substitute.for<Logger>()
  );

  before(() => {
    chai.use(chaiAsPromised);
  });

  describe('#open', () => {
    describe('resolve', () => {
      it('is fulfilled', (done: Mocha.Done) => {
        const webSocket = Substitute.for<PromisedWebSocket>();
        webSocket.open(timeoutMs).returns(Promise.resolve(Substitute.for<Event>()));
        const subject = new DefaultScreenSignalingSession(
          webSocket,
          messageSerialization,
          Substitute.for<Logger>()
        );
        chai.expect(subject.open(timeoutMs)).to.eventually.be.fulfilled.and.notify(done);
      });
    });

    describe('reject', () => {
      it('is fulfilled', (done: Mocha.Done) => {
        const webSocket = Substitute.for<PromisedWebSocket>();
        webSocket.open(timeoutMs).returns(Promise.reject(new Error()));
        const subject = new DefaultScreenSignalingSession(
          webSocket,
          messageSerialization,
          Substitute.for<Logger>()
        );
        chai.expect(subject.open(timeoutMs)).to.eventually.be.rejected.and.notify(done);
      });
    });
  });

  describe('#close', () => {
    describe('resolve', () => {
      it('is fulfilled', (done: Mocha.Done) => {
        const webSocket = Substitute.for<PromisedWebSocket>();
        webSocket.close(timeoutMs).returns(Promise.resolve(Substitute.for<Event>()));
        const subject = new DefaultScreenSignalingSession(
          webSocket,
          messageSerialization,
          Substitute.for<Logger>()
        );
        chai.expect(subject.close(timeoutMs)).to.eventually.be.fulfilled.and.notify(done);
      });
    });

    describe('reject', () => {
      it('is fulfilled', (done: Mocha.Done) => {
        const webSocket = Substitute.for<PromisedWebSocket>();
        webSocket.close(timeoutMs).returns(Promise.reject(new Error()));
        const subject = new DefaultScreenSignalingSession(
          webSocket,
          messageSerialization,
          Substitute.for<Logger>()
        );
        chai.expect(subject.close(timeoutMs)).to.eventually.be.rejected.and.notify(done);
      });
    });
  });

  describe('#addEventListener', () => {
    it('is added', () => {
      subject.addEventListener(ScreenSignalingSessionEventType.StreamStart, (): void => {});
    });
  });

  describe('#removeEventListener', () => {
    const listener = (): void => {};
    before(() => {
      subject.addEventListener(ScreenSignalingSessionEventType.StreamEnd, listener);
    });

    it('is removed', () => {
      subject.removeEventListener(ScreenSignalingSessionEventType.StreamEnd, listener);
    });
  });

  describe('#dispatchEvent', () => {
    it('is dispatched', (done: Mocha.Done) => {
      const event = Substitute.for<Event>();
      event.type.returns('close');
      const listener = (): void => {
        done();
      };
      subject.addEventListener(ScreenSignalingSessionEventType.Close, listener);
      subject.dispatchEvent(event);
    });
  });

  describe('#onMessageHandler', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const GlobalAny = global as any;

    before(() => {
      GlobalAny.CustomEvent = CustomEventMock;
    });

    describe('StreamEnd', () => {
      it('is dispatched', (done: Mocha.Done) => {
        const webSocket = new PromisedWebSocketMock();
        const message = Substitute.for<ScreenSharingMessage>();
        const messageSerialization = Substitute.for<ScreenSharingMessageSerialization>();
        const subject = new DefaultScreenSignalingSession(
          webSocket,
          messageSerialization,
          new NoOpLogger(LogLevel.INFO)
        );
        const event = Substitute.for<MessageEvent>();
        event.type.returns('message');
        messageSerialization.deserialize(Arg.all()).returns(message);
        message.type.returns(ScreenSharingMessageType.StreamEnd);
        subject.addEventListener(ScreenSignalingSessionEventType.StreamEnd, (): void => {
          done();
        });
        webSocket.dispatchEvent(event);
      });
    });

    describe('StreamStart', () => {
      it('is dispatched', (done: Mocha.Done) => {
        const webSocket = new PromisedWebSocketMock();
        const message = Substitute.for<ScreenSharingMessage>();
        const messageSerialization = Substitute.for<ScreenSharingMessageSerialization>();
        const subject = new DefaultScreenSignalingSession(
          webSocket,
          messageSerialization,
          new NoOpLogger(LogLevel.INFO)
        );
        const event = Substitute.for<MessageEvent>();
        event.type.returns('message');
        messageSerialization.deserialize(Arg.all()).returns(message);
        message.type.returns(ScreenSharingMessageType.StreamStart);
        subject.addEventListener(ScreenSignalingSessionEventType.StreamStart, (): void => {
          done();
        });
        webSocket.dispatchEvent(event);
      });
    });

    describe('StreamSwitch', () => {
      it('is dispatched', (done: Mocha.Done) => {
        const webSocket = new PromisedWebSocketMock();
        const message = Substitute.for<ScreenSharingMessage>();
        const messageSerialization = Substitute.for<ScreenSharingMessageSerialization>();
        const subject = new DefaultScreenSignalingSession(
          webSocket,
          messageSerialization,
          new NoOpLogger(LogLevel.INFO)
        );
        const event = Substitute.for<MessageEvent>();
        event.type.returns('message');
        messageSerialization.deserialize(Arg.all()).returns(message);
        message.type.returns(ScreenSharingMessageType.PresenterSwitch);
        subject.addEventListener(ScreenSignalingSessionEventType.StreamSwitch, (): void => {
          done();
        });
        webSocket.dispatchEvent(event);
      });

      describe('HeartbeatRequest', () => {
        it('is dispatched', (done: Mocha.Done) => {
          const webSocket = new PromisedWebSocketMock();
          const message = Substitute.for<ScreenSharingMessage>();
          const messageSerialization = Substitute.for<ScreenSharingMessageSerialization>();
          const subject = new DefaultScreenSignalingSession(
            webSocket,
            messageSerialization,
            new NoOpLogger(LogLevel.INFO)
          );
          const event = Substitute.for<MessageEvent>();
          event.type.returns('message');
          messageSerialization.deserialize(Arg.all()).returns(message);
          message.type.returns(ScreenSharingMessageType.HeartbeatRequestType);
          subject.addEventListener(ScreenSignalingSessionEventType.Heartbeat, (): void => {
            done();
          });
          webSocket.dispatchEvent(event);
        });
      });
    });
  });

  describe('websocket onClose', () => {
    it('is dispatched', (done: Mocha.Done) => {
      const event = Substitute.for<CloseEvent>();
      event.type.returns('close');
      const webSocket = new PromisedWebSocketMock();
      const subject = new DefaultScreenSignalingSession(
        webSocket,
        messageSerialization,
        Substitute.for<Logger>()
      );
      subject.addEventListener(ScreenSignalingSessionEventType.Close, (): void => {
        done();
      });
      webSocket.dispatchEvent(event);
    });
  });
});
