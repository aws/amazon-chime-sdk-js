// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Logger } from 'amazon-chime-sdk-js';
import { describe, expect, it, vi } from 'vitest';

import {
  BlurStrength,
  ModelType,
  ProcessorEffect,
} from '../../../../../src/backgroundsegmentation/BackgroundSegmentationConstants';
import {
  BackgroundEffectProcessor,
  BackgroundSettings,
  DEFAULT_BACKGROUND_IMAGE,
  processorConfig,
} from './BackgroundEffect';

const { FakeProcessor } = vi.hoisted(() => {
  /** Stands in for the CDN processor: records calls, reports nothing until told. */
  class FakeProcessor {
    static created: { config: unknown; model: unknown; collector: unknown }[] = [];
    model: ModelType;
    configs: unknown[] = [];
    modelChanges: ModelType[] = [];
    destroyed = false;
    constructor(config: unknown, model: ModelType) {
      this.model = model;
      this.configs.push(config);
    }
    static async create(
      _logger: unknown,
      config: unknown,
      model: ModelType,
      _cpu: unknown,
      _events: unknown,
      collector: unknown
    ): Promise<FakeProcessor> {
      FakeProcessor.created.push({ config, model, collector });
      return new FakeProcessor(config, model);
    }
    getModelType(): ModelType {
      return this.model;
    }
    setModelType(model: ModelType): void {
      this.model = model;
      this.modelChanges.push(model);
    }
    setConfig(config: unknown): void {
      this.configs.push(config);
    }
    async destroy(): Promise<void> {
      this.destroyed = true;
    }
  }
  return { FakeProcessor };
});

// The SDK's CommonJS bundle does not load under vitest (an import cycle): use its sources.
vi.mock('amazon-chime-sdk-js', async () => {
  const constants =
    await import('../../../../../src/backgroundsegmentation/BackgroundSegmentationConstants');
  const metrics =
    await import('../../../../../src/backgroundsegmentation/BackgroundSegmentationMetrics');
  return {
    BackgroundSegmentationBlurStrength: constants.BlurStrength,
    ModelType: constants.ModelType,
    ProcessorEffect: constants.ProcessorEffect,
    BackgroundSegmentationInitializationStatus: metrics.BackgroundSegmentationInitializationStatus,
    BackgroundSegmentationVideoFrameProcessor: FakeProcessor,
  };
});

const logger = { info: () => {}, warn: () => {} } as unknown as Logger;

const settings = (overrides: Partial<BackgroundSettings> = {}): BackgroundSettings => ({
  effect: 'blur',
  blurStrength: 'high',
  color: '#123456',
  model: 'multiclass',
  image: null,
  ...overrides,
});

/** The custom stats reports the SDK's stats collector adds for the processor, as it builds them. */
const processorReport = (segmentationDurationMs: number): { [field: string]: unknown } => ({
  kind: 'video',
  type: 'outbound-rtp',
  videoBgSegSegmentationDurationMs: segmentationDurationMs,
  videoBgSegEffectRenderDurationMs: 0.2,
  videoBgSegFramesPerSegmentation: 2,
  videoBgSegCpuUsagePercent: 2.4,
  videoBgSegErrorCount: 0,
  videoBgSegFramesSubmitted: 13,
  videoBgSegFramesSegmented: 6,
  videoBgSegInitializationDurationMs: 6655,
  videoBgSegModelType: 'selfie_multiclass',
  videoBgSegDelegateType: 'GPU',
});

const initializationReport = (failure: string | null): { [field: string]: unknown } => ({
  kind: 'video',
  videoBgSegAssetLoadingFailure: failure === 'assets' ? 1 : 0,
  videoBgSegAssetLoadingTimeMs: 1200,
  videoBgSegCompatibilityFailure: failure === 'compatibility' ? 1 : 0,
  videoBgSegProcessorCreationFailure: 0,
});

describe('processorConfig', () => {
  it('maps each effect and its setting to the SDK configuration', () => {
    expect(processorConfig(settings())).toEqual({
      type: ProcessorEffect.BLUR,
      blurStrength: BlurStrength.HIGH,
    });
    expect(processorConfig(settings({ blurStrength: 'bogus' }))).toEqual({
      type: ProcessorEffect.BLUR,
      blurStrength: BlurStrength.MEDIUM,
    });
    expect(processorConfig(settings({ effect: 'color' }))).toEqual({
      type: ProcessorEffect.COLOR_REPLACEMENT,
      replacementColor: '#123456',
    });
    expect(processorConfig(settings({ effect: 'image' }))).toEqual({
      type: ProcessorEffect.IMAGE_REPLACEMENT,
      replacementImageURL: DEFAULT_BACKGROUND_IMAGE,
    });
    expect(
      processorConfig(settings({ effect: 'image', image: 'data:image/jpeg;base64,AA' }))
    ).toMatchObject({ replacementImageURL: 'data:image/jpeg;base64,AA' });
    expect(() => processorConfig(settings({ effect: 'none' }))).toThrow();
  });
});

describe('BackgroundEffectProcessor', () => {
  it('creates the processor with the model and leaves its metrics to the SDK', async () => {
    const effect = new BackgroundEffectProcessor(logger);
    await effect.create(settings({ model: 'general' }));
    const created = FakeProcessor.created.at(-1)!;
    expect(created.model).toBe(ModelType.SELFIE_GENERAL);
    // A collector of our own would take the reports away from the SDK's stats collector.
    expect(created.collector).toBeUndefined();
    expect(effect.running).toBe(true);
  });

  it('reconfigures the running processor and switches model only when it changes', async () => {
    const effect = new BackgroundEffectProcessor(logger);
    const processor = (await effect.create(settings())) as unknown as InstanceType<
      typeof FakeProcessor
    >;
    effect.update(settings({ effect: 'color' }));
    effect.update(settings({ effect: 'color', model: 'general' }));
    // The model change alone does not re-send the unchanged configuration.
    expect(processor.configs.length).toBe(2);
    expect(processor.configs.at(-1)).toEqual({
      type: ProcessorEffect.COLOR_REPLACEMENT,
      replacementColor: '#123456',
    });
    expect(processor.modelChanges).toEqual([ModelType.SELFIE_GENERAL]);
  });

  it('reads the processor reports from the metric report while they are current', async () => {
    const effect = new BackgroundEffectProcessor(logger);
    const processor = (await effect.create(settings())) as unknown as InstanceType<
      typeof FakeProcessor
    >;
    const now = Date.now();
    effect.observe([{ kind: 'audio' }, initializationReport(null), processorReport(7)], now);
    expect(effect.status('blur', now)).toMatchObject({
      selectedModel: ModelType.SELFIE_MULTICLASS,
      assetLoadingTimeMs: 1200,
      failure: undefined,
      processor: {
        segmentationDurationMs: 7,
        framesSubmitted: 13,
        estimatedCPUUsagePercentage: 2.4,
        initializationDurationMs: 6655,
        modelType: 'selfie_multiclass',
        delegateType: 'GPU',
      },
    });
    // A second without a report: the charts get a gap, the facts stay.
    effect.observe([], now + 1000);
    expect(effect.status('blur', now + 5000).processor).toBeUndefined();
    expect(effect.status('blur', now + 5000).assetLoadingTimeMs).toBe(1200);

    await effect.destroy();
    expect(processor.destroyed).toBe(true);
    expect(effect.running).toBe(false);
    expect(effect.status('none')).toEqual({ effect: 'none' });
  });

  it('turns a failed initialization into a reason, and ignores reports when nothing runs', async () => {
    const effect = new BackgroundEffectProcessor(logger);
    effect.observe([processorReport(7)]);
    expect(effect.status('blur').processor).toBeUndefined();
    await effect.create(settings());
    effect.observe([initializationReport('compatibility')]);
    expect(effect.status('blur').failure).toBe('compatibility');
  });
});
