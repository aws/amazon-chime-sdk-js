// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import ConnectionHealthData from '../../src/connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../../src/connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import ReconnectionHealthPolicy from '../../src/connectionhealthpolicy/ReconnectionHealthPolicy';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';

describe('ReconnectionHealthPolicy', () => {
  let expect: Chai.ExpectStatic;
  let reconnectionHealthPolicy: ReconnectionHealthPolicy;
  let configuration: ConnectionHealthPolicyConfiguration;
  let data: ConnectionHealthData;
  const logger = new NoOpDebugLogger();

  beforeEach(() => {
    expect = chai.expect;
    configuration = new ConnectionHealthPolicyConfiguration();
    data = new ConnectionHealthData();
    configuration.connectionWaitTimeMs = 0;
    data.connectionStartTimestampMs = 0;
    data.consecutiveStatsWithNoPackets = 0;
    configuration.connectionUnhealthyThreshold = Infinity;
    configuration.noSignalThresholdTimeMs = 0;
    data.lastNoSignalTimestampMs = 0;
    data.consecutiveMissedPongs = 0;
  });
  it('can be constructed', () => {
    reconnectionHealthPolicy = new ReconnectionHealthPolicy(logger, configuration, data);
    expect(reconnectionHealthPolicy).to.not.equal(null);
  });
  it('can simulate no reconnect needed', () => {
    reconnectionHealthPolicy = new ReconnectionHealthPolicy(logger, configuration, data);
    const health = reconnectionHealthPolicy.health();
    expect(health).to.equal(1);
  });
  it('can simulate no reconnect needed due to recent connection start', () => {
    configuration.connectionWaitTimeMs = Infinity;
    reconnectionHealthPolicy = new ReconnectionHealthPolicy(logger, configuration, data);
    const health = reconnectionHealthPolicy.health();
    expect(health).to.equal(1);
  });
  it('can simulate reconnect needed due to recent no packets', () => {
    configuration.connectionUnhealthyThreshold = 0;
    data.consecutiveStatsWithNoPackets = Infinity;
    reconnectionHealthPolicy = new ReconnectionHealthPolicy(logger, configuration, data);
    const health = reconnectionHealthPolicy.health();
    expect(health).to.equal(0);
  });
  it('can simulate reconnect needed due to recently missed pongs', () => {
    data.consecutiveMissedPongs = Infinity;
    reconnectionHealthPolicy = new ReconnectionHealthPolicy(logger, configuration, data);
    const health = reconnectionHealthPolicy.health();
    expect(health).to.equal(0);
  });
  it('can simulate bad audio delay', () => {
    data.audioSpeakerDelayMs = configuration.maximumAudioDelayMs + 1;
    reconnectionHealthPolicy = new ReconnectionHealthPolicy(logger, configuration, data);
    for (let i = 0; i < configuration.maximumAudioDelayDataPoints; i++) {
      const health = reconnectionHealthPolicy.health();
      expect(health).to.equal(1);
    }
    const health = reconnectionHealthPolicy.health();
    expect(health).to.equal(0);
  });
});
