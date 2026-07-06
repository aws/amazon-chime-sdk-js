// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';

export enum BackgroundSegmentationInitializationStatus {
  SUCCESS = 0,
  ASSET_LOADING_FAILURE = 1,
  COMPATIBILITY_FAILURE = 2,
  PROCESSOR_CREATION_FAILURE = 3,
}

/**
 * [[BackgroundSegmentationInitializationMetrics]] contains metrics reported
 * once per processor creation by [[BackgroundSegmentationVideoFrameProcessor]].
 */
export interface BackgroundSegmentationInitializationMetrics {
  initializationStatus: BackgroundSegmentationInitializationStatus;
  assetLoadingTimeMs?: number;
}

export interface BackgroundSegmentationProcessorMetrics {
  segmentationDurationMs: number;
  effectRenderDurationMs: number;
  framesPerSegmentation: number;
  framesSubmitted: number;
  framesSegmented: number;
  estimatedCPUUsagePercentage: number;
  modelType: string;
  delegateType: string;
  initializationDurationMs?: number;
  initializationFailure?: number;
  errorCount: number;
}

/**
 * Observer interface for receiving background segmentation metrics
 */
export interface BackgroundSegmentationMetricsObserver {
  backgroundSegmentationInitializationMetricsDidReceive(
    metric: BackgroundSegmentationInitializationMetrics
  ): void;
  backgroundSegmentationProcessorMetricsDidReceive(
    metric: BackgroundSegmentationProcessorMetrics
  ): void;
}

/**
 * Metrics collection for background segmentation processing.
 * Collects one-time processor creation metrics and periodic CDN processor metrics.
 */
export default class BackgroundSegmentationMetrics {
  private static readonly MAX_BUFFERED_METRICS = 100;
  private metricsCollector: BackgroundSegmentationMetricsObserver | undefined;
  private bufferedMetrics: BackgroundSegmentationInitializationMetrics[] = [];

  private _initializationStatus: BackgroundSegmentationInitializationStatus =
    BackgroundSegmentationInitializationStatus.SUCCESS;
  private _assetLoadingTimeMs: number | undefined;

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
      this.sendToCollector(metric);
    });
  }

  reportCompatibilityCheck(isCompatible: boolean): void {
    if (!isCompatible) {
      this._initializationStatus = BackgroundSegmentationInitializationStatus.COMPATIBILITY_FAILURE;
    }
  }

  reportAssetLoadingResult(error?: string, loadTimeMs?: number): void {
    if (
      error &&
      this._initializationStatus === BackgroundSegmentationInitializationStatus.SUCCESS
    ) {
      this._initializationStatus = BackgroundSegmentationInitializationStatus.ASSET_LOADING_FAILURE;
    }
    this._assetLoadingTimeMs = loadTimeMs;
  }

  reportProcessorError(): void {
    if (this._initializationStatus === BackgroundSegmentationInitializationStatus.SUCCESS) {
      this._initializationStatus =
        BackgroundSegmentationInitializationStatus.PROCESSOR_CREATION_FAILURE;
    }
  }

  emitInitializationMetrics(): void {
    const metric: BackgroundSegmentationInitializationMetrics = {
      initializationStatus: this._initializationStatus,
      assetLoadingTimeMs: this._assetLoadingTimeMs,
    };

    this.sendToCollector(metric);
  }

  reportProcessorMetrics(metric: BackgroundSegmentationProcessorMetrics): void {
    if (!this.metricsCollector) {
      return;
    }
    try {
      this.metricsCollector.backgroundSegmentationProcessorMetricsDidReceive(metric);
    } catch (error) {
      this.logger.warn(
        `[BackgroundSegmentationMetrics] Failed to send processor metrics to collector: ${error}`
      );
    }
  }

  private sendToCollector(metric: BackgroundSegmentationInitializationMetrics): void {
    if (!this.metricsCollector) {
      if (this.bufferedMetrics.length >= BackgroundSegmentationMetrics.MAX_BUFFERED_METRICS) {
        this.bufferedMetrics.shift();
      }
      this.bufferedMetrics.push(metric);
      return;
    }

    try {
      this.metricsCollector.backgroundSegmentationInitializationMetricsDidReceive(metric);
    } catch (error) {
      this.logger.warn(
        `[BackgroundSegmentationMetrics] Failed to send initialization metric to collector: ${error}`
      );
    }
  }
}
