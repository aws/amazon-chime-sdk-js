// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import DefaultVideoFrameProcessorTimer from '../../src/videoframeprocessor/DefaultVideoFrameProcessorTimer';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultVideoFrameProcessorTimer', () => {
  const assert: Chai.AssertStatic = chai.assert;

  const sandbox = sinon.createSandbox();
  let fakeClock: sinon.SinonFakeTimers;

  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let previousWorker: any;

  beforeEach(() => {
    fakeClock = sandbox.useFakeTimers();

    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);

    previousWorker = globalThis.Worker;
  });

  afterEach(() => {
    sandbox.restore();
    fakeClock.restore();

    domMockBuilder.cleanup();

    globalThis.Worker = previousWorker;
  });

  describe('using worker thread timer', () => {
    beforeEach(() => {
      const dummyProcessID = 2;
      globalThis.Worker = (class {
        private timeoutId: NodeJS.Timeout | null = null;
        constructor(private onmessage = (_: { data: number }) => {}) {}
        terminate(): void {
          if (this.timeoutId) clearTimeout(this.timeoutId);
        }

        postMessage({ duration }: { duration: number }): void {
          this.timeoutId = setTimeout(() => {
            this.onmessage({ data: dummyProcessID });
          }, duration);
        }
      } as unknown) as typeof Worker;
    });

    runTests();
  });

  describe('using main thread timer', () => {
    beforeEach(() => {
      globalThis.Worker = null;
    });
    runTests();
  });

  function runTests(): void {
    describe('constructor', () => {
      it('can be constructed', () => {
        const timer = new DefaultVideoFrameProcessorTimer();
        assert.exists(timer);
      });
    });

    describe('start and destroy', () => {
      it('can start and destroy the timer', () => {
        const timer = new DefaultVideoFrameProcessorTimer();
        const callback = sandbox.stub();

        timer.start(100, callback);
        fakeClock.tick(100);

        assert.isTrue(callback.calledOnce);
        timer.destroy();
      });

      it('does not call the callback if the timer is destroyed before timeout', () => {
        const timer = new DefaultVideoFrameProcessorTimer();
        const callback = sandbox.stub();

        timer.start(100, callback);
        timer.destroy();
        fakeClock.tick(100);

        assert.isFalse(callback.called);
      });
    });
  }
});
