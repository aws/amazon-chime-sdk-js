// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import EventController from '../eventcontroller/EventController';
import EventName from '../eventcontroller/EventName';
import VideoFXEventAttributes from '../eventcontroller/VideoFXEventAttributes';
import Logger from '../logger/Logger';
import VideoFrameBuffer from '../videoframeprocessor/VideoFrameBuffer';
import VideoFrameProcessor from '../videoframeprocessor/VideoFrameProcessor';
import BackgroundSegmentationAssetLoader from './BackgroundSegmentationAssetLoader';
import BackgroundSegmentationCompatibilityChecker from './BackgroundSegmentationCompatibilityChecker';
import {
  BackgroundSegmentationVideoFrameProcessorConfig,
  BlurStrength,
  ModelType,
  ProcessorEffect,
} from './BackgroundSegmentationConstants';
import BackgroundSegmentationMetrics, {
  BackgroundSegmentationMetricsObserver,
  BackgroundSegmentationProcessorMetrics,
} from './BackgroundSegmentationMetrics';

/**
 * Thin wrapper around the CDN-hosted background segmentation processor.
 *
 * All calls pipe through to the underlying CDN processor instance. If the
 * CDN processor fails to load, this falls back to a no-op passthrough that
 * returns frames unmodified.
 */
export default class BackgroundSegmentationVideoFrameProcessor implements VideoFrameProcessor {
  private constructor(
    private logger: Logger,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private cdnProcessor: any | null,
    private metrics: BackgroundSegmentationMetrics,
    private eventController?: EventController
  ) {}

  /**
   * Load the CDN processor script, instantiate it, and return a wrapper.
   * On failure, returns a no-op wrapper that passes frames through unchanged.
   */
  static async create(
    logger: Logger,
    config: BackgroundSegmentationVideoFrameProcessorConfig,
    modelType: ModelType = ModelType.SELFIE_GENERAL,
    cpuUsagePercentage?: number,
    eventController?: EventController,
    metricsCollector?: BackgroundSegmentationMetricsObserver
  ): Promise<BackgroundSegmentationVideoFrameProcessor> {
    const metrics = new BackgroundSegmentationMetrics(logger, metricsCollector);

    logger.info(
      `[BackgroundSegmentationVideoFrameProcessor] Creating processor: model=${modelType}, effect=${config.type}`
    );

    const compatibility = BackgroundSegmentationCompatibilityChecker.checkCompatibility(logger);
    metrics.reportCompatibilityCheck(compatibility.isCompatible);

    if (!compatibility.isCompatible) {
      logger.warn(
        `[BackgroundSegmentationVideoFrameProcessor] Browser not compatible, missing: [${compatibility.missingFeatures.join(', ')}]`
      );
      metrics.reportAssetLoadingResult(
        `Missing features: ${compatibility.missingFeatures.join(', ')}`
      );
      BackgroundSegmentationVideoFrameProcessor.publishFilterFailedEvent(
        eventController,
        'compatibility-check-failed',
        `Missing features: ${compatibility.missingFeatures.join(', ')}`
      ).catch(e =>
        logger.error(
          `[BackgroundSegmentationVideoFrameProcessor] Failed to publish error event: ${e}`
        )
      );

      metrics.emitInitializationMetrics();
      return new BackgroundSegmentationVideoFrameProcessor(logger, null, metrics, eventController);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navWithMemory = navigator as any;
    const deviceMemory = navWithMemory.deviceMemory;
    const cpuCores = navigator.hardwareConcurrency;
    logger.info(
      `[BackgroundSegmentationVideoFrameProcessor] Device resources: memory=${deviceMemory || 'unknown'}GB, cores=${cpuCores || 'unknown'}`
    );

    try {
      const loader = new BackgroundSegmentationAssetLoader(logger);
      const loadTimeMs = await loader.load();

      logger.info(
        `[BackgroundSegmentationVideoFrameProcessor] CDN assets loaded in ${loadTimeMs.toFixed(2)}ms`
      );
      metrics.reportAssetLoadingResult(undefined, loadTimeMs);
    } catch (error) {
      /* istanbul ignore next */
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        `[BackgroundSegmentationVideoFrameProcessor] ✗ Failed to load CDN assets: ${errorMessage}`
      );
      metrics.reportAssetLoadingResult(errorMessage);
      BackgroundSegmentationVideoFrameProcessor.publishFilterFailedEvent(
        eventController,
        'cdn-loading-failed',
        errorMessage
      ).catch(e =>
        logger.error(
          `[BackgroundSegmentationVideoFrameProcessor] Failed to publish error event: ${e}`
        )
      );

      logger.warn('[BackgroundSegmentationVideoFrameProcessor] Falling back to no-op processor');
      metrics.emitInitializationMetrics();
      return new BackgroundSegmentationVideoFrameProcessor(logger, null, metrics, eventController);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ProcessorClass = (window as any).BackgroundSegmentationProcessor;
      /* istanbul ignore next */
      if (!ProcessorClass) {
        throw new Error(
          'Processor script loaded but BackgroundSegmentationProcessor not found on window'
        );
      }
      const cdnProcessor = await ProcessorClass.create(config, modelType, cpuUsagePercentage);

      logger.info(
        `[BackgroundSegmentationVideoFrameProcessor] ✓ Successfully created BackgroundSegmentationProcessor from CDN`
      );

      const processor = new BackgroundSegmentationVideoFrameProcessor(
        logger,
        cdnProcessor,
        metrics,
        eventController
      );

      // Subscribe to periodic processor metrics from CDN processor
      processor.subscribeToProcessorMetrics();

      if (eventController) {
        await processor.publishProcessorConfigEvent('backgroundFilterStarted', config);
      }

      metrics.emitInitializationMetrics();
      return processor;
    } catch (error) {
      /* istanbul ignore next */
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        `[BackgroundSegmentationVideoFrameProcessor] ✗ Failed to create BackgroundSegmentationProcessor: ${errorMessage}`
      );
      metrics.reportProcessorError();
      BackgroundSegmentationVideoFrameProcessor.publishFilterFailedEvent(
        eventController,
        'processor-creation-failed',
        errorMessage
      ).catch(e =>
        logger.error(
          `[BackgroundSegmentationVideoFrameProcessor] Failed to publish error event: ${e}`
        )
      );

      logger.warn('[BackgroundSegmentationVideoFrameProcessor] Falling back to no-op processor');
      metrics.emitInitializationMetrics();
      return new BackgroundSegmentationVideoFrameProcessor(logger, null, metrics, eventController);
    }
  }

  async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    if (!this.cdnProcessor) return buffers;

    try {
      return await this.cdnProcessor.process(buffers);
    } catch (error) {
      /* istanbul ignore next */
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[BackgroundSegmentationVideoFrameProcessor] Processing error: ${errorMessage}`
      );
      return buffers;
    }
  }

  async destroy(): Promise<void> {
    if (!this.cdnProcessor) return;
    try {
      await this.cdnProcessor.destroy();
    } finally {
      this.cdnProcessor = null;
    }
  }

  getConfig(): BackgroundSegmentationVideoFrameProcessorConfig | undefined {
    return this.cdnProcessor?.getConfig();
  }

  setConfig(config: BackgroundSegmentationVideoFrameProcessorConfig): void {
    if (!this.cdnProcessor) return;

    try {
      this.cdnProcessor.setConfig(config);

      // Publish config changed event
      if (this.eventController) {
        this.publishProcessorConfigEvent('backgroundFilterConfigSelected', config).catch(e =>
          this.logger.error(
            `[BackgroundSegmentationVideoFrameProcessor] Failed to publish config changed event: ${e}`
          )
        );
      }
    } catch (error) {
      /* istanbul ignore next */
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[BackgroundSegmentationVideoFrameProcessor] setConfig error: ${errorMessage}`
      );
    }
  }

  getModelType(): ModelType | undefined {
    return this.cdnProcessor?.getModelType();
  }

  setModelType(newModelType: ModelType): void {
    if (!this.cdnProcessor) return;
    this.cdnProcessor.setModelType(newModelType);
  }

  getMaxCPUUsagePercentage(): number | undefined {
    return this.cdnProcessor?.getMaxCPUUsagePercentage();
  }

  setMaxCPUUsagePercentage(percentage: number): void {
    this.cdnProcessor?.setMaxCPUUsagePercentage(percentage);
  }

  /** @internal */
  setEventController(eventController: EventController): void {
    this.eventController = eventController;

    if (this.cdnProcessor) {
      const config = this.getConfig();
      if (config) {
        this.publishProcessorConfigEvent('backgroundFilterStarted', config).catch(e =>
          this.logger.error(
            `[BackgroundSegmentationVideoFrameProcessor] Failed to publish started event: ${e}`
          )
        );
      }
    }
  }

  /** @internal */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMetricsCollector(metricsCollector: any): void {
    this.metrics.setMetricsCollector(metricsCollector);
  }

  subscribeToProcessorMetrics(): void {
    if (!this.cdnProcessor || typeof this.cdnProcessor.addMetricsObserver !== 'function') {
      return;
    }

    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.cdnProcessor.addMetricsObserver({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metricsDidReceive: (cdnMetrics: any) => {
        const processorMetrics: BackgroundSegmentationProcessorMetrics = {
          segmentationDurationMs: cdnMetrics.segmentationDurationMs ?? 0,
          effectRenderDurationMs: cdnMetrics.effectRenderDurationMs ?? 0,
          framesPerSegmentation: cdnMetrics.framesPerSegmentation ?? 0,
          framesSubmitted: cdnMetrics.framesSubmitted ?? 0,
          framesSegmented: cdnMetrics.framesSegmented ?? 0,
          estimatedCPUUsagePercentage: cdnMetrics.estimatedCPUUsagePercentage ?? 0,
          modelType: String(cdnMetrics.modelType ?? 'unknown'),
          delegateType: String(cdnMetrics.delegateType ?? 'unknown'),
          errorCount: cdnMetrics.errorCount ?? 0,
        };
        if (cdnMetrics.initializationDurationMs !== undefined) {
          processorMetrics.initializationDurationMs = cdnMetrics.initializationDurationMs;
        }
        if (cdnMetrics.initializationFailure !== undefined) {
          processorMetrics.initializationFailure = cdnMetrics.initializationFailure;
        }
        this.metrics.reportProcessorMetrics(processorMetrics);
      },
    });
  }

  private async publishProcessorConfigEvent(
    eventName: EventName,
    config: BackgroundSegmentationVideoFrameProcessorConfig
  ): Promise<void> {
    /* istanbul ignore next */
    if (!this.eventController) return;

    const attributes: VideoFXEventAttributes = {
      backgroundBlurEnabled: (config.type === ProcessorEffect.BLUR).toString(),
      backgroundBlurStrength:
        config.type === ProcessorEffect.BLUR ? this.getConfig()!.blurStrength : BlurStrength.NONE,
      backgroundReplacementEnabled: (
        config.type === ProcessorEffect.IMAGE_REPLACEMENT ||
        config.type === ProcessorEffect.COLOR_REPLACEMENT
      ).toString(),
      backgroundFilterVersion: 3,
      backgroundFilterModelType: this.getModelType(),
      backgroundFilterEffectType: config.type,
    };

    await this.eventController.publishEvent(eventName, attributes);
  }

  private static async publishFilterFailedEvent(
    eventController: EventController | undefined,
    errorType: string,
    errorMessage: string
  ): Promise<void> {
    if (!eventController) return;
    await eventController.publishEvent('backgroundFilterFailed', {
      backgroundFilterVersion: 3,
      backgroundFilterErrorType: errorType,
      backgroundFilterErrorMessage: errorMessage,
    } as VideoFXEventAttributes);
  }
}
