// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import BaseTask from './BaseTask';
import Task from './Task';
import TaskStatus from './TaskStatus';

/**
 * [[SerialGroupTask]] runs a set of tasks in series. When canceled, it stops
 * any currently running task and runs no further tasks in the group.
 */
export default class SerialGroupTask extends BaseTask {
  private currentTask: Task | null = null;

  constructor(logger: Logger, protected taskName: string, private tasksToRunSerially: Task[]) {
    super(logger);
    for (const task of tasksToRunSerially) {
      task.setParent(this);
    }
  }

  cancel(): void {
    if (this.currentTask) {
      this.logger.info(
        `canceling serial group task ${this.name()} subtask ${this.currentTask.name()}`
      );
      this.currentTask.cancel();
    }
  }

  async run(): Promise<void> {
    for (const task of this.tasksToRunSerially) {
      if (this.getStatus() === TaskStatus.CANCELED) {
        this.logAndThrow(`serial group task ${this.name()} was canceled`);
      }
      try {
        this.logger.info(`serial group task ${this.name()} running subtask ${task.name()}`);
        this.currentTask = task;
        await task.run();
        this.logger.info(`serial group task ${this.name()} completed subtask ${task.name()}`);
      } catch (err) {
        this.logAndThrow(
          `serial group task ${this.name()} was canceled due to subtask ` +
            `${this.currentTask.name()} error: ${err.message}`
        );
      } finally {
        this.currentTask = null;
      }
    }
    this.logger.info(`serial group task ${this.name()} completed`);
  }
}
