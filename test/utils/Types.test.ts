// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';

import { Maybe, None, Some } from '../../src/';

describe('index.ts imports of Types', () => {
  it('makes istanbul stop complaining about public exports', () => {
    expect(Maybe).to.not.be.undefined;
    expect(None).to.not.be.undefined;
    expect(Some).to.not.be.undefined;
  });
});
