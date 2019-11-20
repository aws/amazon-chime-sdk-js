// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import Backoff from '../../src/backoff/Backoff';
import DOMWebSocket from '../../src/domwebsocket/DOMWebSocket';
import DefaultPromisedWebSocket from '../../src/promisedwebsocket/DefaultPromisedWebSocket';
import PromisedWebSocket from '../../src/promisedwebsocket/PromisedWebSocket';
import PromisedWebSocketFactory from '../../src/promisedwebsocket/PromisedWebSocketFactory';
import ReconnectingPromisedWebSocket from '../../src/promisedwebsocket/ReconnectingPromisedWebSocket';
import CustomEventMock from '../customeventmock/CustomEventMock';
import PromisedWebSocketMock from '../promisedwebsocketmock/PromisedWebSocketMock';

describe('ReconnectingPromisedWebSocket', () => {
  const url = 'ws://foo';
  const protocols = 'protocol=foo';
  const binaryType: BinaryType = 'arraybuffer';
  const timeoutMs = 1000;

  const backoff = {
    ...Substitute.for<Backoff>(),
    nextBackoffAmountMs(): number {
      return 100;
    },
    reset(): void {
      return;
    },
  };

  before(() => {
    chai.should();
    chai.use(chaiAsPromised);
  });

  describe('#open', () => {
    describe('without open', () => {
      it('is fulfilled', (done: Mocha.Done) => {
        const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
        const subject = new ReconnectingPromisedWebSocket(
          url,
          protocols,
          binaryType,
          webSocketFactory,
          backoff
        );
        webSocketFactory.create(Arg.all()).returns(new PromisedWebSocketMock());
        chai.expect(subject.open(timeoutMs)).to.eventually.be.fulfilled.and.notify(done);
      });
    });

    describe('with open', () => {
      it('is rejected', (done: Mocha.Done) => {
        const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
        const subject = new ReconnectingPromisedWebSocket(
          url,
          protocols,
          binaryType,
          webSocketFactory,
          backoff
        );
        webSocketFactory.create(Arg.all()).returns(new PromisedWebSocketMock());

        subject.open(timeoutMs).then(() => {
          chai.expect(subject.open(timeoutMs)).to.eventually.be.rejected.and.notify(done);
        });
      });
    });
  });

  describe('#close', () => {
    describe('without open', () => {
      it('is rejected', (done: Mocha.Done) => {
        const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
        const subject = new ReconnectingPromisedWebSocket(
          url,
          protocols,
          binaryType,
          webSocketFactory,
          backoff
        );
        webSocketFactory.create(url, protocols, binaryType).returns(new PromisedWebSocketMock());
        chai.expect(subject.close(1000)).to.eventually.be.rejected.and.notify(done);
      });
    });

    describe('without onClose', () => {
      it('is delegated', (done: Mocha.Done) => {
        const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
        const subject = new ReconnectingPromisedWebSocket(
          url,
          protocols,
          binaryType,
          webSocketFactory,
          backoff
        );
        webSocketFactory.create(url, protocols, binaryType).returns(new PromisedWebSocketMock());
        subject.open(1000).then(() => {
          chai.expect(subject.close(timeoutMs)).to.eventually.be.fulfilled.and.notify(done);
        });
      });
    });

    describe('with onClose', () => {
      describe('normal', () => {
        it('is notified', (done: Mocha.Done) => {
          const webSocket = new PromisedWebSocketMock();
          const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
          const subject = new ReconnectingPromisedWebSocket(
            url,
            protocols,
            binaryType,
            webSocketFactory,
            backoff
          );
          webSocketFactory.create(url, protocols, binaryType).returns(webSocket);
          subject.addEventListener('close', () => {
            done();
          });
          subject.open(timeoutMs).then(() => {
            const event = Substitute.for<CloseEvent>();
            event.type.returns('close');
            event.code.returns(1000);
            webSocket.dispatchEvent(event);
          });
        });
      });

      describe('abnormal', () => {
        // eslint-disable-next-line
        const GlobalAny = global as any;

        before(() => {
          GlobalAny.CustomEvent = CustomEventMock;
        });

        after(() => {
          delete GlobalAny.CustomEvent;
        });

        describe('with retry limit', () => {
          it('is closed', (done: Mocha.Done) => {
            const backoff = {
              ...Substitute.for<Backoff>(),
              nextBackoffAmountMs(): number {
                throw new Error('retry limit exceeded');
              },
              reset(): void {
                return;
              },
            };
            const webSocket = new PromisedWebSocketMock();
            const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
            const subject = new ReconnectingPromisedWebSocket(
              url,
              protocols,
              binaryType,
              webSocketFactory,
              backoff
            );
            webSocketFactory.create(url, protocols, binaryType).returns(webSocket);
            subject.addEventListener('close', () => {
              done();
            });
            subject.open(timeoutMs).then(() => {
              const event = Substitute.for<CloseEvent>();
              event.type.returns('close');
              event.code.returns(1001);
              webSocket.dispatchEvent(event);
            });
          });
        });

        it('notifies reconnect', (done: Mocha.Done) => {
          const webSocket = new PromisedWebSocketMock();
          const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
          const subject = new ReconnectingPromisedWebSocket(
            url,
            protocols,
            binaryType,
            webSocketFactory,
            backoff
          );
          webSocketFactory.create(url, protocols, binaryType).returns(webSocket);
          subject.addEventListener('reconnect', () => {
            done();
          });
          subject.open(timeoutMs).then(() => {
            const event = Substitute.for<CloseEvent>();
            event.type.returns('close');
            event.code.returns(1001);
            webSocket.dispatchEvent(event);
          });
        });

        it('is not close notified', (done: Mocha.Done) => {
          const webSocket = new PromisedWebSocketMock();
          const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
          const subject = new ReconnectingPromisedWebSocket(
            url,
            protocols,
            binaryType,
            webSocketFactory,
            backoff
          );
          webSocketFactory.create(url, protocols, binaryType).returns(webSocket);
          subject.addEventListener('close', () => {
            throw new Error();
          });
          subject.open(timeoutMs).then(() => {
            const event = Substitute.for<CloseEvent>();
            event.type.returns('close');
            event.code.returns(1001);
            webSocket.dispatchEvent(event);
            done();
          });
        });
      });
    });
  });

  describe('#onMessage', () => {
    describe('with callback', () => {
      it('is notified', (done: Mocha.Done) => {
        const webSocket = new PromisedWebSocketMock();
        const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
        const subject = new ReconnectingPromisedWebSocket(
          url,
          protocols,
          binaryType,
          webSocketFactory,
          backoff
        );
        webSocketFactory.create(url, protocols, binaryType).returns(webSocket);
        subject.addEventListener('message', () => done());
        subject.open(1000).then(() => {
          const event = Substitute.for<MessageEvent>();
          event.type.returns('message');
          webSocket.dispatchEvent(event);
        });
      });
    });

    describe('without callback', () => {
      it('is fulfilled', (done: Mocha.Done) => {
        const webSocket = new PromisedWebSocketMock();
        const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
        const subject = new ReconnectingPromisedWebSocket(
          url,
          protocols,
          binaryType,
          webSocketFactory,
          backoff
        );
        webSocketFactory.create(url, protocols, binaryType).returns(webSocket);
        subject
          .open(1000)
          .then(() => {
            const event = Substitute.for<MessageEvent>();
            event.type.returns('message');
            webSocket.dispatchEvent(event);
          })
          .should.eventually.be.fulfilled.and.notify(done);
      });
    });
  });

  describe('#send', () => {
    describe('without open', () => {
      it('is thrown', () => {
        const webSocket = Substitute.for<PromisedWebSocket>();
        const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
        const subject = new ReconnectingPromisedWebSocket(
          url,
          protocols,
          binaryType,
          webSocketFactory,
          backoff
        );
        webSocketFactory.create(url, protocols, binaryType).returns(webSocket);
        chai
          .expect(() => {
            subject.send('data');
          })
          .to.throw('closed');
      });
    });

    describe('with open', () => {
      it('is not thrown', (done: Mocha.Done) => {
        const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
        const subject = new ReconnectingPromisedWebSocket(
          url,
          protocols,
          binaryType,
          webSocketFactory,
          backoff
        );
        webSocketFactory.create(url, protocols, binaryType).returns(new PromisedWebSocketMock());
        subject.open(1000).then(() => {
          chai
            .expect(() => {
              subject.send('data');
            })
            .not.to.throw('closed');
          done();
        });
      });
    });
  });

  describe('#dispatchEvent', () => {
    const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();

    describe('with event listener', () => {
      it('is dispatched', (done: Mocha.Done) => {
        const subject = new ReconnectingPromisedWebSocket(
          url,
          protocols,
          binaryType,
          webSocketFactory,
          backoff
        );
        subject.addEventListener('event', () => {
          done();
        });
        const event = Substitute.for<Event>();
        event.type.returns('event');
        subject.dispatchEvent(event);
      });
    });

    describe('without event listener', () => {
      it('is not dispatched', () => {
        const subject = new ReconnectingPromisedWebSocket(
          url,
          protocols,
          binaryType,
          webSocketFactory,
          backoff
        );
        const event = Substitute.for<Event>();
        event.type.returns('event');
        subject.dispatchEvent(event);
      });
    });
  });

  describe('#addEventListener', () => {
    const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
    const subject = new ReconnectingPromisedWebSocket(
      url,
      protocols,
      binaryType,
      webSocketFactory,
      backoff
    );
    const listener = (): void => {};

    describe('with event listener', () => {
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
    const webSocketFactory = Substitute.for<PromisedWebSocketFactory>();
    const subject = new ReconnectingPromisedWebSocket(
      url,
      protocols,
      binaryType,
      webSocketFactory,
      backoff
    );

    describe('with event listener', () => {
      const listener = (): void => {};

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
