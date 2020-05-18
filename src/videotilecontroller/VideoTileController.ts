// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
   * Binds the video element to the tile. This should also be called any time
   * the layout of the video element changes, for example, when changing its
   * dimensions.
   */
  bindVideoElement(tileId: number, videoElement: HTMLVideoElement): void;

  /**
   * Unbinds the video element from the tile.
   */
  unbindVideoElement(tileId: number): void;

  /**
   * Starts sharing the local video tile, creating a new video tile if one does
   * not already exist. It returns the the tile id of the video tile.
   */
  startLocalVideoTile(): number;

  /**
   * Stops a local video tile, if it exists.
   */
  stopLocalVideoTile(): void;

  /**
   * Returns whether the local video tile has been started.
   */
  hasStartedLocalVideoTile(): boolean;

  /**
   * Stops and removes a local video tile, if it exists.
   */
  removeLocalVideoTile(): void;

  /**
   * Returns the current local video tile if it exists
   */
  getLocalVideoTile(): VideoTile | null;

  /**
   * Pauses the video tile, if it exists.
   */
  pauseVideoTile(tileId: number): void;

  /**
   * Unpauses the video tile, if it exists.
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
   * Removes a tile by tile id.
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
