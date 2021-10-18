// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ModelSpec from '../modelspec/ModelSpec';
import AssetSpec from '../voicefocus/AssetSpec';
import BackgroundFilterPaths from './BackgroundFilterPaths';

/**
 * An interface to define the paths to load the Web Worker JavaScript, WASM, and the definition and path of
 * the model to use to create the segmentation mask.
 *
 * Members of this interface can change without a major version bump to accommodate new browser
 * bugs and capabilities. If you extend this type, you might need to rework your code for new minor
 * versions of this library.
 */
export default interface BackgroundFilterSpec extends AssetSpec {
  /**
   * Paths to resources that need to be loaded for background blur.
   */
  paths?: BackgroundFilterPaths;

  /**
   * Specification to define the parameters for ML model that does the foreground and background
   * segmentation.
   */
  model?: ModelSpec;
}
