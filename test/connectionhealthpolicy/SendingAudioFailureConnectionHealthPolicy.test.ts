// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import ConnectionHealthData from '../../src/connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../../src/connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import SendingAudioFailureConnectionHealthPolicy from '../../src/connectionhealthpolicy/SendingAudioFailureConnectionHealthPolicy';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';

describe('SendingAudioFailureConnectionHealthPolicy', () => {
  let expect: Chai.ExpectStatic;
  let sendingAudioFailureHealthPolicy: SendingAudioFailureConnectionHealthPolicy;
  let configuration: ConnectionHealthPolicyConfiguration;
  let data: ConnectionHealthData;
  const sandbox: sinon.SinonSandbox = sinon.createSandbox();
  let clock: sinon.SinonFakeTimers;
  const logger = new NoOpLogger(LogLevel.DEBUG);

  beforeEach(() => {
    expect = chai.expect;
    clock = sandbox.useFakeTimers();
    configuration = new ConnectionHealthPolicyConfiguration();
    data = new ConnectionHealthData();
    configuration.cooldownTimeMs = 50;
    configuration.sendingAudioFailureSamplesToConsider = 2;
    configuration.sendingAudioFailureInitialWaitTimeMs = 3000;
    sendingAudioFailureHealthPolicy = new SendingAudioFailureConnectionHealthPolicy(
      logger,
      configuration,
      data
    );
  });

  afterEach(() => {
    clock.restore();
  });

  it('can return maximum health when connection start is recent and audio packets are not being sent', () => {
    data.setConsecutiveStatsWithNoAudioPacketsSent(
      configuration.sendingAudioFailureSamplesToConsider
    );
    data.setConnectionStartTime();
    clock.tick(10);
    sendingAudioFailureHealthPolicy.update(data);
    expect(sendingAudioFailureHealthPolicy.health()).to.equal(
      sendingAudioFailureHealthPolicy.maximumHealth()
    );
  });

  it('can return minimum health when connection start is not recent and audio packets are not being sent', () => {
    data.setConsecutiveStatsWithNoAudioPacketsSent(
      configuration.sendingAudioFailureSamplesToConsider
    );
    data.setConnectionStartTime();
    clock.tick(configuration.sendingAudioFailureInitialWaitTimeMs);
    sendingAudioFailureHealthPolicy.update(data);
    expect(sendingAudioFailureHealthPolicy.health()).to.equal(
      sendingAudioFailureHealthPolicy.minimumHealth()
    );
  });

  it('can return maximum health when connection start is not recent and audio packets are being sent', () => {
    data.setConnectionStartTime();
    data.setConsecutiveStatsWithNoAudioPacketsSent(0);
    clock.tick(configuration.sendingAudioFailureInitialWaitTimeMs);
    sendingAudioFailureHealthPolicy.update(data);
    expect(sendingAudioFailureHealthPolicy.health()).to.equal(
      sendingAudioFailureHealthPolicy.maximumHealth()
    );
  });

  it(`can return maximum health when sendingAudioFailureSamplesToConsider is zero and audio packets are being sent`, () => {
    configuration.sendingAudioFailureSamplesToConsider = 0;
    sendingAudioFailureHealthPolicy = new SendingAudioFailureConnectionHealthPolicy(
      logger,
      configuration,
      data
    );
    data.setConnectionStartTime();
    data.setConsecutiveStatsWithNoAudioPacketsSent(0);
    clock.tick(configuration.sendingAudioFailureInitialWaitTimeMs);
    sendingAudioFailureHealthPolicy.update(data);
    expect(sendingAudioFailureHealthPolicy.health()).to.equal(
      sendingAudioFailureHealthPolicy.maximumHealth()
    );
  });

  it('can simulate warning not raised due to recent warning and raised after cool down time elapses', () => {
    data.setConnectionStartTime();
    data.setConsecutiveStatsWithNoAudioPacketsSent(
      configuration.sendingAudioFailureSamplesToConsider
    ); //First unhealthy
    clock.tick(configuration.sendingAudioFailureInitialWaitTimeMs);
    sendingAudioFailureHealthPolicy.update(data);
    expect(sendingAudioFailureHealthPolicy.health()).to.equal(
      sendingAudioFailureHealthPolicy.minimumHealth()
    );

    data.setConsecutiveStatsWithNoAudioPacketsSent(0); //Immediately recovers to healthy
    sendingAudioFailureHealthPolicy.update(data);
    expect(sendingAudioFailureHealthPolicy.health()).to.equal(
      sendingAudioFailureHealthPolicy.maximumHealth()
    );

    data.setConsecutiveStatsWithNoAudioPacketsSent(
      configuration.sendingAudioFailureSamplesToConsider
    ); //Again unhealthy immediately but warned recently so reports healthy
    sendingAudioFailureHealthPolicy.update(data);
    expect(sendingAudioFailureHealthPolicy.health()).to.equal(
      sendingAudioFailureHealthPolicy.maximumHealth()
    );

    clock.tick(50); //coolDownTimeMs elapses, can surface warning
    sendingAudioFailureHealthPolicy.update(data);
    expect(sendingAudioFailureHealthPolicy.health()).to.equal(
      sendingAudioFailureHealthPolicy.minimumHealth()
    );
  });

  it('can simulate warning suppressed due to maximum warn count being breached', () => {
    data.setConnectionStartTime();
    clock.tick(configuration.sendingAudioFailureInitialWaitTimeMs);

    for (let i = 0; i < configuration.maximumTimesToWarn; i++) {
      data.setConsecutiveStatsWithNoAudioPacketsSent(
        configuration.sendingAudioFailureSamplesToConsider
      );
      sendingAudioFailureHealthPolicy.update(data);
      sendingAudioFailureHealthPolicy.health(); //Unhealthy

      data.setConsecutiveStatsWithNoAudioPacketsSent(0);
      sendingAudioFailureHealthPolicy.update(data);
      sendingAudioFailureHealthPolicy.health(); //Immediately recovers to healthy
      clock.tick(50); //coolDownTimeMs
    }

    data.setConsecutiveStatsWithNoAudioPacketsSent(
      configuration.sendingAudioFailureSamplesToConsider
    );
    sendingAudioFailureHealthPolicy.update(data);
    expect(sendingAudioFailureHealthPolicy.health()).to.equal(
      sendingAudioFailureHealthPolicy.maximumHealth()
    );
  });
});
