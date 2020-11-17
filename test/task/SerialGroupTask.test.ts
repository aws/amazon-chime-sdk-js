// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpLogger from '../../src/logger/NoOpLogger';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import SerialGroupTask from '../../src/task/SerialGroupTask';
import Task from '../../src/task/Task';

describe('SerialGroupTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const waitTimeMs = 100;

  describe('run', () => {
    it('can be run with no subtasks', done => {
      const task: Task = new SerialGroupTask(new NoOpLogger(), 'test', []);
      task.run().then(() => {
        done();
      });
    });

    it('can be run with one subtask', done => {
      class TestTask implements Task {
        name(): string {
          return 'TestTask';
        }
        cancel(): void {}
        setParent(_parentTask: Task): void {}
        async run(): Promise<void> {
          done();
        }
      }
      const task: Task = new SerialGroupTask(new NoOpLogger(), 'test', [new TestTask()]);
      task.run();
    });

    it('can run two tasks in order', done => {
      let currentTask = 0;
      class TestTask implements Task {
        constructor(private id: number) {}
        name(): string {
          return 'TestTask';
        }
        cancel(): void {}
        setParent(_parentTask: Task): void {}
        async run(): Promise<void> {
          currentTask += 1;
          expect(this.id).to.equal(currentTask);
          if (currentTask === 2) {
            done();
          }
        }
      }
      const task: Task = new SerialGroupTask(new NoOpLogger(), 'test', [
        new TestTask(1),
        new TestTask(2),
      ]);
      task.run();
    });

    it('stops running tasks if one fails', done => {
      let taskRunCount = 0;
      class FailTask implements Task {
        name(): string {
          return 'FailTask';
        }
        cancel(): void {}
        setParent(_parentTask: Task): void {}
        async run(): Promise<void> {
          taskRunCount += 1;
          throw new Error('failing task');
        }
      }
      const task: Task = new SerialGroupTask(new NoOpLogger(), 'test', [
        new FailTask(),
        new FailTask(),
      ]);
      task.run().catch(() => {
        if (taskRunCount === 1) {
          done();
        }
      });
    });
  });

  describe('cancel', () => {
    it('will cancel subtasks', done => {
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
      const task: Task = new SerialGroupTask(new NoOpLogger(), 'test', [new TestTask()]);
      task.run();
      task.cancel();
    });

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
      const task: Task = new SerialGroupTask(new NoOpLogger(), 'test', [new TestTask()]);
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
      const task: Task = new SerialGroupTask(new NoOpLogger(), 'test', [new TestTask()]);
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
      const task: Task = new SerialGroupTask(new NoOpLogger(), 'test', [new TestTask()]);
      task.cancel();
      task.run().catch(() => {
        done();
      });
    });

    it('cancels the remaining tasks if the current task cannot be canceled', done => {
      class TestTask implements Task {
        name(): string {
          return 'TestTask';
        }
        cancel(): void {}
        setParent(_parentTask: Task): void {}
        async run(): Promise<void> {}
      }
      const task: Task = new SerialGroupTask(new NoOpLogger(), 'test', [
        new TestTask(),
        new TestTask(),
      ]);
      task.run().catch(() => {
        done();
      });
      task.cancel();
    });
  });
});
