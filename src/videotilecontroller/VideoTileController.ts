// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoTile from '../videotile/VideoTile';
import VideoTileState from '../videotile/VideoTileState';

export interface VideoTileResolutionObserver {
  /**
   * Called when the resolution of a  video tile changes.
   *
   * @param attendeeId The unique identifier for the attendee whose video tile resolution has changed.
   * @param newWidth The new width of the video element associated with the attendee's video tile, in pixels.
   * @param newHeight The new height of the video element associated with the attendee's video tile, in pixels.
   */
  videoTileResolutionDidChange(attendeeId: string, newWidth: number, newHeight: number): void;

  /**
   * Called when a  video tile is unbound from the video element.
   *
   * @param attendeeId The unique identifier for the attendee whose video tile has been unbound.
   */
  videoTileUnbound(attendeeId: string): void;
}

/**
 * [[VideoTileController]] allows one to manipulate how the underlying media
 * streams are assigned to video elements. The caller is responsible for laying
 * out video elements as desired and binding tile ids received from the observer
 * in the [[videoTileUpdated]] callbacks.
 */
export default interface VideoTileController {
  keepLastFrameWhenPaused?: boolean | undefined;

  /**
   * Binds the video element to the tile if it exists for the provided tileId.
   * This should also be called any time the layout of the video element changes, for example, when changing its
   * dimensions.
   */
  bindVideoElement(tileId: number, videoElement: HTMLVideoElement): void;

  /**
   * Unbinds the video element from the tile if it exists for the provided `tileId`.
   * The video tile's bounded video element and that element's `width` and `height` are set to null.
   * @param cleanUpVideoElement By default, the bounded video element's `srcObject` is also set to null.
   * Pass `false` for `cleanUpVideoElement`, if you do not intend to set the bounded video element's `srcObject` to `null`.
   * This does not remove the provided `tileId` mapping from the tile map in the [[DefaultVideoTileController]].
   * To remove the mapping and destroy the tile for this `tileId`, you can use [[removeVideoTile]].
   */
  unbindVideoElement(tileId: number, cleanUpVideoElement?: boolean): void;

  /**
   * Starts sharing the local video tile by creating a new video tile if one does not already exist.
   * Binds the created local video tile to the local video stream and then returns its tile id.
   */
  startLocalVideoTile(): number;

  /**
   * Stops a local video tile, if it exists.
   * The bounded video stream associated with the local video tile is released and set to null.
   */
  stopLocalVideoTile(): void;

  /**
   * Returns whether the local video tile has been started.
   */
  hasStartedLocalVideoTile(): boolean;

  /**
   * Stops and removes a local video tile, if it exists.
   * This calls [[removeVideoTile]] internally with the current local tileId.
   */
  removeLocalVideoTile(): void;

  /**
   * Returns the current local video tile if it exists
   */
  getLocalVideoTile(): VideoTile | null;

  /**
   * Pauses the video tile if it exists and sends the updated video tile state
   * to the meeting session's AudioVideoObserver’s [[videoTileDidUpdate]] callback.
   * This API is intended to be called on the remote videos.
   * If called on a local video tile, then the tile will no longer be updated,
   * but the local video source will continue to be sent into the meeting.
   */
  pauseVideoTile(tileId: number): void;

  /**
   * Unpauses the video tile if it exists and sends the updated video tile state
   * to the meeting session's AudioVideoObserver’s [[videoTileDidUpdate]] callback.
   * This API is intended to be called on the remote videos and has no effect on the local video.
   * When called on a remote video tileId, the remote video source will start getting the updates if paused earlier.
   */
  unpauseVideoTile(tileId: number): void;

  /**
   * Looks up a video tile from its tile id
   */
  getVideoTile(tileId: number): VideoTile | null;

  /**
   * Gets a video tile area in physical pixels
   */
  getVideoTileArea(tile: VideoTile): number;

  /**
   * Returns the remote video tile
   */
  getAllRemoteVideoTiles(): VideoTile[];

  /**
   * Get all video tiles.
   */
  getAllVideoTiles(): VideoTile[];

  /**
   * Returns a new tile. The tile id is assigned automatically.
   */
  addVideoTile(): VideoTile;

  /**
   * Disconnects the video source from the video element bounded with the video tile,
   * removes the tile by the tileId and the AudioVideoObserver’s [[videoTileWasRemoved]] callback
   * is called with the removed tile id.
   */
  removeVideoTile(tileId: number): void;

  /**
   * Removes any tiles that have the given attendee id and returns the tile ids of the
   *  tiles removed
   */
  removeVideoTilesByAttendeeId(attendeeId: string): number[];

  /**
   * Removes all the tiles.
   */
  removeAllVideoTiles(): void;

  /**
   * Broadcasts a tile state update to the session observers.
   */
  sendTileStateUpdate(tileState: VideoTileState): void;

  /**
   * Returns whether at least one video tile has a bound media stream.
   */
  haveVideoTilesWithStreams(): boolean;

  /**
   * Returns whether an attendeeId is associated with a video tile
   */
  haveVideoTileForAttendeeId(attendeeId: string): boolean;

  /**
   * Returns the video tile associated with the given attendeeId
   * @param attendeeId The attendeeId to retrieve the video tile
   */
  getVideoTileForAttendeeId?(attendeeId: string): VideoTile | undefined;

  /**
   * This can be used to capture the image data for a given tile.
   */
  captureVideoTile?(tileId: number): ImageData | null;

  /**
   * Registers an observer that will be notified when the resolution of the video element changes,
   * or when the video element is unbound.
   * @param observer An instance of VideoElementResolutionObserver that will receive update notifications.
   */
  registerVideoTileResolutionObserver?(observer: VideoTileResolutionObserver): void;

  /**
   * Removes a previously registered observer, stopping it from receiving any further notifications.
   * @param observer The observer to be removed from the notification queue.
   */
  removeVideoTileResolutionObserver?(observer: VideoTileResolutionObserver): void;
}
