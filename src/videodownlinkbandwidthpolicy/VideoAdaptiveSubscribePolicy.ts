// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoTile from '../videotile/VideoTile';
import VideoTileController from '../videotilecontroller/VideoTileController';
import VideoDownlinkBandwidthPolicy from './VideoDownlinkBandwidthPolicy';

export default class VideoAdaptiveSubscribePolicy implements VideoDownlinkBandwidthPolicy {
  private optimalReceiveSet: VideoStreamIdSet;
  private subscribedReceiveSet: VideoStreamIdSet;
  private bandwidthLimitationKbps: number;
  private videoIndex: VideoStreamIndex;
  private static readonly LOW_RESOLUTION_TILE_AREA_IN_PHYSICAL_PIXELS: number = 240 * 180;
  private static readonly HIGH_RESOLUTION_TILE_AREA_IN_PHYSICAL_PIXELS: number = 512 * 384;
  private static readonly DEFAULT_BANDWIDTH_KBPS = 2000;

  constructor(private selfAttendeeId: string, private tileController: VideoTileController) {
    this.optimalReceiveSet = new DefaultVideoStreamIdSet();
    this.subscribedReceiveSet = new DefaultVideoStreamIdSet();
    this.bandwidthLimitationKbps = VideoAdaptiveSubscribePolicy.DEFAULT_BANDWIDTH_KBPS;
  }

  updateIndex(videoIndex: VideoStreamIndex): void {
    this.videoIndex = videoIndex;
    this.optimalReceiveSet = this.calculateOptimalReceiveSet();
  }

  updateAvailableBandwidth(bandwidthKbps: number): void {
    this.bandwidthLimitationKbps = bandwidthKbps;
    this.optimalReceiveSet = this.calculateOptimalReceiveSet();
  }

  updateCalculatedOptimalReceiveSet(): void {
    this.optimalReceiveSet = this.calculateOptimalReceiveSet();
  }

  wantsResubscribe(): boolean {
    return !this.subscribedReceiveSet.equal(this.optimalReceiveSet);
  }

  chooseSubscriptions(): VideoStreamIdSet {
    this.subscribedReceiveSet = this.optimalReceiveSet.clone();
    return this.subscribedReceiveSet.clone();
  }

  private calculateOptimalReceiveSet(): VideoStreamIdSet {
    const remoteTiles = this.tileController.getAllRemoteVideoTiles();
    const videoSendingAttendees = this.videoIndex.allVideoSendingAttendeesExcludingSelf(
      this.selfAttendeeId
    );
    const lowResTiles = new Set<string>();
    const highResTiles = new Set<string>();

    for (let i = 0; i < remoteTiles.length; i++) {
      const tile = remoteTiles[i];
      const state = tile.state();
      if (state.active && videoSendingAttendees.has(state.boundAttendeeId)) {
        if (this.shouldBeLowResolution(tile)) {
          lowResTiles.add(state.boundAttendeeId);
        }
        if (this.shouldBeHighResolution(tile)) {
          highResTiles.add(state.boundAttendeeId);
        }
      }
    }

    return this.videoIndex.streamSelectionUnderBandwidthConstraint(
      this.selfAttendeeId,
      highResTiles,
      lowResTiles,
      this.bandwidthLimitationKbps
    );
  }

  private shouldBeLowResolution(tile: VideoTile): boolean {
    const tileArea = this.tileController.getVideoTileArea(tile);
    return tileArea < VideoAdaptiveSubscribePolicy.LOW_RESOLUTION_TILE_AREA_IN_PHYSICAL_PIXELS;
  }

  private shouldBeHighResolution(tile: VideoTile): boolean {
    const tileArea = this.tileController.getVideoTileArea(tile);
    return tileArea > VideoAdaptiveSubscribePolicy.HIGH_RESOLUTION_TILE_AREA_IN_PHYSICAL_PIXELS;
  }
}
