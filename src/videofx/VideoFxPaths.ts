// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * An interface to define the asset paths that will be loaded from CDN for video effects during meeting
 */
export interface VideoFxPaths {
  /**
   * Base path for CDN
   */
  cdnBasePath: string;

  /**
   * Path to the web worker that will be processing video frames
   */
  workerPath: string;

  /**
   * Path to the library responsible for managing and applying video effects like background blur or replacement.
   */
  fxLibPath: string;
}

export default VideoFxPaths;
