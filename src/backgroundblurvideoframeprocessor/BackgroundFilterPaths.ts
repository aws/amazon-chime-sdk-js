// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * paths to assets that will be loaded from CDN
 */
export default interface BackgroundFilterPaths {
  /**
   * Path to the web worker that will processing background segmentation.
   */
  worker: string;
  /**
   * Path to the WASM file for processing background segmenation
   */
  wasm: string;
  /**
   * Path to the WASM file compiled with SIMD support for processing background segmenation
   */
  simd: string;
}
