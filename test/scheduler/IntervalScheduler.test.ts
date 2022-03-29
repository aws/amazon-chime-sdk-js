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
    intervalScheduler.stop();
  });

  it('can check if running when started and not when stopped', () => {
    const intervalMs = 100;
    const intervalScheduler = new IntervalScheduler(intervalMs);
    intervalScheduler.start(() => {});
    expect(intervalScheduler.running()).to.be.true;
    intervalScheduler.stop();
    expect(intervalScheduler.running()).to.be.false;
  });
});
