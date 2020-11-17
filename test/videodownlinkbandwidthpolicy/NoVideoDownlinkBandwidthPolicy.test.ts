// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultClientMetricReport from '../../src/clientmetricreport/DefaultClientMetricReport';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import NoVideoDownlinkBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/NoVideoDownlinkBandwidthPolicy';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';

describe('NoVideoDownlinkBandwidthPolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  let policy: NoVideoDownlinkBandwidthPolicy;
  let emptyVideoStreamIndex: DefaultVideoStreamIndex;

  before(() => {
    policy = new NoVideoDownlinkBandwidthPolicy();
    emptyVideoStreamIndex = new DefaultVideoStreamIndex(logger);
  });

  describe('reset', () => {
    it('resets', () => {
      policy.reset();
    });
  });

  describe('wantsResubscribe', () => {
    it('always returns false', () => {
      expect(policy.wantsResubscribe()).to.be.false;
      policy.updateIndex(emptyVideoStreamIndex);
      expect(policy.wantsResubscribe()).to.be.false;
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 500;
      policy.updateMetrics(metricReport);
      expect(policy.wantsResubscribe()).to.be.false;
    });
  });

  describe('chooseSubscriptions', () => {
    it('returns empty set', () => {
      expect(policy.wantsResubscribe()).to.be.false;
      policy.updateIndex(emptyVideoStreamIndex);
      const idSet = policy.chooseSubscriptions();
      expect(idSet.array()).to.be.deep.equal([]);
    });
  });
});
