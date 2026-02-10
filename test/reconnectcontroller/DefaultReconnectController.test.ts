// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';
import DefaultReconnectController from '../../src/reconnectcontroller/DefaultReconnectController';
import { createFakeTimers } from '../utils/fakeTimerHelper';

describe('DefaultReconnectController', () => {
  let expect: Chai.ExpectStatic;
  let clock: sinon.SinonFakeTimers;
  const defaultController = (): DefaultReconnectController => {
    return new DefaultReconnectController(50, new FullJitterBackoff(10, 0, 0));
  };

  beforeEach(() => {
    expect = chai.expect;
    clock = createFakeTimers();
  });

  afterEach(() => {
    clock.restore();
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
    it('calls the retry func', async () => {
      let called = false;
      expect(
        defaultController().retryWithBackoff(
          () => {
            called = true;
          },
          () => {}
        )
      ).to.equal(true);
      await clock.tickAsync(10);
      expect(called).to.be.true;
    });

    it('calls the cancel func if canceled after starting retry', async () => {
      const controller = defaultController();
      let cancelCalled = false;
      expect(
        controller.retryWithBackoff(
          () => {},
          () => {
            cancelCalled = true;
          }
        )
      ).to.equal(true);
      controller.cancel();
      controller.cancel();
      await clock.tickAsync(0);
      expect(cancelCalled).to.be.true;
    });

    it('does not call the retry func if reconnect is disabled', async () => {
      const controller = defaultController();
      controller.disableReconnect();
      let retryCalled = false;
      expect(
        controller.retryWithBackoff(
          () => {
            retryCalled = true;
          },
          () => {}
        )
      ).to.equal(false);
      await clock.tickAsync(100);
      expect(retryCalled).to.be.false;
    });

    it('stops calling the retry func if it is past the deadline', async () => {
      const controller = defaultController();
      controller.startedConnectionAttempt(true);
      expect(controller.hasStartedConnectionAttempt()).to.equal(true);
      expect(controller.isFirstConnection()).to.equal(true);
      await clock.tickAsync(50); // Move past the 50ms deadline
      let attempts = 0;
      const tryAgain = (): void => {
        if (
          controller.retryWithBackoff(
            () => {
              attempts++;
            },
            () => {}
          )
        ) {
          setTimeout(tryAgain, 10);
        }
      };
      tryAgain();
      await clock.tickAsync(100);
      controller.startedConnectionAttempt(false);
      expect(controller.isFirstConnection()).to.equal(false);
      expect(attempts).to.equal(0);
    });

    it('does not retry if it has been inactive for a while', () => {
      const controller = defaultController();
      controller.setLastActiveTimestampMs(Date.now() - 100);
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
