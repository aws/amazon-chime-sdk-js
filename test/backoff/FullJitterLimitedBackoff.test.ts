// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import FullJitterLimitedBackoff from '../../src/backoff/FullJitterLimitedBackoff';

describe('FullJitterLimitedBackoff', () => {
  const fixed = 1000;
  const short = 100;
  const long = 300;
  const limit = 1;

  describe('nextBackoffAmountMs', () => {
    it('is computed', () => {
      const subject = new FullJitterLimitedBackoff(fixed, short, long, limit);
      subject.nextBackoffAmountMs();
      chai
        .expect(() => {
          subject.nextBackoffAmountMs();
        })
        .to.throw('retry limit exceeded');
    });
  });
});
