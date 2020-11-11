// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpLogger from '../../src/logger/NoOpLogger';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import Task from '../../src/task/Task';
import TimeoutTask from '../../src/task/TimeoutTask';

describe('TimeoutTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const waitTimeMs = 100;

  describe('run', () => {
    it('can be run a subtask before its timeout expires', async () => {
      let finished = false;
      class TestTask implements Task {
        name(): string {
          return 'TestTask';
        }
        cancel(): void {}
        setParent(_parentTask: Task): void {}
        async run(): Promise<void> {
          finished = true;
        }
      }
      const task: Task = new TimeoutTask(new NoOpLogger(), new TestTask(), waitTimeMs);
      await task.run();
      expect(finished).to.be.true;
    });

    it('will cancel a subtask that reaches its timeout', done => {
      class TestTask implements Task {
        name(): string {
          return 'TestTask';
        }
        cancel(): void {
          done();
        }
        setParent(_parentTask: Task): void {}
        run(): Promise<void> {
          return new Promise<void>(resolve => {
            new TimeoutScheduler(waitTimeMs * 2).start(() => {
              resolve();
            });
          });
        }
      }
      const task: Task = new TimeoutTask(new NoOpLogger(), new TestTask(), waitTimeMs);
      task.run();
    });
  });

  describe('cancel', () => {
    it('will cancel idempotently', done => {
      class TestTask implements Task {
        name(): string {
          return 'TestTask';
        }
        cancel(): void {
          done();
        }
        setParent(_parentTask: Task): void {}
        async run(): Promise<void> {}
      }
      const task: Task = new TimeoutTask(new NoOpLogger(), new TestTask(), waitTimeMs);
      task.run();
      task.cancel();
      task.cancel();
    });

    it('will cancel a subtask in progress', done => {
      class TestTask implements Task {
        canceled = false;
        name(): string {
          return 'TestTask';
        }
        cancel(): void {
          this.canceled = true;
        }
        setParent(_parentTask: Task): void {}
        async run(): Promise<void> {
          await new Promise((resolve, reject) => {
            new TimeoutScheduler(waitTimeMs).start(() => {
              if (this.canceled) {
                resolve();
                done();
              } else {
                reject();
              }
            });
          });
        }
      }
      const task: Task = new TimeoutTask(new NoOpLogger(), new TestTask(), waitTimeMs * 2);
      task.run();
      task.cancel();
    });

    it('fails to run if canceled before running', done => {
      class TestTask implements Task {
        name(): string {
          return 'TestTask';
        }
        cancel(): void {}
        setParent(_parentTask: Task): void {}
        async run(): Promise<void> {}
      }
      const task: Task = new TimeoutTask(new NoOpLogger(), new TestTask(), waitTimeMs);
      task.cancel();
      task.run().catch(() => {
        done();
      });
    });
  });
});
