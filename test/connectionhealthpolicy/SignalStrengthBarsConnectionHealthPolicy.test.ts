// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import ConnectionHealthData from '../../src/connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../../src/connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import SignalStrengthBarsConnectionHealthPolicy from '../../src/connectionhealthpolicy/SignalStrengthBarsConnectionHealthPolicy';

describe('SignalStrengthBarsConnectionHealthPolicy', () => {
  let expect: Chai.ExpectStatic;
  let signalStrengthBarsConnectionHealthPolicy: SignalStrengthBarsConnectionHealthPolicy;
  let configuration: ConnectionHealthPolicyConfiguration;
  let data: ConnectionHealthData;

  beforeEach(() => {
    expect = chai.expect;
    configuration = new ConnectionHealthPolicyConfiguration();
    data = new ConnectionHealthData();
    data.consecutiveStatsWithNoPackets = 0;
    configuration.connectionUnhealthyThreshold = Infinity;
    configuration.zeroBarsNoSignalTimeMs = 0;
    data.lastNoSignalTimestampMs = 0;
    data.consecutiveMissedPongs = 0;
    configuration.missedPongsUpperThreshold = Infinity;
    configuration.missedPongsLowerThreshold = Infinity;
    configuration.oneBarWeakSignalTimeMs = 0;
    data.lastWeakSignalTimestampMs = 0;
    configuration.twoBarsTimeMs = 0;
    configuration.threeBarsTimeMs = 0;
    configuration.fourBarsTimeMs = 0;
    configuration.fiveBarsTimeMs = 0;
    data.lastPacketLossInboundTimestampMs = 0;
  });
  it('can be constructed', () => {
    signalStrengthBarsConnectionHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      configuration,
      data
    );
    expect(signalStrengthBarsConnectionHealthPolicy).to.not.equal(null);
  });
  it('can return the maximum', () => {
    let max = signalStrengthBarsConnectionHealthPolicy.maximumHealth();
    expect(max).to.equal(5);
  });
  it('can simulate zero bars due to too many consecutive stats with no packets', () => {
    data.consecutiveStatsWithNoPackets = Infinity;
    configuration.connectionUnhealthyThreshold = 0;
    signalStrengthBarsConnectionHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      configuration,
      data
    );
    let bars = signalStrengthBarsConnectionHealthPolicy.health();
    expect(bars).to.equal(0);
  });
  it('can simulate zero bars due to no signal recent', () => {
    configuration.zeroBarsNoSignalTimeMs = Infinity;
    signalStrengthBarsConnectionHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      configuration,
      data
    );
    let bars = signalStrengthBarsConnectionHealthPolicy.health();
    expect(bars).to.equal(0);
  });
  it('can simulate zero bars due to too many consecutive missed pongs', () => {
    data.consecutiveMissedPongs = Infinity;
    configuration.missedPongsUpperThreshold = 0;
    signalStrengthBarsConnectionHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      configuration,
      data
    );
    let bars = signalStrengthBarsConnectionHealthPolicy.health();
    expect(bars).to.equal(0);
  });
  it('can simulate one bar due to weak signal recent', () => {
    configuration.oneBarWeakSignalTimeMs = Infinity;
    signalStrengthBarsConnectionHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      configuration,
      data
    );
    let bars = signalStrengthBarsConnectionHealthPolicy.health();
    expect(bars).to.equal(1);
  });
  it('can simulate one bar due to last packet loss recent', () => {
    configuration.twoBarsTimeMs = Infinity;
    signalStrengthBarsConnectionHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      configuration,
      data
    );
    let bars = signalStrengthBarsConnectionHealthPolicy.health();
    expect(bars).to.equal(1);
  });
  it('can simulate one bar due to too many consecutive missed pongs but not enough for zero bars', () => {
    configuration.missedPongsLowerThreshold = 1;
    data.consecutiveMissedPongs = 2;
    configuration.missedPongsUpperThreshold = 3;
    signalStrengthBarsConnectionHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      configuration,
      data
    );
    let bars = signalStrengthBarsConnectionHealthPolicy.health();
    expect(bars).to.equal(1);
  });
  it('can simulate two bars due to last packet loss recent', () => {
    configuration.threeBarsTimeMs = Infinity;
    signalStrengthBarsConnectionHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      configuration,
      data
    );
    let bars = signalStrengthBarsConnectionHealthPolicy.health();
    expect(bars).to.equal(2);
  });
  it('can simulate three bar due to last packet loss recent', () => {
    configuration.fourBarsTimeMs = Infinity;
    signalStrengthBarsConnectionHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      configuration,
      data
    );
    let bars = signalStrengthBarsConnectionHealthPolicy.health();
    expect(bars).to.equal(3);
  });
  it('can simulate four bar due to last packet loss recent', () => {
    configuration.fiveBarsTimeMs = Infinity;
    signalStrengthBarsConnectionHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      configuration,
      data
    );
    let bars = signalStrengthBarsConnectionHealthPolicy.health();
    expect(bars).to.equal(4);
  });
  it('can simulate five bars', () => {
    signalStrengthBarsConnectionHealthPolicy = new SignalStrengthBarsConnectionHealthPolicy(
      configuration,
      data
    );
    let bars = signalStrengthBarsConnectionHealthPolicy.health();
    expect(bars).to.equal(5);
  });
});
