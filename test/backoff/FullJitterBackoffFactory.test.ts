// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import FullJitterBackoff from '../../src/backoff/FullJitterBackoff';
import FullJitterBackoffFactory from '../../src/backoff/FullJitterBackoffFactory';
import FullJitterLimitedBackoff from '../../src/backoff/FullJitterLimitedBackoff';

describe('FullJitterBackoffFactory', () => {
  const fixed = 1000;
  const short = 100;
  const long = 300;

  describe('create', () => {
    it('is created', () => {
      const subject = new FullJitterBackoffFactory(fixed, short, long);
      chai.expect(subject.create()).to.be.instanceOf(FullJitterBackoff);
    });
  });

  describe('createWithLimit', () => {
    it('is created', () => {
      const subject = new FullJitterBackoffFactory(fixed, short, long);
      chai.expect(subject.createWithLimit(10)).to.be.instanceOf(FullJitterLimitedBackoff);
    });
  });
});
