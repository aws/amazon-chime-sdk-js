// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AsyncScheduler from '../../src/scheduler/AsyncScheduler';

describe('AsyncScheduler', () => {
  let expect: Chai.ExpectStatic;
  before(() => {
    expect = chai.expect;
  });

  it('can be constructed', () => {
    const asyncScheduler = new AsyncScheduler();
    expect(asyncScheduler).to.not.equal(null);
  });
});
