// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import MediaMetricsTransformManager, {
  EncodedTransformMediaMetricsObserver,
} from '../../src/encodedtransformmanager/MediaMetricsEncodedTransformManager';
import {
  COMMON_MESSAGE_TYPES,
  TRANSFORM_NAMES,
} from '../../src/encodedtransformworker/EncodedTransform';
import { MEDIA_METRICS_MESSAGE_TYPES } from '../../src/encodedtransformworker/MediaMetricsEncodedTransform';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { createFakeTimers } from '../utils/fakeTimerHelper';

describe('MediaMetricsTransformManager', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let domMockBuilder: DOMMockBuilder | null = null;
  let mockWorker: Worker;
  let manager: MediaMetricsTransformManager;
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = createFakeTimers();
    domMockBuilder = new DOMMockBuilder(new DOMMockBehavior());
    // @ts-ignore
    mockWorker = new Worker('test-url');
    manager = new MediaMetricsTransformManager(mockWorker, logger);
  });

  afterEach(async () => {
    await manager.stop();
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
    clock.restore();
  });

  describe('constructor', () => {
    it('creates a manager with worker and logger', () => {
      expect(manager).to.not.be.undefined;
    });
  });

  describe('start', () => {
    it('starts metrics reporting scheduler', async () => {
      await manager.start();
    });
  });

  describe('transformNames', () => {
    it('returns all four transform names', () => {
      const names = manager.transformNames();
      expect(names).to.include(TRANSFORM_NAMES.AUDIO_SENDER);
      expect(names).to.include(TRANSFORM_NAMES.AUDIO_RECEIVER);
      expect(names).to.include(TRANSFORM_NAMES.VIDEO_SENDER);
      expect(names).to.include(TRANSFORM_NAMES.VIDEO_RECEIVER);
      expect(names.length).to.equal(4);
    });
  });

  describe('handleWorkerMessage', () => {
    it('notifies observer on NEW_SSRC for audio sender', () => {
      const spy = sinon.stub();
      const obs: EncodedTransformMediaMetricsObserver = { onFirstPacketReceived: spy };
      manager.addObserver(obs);
      manager.handleWorkerMessage({
        type: MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC,
        transformName: TRANSFORM_NAMES.AUDIO_SENDER,
        message: { ssrc: '12345' },
      });
      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args).to.deep.equal(['audio', 'send', 12345]);
    });

    it('notifies observer on NEW_SSRC for audio receiver', () => {
      const spy = sinon.stub();
      const obs: EncodedTransformMediaMetricsObserver = { onFirstPacketReceived: spy };
      manager.addObserver(obs);
      manager.handleWorkerMessage({
        type: MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC,
        transformName: TRANSFORM_NAMES.AUDIO_RECEIVER,
        message: { ssrc: '100' },
      });
      expect(spy.calledWith('audio', 'receive', 100)).to.be.true;
    });

    it('notifies observer on NEW_SSRC for video sender', () => {
      const spy = sinon.stub();
      const obs: EncodedTransformMediaMetricsObserver = { onFirstPacketReceived: spy };
      manager.addObserver(obs);
      manager.handleWorkerMessage({
        type: MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC,
        transformName: TRANSFORM_NAMES.VIDEO_SENDER,
        message: { ssrc: '200' },
      });
      expect(spy.calledWith('video', 'send', 200)).to.be.true;
    });

    it('notifies observer on NEW_SSRC for video receiver', () => {
      const spy = sinon.stub();
      const obs: EncodedTransformMediaMetricsObserver = { onFirstPacketReceived: spy };
      manager.addObserver(obs);
      manager.handleWorkerMessage({
        type: MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC,
        transformName: TRANSFORM_NAMES.VIDEO_RECEIVER,
        message: { ssrc: '300' },
      });
      expect(spy.calledWith('video', 'receive', 300)).to.be.true;
    });

    it('ignores NEW_SSRC without ssrc field', () => {
      const spy = sinon.stub();
      const obs: EncodedTransformMediaMetricsObserver = { onFirstPacketReceived: spy };
      manager.addObserver(obs);
      manager.handleWorkerMessage({
        type: MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC,
        transformName: TRANSFORM_NAMES.AUDIO_SENDER,
        message: {},
      });
      expect(spy.called).to.be.false;
    });

    it('ignores NEW_SSRC with null message', () => {
      const spy = sinon.stub();
      const obs: EncodedTransformMediaMetricsObserver = { onFirstPacketReceived: spy };
      manager.addObserver(obs);
      manager.handleWorkerMessage({
        type: MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC,
        transformName: TRANSFORM_NAMES.AUDIO_SENDER,
        message: undefined,
      });
      expect(spy.called).to.be.false;
    });

    it('ignores NEW_SSRC with invalid ssrc', () => {
      const spy = sinon.stub();
      const obs: EncodedTransformMediaMetricsObserver = { onFirstPacketReceived: spy };
      manager.addObserver(obs);
      manager.handleWorkerMessage({
        type: MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC,
        transformName: TRANSFORM_NAMES.AUDIO_SENDER,
        message: { ssrc: 'not-a-number' },
      });
      expect(spy.called).to.be.false;
    });

    it('ignores NEW_SSRC with unknown transform name', () => {
      const spy = sinon.stub();
      const obs: EncodedTransformMediaMetricsObserver = { onFirstPacketReceived: spy };
      manager.addObserver(obs);
      manager.handleWorkerMessage({
        type: MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC,
        transformName: 'UnknownTransform',
        message: { ssrc: '12345' },
      });
      expect(spy.called).to.be.false;
    });

    it('catches observer error on NEW_SSRC notification', () => {
      const obs: EncodedTransformMediaMetricsObserver = {
        onFirstPacketReceived: () => {
          throw new Error('test');
        },
      };
      manager.addObserver(obs);
      // Should not throw
      manager.handleWorkerMessage({
        type: MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC,
        transformName: TRANSFORM_NAMES.AUDIO_SENDER,
        message: { ssrc: '12345' },
      });
    });

    it('handles observer without onFirstPacketReceived on NEW_SSRC', () => {
      const obs: EncodedTransformMediaMetricsObserver = {};
      manager.addObserver(obs);
      manager.handleWorkerMessage({
        type: MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC,
        transformName: TRANSFORM_NAMES.AUDIO_SENDER,
        message: { ssrc: '12345' },
      });
    });
    it('calls encodedTransformMediaMetricsDidReceive as optional', async () => {
      await manager.start();
      const obs: EncodedTransformMediaMetricsObserver = {};
      manager.addObserver(obs);
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.AUDIO_SENDER,
        message: {
          metrics: JSON.stringify({ 12345: { ssrc: 12345, packetCount: 100, timestamp: 1000 } }),
        },
      });
      await clock.tickAsync(1100);
      // Should not throw even though observer has no encodedTransformMediaMetricsDidReceive
    });

    it('ignores non-METRICS message type', () => {
      manager.handleWorkerMessage({
        type: 'SomeOtherType',
        transformName: TRANSFORM_NAMES.AUDIO_SENDER,
        message: { data: 'test' },
      });
    });

    it('updates audioSender metrics', async () => {
      await manager.start();
      const metricsData = { 12345: { ssrc: 12345, packetCount: 100, timestamp: 1000 } };
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.AUDIO_SENDER,
        message: { metrics: JSON.stringify(metricsData) },
      });

      const observer: EncodedTransformMediaMetricsObserver = {
        encodedTransformMediaMetricsDidReceive: sinon.stub(),
      };
      manager.addObserver(observer);
      await clock.tickAsync(1100);

      const stub = observer.encodedTransformMediaMetricsDidReceive as sinon.SinonStub;
      expect(stub.called).to.be.true;
      expect(stub.firstCall.args[0].audioSendMetrics[12345]).to.deep.equal(metricsData[12345]);
    });

    it('updates audioReceiver metrics', async () => {
      await manager.start();
      const metricsData = { 12345: { ssrc: 12345, packetCount: 50, timestamp: 2000 } };
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.AUDIO_RECEIVER,
        message: { metrics: JSON.stringify(metricsData) },
      });

      const observer: EncodedTransformMediaMetricsObserver = {
        encodedTransformMediaMetricsDidReceive: sinon.stub(),
      };
      manager.addObserver(observer);
      await clock.tickAsync(1100);

      expect(
        (observer.encodedTransformMediaMetricsDidReceive as sinon.SinonStub).firstCall.args[0]
          .audioReceiveMetrics[12345]
      ).to.deep.equal(metricsData[12345]);
    });

    it('updates videoSender metrics', async () => {
      await manager.start();
      const metricsData = { 67890: { ssrc: 67890, packetCount: 200, timestamp: 3000 } };
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.VIDEO_SENDER,
        message: { metrics: JSON.stringify(metricsData) },
      });

      const observer: EncodedTransformMediaMetricsObserver = {
        encodedTransformMediaMetricsDidReceive: sinon.stub(),
      };
      manager.addObserver(observer);
      await clock.tickAsync(1100);

      expect(
        (observer.encodedTransformMediaMetricsDidReceive as sinon.SinonStub).firstCall.args[0]
          .videoSendMetrics[67890]
      ).to.deep.equal(metricsData[67890]);
    });

    it('updates videoReceiver metrics', async () => {
      await manager.start();
      const metricsData = { 11111: { ssrc: 11111, packetCount: 150, timestamp: 4000 } };
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.VIDEO_RECEIVER,
        message: { metrics: JSON.stringify(metricsData) },
      });

      const observer: EncodedTransformMediaMetricsObserver = {
        encodedTransformMediaMetricsDidReceive: sinon.stub(),
      };
      manager.addObserver(observer);
      await clock.tickAsync(1100);

      expect(
        (observer.encodedTransformMediaMetricsDidReceive as sinon.SinonStub).firstCall.args[0]
          .videoReceiveMetrics[11111]
      ).to.deep.equal(metricsData[11111]);
    });

    it('handles JSON parse errors gracefully', () => {
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.AUDIO_SENDER,
        message: { metrics: 'invalid json' },
      });
    });
  });

  describe('addObserver/removeObserver', () => {
    it('adds and removes observers', async () => {
      await manager.start();
      const observer: EncodedTransformMediaMetricsObserver = {
        encodedTransformMediaMetricsDidReceive: sinon.stub(),
      };
      manager.addObserver(observer);
      await clock.tickAsync(1100);
      expect((observer.encodedTransformMediaMetricsDidReceive as sinon.SinonStub).called).to.be
        .true;
      manager.removeObserver(observer);
    });
  });

  describe('reportMetrics', () => {
    it('notifies all observers with current metrics', async () => {
      await manager.start();
      const observer1: EncodedTransformMediaMetricsObserver = {
        encodedTransformMediaMetricsDidReceive: sinon.stub(),
      };
      const observer2: EncodedTransformMediaMetricsObserver = {
        encodedTransformMediaMetricsDidReceive: sinon.stub(),
      };
      manager.addObserver(observer1);
      manager.addObserver(observer2);

      await clock.tickAsync(1100);
      expect((observer1.encodedTransformMediaMetricsDidReceive as sinon.SinonStub).called).to.be
        .true;
      expect((observer2.encodedTransformMediaMetricsDidReceive as sinon.SinonStub).called).to.be
        .true;
    });

    it('handles observer errors gracefully', async () => {
      await manager.start();
      manager.addObserver({
        encodedTransformMediaMetricsDidReceive: () => {
          throw new Error('Observer error');
        },
      });
      const workingObserver: EncodedTransformMediaMetricsObserver = {
        encodedTransformMediaMetricsDidReceive: sinon.stub(),
      };
      manager.addObserver(workingObserver);

      await clock.tickAsync(1100);
      expect((workingObserver.encodedTransformMediaMetricsDidReceive as sinon.SinonStub).called).to
        .be.true;
    });
  });

  describe('stop', () => {
    it('clears observers and resets metrics', async () => {
      await manager.start();
      manager.handleWorkerMessage({
        type: COMMON_MESSAGE_TYPES.METRICS,
        transformName: TRANSFORM_NAMES.AUDIO_SENDER,
        message: {
          metrics: JSON.stringify({ 12345: { ssrc: 12345, packetCount: 100, timestamp: 1000 } }),
        },
      });

      const observer: EncodedTransformMediaMetricsObserver = {
        encodedTransformMediaMetricsDidReceive: sinon.stub(),
      };
      manager.addObserver(observer);
      await manager.stop();

      (observer.encodedTransformMediaMetricsDidReceive as sinon.SinonStub).resetHistory();
      await clock.tickAsync(1100);

      const receivedMetrics = (observer.encodedTransformMediaMetricsDidReceive as sinon.SinonStub)
        .firstCall?.args[0];
      if (receivedMetrics) {
        expect(Object.keys(receivedMetrics.audioSendMetrics).length).to.equal(0);
      }
    });

    it('stops scheduler and cleans up', async () => {
      await manager.start();
      await manager.stop();
      await manager.stop();
    });

    it('can be called without start', async () => {
      // manager.stop() will be called in afterEach
    });
  });
});
