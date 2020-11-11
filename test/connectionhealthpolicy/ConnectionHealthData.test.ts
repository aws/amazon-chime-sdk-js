// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import ConnectionHealthData from '../../src/connectionhealthpolicy/ConnectionHealthData';

describe('ConnectionHealthData', () => {
  let expect: Chai.ExpectStatic;
  let connectionHealthData: ConnectionHealthData;

  beforeEach(() => {
    expect = chai.expect;
    connectionHealthData = new ConnectionHealthData();
    connectionHealthData.consecutiveMissedPongs = 0;
    connectionHealthData.consecutiveStatsWithNoPackets = 0;
    connectionHealthData.lastPacketLossInboundTimestampMs = 0;
    connectionHealthData.lastNoSignalTimestampMs = 0;
    connectionHealthData.lastWeakSignalTimestampMs = 0;
    connectionHealthData.lastGoodSignalTimestampMs = 0;
  });
  it('can be constructed', () => {
    connectionHealthData = new ConnectionHealthData();
    expect(connectionHealthData).to.not.equal(null);
  });
  it('returns connection is recent', () => {
    connectionHealthData = new ConnectionHealthData();
    const isConnectionStartRecent = connectionHealthData.isConnectionStartRecent(Infinity);
    expect(isConnectionStartRecent).to.equal(true);
  });
  it('returns connection is not recent', () => {
    connectionHealthData = new ConnectionHealthData();
    const isConnectionStartRecent = connectionHealthData.isConnectionStartRecent(0);
    expect(isConnectionStartRecent).to.equal(false);
  });
  it('returns packet loss is recent', () => {
    connectionHealthData = new ConnectionHealthData();
    const isLastPacketLossRecent = connectionHealthData.isLastPacketLossRecent(Infinity);
    expect(isLastPacketLossRecent).to.equal(true);
  });
  it('returns packet loss is not recent', () => {
    connectionHealthData = new ConnectionHealthData();
    const isLastPacketLossRecent = connectionHealthData.isLastPacketLossRecent(0);
    expect(isLastPacketLossRecent).to.equal(false);
  });
  it('returns good signal is recent', () => {
    connectionHealthData = new ConnectionHealthData();
    const isGoodSignalRecent = connectionHealthData.isGoodSignalRecent(Infinity);
    expect(isGoodSignalRecent).to.equal(true);
  });
  it('returns good signal is not recent', () => {
    connectionHealthData = new ConnectionHealthData();
    const isGoodSignalRecent = connectionHealthData.isGoodSignalRecent(0);
    expect(isGoodSignalRecent).to.equal(false);
  });
  it('returns weak signal is recent', () => {
    connectionHealthData = new ConnectionHealthData();
    const isWeakSignalRecent = connectionHealthData.isWeakSignalRecent(Infinity);
    expect(isWeakSignalRecent).to.equal(true);
  });
  it('returns weak signal is not recent', () => {
    connectionHealthData = new ConnectionHealthData();
    const isWeakSignalRecent = connectionHealthData.isWeakSignalRecent(0);
    expect(isWeakSignalRecent).to.equal(false);
  });
  it('returns no signal is recent', () => {
    connectionHealthData = new ConnectionHealthData();
    const isNoSignalRecent = connectionHealthData.isNoSignalRecent(Infinity);
    expect(isNoSignalRecent).to.equal(true);
  });
  it('returns no signal is not recent', () => {
    connectionHealthData = new ConnectionHealthData();
    const isNoSignalRecent = connectionHealthData.isNoSignalRecent(0);
    expect(isNoSignalRecent).to.equal(false);
  });
  it('can be cloned', () => {
    connectionHealthData = new ConnectionHealthData();
    const clonedConnectionHealthData = connectionHealthData.clone();
    expect(clonedConnectionHealthData).to.deep.equal(connectionHealthData);
  });
  it('can set consecutive missed pongs', () => {
    connectionHealthData = new ConnectionHealthData();
    connectionHealthData.setConsecutiveMissedPongs(1);
    expect(connectionHealthData.consecutiveMissedPongs).to.equal(1);
  });
  it('can set consecutive stats with no packets', () => {
    connectionHealthData = new ConnectionHealthData();
    connectionHealthData.setConsecutiveStatsWithNoPackets(1);
    expect(connectionHealthData.consecutiveStatsWithNoPackets).to.equal(1);
  });
  it('can set last packet loss inbound timestamp', () => {
    connectionHealthData = new ConnectionHealthData();
    connectionHealthData.setLastPacketLossInboundTimestampMs(1);
    expect(connectionHealthData.lastPacketLossInboundTimestampMs).to.equal(1);
  });
  it('can set last no signal timestamp', () => {
    connectionHealthData = new ConnectionHealthData();
    connectionHealthData.setLastNoSignalTimestampMs(1);
    expect(connectionHealthData.lastNoSignalTimestampMs).to.equal(1);
  });
  it('can set last weak signal timestamp', () => {
    connectionHealthData = new ConnectionHealthData();
    connectionHealthData.setLastWeakSignalTimestampMs(1);
    expect(connectionHealthData.lastWeakSignalTimestampMs).to.equal(1);
  });
  it('can set last good signal timestamp', () => {
    connectionHealthData = new ConnectionHealthData();
    connectionHealthData.setLastGoodSignalTimestampMs(1);
    expect(connectionHealthData.lastGoodSignalTimestampMs).to.equal(1);
  });
});
