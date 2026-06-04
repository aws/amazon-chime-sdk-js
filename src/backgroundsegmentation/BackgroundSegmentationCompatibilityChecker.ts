// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';

/**
 * Checks browser compatibility for background segmentation processing
 * This runs before attempting to load any CDN assets
 */
export default class BackgroundSegmentationCompatibilityChecker {
  static checkCompatibility(logger: Logger): BackgroundSegmentationCompatibilityResult {
    const checks = {
      webgl2: this.hasWebGL2Support(logger),
      webWorkers: this.hasWebWorkerSupport(),
      webAssembly: this.hasWebAssemblySupport(),
      offscreenCanvas: this.hasOffscreenCanvasSupport(logger),
    };

    const missingFeatures = Object.entries(checks)
      .filter(([_, supported]) => !supported)
      .map(([feature, _]) => feature);

    const isCompatible = missingFeatures.length === 0;

    logger.info(
      `[BackgroundSegmentationCompatibilityChecker] Compatibility: ${isCompatible}, missing: [${missingFeatures.join(', ')}]`
    );

    return {
      isCompatible,
      missingFeatures,
    };
  }

  private static hasWebGL2Support(logger: Logger): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      const supported = gl !== null;

      if (supported) {
        // Release the context so it doesn't count against the browser limit
        const loseCtx = gl.getExtension('WEBGL_lose_context');
        if (loseCtx) {
          loseCtx.loseContext();
        }
      }
      return supported;
    } catch (error) {
      logger.error(`[BackgroundSegmentationCompatibilityChecker] WebGL2 check error: ${error}`);
      return false;
    }
  }

  private static hasWebWorkerSupport(): boolean {
    return typeof Worker !== 'undefined';
  }

  private static hasWebAssemblySupport(): boolean {
    return typeof WebAssembly !== 'undefined';
  }

  private static hasOffscreenCanvasSupport(logger: Logger): boolean {
    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        const offscreen = new OffscreenCanvas(1, 1);
        const ctx = offscreen.getContext('2d');
        return ctx !== null;
      } catch (error) {
        logger.warn(
          `[BackgroundSegmentationCompatibilityChecker] OffscreenCanvas instantiation error: ${error}`
        );
        return false;
      }
    }
    return false;
  }
}

export interface BackgroundSegmentationCompatibilityResult {
  isCompatible: boolean;
  missingFeatures: string[];
}
