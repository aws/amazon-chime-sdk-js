// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import Task from './Task';
import TaskStatus from './TaskStatus';

/*
 * [[BaseTask]] provides common utilities for task implementations.
 */
export default abstract class BaseTask implements Task {
  protected taskName = 'BaseTask';

  private parentTask: Task | null = null;
  private status: TaskStatus = TaskStatus.IDLE;

  abstract run(): Promise<void>;

  constructor(protected logger: Logger) {
    this.run = this.baseRun.bind(this, this.run);
    this.cancel = this.baseCancel.bind(this, this.cancel);
  }

  cancel(): void {}

  name(): string {
    return this.parentTask ? `${this.parentTask.name()}/${this.taskName}` : this.taskName;
  }

  setParent(parentTask: Task): void {
    this.parentTask = parentTask;
  }

  protected getStatus(): TaskStatus {
    return this.status;
  }

  protected logAndThrow(message: string): void {
    this.logger.info(message);
    throw new Error(message);
  }

  private async baseRun(originalRun: () => Promise<void>): Promise<void> {
    try {
      const startTime = Date.now();
      this.logger.info(`running task ${this.name()}`);

      switch (this.status) {
        case TaskStatus.RUNNING:
          this.logAndThrow(`${this.name()} is already running`);
        case TaskStatus.CANCELED:
          this.logAndThrow(`${this.name()} was canceled before running`);
        case TaskStatus.FINISHED:
          this.logAndThrow(`${this.name()} was already finished`);
      }

      this.status = TaskStatus.RUNNING;
      await originalRun.call(this);
      this.logger.info(`${this.name()} took ${Math.round(Date.now() - startTime)} ms`);
    } catch (err) {
      throw err;
    } finally {
      if (this.status !== TaskStatus.CANCELED) {
        this.status = TaskStatus.FINISHED;
      }
    }
  }

  private baseCancel(originalCancel: () => void): void {
    if (this.status === TaskStatus.CANCELED || this.status === TaskStatus.FINISHED) {
      return;
    }
    this.logger.info(`canceling task ${this.name()}`);
    this.status = TaskStatus.CANCELED;

    originalCancel.call(this);
  }
}
