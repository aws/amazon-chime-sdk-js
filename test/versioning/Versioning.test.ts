// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import Versioning from '../../src/versioning/Versioning';

describe('Versioning', () => {
  describe('#sdkVersion', () => {
    it('is semver', () => {
      const version = Versioning.sdkVersion.split('.');
      const major = parseInt(version[0]);
      const minor = parseInt(version[1]);
      const patch = parseInt(version[2]);
      chai.expect(version.length).to.eq(3);
      chai.expect(major).to.gte(0);
      chai.expect(minor).to.gte(0);
      chai.expect(patch).to.gte(0);
      chai.expect(major + minor + patch).to.gt(0);
    });
  });
});
