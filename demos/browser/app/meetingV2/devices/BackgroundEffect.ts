// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  BackgroundSegmentationBlurStrength as BlurStrength,
  BackgroundSegmentationProcessorMetrics,
  BackgroundSegmentationVideoFrameProcessor,
  BackgroundSegmentationVideoFrameProcessorConfig,
  Logger,
  ModelType,
  ProcessorEffect,
} from 'amazon-chime-sdk-js';

// Inlined by vite-plugin-singlefile; the image effect uses it until the user uploads their own.
import beachImageUrl from '../assets/beach.jpg';
import { ConfigValues } from '../config/schema';

export type BackgroundEffectKind = ConfigValues['backgroundEffect'];

export const DEFAULT_BACKGROUND_IMAGE = beachImageUrl;

/** What the processor needs for the current effect, from the Settings values and the image. */
export interface BackgroundSettings {
  effect: BackgroundEffectKind;
  blurStrength: string;
  color: string;
  model: string;
  /** A data URL; null for the default image. */
  image: string | null;
}

export function backgroundSettings(values: ConfigValues, image: string | null): BackgroundSettings {
  return {
    effect: values.backgroundEffect,
    blurStrength: values.backgroundBlurStrength,
    color: values.backgroundColor,
    model: values.backgroundModel,
    image,
  };
}

const BLUR_STRENGTHS: Record<string, BlurStrength> = {
  low: BlurStrength.LOW,
  medium: BlurStrength.MEDIUM,
  high: BlurStrength.HIGH,
};

export function modelType(model: string): ModelType {
  return model === 'general' ? ModelType.SELFIE_GENERAL : ModelType.SELFIE_MULTICLASS;
}

/** The processor configuration for an effect other than none. */
export function processorConfig(
  settings: BackgroundSettings
): BackgroundSegmentationVideoFrameProcessorConfig {
  switch (settings.effect) {
    case 'blur':
      return {
        type: ProcessorEffect.BLUR,
        blurStrength: BLUR_STRENGTHS[settings.blurStrength] ?? BlurStrength.MEDIUM,
      };
    case 'color':
      return { type: ProcessorEffect.COLOR_REPLACEMENT, replacementColor: settings.color };
    case 'image':
      return {
        type: ProcessorEffect.IMAGE_REPLACEMENT,
        replacementImageURL: settings.image ?? DEFAULT_BACKGROUND_IMAGE,
      };
    default:
      throw new Error(`No processor for background effect ${settings.effect}`);
  }
}

/** Why the processor did not start, from its initialization report. */
export type BackgroundFailure = 'assets' | 'compatibility' | 'processor';

/** The latest of what the segmentation processor reported, for the stats panel. */
export interface BackgroundStatus {
  effect: BackgroundEffectKind;
  /** The model asked for; the processor may run another (it downgrades on slow devices). */
  selectedModel?: string;
  failure?: BackgroundFailure;
  assetLoadingTimeMs?: number;
  /** Absent once a report is overdue, so charts show a gap rather than a stale value. */
  processor?: BackgroundSegmentationProcessorMetrics;
}

/** The processor reports about once a second; older than this is no longer current. */
const STALE_AFTER_MS = 2500;

/** One entry of `ClientMetricReport.customStatsReports`; the SDK types them as `any`. */
type CustomStatsReport = { [field: string]: unknown };

const number = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/**
 * Owns the one segmentation processor. Switching effect, blur strength, colour, image or model
 * reconfigures the running processor instead of rebuilding it.
 *
 * In a meeting the SDK's stats collector takes the processor's reports (`DefaultVideoTransformDevice`
 * gives it the processor) and passes each one on, once, in `ClientMetricReport.customStatsReports`;
 * `observe` keeps the latest from there. Registering a collector of our own would take the reports,
 * and the initialization report the SDK uploads, away from it.
 */
export class BackgroundEffectProcessor {
  private processor: BackgroundSegmentationVideoFrameProcessor | undefined;
  /** What was last sent: the processor reports the old model while it loads a new one. */
  private model: ModelType | undefined;
  private config = '';
  private failure: BackgroundFailure | undefined;
  private assetLoadingTimeMs: number | undefined;
  private latest: { metrics: BackgroundSegmentationProcessorMetrics; at: number } | undefined;

  constructor(private readonly logger: Logger) {}

  get running(): boolean {
    return this.processor !== undefined;
  }

  async create(settings: BackgroundSettings): Promise<BackgroundSegmentationVideoFrameProcessor> {
    await this.destroy();
    this.logger.info(`[DEMO] Background effect ${settings.effect}, model ${settings.model}`);
    this.model = modelType(settings.model);
    const config = processorConfig(settings);
    this.config = JSON.stringify(config);
    // On failure the SDK returns a processor that passes frames through, and says why in metrics.
    this.processor = await BackgroundSegmentationVideoFrameProcessor.create(
      this.logger,
      config,
      this.model
    );
    return this.processor;
  }

  update(settings: BackgroundSettings): void {
    if (!this.processor) {
      return;
    }
    const model = modelType(settings.model);
    if (this.model !== model) {
      this.model = model;
      this.processor.setModelType(model);
    }
    // Each setConfig is published as a meeting event, so only real changes are sent.
    const config = processorConfig(settings);
    if (JSON.stringify(config) !== this.config) {
      this.config = JSON.stringify(config);
      this.processor.setConfig(config);
    }
  }

  async destroy(): Promise<void> {
    const processor = this.processor;
    this.processor = undefined;
    this.failure = undefined;
    this.assetLoadingTimeMs = undefined;
    this.latest = undefined;
    await processor?.destroy();
  }

  /** Keep what this second's metric report carries about the processor. */
  observe(reports: CustomStatsReport[], now = Date.now()): void {
    if (!this.processor) {
      return;
    }
    for (const report of reports) {
      if (report.videoBgSegAssetLoadingTimeMs !== undefined) {
        this.assetLoadingTimeMs = number(report.videoBgSegAssetLoadingTimeMs) || undefined;
        this.failure = report.videoBgSegCompatibilityFailure
          ? 'compatibility'
          : report.videoBgSegAssetLoadingFailure
            ? 'assets'
            : report.videoBgSegProcessorCreationFailure
              ? 'processor'
              : undefined;
        if (this.failure) {
          this.logger.warn(`[DEMO] Background effect did not start: ${this.failure} failure`);
        }
      }
      if (report.videoBgSegSegmentationDurationMs !== undefined) {
        this.latest = {
          at: now,
          metrics: {
            segmentationDurationMs: number(report.videoBgSegSegmentationDurationMs) ?? 0,
            effectRenderDurationMs: number(report.videoBgSegEffectRenderDurationMs) ?? 0,
            framesPerSegmentation: number(report.videoBgSegFramesPerSegmentation) ?? 0,
            framesSubmitted: number(report.videoBgSegFramesSubmitted) ?? 0,
            framesSegmented: number(report.videoBgSegFramesSegmented) ?? 0,
            estimatedCPUUsagePercentage: number(report.videoBgSegCpuUsagePercent) ?? 0,
            modelType: String(report.videoBgSegModelType ?? ''),
            delegateType: String(report.videoBgSegDelegateType ?? ''),
            errorCount: number(report.videoBgSegErrorCount) ?? 0,
            initializationDurationMs: number(report.videoBgSegInitializationDurationMs),
          },
        };
      }
    }
  }

  status(effect: BackgroundEffectKind, now = Date.now()): BackgroundStatus {
    return {
      effect,
      selectedModel: this.processor ? this.model : undefined,
      failure: this.failure,
      assetLoadingTimeMs: this.assetLoadingTimeMs,
      processor:
        this.latest && now - this.latest.at <= STALE_AFTER_MS ? this.latest.metrics : undefined,
    };
  }
}

/** Longest side of an uploaded background; larger images only cost memory and storage. */
const MAX_IMAGE_SIDE = 1920;

/** Reads an uploaded image, scaled down to at most 1920 px a side, as a JPEG data URL. */
export async function imageFileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    bitmap.close();
  }
}
