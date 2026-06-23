// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import Versioning from '../versioning/Versioning';

const CDN_BASE_URL = 'https://static.sdkassets.chime.aws/background_segmentation/';
const PROCESSOR_PATH = 'otherassets/background-segmentation-processor.js';

export default class BackgroundSegmentationAssetLoader {
  private loadPromise: Promise<number> | null = null;

  constructor(private logger: Logger) {}

  /**
   * Load the processor by inserting a `<script src>` tag pointing at the CDN.
   * Resolves when the script has loaded and `BackgroundSegmentationProcessor`
   * is available on `window`.
   *
   * This method deduplicates concurrent calls by reusing the same promise
   * and allows retries on failure by clearing the promise.
   * If the processor is already loaded on window, returns immediately.
   * If a load is in progress, subsequent calls wait for the same promise instead of
   * creating duplicate script tags. On failure, the promise is cleared to allow retries.
   *
   * @returns Load time in milliseconds (0 if already loaded)
   */
  async load(): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).BackgroundSegmentationProcessor) {
      this.logger.info(
        '[BackgroundSegmentationAssetLoader] BackgroundSegmentationVideoFrameProcessor already loaded, skipping'
      );
      return 0;
    }

    if (!this.loadPromise) {
      this.loadPromise = this.doLoad().catch(err => {
        this.loadPromise = null;
        throw err;
      });
    }

    return this.loadPromise;
  }

  private async doLoad(): Promise<number> {
    const url = new URL(`${CDN_BASE_URL}${PROCESSOR_PATH}`);
    const version = Versioning.sdkVersionSemVer;
    url.searchParams.set('sdkVersion', `sdk-${version.major}.${version.minor}`);
    const src = url.toString();

    this.logger.info(`[BackgroundSegmentationAssetLoader] Loading CDN asset from ${src}`);

    const loadStartTime = performance.now();

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        script.remove();
        reject(new Error(`Failed to load processor script: ${src}`));
      };
      document.head.appendChild(script);
    });

    const loadTimeMs = performance.now() - loadStartTime;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).BackgroundSegmentationProcessor) {
      this.logger.error(
        '[BackgroundSegmentationAssetLoader] BackgroundSegmentationVideoFrameProcessor not found on window object'
      );
      throw new Error(
        'Processor script loaded but BackgroundSegmentationVideoFrameProcessor not found on window'
      );
    }

    this.logger.info(
      `[BackgroundSegmentationAssetLoader] CDN asset loading completed successfully in ${loadTimeMs.toFixed(2)}ms`
    );
    return loadTimeMs;
  }
}
