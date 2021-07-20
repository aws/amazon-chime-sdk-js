// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import VideoPriorityBasedPolicyConfiguration from '../../src/videodownlinkbandwidthpolicy/VideoPriorityBasedPolicyConfiguration';

describe('VideoPriorityBasedPolicyConfiguration', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;

  describe('construction', () => {
    it('can be constructed', () => {
      const d = new VideoPriorityBasedPolicyConfiguration();
      assert.exists(d);
      expect(d.networkIssueRecoveryDelayFactor === 0).to.be.true;
      expect(d.networkIssueResponseDelayFactor === 0).to.be.true;
    });

    it('can be constructed with parameters', () => {
      const d = new VideoPriorityBasedPolicyConfiguration(0.5, 0.5);
      assert.exists(d);
      expect(d.networkIssueRecoveryDelayFactor === 0.5).to.be.true;
      expect(d.networkIssueResponseDelayFactor === 0.5).to.be.true;
    });
  });

  describe('input out of boundary', () => {
    it('smaller than 0', () => {
      const d = new VideoPriorityBasedPolicyConfiguration(-1, -1);
      expect(d.networkIssueRecoveryDelayFactor === 0).to.be.true;
      expect(d.networkIssueResponseDelayFactor === 0).to.be.true;
    });

    it('bigger than 1', () => {
      const d = new VideoPriorityBasedPolicyConfiguration(2, 2);
      expect(d.networkIssueRecoveryDelayFactor === 1).to.be.true;
      expect(d.networkIssueResponseDelayFactor === 1).to.be.true;
    });
  });

  describe('presets', () => {
    it('can be access', () => {
      assert.exists(VideoPriorityBasedPolicyConfiguration.Default);
      assert.exists(VideoPriorityBasedPolicyConfiguration.UnstableNetworkPreset);
      assert.exists(VideoPriorityBasedPolicyConfiguration.StableNetworkPreset);
    });
  });
});
