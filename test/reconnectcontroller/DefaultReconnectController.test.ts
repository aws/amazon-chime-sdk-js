// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';
import DefaultReconnectController from '../../src/reconnectcontroller/DefaultReconnectController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';

describe('DefaultReconnectController', () => {
  let expect: Chai.ExpectStatic;
  let timeout: number;
  const defaultController = (): DefaultReconnectController => {
    return new DefaultReconnectController(50, new FullJitterBackoff(10, 0, 0));
  };

  beforeEach(() => {
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
      controller.startedConnectionAttempt(true);
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
      controller.startedConnectionAttempt(false);
      expect(controller.isFirstConnection()).to.equal(false);
    });

    it('does not retry if it has been inactive for a while', () => {
      const controller = defaultController();
      controller.setLastActiveTimestampMs(Date.now() - timeout * 2);
      expect(
        controller.retryWithBackoff(
          () => {},
          () => {}
        )
      ).to.equal(false);
      controller.cancel();
    });
  });
});
