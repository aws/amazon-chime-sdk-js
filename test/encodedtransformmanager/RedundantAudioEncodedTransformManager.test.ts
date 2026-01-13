// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import RedundantAudioEncodedTransformManager from '../../src/encodedtransformmanager/RedundantAudioEncodedTransformManager';
import {
  COMMON_MESSAGE_TYPES,
  TRANSFORM_NAMES,
} from '../../src/encodedtransformworker/EncodedTransform';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import RedundantAudioRecoveryMetricsObserver from '../../src/redundantaudiorecoverymetricsobserver/RedundantAudioRecoveryMetricsObserver';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('RedundantAudioEncodedTransformManager', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let domMockBuilder: DOMMockBuilder | null = null;
  let mockWorker: Worker;
  let manager: RedundantAudioEncodedTransformManager;

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(new DOMMockBehavior());
    // @ts-ignore
    mockWorker = new Worker('test-url');
    manager = new RedundantAudioEncodedTransformManager(mockWorker, logger);
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createMockClientMetricReport(
    currentTimestampMs: number,
    audioStats: Array<{
      type: string;
      kind: string;
      packetsSent?: number;
      packetsLost?: number;
      timestamp?: number;
    }>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    return {
      currentTimestampMs,
      getRTCStatsReport: () => {
        const map = new Map();
        audioStats.forEach((stat, index) => map.set(`stat-${index}`, stat));
        return map;
      },
    };
  }

  describe('transformNames', () => {
    it('returns REDUNDANT_AUDIO transform name', () => {
      const names = manager.transformNames();
      expect(names).to.include(TRANSFORM_NAMES.REDUNDANT_AUDIO);
      expect(names.length).to.equal(1);
    });
  });

  describe('handleWorkerMessage', () => {
    it('ignores non-METRICS message type', () => {
      manager.handleWorkerMessage({
        type: 'SomeOtherType',
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: { data: 'test' },
      });
    });

    it('parses metrics and notifies observers', () => {
      const observer: RedundantAudioRecoveryMetricsObserver = {
        recoveryMetricsDidReceive: sinon.stub(),
      };
      manager.addObserver(observer);

      const metricsData = {
        totalAudioPacketsLost: 10,
        totalAudioPacketsExpected: 100,
        totalAudioPacketsRecoveredRed: 5,
        totalAudioPacketsRecoveredFec: 3,
      };
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: { metrics: JSON.stringify(metricsData), ssrc: '12345' },
      });

      const stub = observer.recoveryMetricsDidReceive as sinon.SinonStub;
      expect(stub.calledOnce).to.be.true;
      const report = stub.firstCall.args[0];
      expect(report.ssrc).to.equal(12345);
      expect(report.totalAudioPacketsLost).to.equal(10);
      expect(report.totalAudioPacketsExpected).to.equal(100);
      expect(report.totalAudioPacketsRecoveredRed).to.equal(5);
      expect(report.totalAudioPacketsRecoveredFec).to.equal(3);
    });

    it('handles JSON parse errors gracefully', () => {
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: { metrics: 'invalid json', ssrc: '12345' },
      });
    });

    it('does not notify when no observers', () => {
      const metricsData = {
        totalAudioPacketsLost: 10,
        totalAudioPacketsExpected: 100,
        totalAudioPacketsRecoveredRed: 5,
        totalAudioPacketsRecoveredFec: 3,
      };
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: { metrics: JSON.stringify(metricsData), ssrc: '12345' },
      });
    });
  });

  describe('setAudioPayloadTypes', () => {
    it('sends opus and red payload type messages to worker', () => {
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');
      const payloadTypes = new Map<string, number>([
        ['opus', 111],
        ['red', 63],
      ]);

      manager.setAudioPayloadTypes(payloadTypes);

      expect(postMessageSpy.calledTwice).to.be.true;
      expect(postMessageSpy.firstCall.args[0].message.payloadType).to.equal('111');
      expect(postMessageSpy.secondCall.args[0].message.payloadType).to.equal('63');
    });

    it('uses default values when payload types not found', () => {
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');

      manager.setAudioPayloadTypes(new Map<string, number>());

      expect(postMessageSpy.calledTwice).to.be.true;
      expect(postMessageSpy.firstCall.args[0].message.payloadType).to.equal('0');
      expect(postMessageSpy.secondCall.args[0].message.payloadType).to.equal('0');
    });
  });

  describe('updateNumRedundantEncodings', () => {
    it('updates to 2 encodings for high packet loss (>10%)', () => {
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');
      manager.updateNumRedundantEncodings(15);
      expect(postMessageSpy.calledOnce).to.be.true;
      expect(postMessageSpy.firstCall.args[0].message.numRedundantEncodings).to.equal('2');
    });

    it('updates to 1 encoding for medium packet loss (>5%, <=10%)', () => {
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');
      manager.updateNumRedundantEncodings(7);
      expect(postMessageSpy.calledOnce).to.be.true;
      expect(postMessageSpy.firstCall.args[0].message.numRedundantEncodings).to.equal('1');
    });

    it('updates to 0 encodings for low packet loss (<=5%)', () => {
      manager.updateNumRedundantEncodings(15);
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');
      manager.updateNumRedundantEncodings(3);
      expect(postMessageSpy.calledOnce).to.be.true;
      expect(postMessageSpy.firstCall.args[0].message.numRedundantEncodings).to.equal('0');
    });

    it('does not send message when encoding count unchanged', () => {
      manager.updateNumRedundantEncodings(15);
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');
      manager.updateNumRedundantEncodings(12);
      expect(postMessageSpy.called).to.be.false;
    });
  });

  describe('setRedundancyEnabled', () => {
    it('sends enable message when enabling', () => {
      manager.setRedundancyEnabled(false);
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');
      manager.setRedundancyEnabled(true);
      expect(postMessageSpy.calledOnce).to.be.true;
      expect(postMessageSpy.firstCall.args[0].type).to.equal('Enable');
    });

    it('sends disable message when disabling', () => {
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');
      manager.setRedundancyEnabled(false);
      expect(postMessageSpy.calledOnce).to.be.true;
      expect(postMessageSpy.firstCall.args[0].type).to.equal('Disable');
    });

    it('does not send message when state unchanged', () => {
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');
      manager.setRedundancyEnabled(true);
      expect(postMessageSpy.called).to.be.false;
    });
  });

  describe('getNumRedundantEncodingsForPacketLoss', () => {
    it('returns 0 encodings for packet loss <= 8%', () => {
      const [
        encodings,
        shouldTurnOff,
      ] = RedundantAudioEncodedTransformManager.getNumRedundantEncodingsForPacketLoss(5);
      expect(encodings).to.equal(0);
      expect(shouldTurnOff).to.be.false;
    });

    it('returns 1 encoding for packet loss > 8% and <= 18%', () => {
      const [
        encodings,
        shouldTurnOff,
      ] = RedundantAudioEncodedTransformManager.getNumRedundantEncodingsForPacketLoss(15);
      expect(encodings).to.equal(1);
      expect(shouldTurnOff).to.be.false;
    });

    it('returns 2 encodings for packet loss > 18% and <= 75%', () => {
      const [
        encodings,
        shouldTurnOff,
      ] = RedundantAudioEncodedTransformManager.getNumRedundantEncodingsForPacketLoss(50);
      expect(encodings).to.equal(2);
      expect(shouldTurnOff).to.be.false;
    });

    it('returns 0 encodings and shouldTurnOff for packet loss > 75%', () => {
      const [
        encodings,
        shouldTurnOff,
      ] = RedundantAudioEncodedTransformManager.getNumRedundantEncodingsForPacketLoss(80);
      expect(encodings).to.equal(0);
      expect(shouldTurnOff).to.be.true;
    });
  });

  describe('start', () => {
    it('is a no-op', async () => {
      await manager.start();
    });
  });

  describe('stop', () => {
    it('clears observers and history', async () => {
      const observer: RedundantAudioRecoveryMetricsObserver = {
        recoveryMetricsDidReceive: sinon.stub(),
      };
      manager.addObserver(observer);
      await manager.stop();

      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: {
          metrics: JSON.stringify({
            totalAudioPacketsLost: 10,
            totalAudioPacketsExpected: 100,
            totalAudioPacketsRecoveredRed: 5,
            totalAudioPacketsRecoveredFec: 3,
          }),
          ssrc: '12345',
        },
      });
      expect((observer.recoveryMetricsDidReceive as sinon.SinonStub).called).to.be.false;
    });
  });

  describe('addObserver/removeObserver', () => {
    it('adds and removes observers', () => {
      const observer: RedundantAudioRecoveryMetricsObserver = {
        recoveryMetricsDidReceive: sinon.stub(),
      };
      const metricsData = {
        totalAudioPacketsLost: 10,
        totalAudioPacketsExpected: 100,
        totalAudioPacketsRecoveredRed: 5,
        totalAudioPacketsRecoveredFec: 3,
      };

      manager.addObserver(observer);
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: { metrics: JSON.stringify(metricsData), ssrc: '12345' },
      });
      expect((observer.recoveryMetricsDidReceive as sinon.SinonStub).calledOnce).to.be.true;

      manager.removeObserver(observer);
      (observer.recoveryMetricsDidReceive as sinon.SinonStub).resetHistory();
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: { metrics: JSON.stringify(metricsData), ssrc: '12345' },
      });
      expect((observer.recoveryMetricsDidReceive as sinon.SinonStub).called).to.be.false;
    });
  });

  describe('metricsDidReceive', () => {
    it('adds metrics to history when receiving new receiver report', () => {
      manager.metricsDidReceive(
        createMockClientMetricReport(1000, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 100 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 5, timestamp: 1000 },
        ])
      );
      manager.metricsDidReceive(
        createMockClientMetricReport(2000, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 200 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 10, timestamp: 2000 },
        ])
      );
    });

    it('ignores metrics with same timestamp', () => {
      manager.metricsDidReceive(
        createMockClientMetricReport(1000, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 100 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 5, timestamp: 1000 },
        ])
      );
      manager.metricsDidReceive(
        createMockClientMetricReport(1500, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 150 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 7, timestamp: 1000 },
        ])
      );
    });

    it('removes old history entries when exceeding max', () => {
      for (let i = 0; i < 25; i++) {
        manager.metricsDidReceive(
          createMockClientMetricReport(i * 1000, [
            { type: 'outbound-rtp', kind: 'audio', packetsSent: (i + 1) * 100 },
            { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: i * 2, timestamp: i * 1000 },
          ])
        );
      }
    });

    it('calculates loss percent and updates encodings', () => {
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');
      manager.metricsDidReceive(
        createMockClientMetricReport(0, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 100 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 0, timestamp: 0 },
        ])
      );
      manager.metricsDidReceive(
        createMockClientMetricReport(6000, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 200 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 20, timestamp: 6000 },
        ])
      );
      expect(postMessageSpy.called).to.be.true;
    });

    it('turns off RED at very high packet loss', () => {
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');
      manager.metricsDidReceive(
        createMockClientMetricReport(0, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 100 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 0, timestamp: 0 },
        ])
      );
      manager.metricsDidReceive(
        createMockClientMetricReport(6000, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 200 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 80, timestamp: 6000 },
        ])
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(postMessageSpy.getCalls().find((call: any) => call.args[0].type === 'Disable')).to.not
        .be.undefined;
    });

    it('re-enables RED after recovery period', () => {
      manager.setRedundancyEnabled(false);
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');
      // @ts-ignore
      manager['lastAudioRedTurnOffTimestampMs'] = 0;
      // @ts-ignore
      manager['lastHighPacketLossEventTimestampMs'] = 0;

      manager.metricsDidReceive(
        createMockClientMetricReport(70000, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 100 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 0, timestamp: 70000 },
        ])
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(postMessageSpy.getCalls().find((call: any) => call.args[0].type === 'Enable')).to.not
        .be.undefined;
    });

    it('stays disabled during recovery period after high packet loss', () => {
      manager.setRedundancyEnabled(false);
      // @ts-ignore
      manager['lastAudioRedTurnOffTimestampMs'] = 0;
      // @ts-ignore
      manager['lastHighPacketLossEventTimestampMs'] = 50000;
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');

      manager.metricsDidReceive(
        createMockClientMetricReport(55000, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 100 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 0, timestamp: 55000 },
        ])
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(postMessageSpy.getCalls().find((call: any) => call.args[0].type === 'Enable')).to.be
        .undefined;
    });

    it('respects hold-down timer when decreasing encodings', () => {
      // @ts-ignore
      manager['currentNumRedundantEncodings'] = 2;
      // @ts-ignore
      manager['lastRedHolddownTimerStartTimestampMs'] = Date.now();
      const postMessageSpy = sinon.spy(mockWorker, 'postMessage');

      manager.metricsDidReceive(
        createMockClientMetricReport(0, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 100 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 0, timestamp: 0 },
        ])
      );
      manager.metricsDidReceive(
        createMockClientMetricReport(6000, [
          { type: 'outbound-rtp', kind: 'audio', packetsSent: 200 },
          { type: 'remote-inbound-rtp', kind: 'audio', packetsLost: 2, timestamp: 6000 },
        ])
      );
      expect(
        postMessageSpy
          .getCalls()
          .find((call: sinon.SinonSpyCall) => call.args[0].type === 'UpdateNumRedundantEncodings')
      ).to.be.undefined;
    });
  });
});
