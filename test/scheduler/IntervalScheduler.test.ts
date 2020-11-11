// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import IntervalScheduler from '../../src/scheduler/IntervalScheduler';

describe('IntervalScheduler', () => {
  let expect: Chai.ExpectStatic;
  before(() => {
    expect = chai.expect;
  });

  it('can be constructed', () => {
    const intervalMs = 100;
    const intervalScheduler = new IntervalScheduler(intervalMs);
    expect(intervalScheduler).to.not.equal(null);
  });
});
