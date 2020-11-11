// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import BaseTask from './BaseTask';

/**
 * [[RunnableTask]] Task wrapper for any Promised-operation
 */
export default class RunnableTask<T> extends BaseTask {
  constructor(logger: Logger, private fn: () => Promise<T>, taskName: string = 'RunnableTask') {
    super(logger);
    this.taskName = taskName;
  }

  run(): Promise<void> {
    return this.fn().then(() => {});
  }
}
