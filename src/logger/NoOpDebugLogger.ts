// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LogLevel from './LogLevel';
import NoOpLogger from './NoOpLogger';

/**
 * [[NoOpDebugLogger]] does not log any message but does call
 * debug functions by default.
 */
export default class NoOpDebugLogger extends NoOpLogger {
  constructor() {
    super(LogLevel.DEBUG);
  }
}
