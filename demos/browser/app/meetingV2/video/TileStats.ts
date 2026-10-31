// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { VideoTileControllerFacade } from 'amazon-chime-sdk-js';

import type { DemoVideoTile } from './VideoTile';

const VideoUpstreamMetricsKeyStats: { [key: string]: string } = {
  videoUpstreamFrameHeight: 'Frame Height',
  videoUpstreamFrameWidth: 'Frame Width',
  videoUpstreamBitrate: 'Bitrate (bps)',
  videoUpstreamPacketsSent: 'Packets Sent',
  videoUpstreamPacketLossPercent: 'Packet Loss (%)',
  videoUpstreamFramesEncodedPerSecond: 'Frame Rate',
};

const VideoDownstreamMetricsKeyStats: { [key: string]: string } = {
  videoDownstreamFrameHeight: 'Frame Height',
  videoDownstreamFrameWidth: 'Frame Width',
  videoDownstreamBitrate: 'Bitrate (bps)',
  videoDownstreamPacketLossPercent: 'Packet Loss (%)',
  videoDownstreamPacketsReceived: 'Packet Received',
  videoDownstreamFramesDecodedPerSecond: 'Frame Rate',
};

export type VideoMetricReport = {
  [attendeeId: string]: { [ssrc: string]: { [metric: string]: number } };
};

/** Developer overlay: each unpaused tile shows its key WebRTC metrics while turned on. */
export default class TileStats {
  private showing = false;

  constructor(
    private videoTileController: VideoTileControllerFacade,
    private tiles: ReadonlyMap<number, DemoVideoTile>,
    private tileFor: (tileId: number) => DemoVideoTile | undefined
  ) {}

  setShowing(showing: boolean): void {
    this.showing = showing;
    if (!showing) {
      for (const tile of this.tiles.values()) {
        tile.clearVideoStats();
      }
    }
  }

  show(videoMetricReport: VideoMetricReport): void {
    if (!this.showing) {
      return;
    }
    for (const videoTile of this.videoTileController.getAllVideoTiles()) {
      const tileState = videoTile.state();
      if (tileState.paused) {
        continue;
      }
      const tile = this.tileFor(videoTile.id());
      if (!tile) {
        continue;
      }
      if (tileState.localTile) {
        tile.showVideoStats(
          VideoUpstreamMetricsKeyStats,
          videoMetricReport[tileState.boundAttendeeId!],
          'Upstream'
        );
      } else {
        tile.showVideoStats(
          VideoDownstreamMetricsKeyStats,
          videoMetricReport[tileState.boundAttendeeId!],
          'Downstream'
        );
      }
    }
  }
}
