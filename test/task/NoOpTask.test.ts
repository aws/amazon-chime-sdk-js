// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import NoOpTask from '../../src/task/NoOpTask';

describe('NoOpTask', () => {
  describe('cancel', () => {
    it('cancels', () => {
      new NoOpTask().cancel();
    });
  });
  describe('name', () => {
    it('gets name', () => {
      new NoOpTask().name();
    });
  });
  describe('run', () => {
    it('runs', () => {
      new NoOpTask().run();
    });
  });
  describe('setParent', () => {
    it('sets parent', () => {
      new NoOpTask().setParent(undefined);
    });
  });
});
