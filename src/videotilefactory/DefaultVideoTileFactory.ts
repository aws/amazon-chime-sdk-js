// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DevicePixelRatioMonitor from '../devicepixelratiomonitor/DevicePixelRatioMonitor';
import DefaultVideoTile from '../videotile/DefaultVideoTile';
import VideoElementResolutionMonitor from '../videotile/VideoElementResolutionMonitor';
import VideoTile from '../videotile/VideoTile';
import VideoTileController from '../videotilecontroller/VideoTileController';
import VideoTileFactory from './VideoTileFactory';

export default class DefaultVideoTileFactory implements VideoTileFactory {
  makeTile(
    tileId: number,
    localTile: boolean,
    tileController: VideoTileController,
    devicePixelRatioMonitor: DevicePixelRatioMonitor,
    resolutionMonitor: VideoElementResolutionMonitor
  ): VideoTile {
    return new DefaultVideoTile(tileId, localTile, tileController, devicePixelRatioMonitor, resolutionMonitor);
  }
}
