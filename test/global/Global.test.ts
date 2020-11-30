// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const mochaTestDelayMs = parseInt(process.env.MOCHA_TEST_DELAY_MS);

if (mochaTestDelayMs > 0) {
  beforeEach(done => {
    setTimeout(() => {
      done();
    }, mochaTestDelayMs);
  });
}
