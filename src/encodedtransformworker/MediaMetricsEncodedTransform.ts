// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import EncodedTransform, { COMMON_MESSAGE_TYPES, TRANSFORM_NAMES } from './EncodedTransform';

/**
 * Message types specific to MediaMetrics transforms.
 */
export const MEDIA_METRICS_MESSAGE_TYPES = {
  NEW_SSRC: 'NewSSRC',
} as const;

/**
 * Abstract base class for packet-level metrics collection per SSRC.
 * Tracks packet counts and timestamps, periodically reporting to the main thread.
 */
abstract class BaseMetricsTransform extends EncodedTransform {
  protected metricsMap: Map<number, { packetCount: number; timestamp: number }> = new Map();
  protected readonly reportInterval: number = 100;

  /** Returns the transform name for metrics identification. */
  protected abstract transformName(): string;

  /** Processes frames, collects per-SSRC metrics, and forwards unchanged. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(frame: any, controller: any): void {
    // Extract SSRC from frame
    const ssrc = frame.getMetadata?.().synchronizationSource || 0;

    // Get or create metrics for this SSRC
    let metrics = this.metricsMap.get(ssrc);
    if (!metrics) {
      metrics = { packetCount: 0, timestamp: 0 };
      this.metricsMap.set(ssrc, metrics);
      this.log(`Created metrics for SSRC ${ssrc}`);

      // @ts-ignore
      self.postMessage({
        type: MEDIA_METRICS_MESSAGE_TYPES.NEW_SSRC,
        transformName: this.transformName(),
        message: { ssrc: String(ssrc) },
      });
    }

    // Collect metrics
    metrics.packetCount++;
    metrics.timestamp = frame.timestamp;

    // Forward frame unchanged
    controller.enqueue(frame);

    // Periodically report metrics to main thread
    if (metrics.packetCount % this.reportInterval === 0) {
      this.reportMetrics();
    }
  }

  /** Posts aggregated metrics to the main thread via postMessage. */
  protected reportMetrics(): void {
    const metricsObject: Record<
      number,
      { ssrc: number; packetCount: number; timestamp: number }
    > = {};
    for (const [ssrc, metrics] of this.metricsMap.entries()) {
      metricsObject[ssrc] = { ssrc, ...metrics };
    }

    // @ts-ignore
    self.postMessage({
      type: COMMON_MESSAGE_TYPES.METRICS,
      transformName: this.transformName(),
      message: { metrics: JSON.stringify(metricsObject) },
    });
  }
}

/** Collects packet-level metrics for outbound audio streams. */
export class AudioSenderMetricsTransform extends BaseMetricsTransform {
  protected transformName(): string {
    return TRANSFORM_NAMES.AUDIO_SENDER;
  }
}

/** Collects packet-level metrics for inbound audio streams. */
export class AudioReceiverMetricsTransform extends BaseMetricsTransform {
  protected transformName(): string {
    return TRANSFORM_NAMES.AUDIO_RECEIVER;
  }
}

/** Collects packet-level metrics for outbound video streams. */
export class VideoSenderMetricsTransform extends BaseMetricsTransform {
  protected transformName(): string {
    return TRANSFORM_NAMES.VIDEO_SENDER;
  }
}

/** Collects packet-level metrics for inbound video streams. */
export class VideoReceiverMetricsTransform extends BaseMetricsTransform {
  protected transformName(): string {
    return TRANSFORM_NAMES.VIDEO_RECEIVER;
  }
}
