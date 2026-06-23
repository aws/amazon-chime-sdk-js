// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';

/**
 * [[BackgroundSegmentationMetricReport]] will contain metrics reported
 * by the [[BackgroundSegmentationVideoFrameProcessor]]
 */
export class BackgroundSegmentationMetricReport {
  metricName: string = '';
  timestamp: number = 0;
  assetType?: string;
  loadTimeMs?: number;
  success?: number;
  error?: string;
  errorType?: string;
  errorMessage?: string;
  modelType?: string;
  isCompatible?: boolean;
  missingFeatures?: string;
}

/**
 * Observer interface for receiving background segmentation metrics
 */
export interface BackgroundSegmentationMetricsObserver {
  backgroundSegmentationMetricsDidReceive(metricReport: BackgroundSegmentationMetricReport): void;
}

/**
 * Metrics collection for background segmentation processing
 */
export default class BackgroundSegmentationMetrics {
  private static readonly MAX_BUFFERED_METRICS = 100;
  private metricsCollector: BackgroundSegmentationMetricsObserver | undefined;
  private bufferedMetrics: BackgroundSegmentationMetricReport[] = [];

  constructor(
    private logger: Logger,
    metricsCollector?: BackgroundSegmentationMetricsObserver
  ) {
    this.metricsCollector = metricsCollector;
  }

  /**
   * Update the metrics collector and flush any buffered metrics
   */
  setMetricsCollector(metricsCollector: BackgroundSegmentationMetricsObserver): void {
    this.metricsCollector = metricsCollector;
    this.flushBufferedMetrics();
  }

  private flushBufferedMetrics(): void {
    if (this.bufferedMetrics.length === 0) return;

    this.logger.info(
      `[BackgroundSegmentationMetrics] Flushing ${this.bufferedMetrics.length} buffered metrics`
    );
    const metricsToFlush = [...this.bufferedMetrics];
    this.bufferedMetrics = [];

    metricsToFlush.forEach(metric => {
      this.emitMetricReport(metric);
    });
  }

  reportAssetLoadingResult(assetType: string, error?: string, loadTimeMs?: number): void {
    try {
      const metricReport = new BackgroundSegmentationMetricReport();
      metricReport.metricName = 'BackgroundSegmentationAssetLoadingResult';
      metricReport.assetType = assetType;
      metricReport.success = error ? 0 : 1;
      metricReport.error = error;
      metricReport.loadTimeMs = loadTimeMs;
      metricReport.timestamp = Date.now();

      this.emitMetricReport(metricReport);
    } catch (err) {
      this.logger.warn(
        `[BackgroundSegmentationMetrics] Failed to report asset loading status: ${err}`
      );
    }
  }

  reportProcessorError(errorType: string, errorMessage: string, modelType: string): void {
    try {
      const metricReport = new BackgroundSegmentationMetricReport();
      metricReport.metricName = 'BackgroundSegmentationProcessorError';
      metricReport.errorType = errorType;
      metricReport.errorMessage = errorMessage;
      metricReport.modelType = modelType;
      metricReport.timestamp = Date.now();

      this.emitMetricReport(metricReport);
    } catch (error) {
      this.logger.warn(
        `[BackgroundSegmentationMetrics] Failed to report processor error: ${error}`
      );
    }
  }

  reportCompatibilityCheck(isCompatible: boolean, missingFeatures: string[]): void {
    try {
      const metricReport = new BackgroundSegmentationMetricReport();
      metricReport.metricName = 'BackgroundSegmentationCompatibilityCheck';
      metricReport.isCompatible = isCompatible;
      metricReport.missingFeatures = missingFeatures.join(',');
      metricReport.timestamp = Date.now();

      this.emitMetricReport(metricReport);
    } catch (error) {
      this.logger.warn(
        `[BackgroundSegmentationMetrics] Failed to report compatibility check: ${error}`
      );
    }
  }

  private emitMetricReport(metricReport: BackgroundSegmentationMetricReport): void {
    if (!this.metricsCollector) {
      if (this.bufferedMetrics.length >= BackgroundSegmentationMetrics.MAX_BUFFERED_METRICS) {
        this.bufferedMetrics.shift();
      }
      this.bufferedMetrics.push(metricReport);
      return;
    }

    try {
      this.metricsCollector.backgroundSegmentationMetricsDidReceive(metricReport);
    } catch (error) {
      this.logger.warn(
        `[BackgroundSegmentationMetrics] Failed to send metric report to collector: ${error}`
      );
    }
  }
}
