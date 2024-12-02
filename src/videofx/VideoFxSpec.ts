// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoFxPaths from './VideoFxPaths';

/**
 * An interface to specify customizable resources such as asset paths that will be presented as an input to VideoFxProcessor
 */
export interface VideoFxSpec {
  /**
   * Paths that will be loaded from CDN for video effects.
   */
  paths?: VideoFxPaths;
}

export default VideoFxSpec;
