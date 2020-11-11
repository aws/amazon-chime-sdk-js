// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[VideoTileState]] encapsulates the state of a [[VideoTile]]
 */
export default class VideoTileState {
  /**
   * The unique identifier for the [[VideoTile]] managed by [[VideoTileController]]. Each attendee can have at most one tileId.
   */
  tileId: number | null = null;

  /**
   * Indication of whether tile is associated with local video.
   */
  localTile: boolean = false;

  /**
   * Indication of whether the tile associated with the local attendee has started to play.
   */
  localTileStarted: boolean = false;

  /**
   * Indication of whether the tile has content-sharing video.
   */
  isContent: boolean = false;

  /**
   * Indication of whether the tile has active video stream.
   */
  active: boolean = false;

  /**
   * Indication of whether the tile has paused video stream.
   */
  paused: boolean = false;

  /**
   * Indication of whether the remote video is paused at publishing attendee. This field is not supported.
   */
  poorConnection: boolean = false;

  /**
   * The attendee id associated with the [[VideoTile]].
   */
  boundAttendeeId: string | null = null;

  /**
   * The user id associated with the [[VideoTile]].
   */
  boundExternalUserId: string | null = null;

  /**
   * The video stream bound with the [[VideoTile]].
   */
  boundVideoStream: MediaStream | null = null;

  /**
   * The HTMLVideoElement bound with the [[VideoTile]].
   */
  boundVideoElement: HTMLVideoElement | null = null;

  /**
   * The nameplate for the [[VideoTile]]. SDK users should use boundExternalUserId for user id instead of this field.
   */
  nameplate: string | null = null;

  /**
   * The intrinsic width of the video stream upon binding with the [[VideoTile]].
   * Video stream intrinsic width could change and developers should use HTMLVideoElement listener for actual intrinsic width.
   */
  videoStreamContentWidth: number | null = null;

  /**
   * The intrinsic height of the video stream upon binding with the [[VideoTile]]
   * Video stream intrinsic height could change and developers should use HTMLVideoElement listener for actual intrinsic height.
   */
  videoStreamContentHeight: number | null = null;

  /**
   * The CSS width in pixel of the HTMLVideoElement upon binding with the [[VideoTile]].
   */
  videoElementCSSWidthPixels: number | null = null;

  /**
   * The CSS height in pixel of the HTMLVideoElement upon binding with the [[VideoTile]].
   */
  videoElementCSSHeightPixels: number | null = null;

  /**
   * The device pixel ratio of the current display monitor.
   */
  devicePixelRatio: number = 0;

  /**
   * The physical width in pixel of the HTMLVideoElement upon binding with the [[VideoTile]].
   */
  videoElementPhysicalWidthPixels: number | null = null;

  /**
   * The physical height in pixel of the HTMLVideoElement upon binding with the [[VideoTile]].
   */
  videoElementPhysicalHeightPixels: number | null = null;

  /**
   * The unique identifier published by server to associate with bound video stream. It is defined in [[SignalingProtocol.proto]].
   * Developers should avoid using this field directly.
   */
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
