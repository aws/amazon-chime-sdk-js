// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Task from './Task';

export default class NoOpTask implements Task {
  cancel(): void {}

  name(): string {
    return 'NoOpTask';
  }

  run(): Promise<void> {
    return;
  }

  setParent(_parentTask: Task): void {}
}
