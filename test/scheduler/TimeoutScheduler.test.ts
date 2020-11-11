// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';

describe('TimeoutScheduler', () => {
  let expect: Chai.ExpectStatic;
  const timeoutMs = 10;

  before(() => {
    expect = chai.expect;
  });

  it('can be constructed', () => {
    const timeoutScheduler = new TimeoutScheduler(timeoutMs);
    expect(timeoutScheduler).to.not.equal(null);
  });

  describe('start', () => {
    it('should execute the callback after timeout', () => {
      const timeoutScheduler = new TimeoutScheduler(timeoutMs);
      let updateVal = 0;
      function callback(): void {
        updateVal = 10;
      }

      timeoutScheduler.start(() => {
        callback();
      });
      setTimeout(() => {
        expect(updateVal).to.equal(10);
      }, timeoutMs + 5);
    });
  });

  describe('stop', () => {
    it('should not execute the callback after stop the scheduler', () => {
      const timeoutScheduler = new TimeoutScheduler(timeoutMs);
      let updateVal = 0;
      function callback(): void {
        updateVal = 10;
      }

      timeoutScheduler.start(() => {
        callback();
      });
      timeoutScheduler.stop();
      setTimeout(() => {
        expect(updateVal).to.equal(0);
      }, timeoutMs + 5);
    });
  });
});
