// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import wait from '../../src/utils/wait';

describe('wait', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  it('atleast waits for the specified delay in milliseconds', async () => {
    const startTime = new Date().getTime();
    const delay = 500;
    await wait(delay);
    const endTime = new Date().getTime();
    expect(endTime - startTime).to.gte(delay);
  });
});
