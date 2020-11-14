// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import GetUserMediaError from './GetUserMediaError';

export default class OverconstrainedError extends GetUserMediaError {
  constructor(cause?: Error, public constraint?: string) {
    super(cause);
  }
}
