// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DevicePixelRatioMonitor from '../devicepixelratiomonitor/DevicePixelRatioMonitor';
import VideoTile from '../videotile/VideoTile';
import VideoTileController from '../videotilecontroller/VideoTileController';

/**
 * [[VideoTileFactory]] provides an interface for creating a video tile.
 */
export default interface VideoTileFactory {
  /**
   * Creates a video tile.
   */
  makeTile(
    tileId: number,
    localTile: boolean,
    tileController: VideoTileController,
    devicePixelRatioMonitor: DevicePixelRatioMonitor
  ): VideoTile;
}
