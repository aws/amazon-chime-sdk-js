// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';
import Logger from '../../src/logger/Logger';
import NoOpLogger from '../../src/logger/NoOpLogger';
import Message from '../../src/message/Message';
import DefaultMessagingSession from '../../src/messagingsession/DefaultMessagingSession';
import MessagingSession from '../../src/messagingsession/MessagingSession';
import MessagingSessionConfiguration from '../../src/messagingsession/MessagingSessionConfiguration';
import DefaultReconnectController from '../../src/reconnectcontroller/DefaultReconnectController';
import ReconnectController from '../../src/reconnectcontroller/ReconnectController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import SigV4 from '../../src/sigv4/SigV4';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import WebSocketAdapter from '../../src/websocketadapter/WebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultMessagingSession', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const ENDPOINT_URL = 'localhost:9999/';
  const SESSION_SUBSCRIBED_MSG = JSON.stringify({
    Headers: {
      'x-amz-chime-event-type': 'SESSION_ESTABLISHED',
    },
  });

  const INVALID_MSG = 'invalid_message';

  const logger: Logger = new NoOpLogger();
  let configuration: MessagingSessionConfiguration;
  let webSocket: WebSocketAdapter;
  let reconnectController: ReconnectController;
  let messagingSession: MessagingSession;
  let dommMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;

  let getMessSessionCnt = 0;

  const chimeClient = {
    config: {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'accessKey',
        secretAccessKey: 'secretKey',
        sessionToken: 'sessionToken',
      },
    },
    getMessagingSessionEndpoint: function () {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        promise: async function (): Promise<any> {
          getMessSessionCnt++;
          return {
            Endpoint: {
              Url: ENDPOINT_URL,
            },
          };
        },
      };
    },
  };

  class TestSigV4 implements SigV4 {
    signURL(
      _method: string,
      _scheme: string,
      _serviceName: string,
      hostname: string,
      _path: string,
      _payload: string,
      _queryParams: Map<string, string[]>
    ): string {
      return hostname;
    }
  }

  function createChannelMessage(content: string): string {
    return JSON.stringify({
      Headers: {
        'x-amz-chime-event-type': 'CreateChannelMessage',
        'x-amz-chime-message-type': 'STANDARD',
        'x-amz-chime-persistence-type': 'PERSISTENT',
      },
      Payload: `{\'Content\': ${content}}`,
    });
  }

  beforeEach(() => {
    dommMockBehavior = new DOMMockBehavior();
    dommMockBehavior.webSocketSendEcho = true;
    domMockBuilder = new DOMMockBuilder(dommMockBehavior);
    getMessSessionCnt = 0;
    configuration = new MessagingSessionConfiguration('userArn', '123', undefined, chimeClient, {});
    configuration.reconnectTimeoutMs = 100;
    configuration.reconnectFixedWaitMs = 40;
    configuration.reconnectShortBackoffMs = 10;
    configuration.reconnectLongBackoffMs = 10;
    webSocket = new DefaultWebSocketAdapter(logger);
    reconnectController = new DefaultReconnectController(
      configuration.reconnectTimeoutMs,
      new FullJitterBackoff(
        configuration.reconnectFixedWaitMs,
        configuration.reconnectShortBackoffMs,
        configuration.reconnectLongBackoffMs
      )
    );
    messagingSession = new DefaultMessagingSession(
      configuration,
      logger,
      webSocket,
      reconnectController,
      new TestSigV4()
    );
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('constructor', () => {
    it('can be constructed', () => {
      messagingSession = new DefaultMessagingSession(configuration, logger);
      expect(messagingSession).to.exist;
    });
  });

  describe('start', () => {
    it('Can start', done => {
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          expect(getMessSessionCnt).to.be.eq(1);
          done();
        },
      });
      messagingSession.start();
      new TimeoutScheduler(10).start(() => {
        webSocket.send(SESSION_SUBSCRIBED_MSG);
      });
    });

    it('Can start with prefetch on', done => {
      const prefetchConfiguration = new MessagingSessionConfiguration('userArn', '123', undefined, chimeClient, {});
      prefetchConfiguration.reconnectTimeoutMs = 100;
      prefetchConfiguration.reconnectFixedWaitMs = 40;
      prefetchConfiguration.reconnectShortBackoffMs = 10;
      prefetchConfiguration.reconnectLongBackoffMs = 10;
      prefetchConfiguration.prefetchOn = true;
      const prefetchMessagingSession = new DefaultMessagingSession(
        prefetchConfiguration,
        logger,
        webSocket,
        reconnectController,
        new TestSigV4()
      );
      prefetchMessagingSession.addObserver({
        messagingSessionDidStart(): void {
          expect(getMessSessionCnt).to.be.eq(1);
          done();
        },
      });
      prefetchMessagingSession.start();
      new TimeoutScheduler(10).start(() => {
        webSocket.send(SESSION_SUBSCRIBED_MSG);
      });
    });

    it('Can start with hardcoded config url', done => {
      configuration.endpointUrl = ENDPOINT_URL;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          expect(getMessSessionCnt).to.be.eq(0);
          done();
        },
      });
      messagingSession.start();
      new TimeoutScheduler(10).start(() => {
        webSocket.send(SESSION_SUBSCRIBED_MSG);
      });
    });

    it('Ignores messages before SESSION_ESTABLISH', done => {
      let messageCount = 0;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          expect(messageCount).to.be.eq(0);
          done();
        },
        messagingSessionDidReceiveMessage(_message: Message): void {
          messageCount++;
        },
      });
      messagingSession.start();
      new TimeoutScheduler(10).start(() => {
        webSocket.send(createChannelMessage('message1'));
        webSocket.send(SESSION_SUBSCRIBED_MSG);
      });
    });

    it('Trigger DidStart only once', done => {
      let count = 0;
      let messageCount = 0;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          count++;
        },
        messagingSessionDidReceiveMessage(_message: Message): void {
          messageCount++;
          if (messageCount === 2) {
            messagingSession.stop();
          }
        },
        messagingSessionDidStop(_event: CloseEvent): void {
          expect(count).to.be.eq(1);
          done();
        },
      });
      messagingSession.start();
      new TimeoutScheduler(10).start(() => {
        webSocket.send(SESSION_SUBSCRIBED_MSG);
        webSocket.send(createChannelMessage('message1'));
      });
    });

    it('Do not trigger DidStart before receive first message', done => {
      let count = 0;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          count++;
        },
      });
      messagingSession.start();
      setTimeout(function () {
        webSocket.addEventListener('close', (_event: CloseEvent) => {
          expect(count).to.be.eq(0);
          done();
        });
        webSocket.close(4401);
      }, 1000);
    });

    it('Do not start if there is an existing connection', () => {
      const logSpy = sinon.spy(logger, 'info');
      messagingSession.start();
      messagingSession.start();
      expect(logSpy.calledWith('messaging session already started'));
      logSpy.restore();
    });

    it('Log error if websocket encounters an error', done => {
      dommMockBehavior.webSocketOpenSucceeds = false;
      domMockBuilder = new DOMMockBuilder(dommMockBehavior);
      const logSpy = sinon.spy(logger, 'error');
      messagingSession.start();
      new TimeoutScheduler(100).start(() => {
        expect(logSpy.calledOnce).to.be.true;
        logSpy.restore();
        done();
      });
    });
  });

  describe('stop', () => {
    it('can stop', done => {
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          messagingSession.stop();
        },
        messagingSessionDidStop(_event: CloseEvent): void {
          done();
        },
      });
      messagingSession.start();
      new TimeoutScheduler(10).start(() => {
        webSocket.send(SESSION_SUBSCRIBED_MSG);
      });
    });

    it('Do not stop if there is nothing to close', () => {
      const logSpy = sinon.spy(logger, 'info');
      messagingSession.stop();
      expect(logSpy.calledWith('no existing connection needs closing'));
      logSpy.restore();
    });
  });

  describe('reconnect', () => {
    it('can reconnect', done => {
      let didStartCount = 0;
      let didStartConnecting = 0;
      messagingSession.addObserver({
        messagingSessionDidStartConnecting(reconnecting: boolean): void {
          didStartConnecting++;
          if (!reconnecting) {
            webSocket.addEventListener('open', () => {
              webSocket.close(1006);
            });
          } else {
            webSocket.addEventListener('open', () => {
              webSocket.send(SESSION_SUBSCRIBED_MSG);
            });
            webSocket.addEventListener('message', (_event: MessageEvent) => {
              new TimeoutScheduler(10).start(() => {
                messagingSession.stop();
              });
            });
          }
        },
        messagingSessionDidStart(): void {
          didStartCount++;
        },
        messagingSessionDidStop(_event: CloseEvent): void {
          expect(didStartConnecting).to.be.eq(2);
          expect(didStartCount).to.be.eq(1);
          expect(getMessSessionCnt).to.be.eq(2);
          done();
        },
      });
      messagingSession.start();
    });

    it('can reconnect with failures on getMessagingSession', done => {
      let didStartCount = 0;
      let didStartConnecting = 0;
      const savedClientBehavior = chimeClient.getMessagingSessionEndpoint;
      messagingSession.addObserver({
        messagingSessionDidStartConnecting(reconnecting: boolean): void {
          didStartConnecting++;
          if (!reconnecting) {
            webSocket.addEventListener('open', () => {
              webSocket.close(1006);
              chimeClient.getMessagingSessionEndpoint = function () {
                throw 'some error';
              };
              setTimeout(function () {
                chimeClient.getMessagingSessionEndpoint = savedClientBehavior;
              }, 100);
            });
          } else {
            webSocket.addEventListener('open', () => {
              webSocket.send(SESSION_SUBSCRIBED_MSG);
            });
            webSocket.addEventListener('message', (_event: MessageEvent) => {
              new TimeoutScheduler(10).start(() => {
                messagingSession.stop();
              });
            });
          }
        },
        messagingSessionDidStart(): void {
          didStartCount++;
        },
        messagingSessionDidStop(_event: CloseEvent): void {
          expect(didStartConnecting).to.be.eq(2);
          expect(didStartCount).to.be.eq(1);
          expect(getMessSessionCnt).to.be.eq(2);
          done();
        },
      });
      messagingSession.start();
    });

    it('will not reconnect', done => {
      let didStartConnecting = 0;
      messagingSession.addObserver({
        messagingSessionDidStartConnecting(_reconnecting: boolean): void {
          didStartConnecting++;
          if (didStartConnecting === 1) {
            webSocket.addEventListener('open', () => {
              webSocket.send(SESSION_SUBSCRIBED_MSG);
            });
            webSocket.addEventListener('message', (_event: MessageEvent) => {
              new TimeoutScheduler(10).start(() => {
                webSocket.close(1005);
              });
            });
          }
        },
        messagingSessionDidStop(_event: CloseEvent): void {
          expect(didStartConnecting).to.be.eq(1);
          done();
        },
      });
      messagingSession.start();
    });

    it('reconnect will stop after timeout', done => {
      messagingSession.addObserver({
        messagingSessionDidStartConnecting(reconnecting: boolean): void {
          if (reconnecting) {
            webSocket.addEventListener('error', () => {
              webSocket.close(1006);
            });
          }
        },
        messagingSessionDidStart(): void {
          dommMockBehavior.webSocketOpenSucceeds = false;
          webSocket.close(1006);
        },
        messagingSessionDidStop(_event: CloseEvent): void {
          done();
        },
      });
      messagingSession.start();
      new TimeoutScheduler(10).start(() => {
        webSocket.send(SESSION_SUBSCRIBED_MSG);
      });
    });
  });

  describe('observer', () => {
    it('will not receive event if remove observers', done => {
      let didStartConnecting = 0;
      const observer = {
        messagingSessionDidStartConnecting(_reconnecting: boolean): void {
          didStartConnecting++;
        },
      };
      messagingSession.addObserver(observer);

      messagingSession.start();
      messagingSession.removeObserver(observer);
      setTimeout(function () {
        expect(didStartConnecting).to.be.eq(0);
        done();
      }, 100);
    });

    it('will not receive event if remove observers from observer', done => {
      let didStartConnecting = 0;

      const observer1 = {
        messagingSessionDidStartConnecting(_reconnecting: boolean): void {
          messagingSession.removeObserver(observer2);
          setTimeout(function () {
            expect(didStartConnecting).to.be.eq(0);
            done();
          }, 100);
        },
      };

      const observer2 = {
        messagingSessionDidStartConnecting(_reconnecting: boolean): void {
          didStartConnecting++;
        },
      };

      messagingSession.addObserver(observer1);
      messagingSession.addObserver(observer2);
      messagingSession.start();
    });

    it('will not call observer method if it is not implemented', done => {
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          messagingSession.stop();
          new TimeoutScheduler(10).start(() => {
            done();
          });
        },
      });
      messagingSession.start();
      new TimeoutScheduler(10).start(() => {
        webSocket.send(SESSION_SUBSCRIBED_MSG);
      });
    });
  });

  describe('message', () => {
    it('Catch JSON parse error', done => {
      const logSpy = sinon.spy(logger, 'error');
      messagingSession.start();
      new TimeoutScheduler(10).start(() => {
        webSocket.send(INVALID_MSG);
        new TimeoutScheduler(10).start(() => {
          expect(logSpy.calledOnce).to.be.true;
          logSpy.restore();
          done();
        });
      });
    });
  });
});
