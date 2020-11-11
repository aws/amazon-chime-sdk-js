// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import Backoff from '../../src/backoff/Backoff';
import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';

describe('FullJitterBackoff', () => {
  let expect: Chai.ExpectStatic;
  const TEST_RUNS = 1000;
  const ATTEMPTS = 3;
  before(() => {
    expect = chai.expect;
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const backoff: Backoff = new FullJitterBackoff(1, 1, 1);
      expect(backoff).to.not.equal(null);
    });
  });

  describe('jitter', () => {
    it('is in the expected range for that attempt', () => {
      const maxAmountForAttempt: number[] = [];
      for (let i = 0; i < TEST_RUNS; i++) {
        const backoff = new FullJitterBackoff(10, 1, 4);
        const amountForAttempt: number[] = [];
        for (let j = 0; j < ATTEMPTS; j++) {
          amountForAttempt[j] = backoff.nextBackoffAmountMs();
          if (!(maxAmountForAttempt[j] > amountForAttempt[j])) {
            maxAmountForAttempt[j] = amountForAttempt[j];
          }
        }
        expect(amountForAttempt[0]).to.be.gte(10);
        expect(amountForAttempt[0]).to.be.lte(11);
        expect(amountForAttempt[1]).to.be.gte(10);
        expect(amountForAttempt[1]).to.be.lte(12);
        expect(amountForAttempt[2]).to.be.gte(10);
        expect(amountForAttempt[2]).to.be.lte(14);
      }
      expect(maxAmountForAttempt[0]).to.be.gte(10.5);
      expect(maxAmountForAttempt[1]).to.be.gte(11);
      expect(maxAmountForAttempt[2]).to.be.gte(12);
    });

    it('is clipped by the upper bound', () => {
      const maxAmountForAttempt: number[] = [];
      for (let i = 0; i < TEST_RUNS; i++) {
        const backoff = new FullJitterBackoff(10, 1, 1);
        const amountForAttempt: number[] = [];
        for (let j = 0; j < ATTEMPTS; j++) {
          amountForAttempt[j] = backoff.nextBackoffAmountMs();
          if (!(maxAmountForAttempt[j] > amountForAttempt[j])) {
            maxAmountForAttempt[j] = amountForAttempt[j];
          }
        }
        expect(amountForAttempt[0]).to.be.gte(10);
        expect(amountForAttempt[0]).to.be.lte(11);
        expect(amountForAttempt[1]).to.be.gte(10);
        expect(amountForAttempt[1]).to.be.lte(11);
        expect(amountForAttempt[2]).to.be.gte(10);
        expect(amountForAttempt[2]).to.be.lte(11);
      }
      expect(maxAmountForAttempt[0]).to.be.gte(10.5);
      expect(maxAmountForAttempt[1]).to.be.gte(10.5);
      expect(maxAmountForAttempt[2]).to.be.gte(10.5);
    });

    it('treats negative arguments as zero', () => {
      for (let i = 0; i < TEST_RUNS; i++) {
        const backoff = new FullJitterBackoff(-100, -200, -300);
        for (let j = 0; j < ATTEMPTS; j++) {
          expect(backoff.nextBackoffAmountMs()).to.equal(0);
        }
      }
    });

    it('gives the value in the range for the first attempt after reset', () => {
      const maxAmountForAttempt: number[] = [];
      for (let i = 0; i < TEST_RUNS; i++) {
        const backoff = new FullJitterBackoff(10, 1, 4);
        const amountForAttempt: number[] = [];
        for (let j = 0; j < ATTEMPTS; j++) {
          backoff.reset();
          amountForAttempt[j] = backoff.nextBackoffAmountMs();
          if (!(maxAmountForAttempt[j] > amountForAttempt[j])) {
            maxAmountForAttempt[j] = amountForAttempt[j];
          }
        }
        expect(amountForAttempt[0]).to.be.gte(10);
        expect(amountForAttempt[0]).to.be.lte(11);
        expect(amountForAttempt[1]).to.be.gte(10);
        expect(amountForAttempt[1]).to.be.lte(11);
        expect(amountForAttempt[2]).to.be.gte(10);
        expect(amountForAttempt[2]).to.be.lte(11);
      }
      expect(maxAmountForAttempt[0]).to.be.gte(10.5);
      expect(maxAmountForAttempt[1]).to.be.gte(10.5);
      expect(maxAmountForAttempt[2]).to.be.gte(10.5);
    });
  });
});
