// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoTileState from './VideoTileState';

/**
 * [[VideoTile]] is a binding of attendee id, a video stream, and a video element
 * that sends out updates to session observers whenever one of its properties changes.
 */
export default interface VideoTile {
  /**
   * Returns the tile id for this tile.
   */
  id(): number;

  /**
   * Returns a [[VideoTileState]] representing a copy of the state of the tile.
   */
  state(): VideoTileState;

  /**
   * Returns a [[VideoTileState]]] representing a mutable reference to the state of the tile.
   */
  stateRef(): VideoTileState;

  /**
   * Updates current video tile’s state with the provided arguments.
   * If the tile state is updated, the new tile state is sent to the meeting session's
   * AudioVideoObserver's [[videoTileDidUpdate]] callback.
   */
  bindVideoStream(
    attendeeId: string,
    localTile: boolean,
    mediaStream: MediaStream | null,
    contentWidth: number | null,
    contentHeight: number | null,
    streamId: number | null,
    externalUserId?: string
  ): void;

  /**
   * Binds the video element to the tile and sends out updates. This must also be called
   * anytime the display of the video element changes,
   * for example, when changing its dimensions or hiding it. To unbind
   * the video element from the tile pass null.
   */
  bindVideoElement(videoElement: HTMLVideoElement | null): void;

  /**
   * Pauses the tile if it is not paused. When paused, the tile moves to an inactive state.
   * The updated video tile state is sent to the meeting session’s
   * AudioVideoObserver's [[videoTileDidUpdate]] callback.
   * This API is intended to be called on the remote videos. If called on a local video tile,
   * then the tile will no longer be updated, but the local video source will continue to be sent into the meeting.
   */
  pause(): void;

  /**
   * Unpauses the tile if it was paused. When unpaused, the tile moves to the active state.
   * The updated video tile state is sent to the meeting session’s
   * AudioVideoObserver's [[videoTileDidUpdate]] callback.
   * This API is intended to be called on the remote videos and has no effect on the local video.
   * When called on a remote video, the remote video source will start getting the updates if paused earlier.
   */
  unpause(): void;

  /**
   * Marks the tile as having poor connection returning whether it was previously unmarked.
   * The updated video tile state is sent to the meeting session’s
   * AudioVideoObserver's [[videoTileDidUpdate]] callback.
   */
  markPoorConnection(): boolean;

  /**
   * Unmarks the tile as having a poor connection returning whether it was previously marked.
   * The updated video tile state is sent to the meeting session’s
   * AudioVideoObserver's [[videoTileDidUpdate]] callback.
   */
  unmarkPoorConnection(): boolean;

  /**
   * Cleans up resources associated with the tile. The tile may not be used
   * after destroy is called.
   */
  destroy(): void;

  /**
   * Captures a snapshot image from the tile, or null if the tile is not
   * active right now.
   */
  capture(): ImageData | null;
}
