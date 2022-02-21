// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import VideoPriorityBasedPolicyConfig from '../../src/videodownlinkbandwidthpolicy/VideoPriorityBasedPolicyConfig';

describe('VideoPriorityBasedPolicyConfig', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;

  interface DateNow {
    (): number;
  }
  let originalDateNow: DateNow;
  let startTime: number;

  function mockDateNow(): number {
    return startTime;
  }

  function incrementTime(addMs: number): void {
    startTime += addMs;
  }

  beforeEach(() => {
    startTime = Date.now();
    originalDateNow = Date.now;
    Date.now = mockDateNow;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const videoPriorityBasedPolicyConfig = new VideoPriorityBasedPolicyConfig();
      assert.exists(videoPriorityBasedPolicyConfig);
      expect(videoPriorityBasedPolicyConfig.networkIssueRecoveryDelayFactor === 0).to.be.true;
      expect(videoPriorityBasedPolicyConfig.networkIssueResponseDelayFactor === 0).to.be.true;
    });

    it('can be constructed with parameters', () => {
      const videoPriorityBasedPolicyConfig = new VideoPriorityBasedPolicyConfig(0.5, 0.5);
      assert.exists(videoPriorityBasedPolicyConfig);
      expect(videoPriorityBasedPolicyConfig.networkIssueRecoveryDelayFactor === 0.5).to.be.true;
      expect(videoPriorityBasedPolicyConfig.networkIssueResponseDelayFactor === 0.5).to.be.true;
    });
  });

  describe('input out of boundary', () => {
    it('smaller than 0', () => {
      const videoPriorityBasedPolicyConfig = new VideoPriorityBasedPolicyConfig(-1, -1);
      expect(videoPriorityBasedPolicyConfig.networkIssueRecoveryDelayFactor === 0).to.be.true;
      expect(videoPriorityBasedPolicyConfig.networkIssueResponseDelayFactor === 0).to.be.true;
    });

    it('bigger than 1', () => {
      const videoPriorityBasedPolicyConfig = new VideoPriorityBasedPolicyConfig(2, 2);
      expect(videoPriorityBasedPolicyConfig.networkIssueRecoveryDelayFactor === 1).to.be.true;
      expect(videoPriorityBasedPolicyConfig.networkIssueResponseDelayFactor === 1).to.be.true;
    });
  });

  describe('presets', () => {
    it('can be access', () => {
      assert.exists(VideoPriorityBasedPolicyConfig.Default);
      assert.exists(VideoPriorityBasedPolicyConfig.UnstableNetworkPreset);
      assert.exists(VideoPriorityBasedPolicyConfig.StableNetworkPreset);
    });
  });

  describe('allowSubscribe', () => {
    it('not allowed subscribe when bandwidth decreases within response delay', () => {
      const videoPriorityBasedPolicyConfig = new VideoPriorityBasedPolicyConfig();

      incrementTime(2100);
      expect(videoPriorityBasedPolicyConfig.allowSubscribe(1, 1000)).to.be.true;
      incrementTime(1000);
      expect(videoPriorityBasedPolicyConfig.allowSubscribe(1, 300)).to.be.false;
      incrementTime(1000);
      expect(videoPriorityBasedPolicyConfig.allowSubscribe(1, 300)).to.be.false;
    });

    it('allowed subscribe when bandwidth decreases within response delay', () => {
      const videoPriorityBasedPolicyConfig = new VideoPriorityBasedPolicyConfig();

      incrementTime(2100);
      expect(videoPriorityBasedPolicyConfig.allowSubscribe(1, 1000)).to.be.true;
      incrementTime(1000);
      expect(videoPriorityBasedPolicyConfig.allowSubscribe(1, 300)).to.be.false;
      incrementTime(2100);
      expect(videoPriorityBasedPolicyConfig.allowSubscribe(1, 300)).to.be.true;
      incrementTime(2100);
      expect(videoPriorityBasedPolicyConfig.allowSubscribe(1, 300)).to.be.false;
    });
  });
});
