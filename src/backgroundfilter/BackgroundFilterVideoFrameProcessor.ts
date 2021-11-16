// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BackgroundFilterOptions } from '..';
import { loadWorker } from '../../libs/voicefocus/loader';
import { supportsWASM, supportsWorker } from '../../libs/voicefocus/support';
import { AssetSpec } from '../../libs/voicefocus/voicefocus';
import ModelSpecBuilder from '../backgroundblurprocessor/ModelSpecBuilder';
import BackgroundFilterPaths from '../backgroundfilter/BackgroundFilterPaths';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import Logger from '../logger/Logger';
import ModelSpec from '../modelspec/ModelSpec';
import Versioning from '../versioning/Versioning';
import BackgroundFilterSpec from './BackgroundFilterSpec';

/** @internal */
const CREATE_DEFAULT_MODEL_SPEC = (): ModelSpec =>
  ModelSpecBuilder.builder().withSelfieSegmentationDefaults().build();

/** @internal */
const DEFAULT_CDN = 'https://static.sdkassets.chime.aws';

/** @internal */
const DEFAULT_PATHS: BackgroundFilterPaths = {
  worker: `${DEFAULT_CDN}/bgblur/workers/worker.js`,
  wasm: `${DEFAULT_CDN}/bgblur/wasm/_cwt-wasm.wasm`,
  simd: `${DEFAULT_CDN}/bgblur/wasm/_cwt-wasm-simd.wasm`,
};

export default class BackgroundFilterVideoFrameProcessor {
  /**
   * Based on the SDK version, return an asset group.
   *
   * @returns the default asset spec, based on the SDK version.
   */
  private static defaultAssetSpec(): AssetSpec {
    const version = Versioning.sdkVersionSemVer;

    return {
      assetGroup: `sdk-${version.major}.${version.minor}`,
    };
  }

  /**
   * Set the given parameters to the url. Existing parameters in the url are preserved.
   * If duplicate parameters exist, they are overwritten, so it's safe to call this method multiple
   * times on the same url.
   *
   * @param url the initial url, can include query parameters
   * @param queryParams the query parameters to set
   * @returns a new url with the given query parameters.
   */
  private static createUrlWithParams(url: string, queryParams: { [key: string]: string }): string {
    const u = new URL(url);
    const keys = Object.keys(queryParams);
    for (const key of keys) {
      if (queryParams[key] !== undefined) {
        u.searchParams.set(key, queryParams[key]);
      }
    }

    return u.toString();
  }

  /**
   * Based on the spec that is passed in set defaults for spec
   * @param spec the spec that was passed in
   * @returns An updated spec with defaults set
   */
  protected static resolveSpec(spec?: BackgroundFilterSpec): BackgroundFilterSpec {
    const {
      paths = DEFAULT_PATHS,
      model = CREATE_DEFAULT_MODEL_SPEC(),
      assetGroup = this.defaultAssetSpec().assetGroup,
      revisionID = this.defaultAssetSpec().revisionID,
    } = spec || {};

    const params = {
      assetGroup,
      revisionID,
      sdk: encodeURIComponent(Versioning.sdkVersion),
      ua: encodeURIComponent(Versioning.sdkUserAgentLowResolution),
    };

    paths.worker = this.createUrlWithParams(paths.worker, params);
    paths.wasm = this.createUrlWithParams(paths.wasm, params);
    paths.simd = this.createUrlWithParams(paths.simd, params);
    model.path = this.createUrlWithParams(model.path, params);

    return {
      paths,
      model,
      assetGroup,
      revisionID,
    };
  }

  /**
   * Based on the options that are passed in set defaults for options
   * @param options  the options that are passed in
   * @returns An updated set of options with defaults set
   */
  protected static resolveOptions(options?: BackgroundFilterOptions): BackgroundFilterOptions {
    if (!options.reportingPeriodMillis) {
      options.reportingPeriodMillis = 1000;
    }

    const DEFAULT_FILTER_CPU_UTILIZATION = 30;
    if (!options.filterCPUUtilization) {
      options.filterCPUUtilization = DEFAULT_FILTER_CPU_UTILIZATION;
    } else if (options.filterCPUUtilization < 0 || options.filterCPUUtilization > 100) {
      options.logger.warn(
        `filterCPUUtilization must be set to a range between 0 and 100 percent. Falling back to default of ${DEFAULT_FILTER_CPU_UTILIZATION} percent`
      );
      options.filterCPUUtilization = DEFAULT_FILTER_CPU_UTILIZATION;
    }
    return options;
  }

  /**
   * This method will detect the environment in which it is being used and determine if background
   * blur/replacement can be used.
   * @param spec The {@link BackgroundBlurSpec} spec that will be used to initialize assets
   * @param options options such as logger
   * @returns a boolean promise that will resolve to true if supported and false if not
   */
  static isSupported(spec?: BackgroundFilterSpec, options?: { logger?: Logger }): Promise<boolean> {
    const { logger } = options;

    // could not figure out how to remove globalThis to test failure case
    /* istanbul ignore next */
    if (typeof globalThis === 'undefined') {
      logger.info('Browser does not have globalThis.');
      return Promise.resolve(false);
    }

    const browser = new DefaultBrowserBehavior();
    if (!browser.supportsBackgroundFilter()) {
      logger.info('Browser is not supported.');
      return Promise.resolve(false);
    }

    if (!supportsWASM(globalThis, logger)) {
      logger.info('Browser does not support WASM.');
      return Promise.resolve(false);
    }
    return this.supportsBackgroundBlur(globalThis, spec, logger);
  }

  private static async supportsBackgroundBlur(
    /* istanbul ignore next */
    scope: { Worker?: typeof Worker } = globalThis,
    spec?: BackgroundFilterSpec,
    logger?: Logger
  ): Promise<boolean> {
    if (!supportsWorker(scope, logger)) {
      logger.info('Browser does not support web workers.');
      return false;
    }

    // Use the actual worker path -- it's only 20KB, and it'll get the cache warm.
    const workerURL = spec.paths.worker;
    try {
      const worker = await loadWorker(workerURL, 'BackgroundFilterWorker', {}, null);
      try {
        worker.terminate();
      } catch (e) {
        logger.info(`Failed to terminate worker. ${e.message}`);
      }
      return true;
    } catch (e) {
      logger.info(`Failed to fetch and instantiate test worker ${e.message}`);
      return false;
    }
  }
}
