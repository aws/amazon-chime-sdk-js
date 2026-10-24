// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Side-effect import: the class is only used in type positions here, so a plain named import
// would be elided and the custom element never registered.
import './VideoTile';

import {
  AudioVideoObserver,
  Logger,
  TargetDisplaySize,
  VideoQualityAdaptationPreference,
  VideoSource,
  VideoTileControllerFacade,
  VideoTileState,
} from 'amazon-chime-sdk-js';

import { STRINGS } from '../strings';
import { displayNameOf } from '../ui/dom';
import AvatarTile from './AvatarTile';
import PaginationManager from './PaginationManager';
import RemoteVideoManager from './RemoteVideoManager';
import { chooseFeatured, stageGrid, type StageLayout } from './stagePolicy';
import TileStats, { type VideoMetricReport } from './TileStats';
import type { DegradationPreference, DemoVideoTile, TileLevel } from './VideoTile';

const LevelToVideoPriority: Record<TileLevel, number> = { low: 200, medium: 100, high: 10, max: 1 };

const LevelToTargetDisplaySize: Record<TileLevel, TargetDisplaySize> = {
  low: TargetDisplaySize.Low,
  medium: TargetDisplaySize.Medium,
  high: TargetDisplaySize.High,
  max: TargetDisplaySize.Maximum,
};

const DegradationToPreference: Record<DegradationPreference, VideoQualityAdaptationPreference> = {
  balanced: VideoQualityAdaptationPreference.Balanced,
  maintainResolution: VideoQualityAdaptationPreference.MaintainResolution,
  maintainFramerate: VideoQualityAdaptationPreference.MaintainFramerate,
};

export type { StageLayout };

class TileOrganizer {
  // Highest remote tile index; the local tile takes the one after it.
  static MaxTiles = 27;
  tiles: { [index: number]: number } = {};

  acquireTileIndex(tileId: number): number {
    for (let index = 0; index <= TileOrganizer.MaxTiles; index++) {
      if (this.tiles[index] === tileId) {
        return index;
      }
    }
    for (let index = 0; index <= TileOrganizer.MaxTiles; index++) {
      if (!(index in this.tiles)) {
        this.tiles[index] = tileId;
        return index;
      }
    }
    throw new Error('no tiles are available');
  }

  releaseTileIndex(tileId: number): number {
    for (let index = 0; index <= TileOrganizer.MaxTiles; index++) {
      if (this.tiles[index] === tileId) {
        delete this.tiles[index];
        return index;
      }
    }
    return TileOrganizer.MaxTiles;
  }
}

export interface VideoTileCollectionOptions {
  onMirrorToggle?: () => void;
  tileArea: HTMLElement;
  paginateLeft: HTMLButtonElement;
  paginateRight: HTMLButtonElement;
  emptyState?: HTMLElement;
  localAttendeeId: string;
  mirrorLocal: boolean;
  /** Leave people without video off the stage instead of showing their name tile. */
  videoOnly: boolean;
  /** The remote video preference knobs are developer options. */
  developerMode: () => boolean;
}

/**
 * Owns the stage: binds SDK video tiles to `<video-tile>` elements, pages them, lays them out,
 * and features the active speaker, a pinned attendee, or content share. Everyone present without
 * video gets an `AvatarTile` after the video tiles unless `videoOnly` is set.
 */
export default class VideoTileCollection implements AudioVideoObserver {
  static readonly LocalVideoTileIndex: number = TileOrganizer.MaxTiles + 1;
  /** Video tiles on one page of the stage; the arrows page through the rest. */
  static readonly PageSize = 25;

  private tileOrganizer = new TileOrganizer();
  private tileIndexToTileId: { [index: number]: number } = {};
  private tileIdToTileIndex: { [tileId: number]: number } = {};
  private tiles = new Map<number, DemoVideoTile>();
  private pinnedAttendeeId: string | null = null;
  private layout: StageLayout = 'speaker';
  private mutedAttendees = new Set<string>();
  private selfViewHidden = false;
  private raisedHands = new Set<string>();
  /** Attendees in the meeting (not content shares), in join order, with display names. */
  private readonly present = new Map<string, string>();
  private readonly avatars = new Map<string, AvatarTile>();
  private remoteVideoAttendees = new Set<string>();
  private localVideoOn = false;
  private readonly reactionTimers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly bandwidthConstrainedTiles = new Set<number>();
  readonly pagination: PaginationManager<string>;
  private readonly stats: TileStats;

  /** Who is audibly talking now (volume, not muted); several people can talk at once. */
  private readonly speakingAttendees = new Set<string>();
  private featuredSpeakerAttendeeId = '';
  private incomingVideoPaused = false;
  private readonly signalStrengths = new Map<string, number>();

  /** The speaking ring; the featured tile follows `setFeaturedSpeaker` instead. */
  setAttendeeSpeaking(attendeeId: string, speaking: boolean): void {
    if (speaking) {
      this.speakingAttendees.add(attendeeId);
    } else {
      this.speakingAttendees.delete(attendeeId);
    }
    const tile = this.tileForAttendee(attendeeId);
    if (tile) {
      tile.speaking = speaking;
    }
    const avatar = this.avatars.get(attendeeId);
    if (avatar) {
      avatar.speaking = speaking;
    }
  }

  setAttendeePresent(attendeeId: string, name: string, present: boolean): void {
    if (present) {
      this.present.set(attendeeId, name);
      this.avatars.get(attendeeId)?.setName(name);
    } else {
      this.present.delete(attendeeId);
    }
    this.updatePaginatedVisibleTiles();
  }

  setVideoOnly(videoOnly: boolean): void {
    this.options.videoOnly = videoOnly;
    this.updatePaginatedVisibleTiles();
  }

  setFeaturedSpeaker(attendeeId: string): void {
    if (attendeeId === this.options.localAttendeeId) {
      return; // you are never featured; the last other speaker stays
    }
    this.featuredSpeakerAttendeeId = attendeeId;
    this.layoutFeaturedTile();
  }

  setAttendeeSignalStrength(attendeeId: string, strength: number): void {
    this.signalStrengths.set(attendeeId, strength);
    const tile = this.tileForAttendee(attendeeId);
    if (tile) {
      tile.signalStrength = strength;
    }
  }

  get isIncomingVideoPaused(): boolean {
    return this.incomingVideoPaused;
  }

  /** Pause every remote camera tile (content share keeps playing); new tiles stay paused while on. */
  setIncomingVideoPaused(paused: boolean): void {
    this.incomingVideoPaused = paused;
    for (const tile of this.videoTileController.getAllVideoTiles()) {
      const state = tile.state();
      if (state.localTile || state.isContent || state.tileId === null) {
        continue;
      }
      if (paused && !state.paused) {
        this.videoTileController.pauseVideoTile(state.tileId);
      } else if (!paused && state.paused && !this.bandwidthConstrainedTiles.has(state.tileId)) {
        this.videoTileController.unpauseVideoTile(state.tileId);
      }
    }
  }

  constructor(
    private videoTileController: VideoTileControllerFacade,
    private logger: Logger,
    private remoteVideoManager: RemoteVideoManager,
    private options: VideoTileCollectionOptions
  ) {
    this.pagination = new PaginationManager<string>(VideoTileCollection.PageSize);
    this.stats = new TileStats(videoTileController, this.tiles, tileId =>
      this.tiles.get(this.tileIdToTileIndex[tileId])
    );
    this.setupVideoTiles();
    options.paginateLeft.addEventListener('click', this.onPaginateLeft);
    options.paginateRight.addEventListener('click', this.onPaginateRight);
    this.updatePaginatedVisibleTiles();
  }

  /** Hide the local tile from the stage (it keeps sending); Teams and Zoom offer the same. */
  setSelfViewHidden(hidden: boolean): void {
    this.selfViewHidden = hidden;
    this.updatePaginatedVisibleTiles();
  }

  get isSelfViewHidden(): boolean {
    return this.selfViewHidden;
  }

  setLayout(layout: StageLayout): void {
    this.layout = layout;
    this.layoutFeaturedTile();
  }

  togglePin(attendeeId: string): void {
    this.pinnedAttendeeId = this.pinnedAttendeeId === attendeeId ? null : attendeeId;
    for (const tile of this.tiles.values()) {
      tile.pinned = tile.attendeeId !== '' && tile.attendeeId === this.pinnedAttendeeId;
    }
    this.layoutFeaturedTile();
  }

  setMirrorLocal(mirror: boolean): void {
    this.options.mirrorLocal = mirror;
    this.tiles.get(VideoTileCollection.LocalVideoTileIndex)!.mirrored = mirror;
  }

  setAttendeeMuted(attendeeId: string, muted: boolean): void {
    muted ? this.mutedAttendees.add(attendeeId) : this.mutedAttendees.delete(attendeeId);
    this.tileForAttendee(attendeeId)?.setMuted(muted);
    this.avatars.get(attendeeId)?.setMuted(muted);
  }

  setAttendeeHandRaised(attendeeId: string, raised: boolean): void {
    raised ? this.raisedHands.add(attendeeId) : this.raisedHands.delete(attendeeId);
    const tile = this.tileForAttendee(attendeeId);
    if (tile) {
      tile.handRaised = raised;
    }
    this.avatars.get(attendeeId)?.setHandRaised(raised);
  }

  /** A newer reaction from the same attendee replaces the older one and restarts its timer. */
  showAttendeeReaction(attendeeId: string, emoji: string, durationMs: number = 4000): void {
    const target: { reaction: string } | undefined =
      this.tileForAttendee(attendeeId) ?? this.avatars.get(attendeeId);
    if (!target) {
      return;
    }
    clearTimeout(this.reactionTimers.get(attendeeId));
    target.reaction = emoji;
    this.reactionTimers.set(
      attendeeId,
      setTimeout(() => {
        this.reactionTimers.delete(attendeeId);
        target.reaction = '';
      }, durationMs)
    );
  }

  private tileForAttendee(attendeeId: string): DemoVideoTile | undefined {
    for (const tile of this.tiles.values()) {
      if (tile.attendeeId === attendeeId) {
        return tile;
      }
    }
    return undefined;
  }

  remoteVideoSourcesDidChange(videoSources: VideoSource[]): void {
    this.remoteVideoAttendees = new Set(videoSources.map(source => source.attendee.attendeeId));
    for (const source of videoSources) {
      this.pagination.add(source.attendee.attendeeId);
    }
    // People still present keep their place on the page as name tiles (renderAvatars).
    this.pagination.removeIf(
      (value: string) =>
        !videoSources.some(source => source.attendee.attendeeId === value) &&
        !this.isLocalAttendee(value) &&
        !this.present.has(value)
    );
    this.remoteVideoManager.ensureDefaultPreferences(videoSources);
    this.updatePaginatedVisibleTiles();
  }

  videoTileDidUpdate(tileState: VideoTileState): void {
    this.logger.info(`video tile updated: ${JSON.stringify(tileState, null, '  ')}`);
    if (!tileState.boundAttendeeId || tileState.tileId === null) {
      return;
    }
    const tileId = tileState.tileId;
    const tileIndex = tileState.localTile
      ? VideoTileCollection.LocalVideoTileIndex
      : this.tileOrganizer.acquireTileIndex(tileId);
    const tile = this.tiles.get(tileIndex)!;
    const attendeeId = tileState.boundAttendeeId;

    if (tileState.localTile && !tileState.isContent) {
      tile.setHandlers({
        onHideSelfView: () => this.setSelfViewHidden(true),
        onMirrorToggle: () => this.options.onMirrorToggle?.(),
      });
    } else {
      tile.setHandlers({
        onPauseToggle: () => {
          if (tileState.localTile) {
            return;
          }
          if (tile.paused) {
            this.videoTileController.unpauseVideoTile(tileId);
          } else {
            this.videoTileController.pauseVideoTile(tileId);
          }
        },
        onPinToggle: () => this.togglePin(attendeeId),
        onTargetResolution: level =>
          this.remoteVideoManager.setAttendeeTargetDisplaySize(
            attendeeId,
            LevelToTargetDisplaySize[level]
          ),
        onPriority: level =>
          this.remoteVideoManager.setAttendeePriority(attendeeId, LevelToVideoPriority[level]),
        onDegradationPreference: preference =>
          this.remoteVideoManager.setAttendeeDegradationPreference(
            attendeeId,
            DegradationToPreference[preference]
          ),
      });
    }

    this.logger.info(`binding video tile ${tileId} to ${tile.videoElement.id}`);
    this.videoTileController.bindVideoElement(tileId, tile.videoElement);

    this.tileIndexToTileId[tileIndex] = tileId;
    this.tileIdToTileIndex[tileId] = tileIndex;
    tile.attendeeId = attendeeId;
    if (tileState.boundExternalUserId) {
      tile.nameplate =
        displayNameOf(tileState.boundExternalUserId) +
        (tileState.isContent
          ? STRINGS.contentSuffix
          : tileState.localTile
            ? STRINGS.youSuffix
            : '');
    }
    tile.paused = tileState.paused;
    tile.pauseState =
      tileState.paused && this.bandwidthConstrainedTiles.has(tileId)
        ? STRINGS.pausedLowBandwidth
        : tileState.paused
          ? STRINGS.paused
          : '';
    tile.local = !!tileState.localTile;
    tile.mirrored = !!tileState.localTile && this.options.mirrorLocal && !tileState.isContent;
    tile.setMuted(this.mutedAttendees.has(attendeeId));
    tile.handRaised = this.raisedHands.has(attendeeId);
    tile.signalStrength = this.signalStrengths.get(attendeeId) ?? 100;
    if (
      this.incomingVideoPaused &&
      !tileState.localTile &&
      !tileState.isContent &&
      !tileState.paused &&
      tileState.tileId !== null
    ) {
      this.videoTileController.pauseVideoTile(tileState.tileId);
    }
    tile.pinned = attendeeId === this.pinnedAttendeeId;
    tile.speaking = this.speakingAttendees.has(attendeeId) && !tileState.isContent;

    const shouldUpdatePagination = this.isLocalAttendee(attendeeId);
    if (tileState.localTile && !tileState.isContent) {
      this.localVideoOn = !!tileState.boundVideoStream;
    }
    if (tileState.boundVideoStream) {
      if (shouldUpdatePagination) {
        this.pagination.add(attendeeId);
      }
    } else {
      tile.hide();
      if (shouldUpdatePagination) {
        this.pagination.remove(attendeeId);
      }
    }
    this.updatePaginatedVisibleTiles();
  }

  videoTileWasRemoved(tileId: number): void {
    const tileIndex = this.tileOrganizer.releaseTileIndex(tileId);
    this.logger.info(`video tileId removed: ${tileId} from tile-${tileIndex}`);
    const tile = this.tiles.get(tileIndex);
    if (!tile) {
      return;
    }
    if (tileIndex === VideoTileCollection.LocalVideoTileIndex) {
      this.localVideoOn = false;
    }
    tile.hide();
    tile.attendeeId = '';
    tile.nameplate = '';
    tile.pauseState = '';
    tile.clearVideoStats();
    delete this.tileIndexToTileId[tileIndex];
    delete this.tileIdToTileIndex[tileId];
    this.layoutFeaturedTile();
  }

  private isLocalAttendee(attendeeId: string): boolean {
    // Covers the local attendee and its content share attendee id.
    return attendeeId.startsWith(this.options.localAttendeeId);
  }

  setShowingStats(showing: boolean): void {
    this.stats.setShowing(showing);
  }

  showVideoWebRTCStats(videoMetricReport: VideoMetricReport): void {
    this.stats.show(videoMetricReport);
  }

  private setupVideoTiles(): void {
    const supportsPreferences = this.remoteVideoManager.supportsRemoteVideoPreferences();
    for (let i = 0; i <= VideoTileCollection.LocalVideoTileIndex; i++) {
      const tile = document.createElement('video-tile') as DemoVideoTile;
      // The custom element builds its children on connect, so append before configuring.
      this.options.tileArea.appendChild(tile);
      tile.tileIndex = i;
      if (supportsPreferences && i !== VideoTileCollection.LocalVideoTileIndex) {
        tile.setRemoteVideoPreferencesShown(this.options.developerMode);
      }
      if (i === VideoTileCollection.LocalVideoTileIndex) {
        tile.local = true;
        tile.mirrored = this.options.mirrorLocal;
        tile.setHandlers({
          onHideSelfView: () => this.setSelfViewHidden(true),
          onMirrorToggle: () => this.options.onMirrorToggle?.(),
        });
      }
      this.tiles.set(i, tile);

      const videoElem = tile.videoElement;
      videoElem.onresize = () => {
        // Content and portrait video are letterboxed instead of cropped.
        videoElem.style.objectFit =
          tile.classList.contains('content') || videoElem.videoHeight > videoElem.videoWidth
            ? 'contain'
            : 'cover';
      };
    }
  }

  private layoutFeaturedTile(): void {
    const chosen = chooseFeatured({
      tiles: this.videoTileController.getAllVideoTiles().map(tile => {
        const state = tile.state();
        return {
          tileId: state.tileId,
          attendeeId: state.boundAttendeeId,
          isContent: state.isContent,
        };
      }),
      localAttendeeId: this.options.localAttendeeId,
      localTileId: this.localTileId(),
      currentPage: this.pagination.currentPage(),
      pinned: this.pinnedAttendeeId,
      layout: this.layout,
      present: Array.from(this.present.keys()),
      featuredSpeaker: this.featuredSpeakerAttendeeId,
      avatarIds: Array.from(this.avatars.keys()),
    });
    for (const [tileIndex, tile] of this.tiles) {
      const tileId = this.tileIndexToTileId[tileIndex];
      tile.featured = tileId !== undefined && tileId === chosen.tileId;
    }
    for (const [attendeeId, avatar] of this.avatars) {
      avatar.featured = attendeeId === chosen.avatarId;
    }
    this.updateLayout();
  }

  private updateLayout(): void {
    const area = this.options.tileArea;
    const visible =
      Array.from(this.tiles.values()).filter(tile => tile.classList.contains('active')).length +
      this.avatars.size;
    const featured =
      Array.from(this.tiles.values()).some(
        tile => tile.classList.contains('active') && tile.classList.contains('featured')
      ) || Array.from(this.avatars.values()).some(avatar => avatar.featured);
    const grid = stageGrid(visible, featured, this.layout, this.onlySideTileIsYours());
    area.classList.toggle('featured', featured);
    area.classList.toggle('spotlight', grid.alone);
    area.classList.toggle('pip', grid.pip);
    area.classList.toggle('empty', visible === 0);
    if (this.options.emptyState) {
      this.options.emptyState.hidden = visible !== 0;
    }
    area.style.setProperty('--cols', String(grid.cols));
    area.style.setProperty('--rows', String(grid.rows));
    area.style.setProperty('--phone-cols', String(grid.phoneCols));
  }

  private onlySideTileIsYours(): boolean {
    const local = this.tiles.get(VideoTileCollection.LocalVideoTileIndex);
    const localTileShowing =
      !!local && local.classList.contains('active') && !local.classList.contains('featured');
    const localAvatar = this.avatars.get(this.options.localAttendeeId);
    return localTileShowing || (!!localAvatar && !localAvatar.featured);
  }

  private localTileId(): number | null {
    return this.videoTileController.hasStartedLocalVideoTile()
      ? (this.videoTileController.getLocalVideoTile()?.state().tileId ?? null)
      : null;
  }

  private readonly onPaginateLeft = (): void => this.paginateLeft();
  private readonly onPaginateRight = (): void => this.paginateRight();

  /** Take the tiles off the stage and detach, so the next session's collection starts clean. */
  destroy(): void {
    const { tileArea, paginateLeft, paginateRight, emptyState } = this.options;
    paginateLeft.removeEventListener('click', this.onPaginateLeft);
    paginateRight.removeEventListener('click', this.onPaginateRight);
    paginateLeft.hidden = true;
    paginateRight.hidden = true;
    for (const timer of this.reactionTimers.values()) {
      clearTimeout(timer);
    }
    this.reactionTimers.clear();
    for (const tile of this.tiles.values()) {
      tile.remove();
    }
    for (const avatar of this.avatars.values()) {
      avatar.element.remove();
    }
    this.tiles.clear();
    this.avatars.clear();
    tileArea.classList.remove('featured', 'spotlight', 'pip', 'empty');
    if (emptyState) {
      emptyState.hidden = true;
    }
  }

  private paginateLeft(): void {
    this.pagination.previousPage();
    this.updatePaginatedVisibleTiles();
  }

  private paginateRight(): void {
    this.pagination.nextPage();
    this.updatePaginatedVisibleTiles();
  }

  private updatePaginatedVisibleTiles(): void {
    // Name tiles share the pages with video, so a large audio-mostly meeting pages too.
    const nameTiles = this.nameTileAttendees();
    for (const attendeeId of nameTiles) {
      this.pagination.add(attendeeId);
    }
    this.pagination.removeIf(
      attendeeId =>
        !nameTiles.has(attendeeId) &&
        !this.remoteVideoAttendees.has(attendeeId) &&
        !this.isLocalAttendee(attendeeId)
    );
    const attendeesToShow = this.pagination.currentPage();
    this.logger.info(`Showing current page ${JSON.stringify(attendeesToShow)}`);
    this.remoteVideoManager.visibleAttendees = attendeesToShow.filter(
      attendeeId => !nameTiles.has(attendeeId)
    );
    for (const [index, tile] of this.tiles) {
      const hiddenSelf = this.selfViewHidden && index === VideoTileCollection.LocalVideoTileIndex;
      if (tile.attendeeId && attendeesToShow.includes(tile.attendeeId) && !hiddenSelf) {
        tile.show(tile.attendeeId.endsWith('#content'));
      } else {
        tile.hide();
      }
    }
    this.options.paginateLeft.hidden = !this.pagination.hasPreviousPage();
    this.options.paginateRight.hidden = !this.pagination.hasNextPage();
    this.renderAvatars(attendeesToShow.filter(attendeeId => nameTiles.has(attendeeId)));
    // Presence and video changes can change who the speaker layout falls back to.
    this.layoutFeaturedTile();
  }

  private hasVideo(attendeeId: string): boolean {
    return attendeeId === this.options.localAttendeeId
      ? this.localVideoOn
      : this.remoteVideoAttendees.has(attendeeId);
  }

  /** Everyone present without video, unless the stage shows only video. */
  private nameTileAttendees(): Set<string> {
    return new Set(
      this.options.videoOnly
        ? []
        : Array.from(this.present.keys()).filter(
            attendeeId =>
              !this.hasVideo(attendeeId) &&
              !(this.selfViewHidden && attendeeId === this.options.localAttendeeId)
          )
    );
  }

  /** Name tiles for this page's people without video, after the video tiles in page order. */
  private renderAvatars(onPage: string[]): void {
    const wanted = new Set(onPage);
    for (const [attendeeId, avatar] of this.avatars) {
      if (!wanted.has(attendeeId)) {
        avatar.element.remove();
        this.avatars.delete(attendeeId);
      }
    }
    for (const attendeeId of wanted) {
      let avatar = this.avatars.get(attendeeId);
      if (!avatar) {
        avatar = new AvatarTile(
          attendeeId,
          this.present.get(attendeeId)!,
          attendeeId === this.options.localAttendeeId
        );
        avatar.setMuted(this.mutedAttendees.has(attendeeId));
        avatar.setHandRaised(this.raisedHands.has(attendeeId));
        avatar.speaking = this.speakingAttendees.has(attendeeId);
        this.avatars.set(attendeeId, avatar);
      }
      // Appending in order moves existing tiles into join order after the video tiles.
      this.options.tileArea.appendChild(avatar.element);
    }
  }
}
