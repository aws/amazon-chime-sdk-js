// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import ConnectionHealthData from '../../src/connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../../src/connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import UnusableAudioWarningConnectionHealthPolicy from '../../src/connectionhealthpolicy/UnusableAudioWarningConnectionHealthPolicy';

describe('UnusableAudioWarningConnectionHealthPolicy', () => {
  let expect: Chai.ExpectStatic;
  let unusableAudioWarningConnectionHealthPolicy: UnusableAudioWarningConnectionHealthPolicy;
  let configuration: ConnectionHealthPolicyConfiguration;
  let data: ConnectionHealthData;

  beforeEach(() => {
    expect = chai.expect;
    configuration = new ConnectionHealthPolicyConfiguration();
    data = new ConnectionHealthData();
    data.packetsReceivedInLastMinute = [50, 50, 50];
    configuration.pastSamplesToConsider = 3;
    configuration.packetsExpected = 50;
    configuration.cooldownTimeMs = 0;
    configuration.fractionalLoss = Infinity;
    configuration.goodSignalTimeMs = Infinity;
    data.lastGoodSignalTimestampMs = 0;
    configuration.initialHealth = 0;
    configuration.maximumTimesToWarn = Infinity;
  });
  it('can be constructed', () => {
    unusableAudioWarningConnectionHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      configuration,
      data
    );
    expect(unusableAudioWarningConnectionHealthPolicy).to.not.equal(null);
  });
  it('can return zero fractional loss', () => {
    unusableAudioWarningConnectionHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      configuration,
      data
    );
    const loss = unusableAudioWarningConnectionHealthPolicy.calculateFractionalLoss();
    expect(loss).to.equal(0);
  });
  it('can return zero fractional loss due to insufficient number of samples', () => {
    configuration.pastSamplesToConsider = Infinity;
    data.packetsReceivedInLastMinute = [20, 17, 33];
    unusableAudioWarningConnectionHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      configuration,
      data
    );
    const loss = unusableAudioWarningConnectionHealthPolicy.calculateFractionalLoss();
    expect(loss).to.equal(0);
  });
  it('can return zero packet loss due to packets received being greater than packets expected', () => {
    configuration.packetsExpected = 0;
    unusableAudioWarningConnectionHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      configuration,
      data
    );
    const loss = unusableAudioWarningConnectionHealthPolicy.calculateFractionalLoss();
    expect(loss).to.equal(0);
  });
  it('can return 1 due to complete packet loss', () => {
    data.packetsReceivedInLastMinute = [0, 0, 0];
    unusableAudioWarningConnectionHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      configuration,
      data
    );
    const loss = unusableAudioWarningConnectionHealthPolicy.calculateFractionalLoss();
    expect(loss).to.equal(1);
  });
  it('can return some packet loss', () => {
    data.packetsReceivedInLastMinute = [20, 17, 38];
    unusableAudioWarningConnectionHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      configuration,
      data
    );
    const loss = unusableAudioWarningConnectionHealthPolicy.calculateFractionalLoss();
    expect(loss).to.equal(0.5);
  });
  it('can simulate no warning needed', () => {
    unusableAudioWarningConnectionHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      configuration,
      data
    );
    const health = unusableAudioWarningConnectionHealthPolicy.health();
    expect(health).to.equal(1);
  });
  it('can simulate no warning needed due to being warned recently', () => {
    configuration.cooldownTimeMs = Infinity;
    configuration.goodSignalTimeMs = 0;
    configuration.initialHealth = 1;
    unusableAudioWarningConnectionHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      configuration,
      data
    );
    const health = unusableAudioWarningConnectionHealthPolicy.health();
    expect(health).to.equal(1);
  });
  it('can simulate no warning needed due to excessive previous warnings', () => {
    configuration.fractionalLoss = 0;
    data.packetsReceivedInLastMinute = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    configuration.maximumTimesToWarn = 0;
    configuration.initialHealth = 1;
    unusableAudioWarningConnectionHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      configuration,
      data
    );
    const health = unusableAudioWarningConnectionHealthPolicy.health();
    expect(health).to.equal(1);
  });
  it('can simulate warning needed due to recent high packet loss', () => {
    configuration.fractionalLoss = 0;
    data.packetsReceivedInLastMinute = [0, 0, 0];
    unusableAudioWarningConnectionHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy(
      configuration,
      data
    );
    const health = unusableAudioWarningConnectionHealthPolicy.health();
    expect(health).to.equal(0);
  });
});
