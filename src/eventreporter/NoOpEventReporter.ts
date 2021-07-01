// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import EventReporter from './EventReporter';

export default class NoOpEventReporter implements EventReporter {
  constructor() {}

  reportEvent(
    _ts: number,
    _name: string,
    _attributes?: { [key: string]: string | number }
  ): Promise<void> {
    return;
  }

  start(): void {}

  stop(): void {}
}
