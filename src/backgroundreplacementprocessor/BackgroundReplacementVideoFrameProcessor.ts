// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BackgroundReplacementOptions } from '..';
import BackgroundFilterSpec from '../backgroundfilter/BackgroundFilterSpec';
import BackgroundFilterVideoFrameProcessor from '../backgroundfilter/BackgroundFilterVideoFrameProcessor';
import BackgroundReplacementProcessor from '../backgroundreplacementprocessor/BackgroundReplacementProcessor';
import ConsoleLogger from '../logger/ConsoleLogger';
import Logger from '../logger/Logger';
import LogLevel from '../logger/LogLevel';
import NoOpVideoFrameProcessor from '../videoframeprocessor/NoOpVideoFrameProcessor';
import BackgroundReplacementFilter from './BackgroundReplacementFilter';

/**
 * No-op implementation of the background replacement processor. An instance of this class will be returned when a user attempts
 * to create a background replacement processor when it is not supported.
 */
/** @internal */
class NoOpBackgroundReplacementProcessor
  extends NoOpVideoFrameProcessor
  implements BackgroundReplacementProcessor {
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

  /**
   * no-op
   */
  async setImageBlob(): Promise<void> {
    return;
  }
}

/**
 * [[BackgroundReplacementVideoFrameProcessor]]
 * Creates a background replacement processor which identifies the foreground person and replaces the background.
 */
export default class BackgroundReplacementVideoFrameProcessor extends BackgroundFilterVideoFrameProcessor {
  /**
   * A factory method that will call the private constructor to instantiate the processor and asynchronously
   * initialize the worker, wasm, and ML models. Upon completion of the initialization the promise will either
   * be resolved or rejected.
   * @param spec The spec defines the assets that will be used for adding background filter to a frame
   * @param imagePath The background replacement image path
   */
  static async create(
    spec?: BackgroundFilterSpec,
    options?: BackgroundReplacementOptions
  ): Promise<BackgroundReplacementProcessor | undefined> {
    spec = this.resolveSpec(spec);
    options = this.resolveOptions(options);
    await this.resolveOptionsAsync(options);
    const { logger } = options;

    const supported = await BackgroundReplacementVideoFrameProcessor.isSupported(spec, options);
    // if background replacement is not supported do not initialize. The processor will become a no op if not supported.
    if (!supported) {
      logger.warn('Using no-op processor because background replacement is not supported');
      return new NoOpBackgroundReplacementProcessor();
    }

    logger.info('Using background replacement filter');
    const processor = new BackgroundReplacementFilter(spec, options);

    await processor.loadAssets();
    return processor;
  }

  /**
   * Based on the options that are passed in set defaults for options
   * @param options  the options that are passed in
   * @returns An updated set of options with defaults set
   */
  protected static resolveOptions(
    options?: BackgroundReplacementOptions
  ): BackgroundReplacementOptions {
    options = options ?? {};
    if (!options.logger) {
      options.logger = new ConsoleLogger('BackgroundReplacementProcessor', LogLevel.INFO);
    }

    return super.resolveOptions(options);
  }

  private static async resolveOptionsAsync(options: BackgroundReplacementOptions): Promise<void> {
    if (!options.imageBlob) {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 100, 100);
      const blob = await new Promise<Blob>(resolve => {
        canvas.toBlob(resolve);
      });
      options.imageBlob = blob;
    }
    return;
  }

  /**
   * This method will detect the environment in which it is being used and determine if background
   * replacement can be used.
   * @param spec The {@link BackgroundFilterSpec} spec that will be used to initialize assets
   * @param options options such as logger and imagePath
   * @returns a boolean promise that will resolve to true if supported and false if not
   */
  static async isSupported(
    spec?: BackgroundFilterSpec,
    options?: { logger?: Logger; imageBlob?: Blob }
  ): Promise<boolean> {
    spec = this.resolveSpec(spec);
    options = this.resolveOptions(options);
    await this.resolveOptionsAsync(options);
    const imageBlob = options.imageBlob;
    const imageUrl = URL.createObjectURL(imageBlob);
    try {
      await BackgroundReplacementFilter.loadImage(imageUrl);
    } catch (e) {
      options.logger.info(`Failed to fetch load replacement image ${e.message}`);
      return false;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
    return super.isSupported(spec, options);
  }
}
