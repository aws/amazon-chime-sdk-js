// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AudioVideoObserver,
  Logger,
  TargetDisplaySize,
  VideoQualityAdaptationPreference,
  VideoSource,
  VideoTileControllerFacade,
  VideoTileState,
} from 'amazon-chime-sdk-js';

import RemoteVideoManager from './RemoteVideoManager';
import PaginationManager from './PaginationManager';
import { DemoVideoTile } from './VideoTile'; DemoVideoTile; // Make sure this file is included in webpack

// We use the same config options for multiple settings when configuring
// video tiles, regardless of what they map to internally
type ConfigLevel = 'low' | 'medium' | 'high' | 'max';

const ConfigLevelToVideoPriority: { [Key in ConfigLevel]: number } = {
  low: 200,
  medium: 100,
  high: 10,
  max: 1,
};

const ConfigLevelToTargetDisplaySize: { [Key in ConfigLevel]: TargetDisplaySize } = {
  low: TargetDisplaySize.Low,
  medium: TargetDisplaySize.Medium,
  high: TargetDisplaySize.High,
  max: TargetDisplaySize.Maximum,
};

type DegrationPreferenceString = 'balanced' | 'maintainResolution' | 'maintainFramerate';
 
const StringToVideoQualityAdaptationPreference: { [Key in DegrationPreferenceString]: VideoQualityAdaptationPreference } = {
    balanced: VideoQualityAdaptationPreference.Balanced,
    maintainResolution: VideoQualityAdaptationPreference.MaintainResolution,
    maintainFramerate: VideoQualityAdaptationPreference.MaintainFramerate,
  };
 
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
  tileIndexToDegradationPreferenceEventListener: { [id: number]: (event: Event) => void } = {};

  tileArea = document.getElementById('tile-area') as HTMLDivElement;
  tileIndexToDemoVideoTile = new Map<number, DemoVideoTile>();

  bandwidthConstrainedTiles = new Set<number>();

  _activeSpeakerAttendeeId = "";
  public set activeSpeakerAttendeeId(id: string) {
    this.logger.info(`setting act spk to ${id}`)
    this._activeSpeakerAttendeeId = id;
    this.layoutFeaturedTile();
  }

  statsReportCount: number = 0;
  statsReportInterval: number = 10;

  pagination: PaginationManager<string>;

  constructor(private videoTileController: VideoTileControllerFacade,
    private logger: Logger,
    private remoteVideoManager: RemoteVideoManager,
    private pageSize: number,
    private localAttendeeId: string) {
    this.setupVideoTiles();

    if (!this.remoteVideoManager.supportsRemoteVideoPreferences()) {
      // Don't show priority related configuration if we don't support it
      for (let i = 0; i <= TileOrganizer.MaxTiles; i++) {
        this.tileIndexToDemoVideoTile.get(i).showRemoteVideoPreferences = false;
      }
    }

    this.pagination = new PaginationManager<string>(this.pageSize);
    document.getElementById('video-paginate-left').addEventListener('click', (event: Event) => { this.paginateLeft() });
    document.getElementById('video-paginate-right').addEventListener('click', (event: Event) => { this.paginateRight() });
    this.updatePaginatedVisibleTiles();
  }

  remoteVideoSourcesDidChange(videoSources: VideoSource[]): void {
    // Add these sources to the pagination list
    for (const source of videoSources) {
        this.pagination.add(source.attendee.attendeeId);
    }
    const localTileId = this.localTileId()
    this.pagination.removeIf((value: string) => {
      return !videoSources.some((source: VideoSource) => source.attendee.attendeeId === value) && (localTileId && this.tileIdToAttendeeId[localTileId] !== value);
    });

    // Update the preference manager explicitly as it needs to add default preferences
    this.remoteVideoManager.ensureDefaultPreferences(videoSources);
    this.updatePaginatedVisibleTiles();
  }

  videoTileDidUpdate(tileState: VideoTileState): void {
    this.logger.info(`video tile updated: ${JSON.stringify(tileState, null, '  ')}`);
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

    if (this.remoteVideoManager.supportsRemoteVideoPreferences() && !tileState.localTile) { // No current config possible on local tile
      this.logger.info('adding config listeners for tileIndex ' + tileIndex);
      demoVideoTile.targetResolutionRadioElement.removeEventListener('click', this.tileIndexToTargetResolutionEventListener[tileIndex]);
      this.tileIndexToTargetResolutionEventListener[tileIndex] = this.createTargetResolutionListener(tileState);
      demoVideoTile.targetResolutionRadioElement.addEventListener('click', this.tileIndexToTargetResolutionEventListener[tileIndex]);

      demoVideoTile.videoPriorityRadioElement.removeEventListener('click', this.tileIndexToPriorityEventListener[tileIndex]);
      this.tileIndexToPriorityEventListener[tileIndex] = this.createVideoPriorityListener(tileState);
      demoVideoTile.videoPriorityRadioElement.addEventListener('click', this.tileIndexToPriorityEventListener[tileIndex]);

      demoVideoTile.videoDegradationPreferenceRadioElement.removeEventListener('click', this.tileIndexToDegradationPreferenceEventListener[tileIndex]);
      this.tileIndexToDegradationPreferenceEventListener[tileIndex] = this.createVideoDegradationPreferenceListener(tileState);
      demoVideoTile.videoDegradationPreferenceRadioElement.addEventListener('click', this.tileIndexToDegradationPreferenceEventListener[tileIndex]);
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

    // We need to add local video or content to pagination from tile updates
    const shouldUpdatePagination = tileState.localTile || (tileState.isContent && tileState.boundAttendeeId.startsWith(this.localAttendeeId));
    if (tileState.boundVideoStream) {
        if (shouldUpdatePagination) {
            this.pagination.add(tileState.boundAttendeeId);
        }
    } else {
        // Hide non-active tiles that aren't just paused
        demoVideoTile.hide();
        if (shouldUpdatePagination) {
            this.pagination.remove(tileState.boundAttendeeId);
        }
    }
    this.updatePaginatedVisibleTiles();
    this.updateLayout();
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
      demoVideoTile.videoDegradationPreferenceRadioElement.removeEventListener('click', this.tileIndexToDegradationPreferenceEventListener[tileIndex]);
    }
    demoVideoTile.hide();
    // Clear values
    demoVideoTile.attendeeId = "";
    demoVideoTile.nameplate = "";
    demoVideoTile.pauseState = "";
    this.updateLayout();
  }

  showVideoWebRTCStats(videoMetricReport: { [id: string]: { [id: string]: {} } }): void {
    this.logger.info(`showing stats ${JSON.stringify(videoMetricReport)}`)
    const videoTiles = this.videoTileController.getAllVideoTiles();
    if (videoTiles.length === 0) {
      return;
    }
    for (const videoTile of videoTiles) {
      const tileState = videoTile.state();
      if (tileState.paused) {
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

  collectVideoWebRTCStats(videoMetricReport: { [id: string]: { [id: string]: {} } }): void {
    const videoTiles = this.videoTileController.getAllVideoTiles();
    if (videoTiles.length === 0) {
      return;
    }
    let uplinkStats = new Map<string, number>();
    let downlinkStats = new Map<string, number>();
    let uplinkCount = 0;
    let downlinkCount = 0;
    for (const videoTile of videoTiles) {
      const tileState = videoTile.state();
      if (tileState.paused) {
        continue;
      }
      const tileId = videoTile.id();
      const tileIndex = this.tileIdToTileIndex[tileId];
      const demoVideoTile = this.tileIndexToDemoVideoTile.get(tileIndex);
      if (demoVideoTile === undefined) {
        // Demo tile doesn't exist yet, we probably haven't received any frame
        continue;
      }

      if (tileState.localTile || tileState.isContent) {
        uplinkCount++;
        demoVideoTile.collectVideoStats(VideoUpstreamMetricsKeyStats, videoMetricReport[tileState.boundAttendeeId], 'Upstream', uplinkStats);
      } else {
        downlinkCount++;
        demoVideoTile.collectVideoStats(VideoDownstreamMetricsKeyStats, videoMetricReport[tileState.boundAttendeeId], 'Downstream', downlinkStats);
      }
    }

    // compute average
    if (downlinkCount > 0) {
      for (let [metricName, value] of downlinkStats) {
        downlinkStats.set(metricName, Math.floor(value / downlinkCount));
      }
    }

    // report stats
    this.statsReportCount++;
    if (this.statsReportCount % this.statsReportInterval === 0) {
      if (uplinkCount > 0) {
        let stats: string = "";
        for (let [metricName, value] of uplinkStats) {
          stats += ` | ${metricName}: ${value}`;
        }
        this.logger.info(`  RTCStats  uplink (${uplinkCount}): ${stats}`);
      }
      if (downlinkCount > 0) {
        let stats: string = "";
        for (let [metricName, value] of downlinkStats) {
          stats += ` | ${metricName}: ${value}`;
        }
        this.logger.info(`    RTCStats  downlink (${downlinkCount}): ${stats}`);
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
        if (state.boundAttendeeId.startsWith(this.localAttendeeId) && !this.pagination.currentPage().includes(state.boundAttendeeId)) {
            return null;
         }
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

    this.updateLayout();
  }

  private updateLayout(): void {
    this.tileArea.className = `v-grid size-${this.pagination.currentPage().length}`;

    const localTileId = this.localTileId();
    const activeTile = this.activeTileId();
    if (activeTile && activeTile !== localTileId) {
      this.tileArea.classList.add('featured');
    } else {
      this.tileArea.classList.remove('featured');
    }
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

  private paginateLeft() {
    this.pagination.previousPage();
    this.updatePaginatedVisibleTiles();
  }

  private paginateRight() {
    this.pagination.nextPage();
    this.updatePaginatedVisibleTiles();
  }

  private updatePaginatedVisibleTiles() {
    // Refresh visible attendees incase ones have been added
    let attendeesToShow = this.pagination.currentPage();
    this.logger.info(`Showing current page ${JSON.stringify(attendeesToShow)}`)
    this.remoteVideoManager.visibleAttendees = attendeesToShow;

    // We need to manually control visibility of paused tiles anyways so we just do
    // everything here, even though the preference manager adding/removing will
    // result in tile callbacks as well.
    for (let videoTile of this.tileIndexToDemoVideoTile.values()) {
        if (attendeesToShow.includes(videoTile.attendeeId)) {
            videoTile.show(false);
        } else {
            videoTile.hide();
        }
    }

    const display = (should: boolean): string => { return should ? 'block' : 'none' };
    document.getElementById('video-paginate-left').style.display = display(this.pagination.hasPreviousPage());
    document.getElementById('video-paginate-right').style.display = display(this.pagination.hasNextPage());
  }

  private createTargetResolutionListener(tileState: VideoTileState): (event: Event) => void {
    return (event: Event): void => {
      if (!(event.target instanceof HTMLInputElement)) {
        // Ignore the Label event which will have a stale value
        return;
      }
      const attendeeId = tileState.boundAttendeeId;
      const value = (event.target as HTMLInputElement).value;
      this.logger.info(`target resolution changed for: ${attendeeId} to ${value}`);
      const targetDisplaySize = ConfigLevelToTargetDisplaySize[value as ConfigLevel];
      this.remoteVideoManager.setAttendeeTargetDisplaySize(attendeeId, targetDisplaySize);
    }
  }

  private createVideoPriorityListener(tileState: VideoTileState): (event: Event) => void {
    return (event: Event): void => {
      if (!(event.target instanceof HTMLInputElement)) {
        // Ignore the Label event which will have a stale value
        return;
      }
      const attendeeId = tileState.boundAttendeeId;
      const value = (event.target as HTMLInputElement).value;
      this.logger.info(`priority changed for: ${attendeeId} to ${value}`);
      const priority = ConfigLevelToVideoPriority[value as ConfigLevel];
      this.remoteVideoManager.setAttendeePriority(attendeeId, priority);
    }
  }

  private createVideoDegradationPreferenceListener(tileState: VideoTileState): (event: Event) => void {
    return (event: Event): void => {
      if (!(event.target instanceof HTMLInputElement)) {
        // Ignore the Label event which will have a stale value
        return;
      }
      const attendeeId = tileState.boundAttendeeId;
      const value = (event.target as HTMLInputElement).value;
      const preference = StringToVideoQualityAdaptationPreference[value as DegrationPreferenceString];
      this.logger.info(`degradation preference changed for: ${attendeeId} to ${preference}`);
      this.remoteVideoManager.setAttendeeDegradationPreference(attendeeId, preference);
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
