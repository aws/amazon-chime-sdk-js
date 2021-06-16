// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import VideoPriorityBasedPolicyConfig from '../../src/videodownlinkbandwidthpolicy/VideoPriorityBasedPolicyConfig';

describe('VideoPriorityBasedPolicyConfig', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;

  describe('construction', () => {
    it('can be constructed', () => {
      const d = new VideoPriorityBasedPolicyConfig();
      assert.exists(d);
      expect(d.getNetworkIssueRecoveryDelay() === 2000).to.be.true;
      expect(d.getNetworkIssueResponseDelay() === 2000).to.be.true;
    });

    it('can be constructed with parameters', () => {
      const d = new VideoPriorityBasedPolicyConfig(0.5, 0.5);
      assert.exists(d);
      expect(d.getNetworkIssueRecoveryDelay() === 5000).to.be.true;
      expect(d.getNetworkIssueResponseDelay() === 5000).to.be.true;
    });
  });

  describe('input out of boundary', () => {
    it('smaller than 0', () => {
      const d = new VideoPriorityBasedPolicyConfig();
      d.setNetworkIssueRecoveryDelayFactor(-1);
      expect(d.getNetworkIssueRecoveryDelay() === 2000).to.be.true;
      d.setNetworkIssueResponseDelayFactor(-1);
      expect(d.getNetworkIssueResponseDelay() === 2000).to.be.true;
    });

    it('bigger than 1', () => {
      const d = new VideoPriorityBasedPolicyConfig();
      d.setNetworkIssueRecoveryDelayFactor(2);
      expect(d.getNetworkIssueRecoveryDelay() === 8000).to.be.true;
      d.setNetworkIssueResponseDelayFactor(2);
      expect(d.getNetworkIssueResponseDelay() === 8000).to.be.true;
    });
  });

  describe('presets', () => {
    it('can be access', () => {
      assert.exists(VideoPriorityBasedPolicyConfig.Default);
      assert.exists(VideoPriorityBasedPolicyConfig.UnstableNetworkPreset);
      assert.exists(VideoPriorityBasedPolicyConfig.StableNetworkPreset);
    });
  });
});