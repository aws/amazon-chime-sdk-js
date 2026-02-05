// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  COMMON_MESSAGE_TYPES,
  EncodedTransformMessage,
  TRANSFORM_NAMES,
} from '../encodedtransformworker/EncodedTransform';
import {
  EncodedTransformMediaStreamMetrics,
  MEDIA_METRICS_MESSAGE_TYPES,
} from '../encodedtransformworker/MediaMetricsEncodedTransform';
import Logger from '../logger/Logger';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import EncodedTransformManager from './EncodedTransformManager';

/**
 * Aggregated metrics from all encoded transform types, keyed by SSRC.
 * Reported periodically to observers for stats collection.
 */
export interface EncodedTransformMediaMetrics {
  /**
   * Outbound audio stream metrics.
   */
  audioSendMetrics: Record<number, EncodedTransformMediaStreamMetrics>;

  /**
   * Inbound audio stream metrics.
   */
  audioReceiveMetrics: Record<number, EncodedTransformMediaStreamMetrics>;

  /**
   * Outbound video stream metrics.
   */
  videoSendMetrics: Record<number, EncodedTransformMediaStreamMetrics>;

  /**
   * Inbound video stream metrics.
   */
  videoReceiveMetrics: Record<number, EncodedTransformMediaStreamMetrics>;
}

/**
 * Observer interface for receiving encoded transform media metrics.
 */
export interface EncodedTransformMediaMetricsObserver {
  /**
   * Called when new encoded transform media metrics become available.
   */
  encodedTransformMediaMetricsDidReceive(metrics: EncodedTransformMediaMetrics): void;
}

/**
 * Manages metrics collection for all media types (audio/video, sender/receiver).
 * Consolidates packet-level metrics from the Web Worker.
 */
export default class MediaMetricsTransformManager extends EncodedTransformManager {
  private audioSendMetrics: Record<number, EncodedTransformMediaStreamMetrics> = {};
  private audioReceiveMetrics: Record<number, EncodedTransformMediaStreamMetrics> = {};
  private videoSendMetrics: Record<number, EncodedTransformMediaStreamMetrics> = {};
  private videoReceiveMetrics: Record<number, EncodedTransformMediaStreamMetrics> = {};

  private observers: Set<EncodedTransformMediaMetricsObserver> = new Set();
  private metricsReportingScheduler: IntervalScheduler | null = null;
  private readonly METRICS_REPORTING_INTERVAL_MS = 1000;

  constructor(worker: Worker, logger: Logger) {
    super(worker, logger);
  }

  /**
   * Start the metrics transform manager
   */
  async start(): Promise<void> {
    this.startMetricsReporting();
  }

  /**
   * Get the transform names that this manager handles
   */
  transformNames(): string[] {
    return [
      TRANSFORM_NAMES.AUDIO_SENDER,
      TRANSFORM_NAMES.AUDIO_RECEIVER,
      TRANSFORM_NAMES.VIDEO_SENDER,
      TRANSFORM_NAMES.VIDEO_RECEIVER,
    ];
  }

  /**
   * Handle metrics messages from the Web Worker
   * Routes messages to the appropriate metrics property
   */
  handleWorkerMessage(message: EncodedTransformMessage): void {
    if (message.type === MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC) {
      return;
    }

    if (message.type !== COMMON_MESSAGE_TYPES.METRICS) {
      return;
    }

    try {
      const metrics: Record<number, EncodedTransformMediaStreamMetrics> = JSON.parse(
        message.message.metrics
      );

      switch (message.transformName) {
        case TRANSFORM_NAMES.AUDIO_SENDER:
          this.audioSendMetrics = metrics;
          break;
        case TRANSFORM_NAMES.AUDIO_RECEIVER:
          this.audioReceiveMetrics = metrics;
          break;
        case TRANSFORM_NAMES.VIDEO_SENDER:
          this.videoSendMetrics = metrics;
          break;
        case TRANSFORM_NAMES.VIDEO_RECEIVER:
          this.videoReceiveMetrics = metrics;
          break;
      }
    } catch (e) {
      this.logger.warn(`Failed to handle metrics message: ${e}`);
    }
  }

  /**
   * Add an observer to receive media metrics
   */
  addObserver(observer: EncodedTransformMediaMetricsObserver): void {
    this.observers.add(observer);
  }

  /**
   * Remove an observer
   */
  removeObserver(observer: EncodedTransformMediaMetricsObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Start periodic metrics reporting to observers
   */
  private startMetricsReporting(): void {
    this.metricsReportingScheduler = new IntervalScheduler(this.METRICS_REPORTING_INTERVAL_MS);
    this.metricsReportingScheduler.start(() => {
      this.reportMetrics();
    });
  }

  /**
   * Report current metrics to all observers
   */
  private reportMetrics(): void {
    const metrics: EncodedTransformMediaMetrics = {
      audioSendMetrics: { ...this.audioSendMetrics },
      audioReceiveMetrics: { ...this.audioReceiveMetrics },
      videoSendMetrics: { ...this.videoSendMetrics },
      videoReceiveMetrics: { ...this.videoReceiveMetrics },
    };

    for (const observer of this.observers) {
      try {
        observer.encodedTransformMediaMetricsDidReceive(metrics);
      } catch (e) {
        this.logger.error(`Error notifying media metrics observer: ${e}`);
      }
    }
  }

  /**
   * Stop metrics transform and release resources
   */
  async stop(): Promise<void> {
    if (this.metricsReportingScheduler) {
      this.metricsReportingScheduler.stop();
      this.metricsReportingScheduler = null;
    }

    this.observers.clear();

    // Reset all metrics to initial state
    this.audioSendMetrics = {};
    this.audioReceiveMetrics = {};
    this.videoSendMetrics = {};
    this.videoReceiveMetrics = {};
  }
}
