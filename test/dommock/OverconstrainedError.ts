// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class OverconstrainedError extends Error {
  constructor(message: string, public constraint: string) {
    super(message);
    this.name = 'OverconstrainedError';
  }
}
