// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GetMessagingSessionEndpointCommand } from '@aws-sdk/client-chime-sdk-messaging';
import * as chai from 'chai';
import * as sinon from 'sinon';

import { PrefetchSortBy } from '../../src';
import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';
import Logger from '../../src/logger/Logger';
import NoOpLogger from '../../src/logger/NoOpLogger';
import Message from '../../src/message/Message';
import DefaultMessagingSession from '../../src/messagingsession/DefaultMessagingSession';
import MessagingSession from '../../src/messagingsession/MessagingSession';
import MessagingSessionConfiguration from '../../src/messagingsession/MessagingSessionConfiguration';
import PrefetchOn from '../../src/messagingsession/PrefetchOn';
import DefaultReconnectController from '../../src/reconnectcontroller/DefaultReconnectController';
import ReconnectController from '../../src/reconnectcontroller/ReconnectController';
import SigV4 from '../../src/sigv4/SigV4';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import WebSocketAdapter from '../../src/websocketadapter/WebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { createFakeTimers, tick } from '../utils/fakeTimerHelper';

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
  let clock: sinon.SinonFakeTimers;

  const v3ChimeClient = {
    config: {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'accessKey',
        secretAccessKey: 'secretKey',
        sessionToken: 'sessionToken',
      },
    },

    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    send: function (command: GetMessagingSessionEndpointCommand) {
      getMessSessionCnt++;
      return {
        Endpoint: {
          Url: ENDPOINT_URL,
        },
      };
    },
  };

  const v3ChimeClientV2style = {
    config: {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'accessKey',
        secretAccessKey: 'secretKey',
        sessionToken: 'sessionToken',
      },
    },

    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    getMessagingSessionEndpoint: async function (): Promise<any> {
      getMessSessionCnt++;
      return {
        Endpoint: {
          Url: ENDPOINT_URL,
        },
      };
    },
  };

  const v2ChimeClient = {
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
    lastSignedQueryParams: Map<string, string[]>;

    signURL(
      _method: string,
      _scheme: string,
      _serviceName: string,
      hostname: string,
      _path: string,
      _payload: string,
      _queryParams: Map<string, string[]>
    ): Promise<string> {
      this.lastSignedQueryParams = _queryParams;
      return Promise.resolve(hostname);
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
    clock = createFakeTimers();
    dommMockBehavior = new DOMMockBehavior();
    dommMockBehavior.webSocketSendEcho = true;
    domMockBuilder = new DOMMockBuilder(dommMockBehavior);
    getMessSessionCnt = 0;
    configuration = new MessagingSessionConfiguration('userArn', '123', undefined, v3ChimeClient);
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
    clock.restore();
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
    it('Can start', async () => {
      let didStart = false;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          didStart = true;
        },
      });
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 50);
      expect(didStart).to.be.true;
      expect(getMessSessionCnt).to.be.eq(1);
    });

    it('Can start with v3 client with v2 style', async () => {
      configuration.chimeClient = v3ChimeClientV2style;
      let didStart = false;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          didStart = true;
        },
      });
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 50);
      expect(didStart).to.be.true;
      expect(getMessSessionCnt).to.be.eq(1);
    });

    it('Can start with v2 client', async () => {
      configuration.chimeClient = v2ChimeClient;
      let didStart = false;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          didStart = true;
        },
      });
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 50);
      expect(didStart).to.be.true;
      expect(getMessSessionCnt).to.be.eq(1);
    });

    it('Can start with hardcoded config url', async () => {
      configuration.endpointUrl = ENDPOINT_URL;
      let didStart = false;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          didStart = true;
        },
      });
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 50);
      expect(didStart).to.be.true;
      expect(getMessSessionCnt).to.be.eq(0);
    });

    it('Can start with prefetch on', async () => {
      const prefetchConfiguration = new MessagingSessionConfiguration(
        'userArn',
        '123',
        undefined,
        v3ChimeClient
      );
      prefetchConfiguration.prefetchOn = PrefetchOn.Connect;
      const testSigV4 = new TestSigV4();
      const prefetchMessagingSession = new DefaultMessagingSession(
        prefetchConfiguration,
        logger,
        webSocket,
        reconnectController,
        testSigV4
      );
      let didStart = false;
      prefetchMessagingSession.addObserver({
        messagingSessionDidStart(): void {
          didStart = true;
        },
      });
      prefetchMessagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 50);
      expect(didStart).to.be.true;
      expect(testSigV4.lastSignedQueryParams.get('prefetch-on')[0]).to.be.eq('connect');
      expect(testSigV4.lastSignedQueryParams.get('prefetch-on').length).to.be.eq(1);
    });

    it('Can start with prefetch on sort by unread', async () => {
      const prefetchConfiguration = new MessagingSessionConfiguration(
        'userArn',
        '123',
        undefined,
        v3ChimeClient
      );
      prefetchConfiguration.prefetchOn = PrefetchOn.Connect;
      prefetchConfiguration.prefetchSortBy = PrefetchSortBy.Unread;
      const testSigV4 = new TestSigV4();
      const prefetchMessagingSession = new DefaultMessagingSession(
        prefetchConfiguration,
        logger,
        webSocket,
        reconnectController,
        testSigV4
      );
      let didStart = false;
      prefetchMessagingSession.addObserver({
        messagingSessionDidStart(): void {
          didStart = true;
        },
      });
      prefetchMessagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 50);
      expect(didStart).to.be.true;
      expect(testSigV4.lastSignedQueryParams.get('prefetch-on')[0]).to.be.eq('connect');
      expect(testSigV4.lastSignedQueryParams.get('prefetch-on').length).to.be.eq(1);
      expect(testSigV4.lastSignedQueryParams.get('prefetch-sort-by')[0]).to.be.eq('unread');
      expect(testSigV4.lastSignedQueryParams.get('prefetch-sort-by').length).to.be.eq(1);
    });

    it('Can start with prefetch on sort by last-message-timestamp', async () => {
      const prefetchConfiguration = new MessagingSessionConfiguration(
        'userArn',
        '123',
        undefined,
        v3ChimeClient
      );
      prefetchConfiguration.prefetchOn = PrefetchOn.Connect;
      prefetchConfiguration.prefetchSortBy = PrefetchSortBy.LastMessageTimestamp;
      const testSigV4 = new TestSigV4();
      const prefetchMessagingSession = new DefaultMessagingSession(
        prefetchConfiguration,
        logger,
        webSocket,
        reconnectController,
        testSigV4
      );
      let didStart = false;
      prefetchMessagingSession.addObserver({
        messagingSessionDidStart(): void {
          didStart = true;
        },
      });
      prefetchMessagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 50);
      expect(didStart).to.be.true;
      expect(testSigV4.lastSignedQueryParams.get('prefetch-on')[0]).to.be.eq('connect');
      expect(testSigV4.lastSignedQueryParams.get('prefetch-on').length).to.be.eq(1);
      expect(testSigV4.lastSignedQueryParams.get('prefetch-sort-by')[0]).to.be.eq(
        'last-message-timestamp'
      );
      expect(testSigV4.lastSignedQueryParams.get('prefetch-sort-by').length).to.be.eq(1);
    });

    it('can reconnect with failures on getMessagingSession', async () => {
      configuration.chimeClient = v3ChimeClientV2style;
      let didStartCount = 0;
      let didStartConnecting = 0;
      let didStop = false;
      const savedClientBehavior = v3ChimeClientV2style.getMessagingSessionEndpoint;
      messagingSession.addObserver({
        messagingSessionDidStartConnecting(reconnecting: boolean): void {
          didStartConnecting++;
          if (!reconnecting) {
            webSocket.addEventListener('open', () => {
              webSocket.close(1006);
              v3ChimeClientV2style.getMessagingSessionEndpoint = function () {
                throw 'some error';
              };
              setTimeout(function () {
                v3ChimeClientV2style.getMessagingSessionEndpoint = savedClientBehavior;
              }, 100);
            });
          } else {
            webSocket.addEventListener('open', () => {
              webSocket.send(SESSION_SUBSCRIBED_MSG);
            });
            webSocket.addEventListener('message', (_event: MessageEvent) => {
              setTimeout(() => {
                messagingSession.stop();
              }, 10);
            });
          }
        },
        messagingSessionDidStart(): void {
          didStartCount++;
        },
        messagingSessionDidStop(_event: CloseEvent): void {
          didStop = true;
        },
      });
      messagingSession.start();
      // Advance time to allow reconnection and all callbacks to complete
      await tick(clock, 500);
      expect(didStartConnecting).to.be.eq(2);
      expect(didStartCount).to.be.eq(1);
      expect(getMessSessionCnt).to.be.eq(2);
      expect(didStop).to.be.true;
    });

    it('Queue messages before SESSION_ESTABLISH', async () => {
      let messageCount = 0;
      let didStart = false;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          didStart = true;
        },
        messagingSessionDidReceiveMessage(_message: Message): void {
          messageCount++;
        },
      });
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(createChannelMessage('message1'));
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 200);
      expect(didStart).to.be.true;
      expect(messageCount).to.be.eq(2);
    });

    it('Trigger DidStart only once', async () => {
      let count = 0;
      let messageCount = 0;
      let didStop = false;
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
          didStop = true;
        },
      });
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      webSocket.send(createChannelMessage('message1'));
      await tick(clock, 100);
      expect(count).to.be.eq(1);
      expect(didStop).to.be.true;
    });

    it('Do not trigger DidStart before receive first message', async () => {
      let count = 0;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          count++;
        },
      });
      let closeEventReceived = false;
      let catchCalled = false;
      messagingSession.start().catch(event => {
        catchCalled = true;
        expect(event.code).to.be.eq(4401);
      });
      // Wait for websocket to be created and opened
      await tick(clock, 20);
      // Now add close event listener after websocket is created
      webSocket.addEventListener('close', (_event: CloseEvent) => {
        closeEventReceived = true;
      });
      webSocket.close(4401);
      await tick(clock, 50);
      expect(count).to.be.eq(0);
      expect(closeEventReceived).to.be.true;
      expect(catchCalled).to.be.true;
    });

    it('Do not start if there is an existing connection', async () => {
      const logSpy = sinon.spy(logger, 'info');
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 10);
      await messagingSession.start();
      expect(logSpy.calledWith('messaging session already started'));
      logSpy.restore();
    });

    it('Log error if websocket encounters an error', async () => {
      dommMockBehavior.webSocketOpenSucceeds = false;
      domMockBuilder = new DOMMockBuilder(dommMockBehavior);
      const logSpy = sinon.spy(logger, 'error');
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 20);
      expect(logSpy.calledOnce).to.be.true;
      logSpy.restore();
    });
  });

  describe('stop', () => {
    it('can stop', async () => {
      let didStop = false;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          messagingSession.stop();
        },
        messagingSessionDidStop(_event: CloseEvent): void {
          didStop = true;
        },
      });
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 100);
      expect(didStop).to.be.true;
    });

    it('Do not stop if there is nothing to close', () => {
      const logSpy = sinon.spy(logger, 'info');
      messagingSession.stop();
      expect(logSpy.calledWith('no existing connection needs closing'));
      logSpy.restore();
    });
  });

  describe('reconnect', () => {
    it('can reconnect', async () => {
      let didStartCount = 0;
      let didStartConnecting = 0;
      let didStop = false;
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
              setTimeout(() => {
                messagingSession.stop();
              }, 10);
            });
          }
        },
        messagingSessionDidStart(): void {
          didStartCount++;
        },
        messagingSessionDidStop(_event: CloseEvent): void {
          didStop = true;
        },
      });
      messagingSession.start();
      await tick(clock, 500);
      expect(didStartConnecting).to.be.eq(2);
      expect(didStartCount).to.be.eq(1);
      expect(getMessSessionCnt).to.be.eq(2);
      expect(didStop).to.be.true;
    });

    it('will not reconnect', async () => {
      let didStartConnecting = 0;
      let didStop = false;
      messagingSession.addObserver({
        messagingSessionDidStartConnecting(_reconnecting: boolean): void {
          didStartConnecting++;
          if (didStartConnecting === 1) {
            webSocket.addEventListener('open', () => {
              webSocket.send(SESSION_SUBSCRIBED_MSG);
            });
            webSocket.addEventListener('message', (_event: MessageEvent) => {
              setTimeout(() => {
                webSocket.close(1005);
              }, 10);
            });
          }
        },
        messagingSessionDidStop(_event: CloseEvent): void {
          didStop = true;
        },
      });
      messagingSession.start();
      await tick(clock, 500);
      expect(didStartConnecting).to.be.eq(1);
      expect(didStop).to.be.true;
    });

    it('reconnect will stop after timeout', async () => {
      let didStop = false;
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
          didStop = true;
        },
      });
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 500);
      expect(didStop).to.be.true;
    });
  });

  describe('observer', () => {
    it('will not receive event if remove observers', async () => {
      let didStart = 0;
      const observer = {
        messagingSessionDidStart(): void {
          didStart++;
        },
      };
      messagingSession.addObserver(observer);
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 10);
      messagingSession.removeObserver(observer);
      expect(didStart).to.be.eq(0);
    });

    it('will not call observer method if it is not implemented', async () => {
      let didStart = false;
      messagingSession.addObserver({
        messagingSessionDidStart(): void {
          didStart = true;
          messagingSession.stop();
        },
      });
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 20);
      expect(didStart).to.be.true;
    });
  });

  describe('message', () => {
    it('Catch JSON parse error', async () => {
      const logSpy = sinon.spy(logger, 'error');
      messagingSession.start();
      await tick(clock, 10);
      webSocket.send(SESSION_SUBSCRIBED_MSG);
      await tick(clock, 10);
      webSocket.send(INVALID_MSG);
      await tick(clock, 10);
      expect(logSpy.calledOnce).to.be.true;
      logSpy.restore();
    });
  });
});
