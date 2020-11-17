// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import TimeoutScheduler from '../scheduler/TimeoutScheduler';
import BaseTask from './BaseTask';
import Task from './Task';

/**
 * [[TimeoutTask]] runs a subtask until it either succeeds or reaches a
 * timeout, at which point the subtask is canceled.
 */
export default class TimeoutTask extends BaseTask {
  protected taskName: string;

  constructor(logger: Logger, private taskToRunBeforeTimeout: Task, private timeoutMs: number) {
    super(logger);
    this.taskName = `Timeout${this.timeoutMs}ms`;
    taskToRunBeforeTimeout.setParent(this);
  }

  cancel(): void {
    this.logger.info(
      `canceling timeout task ${this.name()} subtask ${this.taskToRunBeforeTimeout}`
    );
    this.taskToRunBeforeTimeout.cancel();
  }

  async run(): Promise<void> {
    const timer = new TimeoutScheduler(this.timeoutMs);
    timer.start(() => {
      this.logger.info(`timeout reached for task ${this.name()}`);
      this.taskToRunBeforeTimeout.cancel();
    });
    try {
      await this.taskToRunBeforeTimeout.run();
    } finally {
      timer.stop();
    }
    this.logger.info(`timeout task ${this.name()} completed`);
  }
}
