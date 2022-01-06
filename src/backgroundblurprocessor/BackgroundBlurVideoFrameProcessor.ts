// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackgroundFilterSpec from '../backgroundfilter/BackgroundFilterSpec';
import BackgroundFilterVideoFrameProcessor from '../backgroundfilter/BackgroundFilterVideoFrameProcessor';
import ConsoleLogger from '../logger/ConsoleLogger';
import Logger from '../logger/Logger';
import LogLevel from '../logger/LogLevel';
import NoOpVideoFrameProcessor from '../videoframeprocessor/NoOpVideoFrameProcessor';
import BackgroundBlurOptions from './BackgroundBlurOptions';
import BackgroundBlurProcessor from './BackgroundBlurProcessor';
import BackgroundBlurProcessorBuiltIn from './BackgroundBlurProcessorBuiltIn';
import BackgroundBlurProcessorProvided from './BackgroundBlurProcessorProvided';
import BlurStrength from './BackgroundBlurStrength';

/**
 * No-op implementation of the blur processor. An instance of this class will be returned when a user attempts
 * to create a blur processor when it is not supported.
 */
/** @internal */
class NoOpBackgroundBlurProcessor
  extends NoOpVideoFrameProcessor
  implements BackgroundBlurProcessor {
  /**
   * no-op
   */
  setBlurStrength(): void {}

  /**
   * no-op
   * @returns
   */
  async loadAssets(): Promise<void> {
    return;
  }

  /**
   * no-op
   */
  addObserver(): void {}

  /**
   * no-op
   */
  removeObserver(): void {}
}

/**
 * [[BackgroundBlurVideoFrameProcessor]]
 * Creates a background blur processor which identifies the foreground person and blurs the background.
 */
export default class BackgroundBlurVideoFrameProcessor extends BackgroundFilterVideoFrameProcessor {
  /**
   * A factory method that will call the private constructor to instantiate the processor and asynchronously
   * initialize the worker, wasm, and ML models. Upon completion of the initialization the promise will either
   * be resolved or rejected.
   * @param spec The spec defines the assets that will be used for adding background blur to a frame
   * @param blurStrength How much blur to apply to a frame
   * @returns
   */
  static async create(
    spec?: BackgroundFilterSpec,
    options?: BackgroundBlurOptions
  ): Promise<BackgroundBlurProcessor | undefined> {
    spec = BackgroundBlurVideoFrameProcessor.resolveSpec(spec);
    options = BackgroundBlurVideoFrameProcessor.resolveOptions(options);
    const { logger } = options;

    const supported = await BackgroundBlurVideoFrameProcessor.isSupported(spec, options);
    // if blur is not supported do not initialize. The processor will become a no op if not supported.
    logger.info(`processor is ${supported ? '' : 'not'} supported`);
    if (!supported) {
      logger.warn('Using no-op processor because background blur is not supported');
      return new NoOpBackgroundBlurProcessor();
    }

    let processor: BackgroundBlurProcessor;
    if (await BackgroundBlurProcessorProvided.isSupported()) {
      logger.info('Using browser-provided background blur');
      processor = new BackgroundBlurProcessorProvided(spec, options);
    } else {
      logger.info('Using built-in background blur');
      processor = new BackgroundBlurProcessorBuiltIn(spec, options);
    }

    await processor.loadAssets();
    return processor;
  }

  /**
   * Based on the options that are passed in set defaults for options
   * @param options  the options that are passed in
   * @returns An updated set of options with defaults set
   */
  protected static resolveOptions(options: BackgroundBlurOptions = {}): BackgroundBlurOptions {
    if (!options.blurStrength) {
      options.blurStrength = BlurStrength.MEDIUM;
    }

    if (!options.logger) {
      options.logger = new ConsoleLogger('BackgroundBlurProcessor', LogLevel.INFO);
    }
    options = super.resolveOptions(options);
    return options;
  }

  /**
   * This method will detect the environment in which it is being used and determine if background
   * blur can be used.
   * @param spec The {@link BackgroundBlurSpec} spec that will be used to initialize assets
   * @param options options such as logger
   * @returns a boolean promise that will resolve to true if supported and false if not
   */
  static isSupported(spec?: BackgroundFilterSpec, options?: { logger?: Logger }): Promise<boolean> {
    spec = BackgroundBlurVideoFrameProcessor.resolveSpec(spec);
    options = BackgroundBlurVideoFrameProcessor.resolveOptions(options);
    return super.isSupported(spec, options);
  }
}
