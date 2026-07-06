// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import BackgroundSegmentationMetrics, {
  BackgroundSegmentationInitializationStatus,
  BackgroundSegmentationMetricsObserver,
  BackgroundSegmentationProcessorMetrics,
} from '../../src/backgroundsegmentation/BackgroundSegmentationMetrics';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';

describe('BackgroundSegmentationMetrics', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  const sandbox: sinon.SinonSandbox = sinon.createSandbox();

  function createObserver(): BackgroundSegmentationMetricsObserver {
    return {
      backgroundSegmentationInitializationMetricsDidReceive: sandbox.stub(),
      backgroundSegmentationProcessorMetricsDidReceive: sandbox.stub(),
    };
  }

  function createProcessorMetrics(
    overrides?: Partial<BackgroundSegmentationProcessorMetrics>
  ): BackgroundSegmentationProcessorMetrics {
    return {
      segmentationDurationMs: 10,
      effectRenderDurationMs: 5,
      framesPerSegmentation: 2,
      framesSubmitted: 30,
      framesSegmented: 15,
      estimatedCPUUsagePercentage: 12.5,
      modelType: 'selfie_general',
      delegateType: 'gpu',
      errorCount: 0,
      ...overrides,
    };
  }

  afterEach(() => {
    sandbox.restore();
  });

  describe('construction', () => {
    it('constructs without collector', () => {
      const metrics = new BackgroundSegmentationMetrics(logger);
      expect(metrics).to.not.be.undefined;
    });

    it('constructs with collector', () => {
      const collector = createObserver();
      const metrics = new BackgroundSegmentationMetrics(logger, collector);
      expect(metrics).to.not.be.undefined;
    });
  });

  describe('reportAssetLoadingResult', () => {
    it('records successful asset loading with time', () => {
      const metrics = new BackgroundSegmentationMetrics(logger);
      metrics.reportAssetLoadingResult(undefined, 123);

      const collector = createObserver();
      metrics.setMetricsCollector(collector);
      metrics.emitInitializationMetrics();

      const stub =
        collector.backgroundSegmentationInitializationMetricsDidReceive as sinon.SinonStub;
      expect(stub.called).to.be.true;
      const report = stub.lastCall.args[0];
      expect(report.initializationStatus).to.equal(
        BackgroundSegmentationInitializationStatus.SUCCESS
      );
      expect(report.assetLoadingTimeMs).to.equal(123);
    });

    it('records asset loading failure', () => {
      const collector = createObserver();
      const metrics = new BackgroundSegmentationMetrics(logger, collector);
      metrics.reportAssetLoadingResult('network error');
      metrics.emitInitializationMetrics();

      const stub =
        collector.backgroundSegmentationInitializationMetricsDidReceive as sinon.SinonStub;
      const report = stub.lastCall.args[0];
      expect(report.initializationStatus).to.equal(
        BackgroundSegmentationInitializationStatus.ASSET_LOADING_FAILURE
      );
    });

    it('defaults loadTimeMs to undefined when not provided', () => {
      const collector = createObserver();
      const metrics = new BackgroundSegmentationMetrics(logger, collector);
      metrics.reportAssetLoadingResult(undefined);
      metrics.emitInitializationMetrics();

      const stub =
        collector.backgroundSegmentationInitializationMetricsDidReceive as sinon.SinonStub;
      const report = stub.lastCall.args[0];
      expect(report.assetLoadingTimeMs).to.be.undefined;
    });
  });

  describe('reportCompatibilityCheck', () => {
    it('records compatible result', () => {
      const collector = createObserver();
      const metrics = new BackgroundSegmentationMetrics(logger, collector);
      metrics.reportCompatibilityCheck(true);
      metrics.emitInitializationMetrics();

      const stub =
        collector.backgroundSegmentationInitializationMetricsDidReceive as sinon.SinonStub;
      const report = stub.lastCall.args[0];
      expect(report.initializationStatus).to.equal(
        BackgroundSegmentationInitializationStatus.SUCCESS
      );
    });

    it('records incompatible result', () => {
      const collector = createObserver();
      const metrics = new BackgroundSegmentationMetrics(logger, collector);
      metrics.reportCompatibilityCheck(false);
      metrics.emitInitializationMetrics();

      const stub =
        collector.backgroundSegmentationInitializationMetricsDidReceive as sinon.SinonStub;
      const report = stub.lastCall.args[0];
      expect(report.initializationStatus).to.equal(
        BackgroundSegmentationInitializationStatus.COMPATIBILITY_FAILURE
      );
    });
  });

  describe('reportProcessorError', () => {
    it('records processor creation failure', () => {
      const collector = createObserver();
      const metrics = new BackgroundSegmentationMetrics(logger, collector);
      metrics.reportProcessorError();
      metrics.emitInitializationMetrics();

      const stub =
        collector.backgroundSegmentationInitializationMetricsDidReceive as sinon.SinonStub;
      const report = stub.lastCall.args[0];
      expect(report.initializationStatus).to.equal(
        BackgroundSegmentationInitializationStatus.PROCESSOR_CREATION_FAILURE
      );
    });
  });

  describe('emitInitializationMetrics', () => {
    it('sends initialization status and loading time in a single report', () => {
      const collector = createObserver();
      const metrics = new BackgroundSegmentationMetrics(logger, collector);

      metrics.reportCompatibilityCheck(true);
      metrics.reportAssetLoadingResult(undefined, 200);
      metrics.emitInitializationMetrics();

      const stub =
        collector.backgroundSegmentationInitializationMetricsDidReceive as sinon.SinonStub;
      expect(stub.calledOnce).to.be.true;
      const report = stub.firstCall.args[0];
      expect(report.initializationStatus).to.equal(
        BackgroundSegmentationInitializationStatus.SUCCESS
      );
      expect(report.assetLoadingTimeMs).to.equal(200);
    });

    it('buffers metrics when no collector is set', () => {
      const metrics = new BackgroundSegmentationMetrics(logger);
      metrics.reportAssetLoadingResult(undefined, 150);
      metrics.emitInitializationMetrics();

      const collector = createObserver();
      metrics.setMetricsCollector(collector);

      const stub =
        collector.backgroundSegmentationInitializationMetricsDidReceive as sinon.SinonStub;
      expect(stub.calledOnce).to.be.true;
      const report = stub.firstCall.args[0];
      expect(report.assetLoadingTimeMs).to.equal(150);
    });
  });

  describe('setMetricsCollector', () => {
    it('flushes buffered metrics to new collector', () => {
      const metrics = new BackgroundSegmentationMetrics(logger);
      metrics.reportAssetLoadingResult(undefined, 10);
      metrics.emitInitializationMetrics();
      metrics.reportAssetLoadingResult('err');
      metrics.emitInitializationMetrics();

      const collector = createObserver();
      metrics.setMetricsCollector(collector);

      const stub =
        collector.backgroundSegmentationInitializationMetricsDidReceive as sinon.SinonStub;
      expect(stub.callCount).to.equal(2);
    });

    it('does not flush when buffer is empty', () => {
      const collector = createObserver();
      const metrics = new BackgroundSegmentationMetrics(logger);
      metrics.setMetricsCollector(collector);

      const stub =
        collector.backgroundSegmentationInitializationMetricsDidReceive as sinon.SinonStub;
      expect(stub.notCalled).to.be.true;
    });

    it('drops oldest buffered metrics when MAX_BUFFERED_METRICS exceeded', () => {
      const metrics = new BackgroundSegmentationMetrics(logger);

      for (let i = 0; i <= 100; i++) {
        metrics.reportAssetLoadingResult(undefined, i);
        metrics.emitInitializationMetrics();
      }

      const collector = createObserver();
      metrics.setMetricsCollector(collector);

      const stub =
        collector.backgroundSegmentationInitializationMetricsDidReceive as sinon.SinonStub;
      expect(stub.callCount).to.equal(100);
      const firstReport = stub.firstCall.args[0];
      expect(firstReport.assetLoadingTimeMs).to.equal(1);
    });
  });

  describe('reportProcessorMetrics', () => {
    it('sends processor metrics to collector', () => {
      const collector = createObserver();
      const metrics = new BackgroundSegmentationMetrics(logger, collector);

      const perfReport = createProcessorMetrics();
      metrics.reportProcessorMetrics(perfReport);

      const stub = collector.backgroundSegmentationProcessorMetricsDidReceive as sinon.SinonStub;
      expect(stub.calledOnce).to.be.true;
      expect(stub.firstCall.args[0]).to.deep.equal(perfReport);
    });

    it('silently drops processor metrics when no collector is set', () => {
      const metrics = new BackgroundSegmentationMetrics(logger);
      // Should not throw
      metrics.reportProcessorMetrics(createProcessorMetrics());
    });

    it('handles collector throwing error gracefully', () => {
      const collector: BackgroundSegmentationMetricsObserver = {
        backgroundSegmentationInitializationMetricsDidReceive: sandbox.stub(),
        backgroundSegmentationProcessorMetricsDidReceive: sandbox.stub().throws(new Error('fail')),
      };
      const metrics = new BackgroundSegmentationMetrics(logger, collector);

      // Should not throw
      metrics.reportProcessorMetrics(createProcessorMetrics());
    });
  });

  describe('error handling', () => {
    it('handles collector throwing on metric emit', () => {
      const collector: BackgroundSegmentationMetricsObserver = {
        backgroundSegmentationInitializationMetricsDidReceive: sandbox
          .stub()
          .throws(new Error('collector error')),
        backgroundSegmentationProcessorMetricsDidReceive: sandbox.stub(),
      };
      const metrics = new BackgroundSegmentationMetrics(logger, collector);

      // Should not throw
      metrics.reportAssetLoadingResult(undefined, 50);
      metrics.emitInitializationMetrics();
    });
  });
});
