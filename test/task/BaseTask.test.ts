// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpLogger from '../../src/logger/NoOpLogger';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import BaseTask from '../../src/task/BaseTask';
import TaskStatus from '../../src/task/TaskStatus';

describe('BaseTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const waitTimeMs = 50;

  describe('run', () => {
    it('can be run', done => {
      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        async run(): Promise<void> {
          expect(this.getStatus()).to.equal(TaskStatus.RUNNING);
          done();
        }
      }

      const task: TestTask = new TestTask();
      task.run();
    });

    it('can log and throw', done => {
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
          done('This line should not be reached.');
        }
      }

      const task: TestTask = new TestTask();
      task.run().catch(err => {
        expect(err.message).have.string(message);
        done();
      });
    });

    it('will fail if run more than once', done => {
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
      task.run().then(() => {
        task.run().catch(err => {
          expect(err.message).have.string(message);
          done();
        });
      });
    });

    it('will fail if task is already running', done => {
      const message = 'running';

      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        async run(): Promise<void> {
          await new Promise(resolve => new TimeoutScheduler(waitTimeMs).start(resolve));
        }
      }

      const task: TestTask = new TestTask();
      new TimeoutScheduler(waitTimeMs / 2).start(() => {
        task.run().catch(err => {
          expect(err.message).have.string(message);
          done();
        });
      });
      task.run();
    });
  });

  describe('cancel', () => {
    it('will cancel task if task is not running', done => {
      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        async run(): Promise<void> {
          done('This line should not be reached.');
        }
      }

      const task: TestTask = new TestTask();
      task.cancel();
      task.run().catch(err => {
        expect(err.message).have.string('canceled');
        done();
      });
    });

    it('will attempt to cancel but task will be run', done => {
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
      new TimeoutScheduler(waitTimeMs).start(() => {
        task.cancel();
      });
      new TimeoutScheduler(waitTimeMs * 2).start(() => {
        expect(called).to.equal(true);
        done();
      });
      task.run();
    });

    it('will cancel task first and execute the cancel implementation', done => {
      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        cancel(): void {
          expect(this.getStatus()).to.equal(TaskStatus.CANCELED);
        }

        async run(): Promise<void> {
          done('This line should not be reached.');
        }
      }

      const task: TestTask = new TestTask();
      task.cancel();
      task.run().catch(err => {
        expect(err.message).have.string('canceled');
        done();
      });
    });

    it('will cancel idempotently', done => {
      class TestTask extends BaseTask {
        constructor() {
          super(new NoOpLogger());
        }

        name(): string {
          return 'TestTask';
        }

        cancel(): void {
          done();
        }

        async run(): Promise<void> {}
      }

      const task: TestTask = new TestTask();
      task.run();
      task.cancel();
      task.cancel();
    });
  });
});
