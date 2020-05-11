// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import BaseConnectionHealthPolicy from '../../src/connectionhealthpolicy/BaseConnectionHealthPolicy';
import ConnectionHealthData from '../../src/connectionhealthpolicy/ConnectionHealthData';
import ConnectionHealthPolicyConfiguration from '../../src/connectionhealthpolicy/ConnectionHealthPolicyConfiguration';

describe('BaseConnectionHealthPolicy', () => {
  let expect: Chai.ExpectStatic;
  let baseConnectionHealthPolicy: BaseConnectionHealthPolicy;
  let configuration: ConnectionHealthPolicyConfiguration;
  let data: ConnectionHealthData;

  beforeEach(() => {
    expect = chai.expect;
    configuration = new ConnectionHealthPolicyConfiguration();
    configuration.minHealth = 0;
    configuration.maxHealth = 1;
    configuration.initialHealth = 0;
    data = new ConnectionHealthData();
    baseConnectionHealthPolicy = new BaseConnectionHealthPolicy(configuration, data);
  });
  it('can be constructed', () => {
    let baseConnectionHealthPolicy = new BaseConnectionHealthPolicy(configuration, data);
    expect(baseConnectionHealthPolicy).to.not.equal(null);
  });
  it('can get minimumHealth', () => {
    let min = baseConnectionHealthPolicy.minimumHealth();
    expect(min).to.equal(configuration.minHealth);
  });
  it('can get maximumHealth', () => {
    let max = baseConnectionHealthPolicy.maximumHealth();
    expect(max).to.equal(configuration.maxHealth);
  });
  it('can get health', () => {
    let val = baseConnectionHealthPolicy.health();
    expect(val).to.equal(configuration.maxHealth);
  });
  it('can update and get its connection health data', () => {
    let testConnectionHealthData = new ConnectionHealthData();
    baseConnectionHealthPolicy.update(testConnectionHealthData);
    let healthData = baseConnectionHealthPolicy.getConnectionHealthData();
    expect(healthData).to.deep.equal(testConnectionHealthData);
  });
  it('can return healthy', () => {
    baseConnectionHealthPolicy = new BaseConnectionHealthPolicy(configuration, data);
    let healthy = baseConnectionHealthPolicy.healthy();
    expect(healthy).to.equal(true);
  });
  it('can return unhealthy', () => {
    configuration.minHealth = 0.1;
    configuration.maxHealth = 0;
    baseConnectionHealthPolicy = new BaseConnectionHealthPolicy(configuration, data);
    let healthy = baseConnectionHealthPolicy.healthy();
    expect(healthy).to.equal(false);
  });
  it('can return health when it has changed since last call', () => {
    baseConnectionHealthPolicy = new BaseConnectionHealthPolicy(configuration, data);
    let value = baseConnectionHealthPolicy.healthIfChanged();
    expect(value).to.not.equal(0);
  });
  it('can return null when health has not changed', () => {
    baseConnectionHealthPolicy = new BaseConnectionHealthPolicy(configuration, data);
    baseConnectionHealthPolicy.healthIfChanged();
    let value = baseConnectionHealthPolicy.healthIfChanged();
    expect(value).to.equal(null);
  });
});
