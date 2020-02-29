// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';
import DefaultReconnectController from '../../src/reconnectcontroller/DefaultReconnectController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import PingPong from '../../src/pingpong/PingPong';
import PingPongObserver from '../../src/pingpongobserver/PingPongObserver';

describe('DefaultReconnectController', () => {
  let pingPongStartCalled: boolean;
  let expect: Chai.ExpectStatic;
  let timeout: number;
  let defaultController = (): DefaultReconnectController => {
    return new DefaultReconnectController(50, new FullJitterBackoff(10, 0, 0));
  };

  beforeEach(() => {
    pingPongStartCalled = false;
    const controller = defaultController();
    controller.startedConnectionAttempt(false, new TestPingPong());
    expect = chai.expect;
    timeout = 50;
  });
  it('can be constructed', () => {
    expect(defaultController).to.not.equal(null);
  });

  describe('clone', () => {
    it('can be cloned', () => {
      const original = defaultController();
      const cloned = original.clone();
      expect(cloned).to.not.equal(null);
      expect(cloned).to.not.equal(original);
    });
  });

  describe('enableRestartPeerConnection', () => {
    it('should enable only restart peer connection', () => {
      const controller = defaultController();
      expect(controller.shouldOnlyRestartPeerConnection()).to.equal(false);
      controller.enableRestartPeerConnection();
      expect(controller.shouldOnlyRestartPeerConnection()).to.equal(true);
    });
  });

  describe('retryWithBackoff', () => {
    it('calls the retry func', done => {
      expect(
        defaultController().retryWithBackoff(
          () => {
            done();
          },
          () => {}
        )
      ).to.equal(true);
    });

    it('calls the cancel func if canceled after starting retry', done => {
      const controller = defaultController();
      expect(
        controller.retryWithBackoff(
          () => {},
          () => {
            new TimeoutScheduler(timeout).start(() => {
              done();
            });
          }
        )
      ).to.equal(true);
      controller.cancel();
      controller.cancel(); // this shouldn't trigger backoffCancel again
    });

    it('does not call the retry func if reconnect is disabled', done => {
      const controller = defaultController();
      controller.disableReconnect();
      expect(
        controller.retryWithBackoff(
          () => {},
          () => {}
        )
      ).to.equal(false);
      new TimeoutScheduler(timeout).start(() => {
        done();
      });
    });

    it('stops calling the retry func if it is past the deadline', done => {
      const controller = defaultController();
      controller.startedConnectionAttempt(true, new TestPingPong());
      expect(controller.hasStartedConnectionAttempt()).to.equal(true);
      expect(controller.isFirstConnection()).to.equal(true);
      const tryAgain = (): void => {
        controller.retryWithBackoff(
          () => {},
          () => {}
        )
          ? new TimeoutScheduler(10).start(() => {
              tryAgain();
            })
          : done();
      };
      tryAgain();
      new TimeoutScheduler(2 * timeout).start(() => {});
      controller.startedConnectionAttempt(false, new TestPingPong());
      expect(controller.isFirstConnection()).to.equal(false);
    });
    it('stops calling the retry func if it is past the deadline', done => {
          const controller = defaultController();
          controller.startedConnectionAttempt(true, new TestPingPong());
          expect(controller.hasStartedConnectionAttempt()).to.equal(true);
          expect(controller.isFirstConnection()).to.equal(true);
                  controller.didReceivePong(0, 0);
          const tryAgain = (): void => {
            controller.retryWithBackoff(
              () => {},
              () => {}
            )
              ? new TimeoutScheduler(10).start(() => {
                  tryAgain();
                })
              : done();
          };
          tryAgain();
          new TimeoutScheduler(2 * timeout).start(() => {});
          controller.startedConnectionAttempt(false, new TestPingPong());
          expect(controller.isFirstConnection()).to.equal(false);
        });
  });

  it('can start a PingPong', () => {
    const controller = defaultController();
    controller.startedConnectionAttempt(true, new TestPingPong());
    expect(pingPongStartCalled).to.equal(true);
  });

  it('can receive a pong', () => {
    const controller = defaultController();
    const didReceivePongSpy = sinon.spy(controller, 'didReceivePong');
    controller.didReceivePong(0, 0);
    expect(didReceivePongSpy.called).to.equal(true);
  });

  it('can stop a PingPong', () => {
    const controller = defaultController();
    const pingPong = new TestPingPong();
    const startSpy = sinon.spy(pingPong, 'start');
    const stopSpy = sinon.spy(pingPong, 'stop');
    controller.startedConnectionAttempt(true, pingPong);
    expect(controller.hasStartedConnectionAttempt()).to.equal(true);
    expect(controller.isFirstConnection()).to.equal(true);
    controller.didReceivePong(0, 0);
    expect(startSpy.called).to.equal(true);
    controller.reset();
    expect(stopSpy.called).to.equal(true);
  });

  class TestPingPong implements PingPong {
      addObserver(_observer: PingPongObserver): void {}
      removeObserver(_observer: PingPongObserver): void {}
      forEachObserver(_observerFunc: (_observer: PingPongObserver) => void): void {}
      start(): void {
        pingPongStartCalled = true;
      }
      stop(): void {}
    }
});
