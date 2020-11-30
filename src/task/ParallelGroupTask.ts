// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import BaseTask from './BaseTask';
import Task from './Task';

/**
 * [[ParallelGroupTask]] runs a set of tasks in parallel. When canceled, it
 * stops any currently running tasks.
 */
export default class ParallelGroupTask extends BaseTask {
  constructor(logger: Logger, protected taskName: string, private tasksToRunParallel: Task[]) {
    super(logger);
    for (const task of tasksToRunParallel) {
      task.setParent(this);
    }
  }

  cancel(): void {
    for (const task of this.tasksToRunParallel) {
      this.logger.info(`canceling parallel group task ${this.name()} subtask ${task.name()}`);
      task.cancel();
    }
  }

  async run(): Promise<void> {
    const taskResults: Promise<void>[] = [];
    for (const task of this.tasksToRunParallel) {
      this.logger.info(`parallel group task ${this.name()} running subtask ${task.name()}`);
      taskResults.push(task.run());
    }
    const failures: string[] = [];
    for (let i = 0; i < taskResults.length; i++) {
      try {
        await taskResults[i];
      } catch (err) {
        failures.push(`task ${this.tasksToRunParallel[i].name()} failed: ${err.message}`);
      }
      this.logger.info(
        `parallel group task ${this.name()} completed subtask ${this.tasksToRunParallel[i].name()}`
      );
    }
    if (failures.length > 0) {
      const failureMessage = failures.join(', ');
      this.logAndThrow(`parallel group task ${this.name()} failed for tasks: ${failureMessage}`);
    }
    this.logger.info(`parallel group task ${this.name()} completed`);
  }
}
