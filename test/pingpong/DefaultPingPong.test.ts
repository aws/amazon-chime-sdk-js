// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import Maybe from '../../src/maybe/Maybe';
import DefaultPingPong from '../../src/pingpong/DefaultPingPong';
import PingPongObserver from '../../src/pingpongobserver/PingPongObserver';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClientEvent from '../../src/signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../../src/signalingclient/SignalingClientEventType';
import {
  SdkPingPongFrame,
  SdkPingPongType,
  SdkSignalFrame,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultPingPong', () => {
  let expect: Chai.ExpectStatic;
  const defaultIntervalMs = 10000;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  let domMockBuilder: DOMMockBuilder | null = null;
  before(() => {
    expect = chai.expect;
  });

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder();
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const signalingClient = new DefaultSignalingClient(webSocketAdapter, logger);
      const pingPong = new DefaultPingPong(signalingClient, defaultIntervalMs, logger);
      expect(pingPong).to.not.equal(null);
    });
  });

  describe('start and stop', () => {
    it('can be started and stopped', () => {
      class TestSignalingClient extends DefaultSignalingClient {
        ready(): boolean {
          return true;
        }
      }
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const signalingClient = new TestSignalingClient(webSocketAdapter, logger);
      const deregisterSpy = sinon.spy(signalingClient, 'removeObserver');
      const registerSpy = sinon.spy(signalingClient, 'registerObserver');
      const pingPongSpy = sinon.spy(signalingClient, 'pingPong');
      const pingPong = new DefaultPingPong(signalingClient, defaultIntervalMs, logger);
      pingPong.start();
      expect(deregisterSpy.calledOnce).to.be.true;
      expect(registerSpy.calledOnce).to.be.true;
      expect(pingPong.pingId).to.equal(1);
      expect(pingPong.consecutivePongsUnaccountedFor).to.equal(1);
      expect(pingPongSpy.calledOnce).to.be.true;
      pingPong.stop();
      expect(pingPong.pingId).to.equal(0);
      expect(pingPong.consecutivePongsUnaccountedFor).to.equal(0);
    });

    it('can keep pinging once gets started', done => {
      class TestSignalingClient extends DefaultSignalingClient {
        ready(): boolean {
          return true;
        }
      }

      let called = false;
      class TestObserver implements PingPongObserver {
        didMissPongs?(_consecutiveMissed: number): void {
          called = true;
        }
      }
      const observer = new TestObserver();
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const signalingClient = new TestSignalingClient(webSocketAdapter, logger);
      const intervalMs = 100;
      const pingPong = new DefaultPingPong(signalingClient, intervalMs, logger);
      pingPong.addObserver(observer);
      pingPong.start();
      new TimeoutScheduler(intervalMs * 2.5).start(() => {
        expect(pingPong.consecutivePongsUnaccountedFor).to.equal(3);
        expect(called).to.be.true;
        pingPong.stop();
        pingPong.removeObserver(observer);
        done();
      });
    });

    it('cannot start if the signaling client is not ready', () => {
      class TestSignalingClient extends DefaultSignalingClient {
        ready(): boolean {
          return false;
        }
      }

      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const signalingClient = new TestSignalingClient(webSocketAdapter, logger);
      const pingPong = new DefaultPingPong(signalingClient, defaultIntervalMs, logger);
      pingPong.start();
      expect(pingPong.pingId).to.equal(0);
      pingPong.stop();
    });

    it('can be started by the WebSocketOpen event', done => {
      class TestSignalingClient extends DefaultSignalingClient {
        ready(): boolean {
          return false;
        }
      }

      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const signalingClient = new TestSignalingClient(webSocketAdapter, logger);
      const intervalMs = 100;
      const pingPong = new DefaultPingPong(signalingClient, intervalMs, logger);
      pingPong.start();
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketOpen, null)
      );
      new TimeoutScheduler(intervalMs * 2.5).start(() => {
        expect(pingPong.pingId).to.equal(3);
        pingPong.stop();
        done();
      });
    });

    it('can add and remove observers', () => {
      class TestObserver implements PingPongObserver {
        didMissPongs?(_consecutiveMissed: number): void {}
      }
      const observer = new TestObserver();
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const signalingClient = new DefaultSignalingClient(webSocketAdapter, logger);
      const pingPong = new DefaultPingPong(signalingClient, defaultIntervalMs, logger);
      pingPong.addObserver(observer);
      pingPong.forEachObserver(observer => {
        Maybe.of(observer.didMissPongs).map(f => f.bind(observer)());
      });
      pingPong.removeObserver(observer);
    });

    it('can stop pinging when the WebSocket is closed and restart when connected', async () => {
      class TestSignalingClient extends DefaultSignalingClient {
        ready(): boolean {
          return false;
        }
      }
      const webSocketAdapter = new DefaultWebSocketAdapter(logger);
      const signalingClient = new TestSignalingClient(webSocketAdapter, logger);
      const intervalMs = 100;
      const pingPong = new DefaultPingPong(signalingClient, intervalMs, logger);
      pingPong.start();
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketOpen, null)
      );
      await new Promise(resolve => new TimeoutScheduler(intervalMs * 2.5).start(resolve));
      expect(pingPong.pingId).to.equal(3);
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketClosed, null)
      );
      await new Promise(resolve => new TimeoutScheduler(intervalMs * 2.5).start(resolve));
      expect(pingPong.pingId).to.equal(0);
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketOpen, null)
      );
      await new Promise(resolve => new TimeoutScheduler(intervalMs * 2.5).start(resolve));
      expect(pingPong.pingId).to.equal(3);
      pingPong.stop();
    });
  });

  describe('handleSignalingClientEvent', () => {
    let webSocketAdapter: DefaultWebSocketAdapter;
    let signalingClient: DefaultSignalingClient;
    let pingPong: DefaultPingPong;
    beforeEach(() => {
      webSocketAdapter = new DefaultWebSocketAdapter(logger);
      signalingClient = new DefaultSignalingClient(webSocketAdapter, logger);
      pingPong = new DefaultPingPong(signalingClient, defaultIntervalMs, logger);
    });
    it('can start pinging once receive WebSocketOpen event', () => {
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketOpen, null)
      );
      expect(pingPong.pingId).to.equal(1);
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketClosed, null)
      );
    });

    it('can stop pinging once receive WebSocketFailed event', () => {
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketOpen, null)
      );
      expect(pingPong.pingId).to.equal(1);
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketFailed, null)
      );
    });

    it('can stop pinging once receive WebSocketError event', () => {
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketOpen, null)
      );
      expect(pingPong.pingId).to.equal(1);
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketError, null)
      );
    });

    it('can stop pinging once receive WebSocketClosing event', () => {
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketOpen, null)
      );
      expect(pingPong.pingId).to.equal(1);
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketClosing, null)
      );
    });

    it('should PONG back when receive Signal PING frame', () => {
      const signalingClient = new DefaultSignalingClient(webSocketAdapter, logger);
      const clientSpy = sinon.spy(signalingClient, 'pingPong');
      const pingPong = new DefaultPingPong(signalingClient, defaultIntervalMs, logger);
      const ping = SdkSignalFrame.create();
      ping.type = SdkSignalFrame.Type.PING_PONG;
      ping.pingPong = SdkPingPongFrame.create();
      ping.pingPong.type = SdkPingPongType.PING;
      ping.pingPong.pingId = 1;
      ping.timestampMs = 10000;
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(
          signalingClient,
          SignalingClientEventType.ReceivedSignalFrame,
          ping
        )
      );
      expect(clientSpy.calledOnce).to.be.true;
      clientSpy.restore();
    });

    it('should ignore other Signal frame', () => {
      const signalingClient = new DefaultSignalingClient(webSocketAdapter, logger);
      const clientSpy = sinon.spy(signalingClient, 'pingPong');
      const pingPong = new DefaultPingPong(signalingClient, defaultIntervalMs, logger);
      const frame = SdkSignalFrame.create();
      frame.type = -1;
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(
          signalingClient,
          SignalingClientEventType.ReceivedSignalFrame,
          frame
        )
      );
      expect(clientSpy.calledOnce).to.not.be.true;
      expect(pingPong.pingId).to.equal(0);
      clientSpy.restore();
    });

    it('should process the PONG frame when receive Signal PONG frame after ping', done => {
      const pingTimestampLocalMs = 10000;
      const pingPong = new DefaultPingPong(signalingClient, defaultIntervalMs, logger);

      class TestObserver implements PingPongObserver {
        didReceivePong(id: number, latencyMs: number, clockSkewMs: number): void {
          expect(id).to.equal(1);
          expect(latencyMs).to.equal(0);
          expect(clockSkewMs).to.equal(2000);
          pingPong.stop();
          done();
        }
      }

      pingPong.addObserver(new TestObserver());
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketOpen, null)
      );
      expect(pingPong.pingId).to.equal(1);
      // override the ping local timestamp
      pingPong.pingTimestampLocalMs = pingTimestampLocalMs;
      // create PONG event
      const pong = SdkSignalFrame.create();
      pong.type = SdkSignalFrame.Type.PING_PONG;
      pong.pingPong = SdkPingPongFrame.create();
      pong.pingPong.type = SdkPingPongType.PONG;
      pong.pingPong.pingId = 1;
      pong.timestampMs = pingTimestampLocalMs + 1000;

      const pongEvent = new SignalingClientEvent(
        signalingClient,
        SignalingClientEventType.ReceivedSignalFrame,
        pong
      );
      pongEvent.timestampMs = pingTimestampLocalMs + 2000;
      pingPong.handleSignalingClientEvent(pongEvent);
      expect(pingPong.consecutivePongsUnaccountedFor).to.equal(0);
    });

    it('should ignore the PONG frame when receive Signal PONG frame but pingId does not match', done => {
      class TestObserver implements PingPongObserver {
        didReceivePong(_id: number, _latencyMs: number, _clockSkewMs: number): void {
          done();
        }
      }
      const pingPong = new DefaultPingPong(signalingClient, defaultIntervalMs, logger);
      pingPong.addObserver(new TestObserver());
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketOpen, null)
      );
      expect(pingPong.pingId).to.equal(1);
      const pong = SdkSignalFrame.create();
      pong.type = SdkSignalFrame.Type.PING_PONG;
      pong.pingPong = SdkPingPongFrame.create();
      pong.pingPong.type = SdkPingPongType.PONG;
      pong.pingPong.pingId = 0;
      pong.timestampMs = 10000;
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(
          signalingClient,
          SignalingClientEventType.ReceivedSignalFrame,
          pong
        )
      );
      expect(pingPong.consecutivePongsUnaccountedFor).to.equal(1);
      pingPong.stop();
      done();
    });

    it('should ignore Signal PONG frame with null timestampMs', done => {
      class TestObserver implements PingPongObserver {
        didReceivePong(_id: number, _latencyMs: number, _clockSkewMs: number): void {
          done();
        }
      }
      const pingPong = new DefaultPingPong(signalingClient, defaultIntervalMs, logger);
      pingPong.addObserver(new TestObserver());
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(signalingClient, SignalingClientEventType.WebSocketOpen, null)
      );
      expect(pingPong.pingId).to.equal(1);
      const pong = SdkSignalFrame.create();
      pong.type = SdkSignalFrame.Type.PING_PONG;
      pong.pingPong = SdkPingPongFrame.create();
      pong.pingPong.type = SdkPingPongType.PONG;
      pong.pingPong.pingId = 1;
      pong.timestampMs = undefined;
      pingPong.handleSignalingClientEvent(
        new SignalingClientEvent(
          signalingClient,
          SignalingClientEventType.ReceivedSignalFrame,
          pong
        )
      );
      expect(pingPong.consecutivePongsUnaccountedFor).to.equal(0);
      pingPong.stop();
      done();
    });
  });
});
