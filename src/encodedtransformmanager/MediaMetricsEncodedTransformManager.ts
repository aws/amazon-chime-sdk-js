// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Destroyable from '../destroyable/Destroyable';
import {
  COMMON_MESSAGE_TYPES,
  EncodedTransformMessage,
  TRANSFORM_NAMES,
} from '../encodedtransformworker/EncodedTransform';
import { MEDIA_METRICS_MESSAGE_TYPES } from '../encodedtransformworker/MediaMetricsEncodedTransform';
import Logger from '../logger/Logger';
import IntervalScheduler from '../scheduler/IntervalScheduler';
import EncodedTransformManager from './EncodedTransformManager';

/**
 * Metrics for a single media stream identified by SSRC.
 * Collected from encoded transform workers processing RTP packets.
 */
export interface EncodedTransformMediaStreamMetrics {
  /**
   * Synchronization source identifier for the stream.
   */
  ssrc: number;
  /**
   * Number of packets processed in the reporting interval.
   */
  packetCount: number;
  /**
   * Unix timestamp (ms) when metrics were collected.
   */
  timestamp: number;
}

/**
 * Aggregated metrics from all encoded transform types, keyed by SSRC.
 * Reported periodically to observers for stats collection.
 */
export interface EncodedTransformMediaMetrics {
  /**
   * Outbound audio stream metrics.
   */
  audioSender: Record<number, EncodedTransformMediaStreamMetrics>;
  /**
   * Inbound audio stream metrics.
   */
  audioReceiver: Record<number, EncodedTransformMediaStreamMetrics>;
  /**
   * Outbound video stream metrics.
   */
  videoSender: Record<number, EncodedTransformMediaStreamMetrics>;
  /**
   * Inbound video stream metrics.
   */
  videoReceiver: Record<number, EncodedTransformMediaStreamMetrics>;
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
export default class MediaMetricsTransformManager
  extends EncodedTransformManager
  implements Destroyable {
  private audioSender: Record<number, EncodedTransformMediaStreamMetrics> = {};
  private audioReceiver: Record<number, EncodedTransformMediaStreamMetrics> = {};
  private videoSender: Record<number, EncodedTransformMediaStreamMetrics> = {};
  private videoReceiver: Record<number, EncodedTransformMediaStreamMetrics> = {};

  private observers: Set<EncodedTransformMediaMetricsObserver> = new Set();
  private metricsReportingScheduler: IntervalScheduler | null = null;
  private readonly METRICS_REPORTING_INTERVAL_MS = 1000;

  constructor(worker: Worker, logger: Logger) {
    super(worker, logger);
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
    // Ignore NewSSRC messages for now
    if (message.type === MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC) {
      return;
    }

    if (message.type !== COMMON_MESSAGE_TYPES.METRICS) return;

    const metrics = message.message?.metrics ? JSON.parse(message.message.metrics) : null;
    if (!metrics) return;

    switch (message.transformName) {
      case TRANSFORM_NAMES.AUDIO_SENDER:
        this.audioSender = metrics as Record<number, EncodedTransformMediaStreamMetrics>;
        break;
      case TRANSFORM_NAMES.AUDIO_RECEIVER:
        this.audioReceiver = metrics as Record<number, EncodedTransformMediaStreamMetrics>;
        break;
      case TRANSFORM_NAMES.VIDEO_SENDER:
        this.videoSender = metrics as Record<number, EncodedTransformMediaStreamMetrics>;
        break;
      case TRANSFORM_NAMES.VIDEO_RECEIVER:
        this.videoReceiver = metrics as Record<number, EncodedTransformMediaStreamMetrics>;
        break;
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
      audioSender: { ...this.audioSender },
      audioReceiver: { ...this.audioReceiver },
      videoSender: { ...this.videoSender },
      videoReceiver: { ...this.videoReceiver },
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
   * Reset metrics transform state
   */
  reset(): void {
    this.observers.clear();

    // Reset all metrics to initial state
    this.audioSender = {};
    this.audioReceiver = {};
    this.videoSender = {};
    this.videoReceiver = {};
  }

  /**
   * Destroy the manager and release resources
   */
  async destroy(): Promise<void> {
    if (this.metricsReportingScheduler) {
      this.metricsReportingScheduler.stop();
      this.metricsReportingScheduler = null;
    }

    this.reset();
  }
}
