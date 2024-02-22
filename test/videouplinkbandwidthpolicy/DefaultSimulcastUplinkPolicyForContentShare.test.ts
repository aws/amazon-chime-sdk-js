// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import SimulcastLayers from '../../src/simulcastlayers/SimulcastLayers';
import DefaultSimulcastUplinkPolicyForContentShare from '../../src/videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicyForContentShare';
import SimulcastUplinkObserver from '../../src/videouplinkbandwidthpolicy/SimulcastUplinkObserver';

describe('DefaultSimulcastUplinkPolicyForContentShare', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  let policy: DefaultSimulcastUplinkPolicyForContentShare;

  function isEncodingParamsEqual(
    encoding1: RTCRtpEncodingParameters,
    encoding2: RTCRtpEncodingParameters
  ): boolean {
    if (encoding1.rid !== encoding2.rid) {
      return false;
    }
    if (encoding1.active !== encoding2.active) {
      return false;
    }
    if (encoding1.maxBitrate !== encoding2.maxBitrate) {
      return false;
    }
    if (encoding1.scaleResolutionDownBy !== encoding2.scaleResolutionDownBy) {
      return false;
    }
    if (encoding1.maxFramerate !== encoding2.maxFramerate) {
      return false;
    }
    return true;
  }

  beforeEach(() => {
    policy = new DefaultSimulcastUplinkPolicyForContentShare(logger);
  });

  describe('constructor', () => {
    it('can be constructed', () => {
      assert.exists(policy);
    });

    it('can be constructed with optional encoding params', () => {
      const policy = new DefaultSimulcastUplinkPolicyForContentShare(logger, {
        low: {
          maxBitrateKbps: 100,
          scaleResolutionDownBy: 4,
          maxFramerate: 3,
        },
        high: {
          maxBitrateKbps: 1400,
          scaleResolutionDownBy: 1,
          maxFramerate: 30,
        },
      });
      assert.exists(policy);
    });
  });

  describe('chooseEncodingParameters', () => {
    it('default encoding parameters', () => {
      const result = policy.chooseEncodingParameters();
      expect(
        isEncodingParamsEqual(result.get('low'), {
          rid: 'low',
          active: true,
          maxBitrate: 300 * 1000,
          scaleResolutionDownBy: 2,
          maxFramerate: 5,
        })
      ).to.be.true;
      expect(
        isEncodingParamsEqual(result.get('hi'), {
          rid: 'hi',
          active: true,
          maxBitrate: 1200 * 1000,
          scaleResolutionDownBy: 1,
          maxFramerate: undefined,
        })
      ).to.be.true;
    });

    it('overridden encoding parameters', () => {
      const policy = new DefaultSimulcastUplinkPolicyForContentShare(logger, {
        low: {
          maxBitrateKbps: 100,
          scaleResolutionDownBy: 4,
          maxFramerate: 3,
        },
        high: {
          maxBitrateKbps: 1000,
          scaleResolutionDownBy: 2,
          maxFramerate: 10,
        },
      });
      const result = policy.chooseEncodingParameters();
      expect(
        isEncodingParamsEqual(result.get('low'), {
          rid: 'low',
          active: true,
          maxBitrate: 100 * 1000,
          scaleResolutionDownBy: 4,
          maxFramerate: 3,
        })
      ).to.be.true;
      expect(
        isEncodingParamsEqual(result.get('hi'), {
          rid: 'hi',
          active: true,
          maxBitrate: 1000 * 1000,
          scaleResolutionDownBy: 2,
          maxFramerate: 10,
        })
      ).to.be.true;
    });
  });

  describe('Noop', () => {
    it('updateConnectionMetric', () => {
      policy.updateConnectionMetric({ uplinkKbps: 1000 });
    });

    it('chooseMediaTrackConstraints', () => {
      expect(policy.chooseMediaTrackConstraints()).to.be.undefined;
    });

    it('chooseCaptureAndEncodeParameters', () => {
      expect(policy.chooseCaptureAndEncodeParameters()).to.be.undefined;
    });

    it('maxBandwidthKbps', () => {
      expect(policy.maxBandwidthKbps()).to.equal(1200);
    });

    it('setIdealMaxBandwidthKbps', () => {
      policy.setIdealMaxBandwidthKbps(2000);
    });

    it('setHasBandwidthPriority', () => {
      policy.setHasBandwidthPriority(false);
    });

    it('wantsResubscribe', () => {
      expect(policy.wantsResubscribe()).to.be.false;
    });

    it('updateIndex', () => {
      policy.updateIndex(undefined);
    });

    it('observer', () => {
      const observer = {
        encodingSimulcastLayersDidChange(_simulcastLayers: SimulcastLayers): void {},
      };
      policy.addObserver(observer);
      policy.forEachObserver((_observer: SimulcastUplinkObserver) => {});
      policy.removeObserver(observer);
    });
  });

  describe('set high resolution feature', () => {
    it('can be set high resolution feature', () => {
      policy = new DefaultSimulcastUplinkPolicyForContentShare(logger);
      policy.setHighResolutionFeatureEnabled(true);
      // @ts-ignore
      expect(policy.defaultHiTargetBitrateKbps).to.equal(2000);
      // @ts-ignore
      expect(policy.defaultLowTargetBitrateKbps).to.equal(500);
      expect(policy.maxBandwidthKbps()).to.equal(2000);
      policy.setHighResolutionFeatureEnabled(false);
      // @ts-ignore
      expect(policy.defaultHiTargetBitrateKbps).to.equal(1200);
      // @ts-ignore
      expect(policy.defaultLowTargetBitrateKbps).to.equal(300);
      expect(policy.maxBandwidthKbps()).to.equal(1200);
    });
  });
});
