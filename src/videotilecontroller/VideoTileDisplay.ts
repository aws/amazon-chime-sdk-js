// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoElementDisplay from '../videotile/VideoElementDisplay';

/**
 * [[VideoTileDisplay]] describes how the video element of a remote video tile is displayed.
 */
export default interface VideoTileDisplay extends VideoElementDisplay {
  /**
   * The device pixel ratio of the tile.
   */
  devicePixelRatio: number;
}
