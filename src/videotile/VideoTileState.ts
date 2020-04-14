// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[VideoTileState]] encapsulates the state of a [[VideoTile]]
 */
export default class VideoTileState {
  tileId: number | null = null;
  localTile: boolean = false;
  localTileStarted: boolean = false;
  isContent: boolean = false;
  active: boolean = false;
  paused: boolean = false;
  poorConnection: boolean = false;
  boundAttendeeId: string | null = null;
  boundExternalUserId: string | null = null;
  boundVideoStream: MediaStream | null = null;
  boundVideoElement: HTMLVideoElement | null = null;
  nameplate: string | null = null;
  videoStreamContentWidth: number | null = null;
  videoStreamContentHeight: number | null = null;
  videoElementCSSWidthPixels: number | null = null;
  videoElementCSSHeightPixels: number | null = null;
  devicePixelRatio: number = 0;
  videoElementPhysicalWidthPixels: number | null = null;
  videoElementPhysicalHeightPixels: number | null = null;
  streamId: number | null = null;

  clone(): VideoTileState {
    const cloned = new VideoTileState();
    cloned.tileId = this.tileId;
    cloned.localTile = this.localTile;
    cloned.isContent = this.isContent;
    cloned.active = this.active;
    cloned.paused = this.paused;
    cloned.poorConnection = this.poorConnection;
    cloned.boundAttendeeId = this.boundAttendeeId;
    cloned.boundExternalUserId = this.boundExternalUserId;
    cloned.boundVideoStream = this.boundVideoStream;
    cloned.boundVideoElement = this.boundVideoElement;
    cloned.nameplate = this.nameplate;
    cloned.videoStreamContentWidth = this.videoStreamContentWidth;
    cloned.videoStreamContentHeight = this.videoStreamContentHeight;
    cloned.videoElementCSSWidthPixels = this.videoElementCSSWidthPixels;
    cloned.videoElementCSSHeightPixels = this.videoElementCSSHeightPixels;
    cloned.devicePixelRatio = this.devicePixelRatio;
    cloned.videoElementPhysicalWidthPixels = this.videoElementPhysicalWidthPixels;
    cloned.videoElementPhysicalHeightPixels = this.videoElementPhysicalHeightPixels;
    cloned.streamId = this.streamId;
    return cloned;
  }
}
