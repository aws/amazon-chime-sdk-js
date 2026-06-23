// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import BackgroundSegmentationMetrics, {
  BackgroundSegmentationMetricsObserver,
} from '../../src/backgroundsegmentation/BackgroundSegmentationMetrics';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';

describe('BackgroundSegmentationMetrics', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  const sandbox: sinon.SinonSandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('constructs without collector', () => {
    const metrics = new BackgroundSegmentationMetrics(logger);
    expect(metrics).to.not.be.undefined;
  });

  it('constructs with collector', () => {
    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub(),
    };
    const metrics = new BackgroundSegmentationMetrics(logger, collector);
    expect(metrics).to.not.be.undefined;
  });

  it('buffers metrics when no collector is set', () => {
    const metrics = new BackgroundSegmentationMetrics(logger);
    metrics.reportAssetLoadingResult('cdn-processor', undefined, 123);

    // Set collector and verify buffered metrics are flushed
    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub(),
    };
    metrics.setMetricsCollector(collector);
    expect((collector.backgroundSegmentationMetricsDidReceive as sinon.SinonStub).calledOnce).to.be
      .true;
    const report = (collector.backgroundSegmentationMetricsDidReceive as sinon.SinonStub)
      .args[0][0];
    expect(report.metricName).to.equal('BackgroundSegmentationAssetLoadingResult');
    expect(report.loadTimeMs).to.equal(123);
    expect(report.success).to.equal(1);
  });

  it('sends metrics directly when collector is set', () => {
    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub(),
    };
    const metrics = new BackgroundSegmentationMetrics(logger, collector);
    metrics.reportAssetLoadingResult('cdn-processor', undefined, 50);
    expect((collector.backgroundSegmentationMetricsDidReceive as sinon.SinonStub).calledOnce).to.be
      .true;
  });

  it('reports asset loading failure', () => {
    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub(),
    };
    const metrics = new BackgroundSegmentationMetrics(logger, collector);
    metrics.reportAssetLoadingResult('cdn-processor', 'network error');
    const report = (collector.backgroundSegmentationMetricsDidReceive as sinon.SinonStub)
      .args[0][0];
    expect(report.success).to.equal(0);
    expect(report.error).to.equal('network error');
  });

  it('reports processor error', () => {
    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub(),
    };
    const metrics = new BackgroundSegmentationMetrics(logger, collector);
    metrics.reportProcessorError('processing-failed', 'timeout', 'selfie_general');
    const report = (collector.backgroundSegmentationMetricsDidReceive as sinon.SinonStub)
      .args[0][0];
    expect(report.metricName).to.equal('BackgroundSegmentationProcessorError');
    expect(report.errorType).to.equal('processing-failed');
    expect(report.errorMessage).to.equal('timeout');
    expect(report.modelType).to.equal('selfie_general');
  });

  it('reports compatibility check', () => {
    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub(),
    };
    const metrics = new BackgroundSegmentationMetrics(logger, collector);
    metrics.reportCompatibilityCheck(false, ['webgl2', 'offscreenCanvas']);
    const report = (collector.backgroundSegmentationMetricsDidReceive as sinon.SinonStub)
      .args[0][0];
    expect(report.metricName).to.equal('BackgroundSegmentationCompatibilityCheck');
    expect(report.isCompatible).to.be.false;
    expect(report.missingFeatures).to.equal('webgl2,offscreenCanvas');
  });

  it('drops oldest buffered metrics when MAX_BUFFERED_METRICS exceeded', () => {
    const metrics = new BackgroundSegmentationMetrics(logger);

    for (let i = 0; i <= 100; i++) {
      metrics.reportAssetLoadingResult(`asset-${i}`, undefined, i);
    }

    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub(),
    };
    metrics.setMetricsCollector(collector);
    expect(
      (collector.backgroundSegmentationMetricsDidReceive as sinon.SinonStub).callCount
    ).to.equal(100);
    const firstReport = (collector.backgroundSegmentationMetricsDidReceive as sinon.SinonStub)
      .args[0][0];
    expect(firstReport.assetType).to.equal('asset-1');
  });

  it('does not flush when buffer is empty', () => {
    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub(),
    };
    const metrics = new BackgroundSegmentationMetrics(logger);
    metrics.setMetricsCollector(collector);
    expect((collector.backgroundSegmentationMetricsDidReceive as sinon.SinonStub).notCalled).to.be
      .true;
  });

  it('handles collector throwing error gracefully', () => {
    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub().throws(new Error('collector error')),
    };
    const metrics = new BackgroundSegmentationMetrics(logger, collector);

    metrics.reportAssetLoadingResult('cdn-processor', undefined, 50);
  });

  it('handles reportAssetLoadingResult internal error gracefully', () => {
    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub(),
    };
    const metrics = new BackgroundSegmentationMetrics(logger, collector);
    // Stub Date.now to throw to trigger catch
    sandbox.stub(Date, 'now').throws(new Error('time error'));

    metrics.reportAssetLoadingResult('cdn-processor', undefined, 50);
  });

  it('handles reportProcessorError internal error gracefully', () => {
    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub(),
    };
    const metrics = new BackgroundSegmentationMetrics(logger, collector);
    sandbox.stub(Date, 'now').throws(new Error('time error'));
    metrics.reportProcessorError('type', 'msg', 'model');
  });

  it('handles reportCompatibilityCheck internal error gracefully', () => {
    const collector: BackgroundSegmentationMetricsObserver = {
      backgroundSegmentationMetricsDidReceive: sandbox.stub(),
    };
    const metrics = new BackgroundSegmentationMetrics(logger, collector);
    sandbox.stub(Date, 'now').throws(new Error('time error'));
    metrics.reportCompatibilityCheck(true, []);
  });
});
