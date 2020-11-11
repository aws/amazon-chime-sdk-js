// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoTile from '../videotile/VideoTile';
import VideoTileState from '../videotile/VideoTileState';

/**
 * [[VideoTileController]] allows one to manipulate how the underlying media
 * streams are assigned to video elements. The caller is responsible for laying
 * out video elements as desired and binding tile ids received from the observer
 * in the [[videoTileUpdated]] callbacks.
 */
export default interface VideoTileController {
  /**
   * Binds the video element to the tile if it exists for the provided tileId.
   * This should also be called any time the layout of the video element changes, for example, when changing its
   * dimensions.
   */
  bindVideoElement(tileId: number, videoElement: HTMLVideoElement): void;

  /**
   * Unbinds the video element from the tile if it exists for the provided tileId.
   * The video tile's bounded video element and that element's width and height are set to null.
   * This does not remove the provided tileId mapping from the tile map in the [[DefaultVideoTileController]].
   * To remove the mapping and destroy the tile for this tileId, you can use [[removeVideoTile]].
   */
  unbindVideoElement(tileId: number): void;

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
   * This can be used to capture the image data for a given tile.
   */
  captureVideoTile?(tileId: number): ImageData | null;
}
