// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AudioVideoObserver,
  Logger,
  TargetDisplaySize,
  VideoTileControllerFacade,
  VideoTileState,
} from 'amazon-chime-sdk-js';

import VideoPreferenceManager from './VideoPreferenceManager';
import { DemoVideoTile } from './VideoTile'; DemoVideoTile; // Make sure this file is included

// We use the same config options for multiple settings when configuring
// video tiles, regardless of what they map to internally
type ConfigLevel = 'low' | 'medium' | 'high';

const ConfigLevelToVideoPriority: {[Key in ConfigLevel]: number} = {
  low: 10,
  medium: 5,
  high: 1,
};

const ConfigLevelToTargetDisplaySize: {[Key in ConfigLevel]: TargetDisplaySize} = {
  low: TargetDisplaySize.Low,
  medium: TargetDisplaySize.Medium,
  high: TargetDisplaySize.High,
};

const VideoUpstreamMetricsKeyStats: { [key: string]: string } = {
  videoUpstreamGoogFrameHeight: 'Frame Height',
  videoUpstreamGoogFrameWidth: 'Frame Width',
  videoUpstreamFrameHeight: 'Frame Height',
  videoUpstreamFrameWidth: 'Frame Width',
  videoUpstreamBitrate: 'Bitrate (bps)',
  videoUpstreamPacketsSent: 'Packets Sent',
  videoUpstreamPacketLossPercent: 'Packet Loss (%)',
  videoUpstreamFramesEncodedPerSecond: 'Frame Rate',
};

const VideoDownstreamMetricsKeyStats: { [key: string]: string } = {
  videoDownstreamGoogFrameHeight: 'Frame Height',
  videoDownstreamGoogFrameWidth: 'Frame Width',
  videoDownstreamFrameHeight: 'Frame Height',
  videoDownstreamFrameWidth: 'Frame Width',
  videoDownstreamBitrate: 'Bitrate (bps)',
  videoDownstreamPacketLossPercent: 'Packet Loss (%)',
  videoDownstreamPacketsReceived: 'Packet Received',
  videoDownstreamFramesDecodedPerSecond: 'Frame Rate',
};

class TileOrganizer {
  // this is index instead of length
  static MaxTiles = 27;
  tiles: { [id: number]: number } = {};
  tileStates: { [id: number]: boolean } = {};
  remoteTileCount = 0;

  acquireTileIndex(tileId: number): number {
    for (let index = 0; index <= TileOrganizer.MaxTiles; index++) {
      if (this.tiles[index] === tileId) {
        return index;
      }
    }
    for (let index = 0; index <= TileOrganizer.MaxTiles; index++) {
      if (!(index in this.tiles)) {
        this.tiles[index] = tileId;
        this.remoteTileCount++;
        return index;
      }
    }
    throw new Error('no tiles are available');
  }

  releaseTileIndex(tileId: number): number {
    for (let index = 0; index <= TileOrganizer.MaxTiles; index++) {
      if (this.tiles[index] === tileId) {
        this.remoteTileCount--;
        delete this.tiles[index];
        return index;
      }
    }
    return TileOrganizer.MaxTiles;
  }
}

export default class VideoTileCollection implements AudioVideoObserver {
  // We reserve the last tile index for local video
  static readonly LocalVideoTileIndex: number = TileOrganizer.MaxTiles;

  tileOrganizer: TileOrganizer = new TileOrganizer();

  tileIndexToTileId: { [id: number]: number } = {};
  tileIdToTileIndex: { [id: number]: number } = {};
  tileIdToAttendeeId: { [id: number]: string } = {};

  // Store these per-tile event listeners so we can avoid leaking them when tile is removed
  tileIndexToPauseEventListener: { [id: number]: (event: Event) => void } = {};
  tileIndexToTargetResolutionEventListener: { [id: number]: (event: Event) => void } = {};
  tileIndexToPriorityEventListener: { [id: number]: (event: Event) => void } = {};
  tileIndexToPriorityPauseEnabledEventListener: { [id: number]: (event: Event) => void } = {};

  tileArea = document.getElementById('tile-area') as HTMLDivElement;
  tileIndexToDemoVideoTile = new Map<number, DemoVideoTile>();

  bandwidthConstrainedTiles = new Set<number>();

  _activeSpeakerAttendeeId = "";
  public set activeSpeakerAttendeeId(id: string) {
    this.logger.info(`setting act spk to ${id}`)
    this._activeSpeakerAttendeeId = id;
    this.layoutFeaturedTile();
  }

  constructor(private videoTileController: VideoTileControllerFacade,
    private logger: Logger,
    private videoPreferenceManager?: VideoPreferenceManager) {
    this.setupVideoTiles();

    if (this.videoPreferenceManager === undefined) {
      // Don't show priority related configuration if we don't support it
      for (let i = 0; i <= TileOrganizer.MaxTiles; i++) {
        this.tileIndexToDemoVideoTile.get(i).showRemoteVideoPreferences = false;
      }
    }
  }

  videoTileDidUpdate(tileState: VideoTileState): void {
    console.log(`video tile updated: ${JSON.stringify(tileState, null, '  ')}`);
    if (!tileState.boundAttendeeId) {
      return;
    }
    const tileIndex = tileState.localTile
      ? VideoTileCollection.LocalVideoTileIndex
      : this.tileOrganizer.acquireTileIndex(tileState.tileId);
    const demoVideoTile = this.tileIndexToDemoVideoTile.get(tileIndex);

    if (!tileState.localTile) { // Pausing local tile doesn't make sense
      demoVideoTile.pauseButtonElement.removeEventListener('click', this.tileIndexToPauseEventListener[tileIndex]);
      this.tileIndexToPauseEventListener[tileIndex] = this.createPauseResumeListener(tileState);
      demoVideoTile.pauseButtonElement.addEventListener('click', this.tileIndexToPauseEventListener[tileIndex]);
    }

    if (this.videoPreferenceManager !== undefined && !tileState.localTile) { // No current config possible on local tile
      this.logger.info('adding config listeners for tileIndex ' + tileIndex);
      demoVideoTile.targetResolutionRadioElement.removeEventListener('click', this.tileIndexToTargetResolutionEventListener[tileIndex]);
      this.tileIndexToTargetResolutionEventListener[tileIndex] = this.createTargetResolutionListener(tileState, demoVideoTile.targetResolutionRadioElement);
      demoVideoTile.targetResolutionRadioElement.addEventListener('click', this.tileIndexToTargetResolutionEventListener[tileIndex]);

      demoVideoTile.videoPriorityRadioElement.removeEventListener('click', this.tileIndexToPriorityEventListener[tileIndex]);
      this.tileIndexToPriorityEventListener[tileIndex] = this.createVideoPriorityListener(tileState, demoVideoTile.videoPriorityRadioElement);
      demoVideoTile.videoPriorityRadioElement.addEventListener('click', this.tileIndexToPriorityEventListener[tileIndex]);

      demoVideoTile.videoPriorityPauseEnabledRadioElement.removeEventListener('click', this.tileIndexToPriorityPauseEnabledEventListener[tileIndex]);
      this.tileIndexToPriorityPauseEnabledEventListener[tileIndex] = this.createVideoPriorityPauseEnabledListener(tileState, demoVideoTile.videoPriorityPauseEnabledRadioElement);
      demoVideoTile.videoPriorityPauseEnabledRadioElement.addEventListener('click', this.tileIndexToPriorityPauseEnabledEventListener[tileIndex]);
    }

    const videoElement = demoVideoTile.videoElement;
    this.logger.info(`binding video tile ${tileState.tileId} to ${videoElement.id}`);
    this.videoTileController.bindVideoElement(tileState.tileId, this.tileIndexToDemoVideoTile.get(tileIndex).videoElement);

    this.tileIndexToTileId[tileIndex] = tileState.tileId;
    this.tileIdToTileIndex[tileState.tileId] = tileIndex;
    this.tileIdToAttendeeId[tileState.tileId] = tileState.boundAttendeeId;
    if (tileState.boundExternalUserId) {
      demoVideoTile.nameplate = tileState.boundExternalUserId.split('#').slice(-1)[0];
    }
    if (tileState.paused && this.bandwidthConstrainedTiles.has(tileState.tileId)) {
      demoVideoTile.pauseState = '⚡';
    } else {
      demoVideoTile.pauseState = '';
    }
    demoVideoTile.attendeeId = tileState.boundAttendeeId;
    demoVideoTile.show(tileState.isContent);
    this.updateGridClasses();
    this.layoutFeaturedTile();
  }

  videoTileWasRemoved(tileId: number): void {
    const tileIndex = this.tileOrganizer.releaseTileIndex(tileId);
    this.logger.info(`video tileId removed: ${tileId} from tile-${tileIndex}`);
    const demoVideoTile = this.tileIndexToDemoVideoTile.get(tileIndex);
    demoVideoTile.pauseButtonElement.removeEventListener('click', this.tileIndexToPauseEventListener[tileIndex]);
    if (true) {
      demoVideoTile.targetResolutionRadioElement.removeEventListener('click', this.tileIndexToTargetResolutionEventListener[tileIndex]);
      demoVideoTile.videoPriorityRadioElement.removeEventListener('click', this.tileIndexToPriorityEventListener[tileIndex]);
    }
    demoVideoTile.hide();
    this.updateGridClasses();
  }

  showVideoWebRTCStats(videoMetricReport: { [id: string]: { [id: string]: {} } }): void {
    this.logger.info(`showing stats ${JSON.stringify(videoMetricReport)}`)
    const videoTiles = this.videoTileController.getAllVideoTiles();
    if (videoTiles.length === 0) {
      return;
    }
    for (const videoTile of videoTiles) {
      const tileState = videoTile.state();
      if (tileState.paused || tileState.isContent) {
        continue;
      }
      const tileId = videoTile.id();
      const tileIndex = this.tileIdToTileIndex[tileId];
      const demoVideoTile = this.tileIndexToDemoVideoTile.get(tileIndex);
      if (tileState.localTile) {
        this.logger.info(`showing stats ${JSON.stringify(videoMetricReport)}`)
        demoVideoTile.showVideoStats(VideoUpstreamMetricsKeyStats, videoMetricReport[tileState.boundAttendeeId], 'Upstream');
      } else {
        demoVideoTile.showVideoStats(VideoDownstreamMetricsKeyStats, videoMetricReport[tileState.boundAttendeeId], 'Downstream');
      }
    }
  }

  private setupVideoTiles(): void {
    const tileArea = document.getElementById(`tile-area`);
    for (let i = 0; i <= TileOrganizer.MaxTiles; i++) {
      const tile = document.createElement('video-tile') as DemoVideoTile
      // `DemoVideoTile` requires being added to DOM before calling any functions
      tileArea.appendChild(tile);

      tile.tileIndex = i;
      if (i === VideoTileCollection.LocalVideoTileIndex) {
        // Don't show config or pause on local video because they don't make sense there
        tile.showConfigDropdown = false;
        tile.showRemoteVideoPreferences = false;
      }

      this.tileIndexToDemoVideoTile.set(i, tile);

      // Setup tile element resizer
      const videoElem = tile.videoElement;
      videoElem.onresize = () => {
        if (videoElem.videoHeight > videoElem.videoWidth) {
          // portrait mode
          videoElem.style.objectFit = 'contain';
          this.logger.info(
            `video-${i} changed to portrait mode resolution ${videoElem.videoWidth}x${videoElem.videoHeight}`
          );
        } else {
          videoElem.style.objectFit = 'cover';
        }
      };
    }
  }

  private tileIdForAttendeeId(attendeeId: string): number | null {
    for (const tile of this.videoTileController.getAllVideoTiles()) {
      const state = tile.state();
      if (state.boundAttendeeId === attendeeId) {
        return state.tileId;
      }
    }
    return null;
  }

  private findContentTileId(): number | null {
    for (const tile of this.videoTileController.getAllVideoTiles()) {
      const state = tile.state();
      if (state.isContent) {
        return state.tileId;
      }
    }
    return null;
  }

  private activeTileId(): number | null {
    let contentTileId = this.findContentTileId();
    if (contentTileId !== null) {
      return contentTileId;
    }
    return this.tileIdForAttendeeId(this._activeSpeakerAttendeeId);
  }

  private layoutFeaturedTile(): void {
    const tilesIndices = this.visibleTileIndices();
    const localTileId = this.localTileId();
    const activeTile = this.activeTileId();

    for (let i = 0; i < tilesIndices.length; i++) {
      const tileIndex = tilesIndices[i];
      const demoVideoTile = this.tileIndexToDemoVideoTile.get(tileIndex);
      const tileId = this.tileIndexToTileId[tileIndex];

      if (tileId === activeTile && tileId !== localTileId) {
        demoVideoTile.featured = true;
      } else {
        demoVideoTile.featured = false;
      }
    }

    this.updateGridClasses();
  }

  private updateGridClasses(): void {
    const localTileId = this.localTileId();
    const activeTile = this.activeTileId();

    this.tileArea.className = `v-grid size-${this.videoTileCount()}`;

    if (activeTile && activeTile !== localTileId) {
      this.tileArea.classList.add('featured');
    } else {
      this.tileArea.classList.remove('featured');
    }
  }

  private videoTileCount(): number {
    return (
      this.tileOrganizer.remoteTileCount + (this.videoTileController.hasStartedLocalVideoTile() ? 1 : 0)
    );
  }

  private localTileId(): number | null {
    return this.videoTileController.hasStartedLocalVideoTile()
      ? this.videoTileController.getLocalVideoTile().state().tileId
      : null;
  }

  private visibleTileIndices(): number[] {
    const tileKeys = Object.keys(this.tileOrganizer.tiles);
    const tiles = tileKeys.map(tileId => parseInt(tileId));
    return tiles;
  }

  private createTargetResolutionListener(tileState: VideoTileState, form: HTMLFormElement): (event: Event) => void {
    return (event: Event): void => {
      if (!(event.target instanceof HTMLInputElement)) {
        // Ignore the Label event which will have a stale value
        return;
      }
      const attendeeId = tileState.boundAttendeeId;
      const value = (form.elements.namedItem('level') as RadioNodeList).value;
      this.logger.info(`target resolution changed for: ${attendeeId} to ${value}`);
      const targetDisplaySize = ConfigLevelToTargetDisplaySize[value as ConfigLevel];
      this.videoPreferenceManager.setAttendeeTargetDisplaySize(attendeeId, targetDisplaySize);
    }
  }

  private createVideoPriorityListener(tileState: VideoTileState, form: HTMLFormElement): (event: Event) => void {
    return (event: Event): void => {
      if (!(event.target instanceof HTMLInputElement)) {
        // Ignore the Label event which will have a stale value
        return;
      }
      const attendeeId = tileState.boundAttendeeId;
      const value = (form.elements.namedItem('level') as RadioNodeList).value;
      this.logger.info(`priority changed for: ${attendeeId} to ${value}`);
      const priority = ConfigLevelToVideoPriority[value as ConfigLevel];
      this.videoPreferenceManager.setAttendeePriority(attendeeId, priority);
    }
  }

  private createVideoPriorityPauseEnabledListener(tileState: VideoTileState, form: HTMLFormElement): (event: Event) => void {
    return (event: Event): void => {
      if (!(event.target instanceof HTMLInputElement)) {
        // Ignore the Label event which will have a stale value
        return;
      }
      const attendeeId = tileState.boundAttendeeId;
      const value = (form.elements.namedItem('level') as RadioNodeList).value;
      this.logger.info(`downlink policy enabled for: ${attendeeId} changed to ${value}`);
      this.videoPreferenceManager.setAttendeeDisableDownlinkPolicyPause(attendeeId, value === 'off');
    }
  }


  private createPauseResumeListener(tileState: VideoTileState): (event: Event) => void {
    return (event: Event): void => {
      if (!tileState.paused) {
        this.videoTileController.pauseVideoTile(tileState.tileId);
        (event.target as HTMLButtonElement).innerText = 'Resume';
      } else {
        this.videoTileController.unpauseVideoTile(tileState.tileId);
        (event.target as HTMLButtonElement).innerText = 'Pause';
      }
    }
  }
}
