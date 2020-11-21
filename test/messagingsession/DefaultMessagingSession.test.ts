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
      'x-amz-chime-channel': 'session_channel!123',
      'x-amz-chime-message-type': 'SOCKET_SUBSCRIBE',
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

  const chimeClient = {
    config: {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'accessKey',
        secretAccessKey: 'secretKey',
        sessionToken: 'sessionToken',
      },
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
    configuration = new MessagingSessionConfiguration(
      'userArn',
      '123',
      ENDPOINT_URL,
      chimeClient,
      {}
    );
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
          done();
        },
      });
      messagingSession.start();
      new TimeoutScheduler(10).start(() => {
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
      webSocket.addEventListener('close', (_event: CloseEvent) => {
        expect(count).to.be.eq(0);
        done();
      });
      webSocket.close(4401);
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
      new TimeoutScheduler(10).start(() => {
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
      webSocket.addEventListener('open', () => {
        expect(didStartConnecting).to.be.eq(0);
        done();
      });
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
      webSocket.send(INVALID_MSG);
      new TimeoutScheduler(10).start(() => {
        expect(logSpy.calledOnce).to.be.true;
        logSpy.restore();
        done();
      });
    });
  });
});
