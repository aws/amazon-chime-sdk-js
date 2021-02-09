// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoTile from '../videotile/VideoTile';

export default interface VideoTileControllerFacade {
  bindVideoElement(tileId: number, videoElement: HTMLVideoElement): void;
  unbindVideoElement(tileId: number): void;
  startLocalVideoTile(): number;
  stopLocalVideoTile(): void;
  hasStartedLocalVideoTile(): boolean;
  removeLocalVideoTile(): void;
  getLocalVideoTile(): VideoTile | null;
  pauseVideoTile(tileId: number): void;
  unpauseVideoTile(tileId: number): void;
  getVideoTile(tileId: number): VideoTile | null;
  getAllRemoteVideoTiles(): VideoTile[];
  getAllVideoTiles(): VideoTile[];
  addVideoTile(): VideoTile;
  removeVideoTile(tileId: number): void;
  removeVideoTilesByAttendeeId(attendeeId: string): number[];
  removeAllVideoTiles(): void;
  captureVideoTile(tileId: number): ImageData | null;
}
