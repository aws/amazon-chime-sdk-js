// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpLogger from '../../src/logger/NoOpLogger';
import BaseTask from '../../src/task/BaseTask';
import TaskStatus from '../../src/task/TaskStatus';
import { createFakeTimers, tick } from '../utils/fakeTimerHelper';

describe('BaseTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const waitTimeMs = 50;
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = createFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  describe('run', () => {
    it('can be run', async () => {
      let statusDuringRun: TaskStatus;

      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        async run(): Promise<void> {
          statusDuringRun = this.getStatus();
        }
      }

      const task: TestTask = new TestTask();
      await task.run();
      expect(statusDuringRun).to.equal(TaskStatus.RUNNING);
    });

    it('can log and throw', async () => {
      const message = 'Something went wrong';

      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        async run(): Promise<void> {
          this.logAndThrow(message);
        }
      }

      const task: TestTask = new TestTask();
      try {
        await task.run();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).have.string(message);
      }
    });

    it('will fail if run more than once', async () => {
      const message = 'finished';

      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        async run(): Promise<void> {}
      }

      const task: TestTask = new TestTask();
      await task.run();
      try {
        await task.run();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).have.string(message);
      }
    });

    it('will fail if task is already running', async () => {
      const message = 'running';
      let resolveDelay: () => void;

      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        run(): Promise<void> {
          return new Promise(resolve => {
            resolveDelay = resolve;
          });
        }
      }

      const task: TestTask = new TestTask();
      const runPromise = task.run();
      // Advance time to simulate the task being in progress
      await tick(clock, waitTimeMs / 2);
      try {
        await task.run();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).have.string(message);
      }
      // Clean up by resolving the original promise
      resolveDelay();
      await runPromise;
    });
  });

  describe('cancel', () => {
    it('will cancel task if task is not running', async () => {
      let runCalled = false;

      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        async run(): Promise<void> {
          runCalled = true;
        }
      }

      const task: TestTask = new TestTask();
      task.cancel();
      try {
        await task.run();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).have.string('canceled');
        expect(runCalled).to.be.false;
      }
    });

    it('will attempt to cancel but task will be run', async () => {
      let called = false;

      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        async run(): Promise<void> {
          called = true;
        }
      }

      const task: TestTask = new TestTask();
      const runPromise = task.run();
      await tick(clock, waitTimeMs);
      task.cancel();
      await tick(clock, waitTimeMs);
      await runPromise;
      expect(called).to.equal(true);
    });

    it('will cancel task first and execute the cancel implementation', async () => {
      let cancelStatus: TaskStatus;

      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        cancel(): void {
          cancelStatus = this.getStatus();
        }

        async run(): Promise<void> {}
      }

      const task: TestTask = new TestTask();
      task.cancel();
      try {
        await task.run();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).have.string('canceled');
        expect(cancelStatus).to.equal(TaskStatus.CANCELED);
      }
    });

    it('will cancel idempotently', async () => {
      let cancelCount = 0;
      let resolveRun: () => void;

      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        cancel(): void {
          cancelCount++;
        }

        run(): Promise<void> {
          return new Promise(resolve => {
            resolveRun = resolve;
          });
        }
      }

      const task: TestTask = new TestTask();
      const runPromise = task.run();
      task.cancel();
      task.cancel();
      expect(cancelCount).to.equal(1);
      resolveRun();
      await runPromise.catch(() => {});
    });
  });
});
