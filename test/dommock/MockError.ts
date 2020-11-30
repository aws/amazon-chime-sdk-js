// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class MockError extends Error {
  constructor(name: string, message?: string) {
    super(message);
    this.name = name;
  }
}

export class OverconstrainedError extends Error {
  constructor(message: string, public constraint: string) {
    super(message);
    this.name = 'OverconstrainedError';
  }
}
