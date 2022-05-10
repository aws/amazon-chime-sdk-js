// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import DefaultDevicePixelRatioMonitor from '../devicepixelratiomonitor/DefaultDevicePixelRatioMonitor';
import DevicePixelRatioWindowSource from '../devicepixelratiosource/DevicePixelRatioWindowSource';
import Logger from '../logger/Logger';
import { Maybe } from '../utils/Types';
import DefaultVideoTile from '../videotile/DefaultVideoTile';
import VideoTile from '../videotile/VideoTile';
import VideoTileState from '../videotile/VideoTileState';
import VideoTileFactory from '../videotilefactory/VideoTileFactory';
import VideoTileController from './VideoTileController';

export default class DefaultVideoTileController implements VideoTileController {
  private tileMap = new Map<number, VideoTile>();
  private nextTileId: number = 1;
  private currentLocalTile: VideoTile | null = null;
  private devicePixelRatioMonitor: undefined | DefaultDevicePixelRatioMonitor;
  private currentPausedTilesByIds: Set<number> = new Set<number>();
  keepLastFrameWhenPaused: boolean | undefined = false;

  constructor(
    private tileFactory: VideoTileFactory,
    private audioVideoController: AudioVideoController,
    private logger: Logger
  ) {
    this.keepLastFrameWhenPaused = audioVideoController.configuration.keepLastFrameWhenPaused;
  }

  private createDevicePixelRatioMonitorIfNeeded(): void {
    if (this.devicePixelRatioMonitor) {
      return;
    }
    this.devicePixelRatioMonitor = new DefaultDevicePixelRatioMonitor(
      new DevicePixelRatioWindowSource(),
      this.logger
    );
  }

  private async discardDevicePixelRatioMonitorIfNotNeeded(): Promise<void> {
    if (this.tileMap.size || !this.devicePixelRatioMonitor) {
      return;
    }
    const monitor = this.devicePixelRatioMonitor;
    this.devicePixelRatioMonitor = undefined;
    return monitor.destroy();
  }

  bindVideoElement(tileId: number, videoElement: HTMLVideoElement | null): void {
    const tile = this.getVideoTile(tileId);
    if (tile === null) {
      this.logger.warn(`Ignoring video element binding for unknown tile id ${tileId}`);
      return;
    }
    tile.bindVideoElement(videoElement);
  }

  unbindVideoElement(tileId: number): void {
    const tile = this.getVideoTile(tileId);
    if (tile === null) {
      this.logger.warn(`Ignoring video element un-binding for unknown tile id ${tileId}`);
      return;
    }
    const videoElement = tile.stateRef().boundVideoElement;
    tile.bindVideoElement(null);
    DefaultVideoTile.disconnectVideoStreamFromVideoElement(videoElement, false);
  }

  startLocalVideoTile(): number {
    const tile = this.findOrCreateLocalVideoTile();
    this.currentLocalTile.stateRef().localTileStarted = true;

    this.audioVideoController.update({ needsRenegotiation: true });
    return tile.id();
  }

  stopLocalVideoTile(): void {
    if (!this.currentLocalTile) {
      return;
    }
    this.currentLocalTile.stateRef().localTileStarted = false;
    this.currentLocalTile.bindVideoStream(
      this.audioVideoController.configuration.credentials.attendeeId,
      true,
      null,
      null,
      null,
      null,
      this.audioVideoController.configuration.credentials.externalUserId
    );
    this.audioVideoController.update({ needsRenegotiation: true });
  }

  hasStartedLocalVideoTile(): boolean {
    return !!(this.currentLocalTile && this.currentLocalTile.stateRef().localTileStarted);
  }

  removeLocalVideoTile(): void {
    if (this.currentLocalTile) {
      this.removeVideoTile(this.currentLocalTile.id());
    }
  }

  getLocalVideoTile(): VideoTile | null {
    return this.currentLocalTile;
  }

  pauseVideoTile(tileId: number): void {
    const tile = this.getVideoTile(tileId);
    if (tile) {
      if (!this.currentPausedTilesByIds.has(tileId)) {
        this.audioVideoController.pauseReceivingStream(tile.stateRef().streamId);
        this.currentPausedTilesByIds.add(tileId);
      }
      tile.pause();
    }
  }

  unpauseVideoTile(tileId: number): void {
    const tile = this.getVideoTile(tileId);
    if (tile) {
      if (this.currentPausedTilesByIds.has(tileId)) {
        this.audioVideoController.resumeReceivingStream(tile.stateRef().streamId);
        this.currentPausedTilesByIds.delete(tileId);
      }
      tile.unpause();
    }
  }

  getVideoTile(tileId: number): VideoTile | null {
    return this.tileMap.has(tileId) ? this.tileMap.get(tileId) : null;
  }

  getVideoTileArea(tile: VideoTile): number {
    const state = tile.state();
    let tileHeight = 0;
    let tileWidth = 0;
    if (state.boundVideoElement) {
      tileHeight = state.boundVideoElement.clientHeight * state.devicePixelRatio;
      tileWidth = state.boundVideoElement.clientWidth * state.devicePixelRatio;
    }
    return tileHeight * tileWidth;
  }

  getAllRemoteVideoTiles(): VideoTile[] {
    const result = new Array<VideoTile>();
    this.tileMap.forEach((tile: VideoTile, tileId: number): void => {
      if (!this.currentLocalTile || tileId !== this.currentLocalTile.id()) {
        result.push(tile);
      }
    });
    return result;
  }

  getAllVideoTiles(): VideoTile[] {
    return Array.from(this.tileMap.values());
  }

  addVideoTile(localTile: boolean = false): VideoTile {
    const tileId = this.nextTileId;
    this.nextTileId += 1;
    this.createDevicePixelRatioMonitorIfNeeded();
    const tile = this.tileFactory.makeTile(tileId, localTile, this, this.devicePixelRatioMonitor);
    this.tileMap.set(tileId, tile);
    return tile;
  }

  removeVideoTile(tileId: number): void {
    if (!this.tileMap.has(tileId)) {
      return;
    }
    const tile = this.tileMap.get(tileId);
    if (this.currentLocalTile === tile) {
      this.currentLocalTile = null;
    }
    tile.destroy();
    this.tileMap.delete(tileId);
    this.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
      Maybe.of(observer.videoTileWasRemoved).map(f => f.bind(observer)(tileId));
    });
    this.discardDevicePixelRatioMonitorIfNotNeeded();
  }

  removeVideoTilesByAttendeeId(attendeeId: string): number[] {
    const tilesRemoved: number[] = [];
    for (const tile of this.getAllVideoTiles()) {
      const state = tile.state();
      if (state.boundAttendeeId === attendeeId) {
        this.removeVideoTile(state.tileId);
        tilesRemoved.push(state.tileId);
      }
    }
    return tilesRemoved;
  }

  removeAllVideoTiles(): void {
    const tileIds = Array.from(this.tileMap.keys());
    for (const tileId of tileIds) {
      this.removeVideoTile(tileId);
    }
  }

  sendTileStateUpdate(tileState: VideoTileState): void {
    this.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
      Maybe.of(observer.videoTileDidUpdate).map(f => f.bind(observer)(tileState));
    });
  }

  haveVideoTilesWithStreams(): boolean {
    for (const tile of this.getAllVideoTiles()) {
      if (tile.state().boundVideoStream) {
        return true;
      }
    }
    return false;
  }

  haveVideoTileForAttendeeId(attendeeId: string): boolean {
    return !!this.getVideoTileForAttendeeId(attendeeId);
  }

  getVideoTileForAttendeeId(attendeeId: string): VideoTile | undefined {
    for (const tile of this.getAllVideoTiles()) {
      const state = tile.state();
      if (state.boundAttendeeId === attendeeId) {
        return tile;
      }
    }
    return undefined;
  }

  captureVideoTile(tileId: number): ImageData | null {
    const tile = this.getVideoTile(tileId);
    if (!tile) {
      return null;
    }
    return tile.capture();
  }

  private findOrCreateLocalVideoTile(): VideoTile | null {
    if (this.currentLocalTile) {
      return this.currentLocalTile;
    }
    this.currentLocalTile = this.addVideoTile(true);
    this.currentLocalTile.bindVideoStream(
      this.audioVideoController.configuration.credentials.attendeeId,
      true,
      null,
      null,
      null,
      null,
      this.audioVideoController.configuration.credentials.externalUserId
    );
    return this.currentLocalTile;
  }
}
