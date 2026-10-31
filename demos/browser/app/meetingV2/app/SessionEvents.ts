// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  ClientMetricReport,
  DefaultModality,
  MeetingSessionStatus,
  MeetingSessionStatusCode,
} from 'amazon-chime-sdk-js';

import type { MeetingConfig } from '../config/MeetingConfig';
import type DeviceManager from '../devices/DeviceManager';
import { permissionState } from '../devices/devicePermissions';
import type ContentShareManager from '../features/ContentShareManager';
import type Reactions from '../features/Reactions';
import type Recording from '../features/Recording';
import type Roster from '../features/Roster';
import StatsPanel from '../features/StatsPanel';
import type MeetingSessionController from '../session/MeetingSessionController';
import { SessionDelegate } from '../session/MeetingSessionController';
import type Flows from '../shell/Flows';
import type Toolbar from '../shell/Toolbar';
import { STRINGS } from '../strings';
import { displayNameOf } from '../ui/dom';
import Toast from '../ui/Toast';
import type VideoTileCollection from '../video/VideoTileCollection';

export type LeftReason = 'left' | 'ended' | 'removed' | 'disconnected';

/** The header and permission-screen elements the session callbacks write to. */
export interface SessionElements {
  timer: HTMLElement;
  connectionIndicator: HTMLElement;
  permissionDeniedReason: HTMLElement;
  permissionRetry: HTMLElement;
  permissionContinue: HTMLElement;
}

/** What the SDK callbacks may read and drive in the app; `DemoMeetingApp` implements it. */
export interface SessionUi {
  readonly config: MeetingConfig;
  readonly session: MeetingSessionController;
  readonly flows: Flows;
  readonly toolbar: Toolbar;
  readonly roster: Roster;
  readonly devices: DeviceManager | undefined;
  readonly tiles: VideoTileCollection | undefined;
  readonly contentShare: ContentShareManager | undefined;
  readonly reactions: Reactions | undefined;
  readonly recording: Recording | undefined;
  readonly stats: StatsPanel | undefined;
  readonly rejoinRequested: boolean;
  /** This attendee pressed End for everyone, so its own stop means the meeting is over. */
  readonly endedByMe: boolean;
  fatal(error: unknown): void;
  togglePromotion(): Promise<void>;
  applyReplicaPromotionState(state: 'promoted' | 'demoted'): void;
  setIncomingVideoPaused(paused: boolean): void;
  setSharingBannerVisible(sharing: boolean): void;
  showLeftScreen(reason: LeftReason): void;
  rememberMediaState(): void;
  rejoinInPlace(): Promise<void>;
  cleanUp(): Promise<void>;
  halt(): void;
}

/** How long a new loudest speaker must stay loudest before the featured tile switches to them. */
const SPEAKER_SWITCH_HOLD_MS = 2000;
/** How long a weak connection must persist before offering to turn off incoming video. */
const POOR_CONNECTION_PROMPT_MS = 15000;
/** The volume above which someone counts as talking: the SDK active speaker policy's threshold. */
const SPEAKING_VOLUME = 0.2;
/** The speaking ring stays this long after the volume drops, so pauses between words do not flicker. */
const SPEAKING_HOLD_MS = 800;
/** Presence updates right after joining are the people already there, not arrivals. */
const ARRIVAL_QUIET_MS = 5000;
/** Above this many people, join and leave toasts would be noise. */
const ARRIVAL_TOAST_MAX_ATTENDEES = 10;

/**
 * Receives the session controller's callbacks and pushes them into the UI: roster, tiles, dock
 * state, header, toasts. Kept apart from `DemoMeetingApp` so the composition root stays about
 * wiring; everything here reacts to something the SDK reported.
 */
export default class SessionEventHandler implements SessionDelegate {
  private meetingStartedAt: number | undefined;
  private timer: ReturnType<typeof setInterval> | undefined;
  private featuredSpeaker = '';
  private speakerCandidate = '';
  private speakerSwitchTimer: ReturnType<typeof setTimeout> | undefined;
  private poorConnectionTimer: ReturnType<typeof setTimeout> | undefined;
  private poorConnectionPrompted = false;
  private joinedAt: number | undefined;
  private readonly muted = new Map<string, boolean>();
  private readonly speaking = new Set<string>();
  private readonly speakingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly app: SessionUi,
    private readonly elements: SessionElements
  ) {}

  attendeePresence(attendeeId: string, present: boolean, externalUserId: string): void {
    const { app } = this;
    const isContent = new DefaultModality(attendeeId).hasModality(DefaultModality.MODALITY_CONTENT);
    const isSelf = app.session.isSelfAttendee(attendeeId);
    if (!isContent) {
      app.tiles?.setAttendeePresent(attendeeId, displayNameOf(externalUserId), present);
      if (!isSelf) {
        this.announceArrival(displayNameOf(externalUserId), present, attendeeId);
      }
    }
    if (!present) {
      app.roster.removeAttendee(attendeeId);
      this.setSpeaking(attendeeId, false);
      this.muted.delete(attendeeId);
      if (attendeeId === this.featuredSpeaker) {
        this.featuredSpeaker = '';
      }
      return;
    }
    // Only one content share at a time unless explicitly allowed: a remote share stops ours.
    if (
      !app.config.get('maxContentShare') &&
      !app.session.isSelfAttendee(attendeeId) &&
      isContent &&
      app.contentShare?.isStarted
    ) {
      void app.contentShare.stop();
    }
    const isNew = !app.roster.hasAttendee(attendeeId);
    app.roster.addAttendee(
      attendeeId,
      displayNameOf(externalUserId) +
        (isContent ? STRINGS.contentSuffix : isSelf ? STRINGS.youSuffix : '')
    );
    if (isNew && !isContent && !isSelf) {
      app.reactions?.rebroadcastHand();
      app.recording?.rebroadcast();
    }
  }

  attendeeVolume(
    attendeeId: string,
    volume: number | null,
    muted: boolean | null,
    signalStrength: number | null
  ): void {
    if (muted !== null) {
      this.muted.set(attendeeId, muted);
      this.app.roster.setMuteStatus(attendeeId, muted);
      this.app.tiles?.setAttendeeMuted(attendeeId, muted);
      if (muted) {
        this.setSpeaking(attendeeId, false);
      }
    }
    if (volume !== null && !this.muted.get(attendeeId)) {
      if (volume > SPEAKING_VOLUME) {
        clearTimeout(this.speakingTimers.get(attendeeId));
        this.speakingTimers.delete(attendeeId);
        this.setSpeaking(attendeeId, true);
      } else if (this.speaking.has(attendeeId) && !this.speakingTimers.has(attendeeId)) {
        this.speakingTimers.set(
          attendeeId,
          setTimeout(() => this.setSpeaking(attendeeId, false), SPEAKING_HOLD_MS)
        );
      }
    }
    if (signalStrength !== null) {
      this.app.roster.setSignalStrength(attendeeId, signalStrength);
      this.app.tiles?.setAttendeeSignalStrength(attendeeId, signalStrength);
    }
  }

  /** The speaking ring follows the volume (and goes the moment someone mutes), as in Meet. */
  private setSpeaking(attendeeId: string, speaking: boolean): void {
    if (!speaking) {
      clearTimeout(this.speakingTimers.get(attendeeId));
      this.speakingTimers.delete(attendeeId);
    }
    if (this.speaking.has(attendeeId) === speaking) {
      return;
    }
    if (speaking) {
      this.speaking.add(attendeeId);
    } else {
      this.speaking.delete(attendeeId);
    }
    this.app.roster.setAttendeeSpeakingStatus(attendeeId, speaking);
    this.app.tiles?.setAttendeeSpeaking(attendeeId, speaking);
  }

  /** "Alice joined" / "Alice left" for small meetings, once the initial roster has arrived. */
  private announceArrival(name: string, present: boolean, attendeeId: string): void {
    const { roster } = this.app;
    if (
      this.joinedAt === undefined ||
      Date.now() - this.joinedAt < ARRIVAL_QUIET_MS ||
      roster.participantCount > ARRIVAL_TOAST_MAX_ATTENDEES ||
      present === roster.hasAttendee(attendeeId)
    ) {
      return;
    }
    Toast.show({
      message: present ? STRINGS.attendeeJoined(name) : STRINGS.attendeeLeft(name),
      durationMs: 3000,
    });
  }

  /**
   * The featured tile only switches once a new loudest speaker has held the floor for a moment,
   * so interjections do not swap the stage. You are never featured, so your own talking is skipped.
   */
  activeSpeakers(attendeeIds: string[]): void {
    const { roster, session } = this.app;
    const loudest = attendeeIds.find(id => roster.hasAttendee(id) && !session.isSelfAttendee(id));
    if (!loudest) {
      return;
    }
    if (loudest === this.featuredSpeaker) {
      this.speakerCandidate = '';
      clearTimeout(this.speakerSwitchTimer);
      return;
    }
    if (!this.featuredSpeaker) {
      this.featureSpeaker(loudest);
      return;
    }
    if (loudest !== this.speakerCandidate) {
      this.speakerCandidate = loudest;
      clearTimeout(this.speakerSwitchTimer);
      this.speakerSwitchTimer = setTimeout(() => {
        if (this.speakerCandidate === loudest) {
          this.featureSpeaker(loudest);
        }
      }, SPEAKER_SWITCH_HOLD_MS);
    }
  }

  private featureSpeaker(attendeeId: string): void {
    this.featuredSpeaker = attendeeId;
    this.speakerCandidate = '';
    this.app.tiles?.setFeaturedSpeaker(attendeeId);
  }

  localMuteChanged(muted: boolean): void {
    this.app.session.logger.info(`[DEMO] muted = ${muted}`);
    if (this.app.toolbar.state('button-microphone') !== 'disabled') {
      this.app.toolbar.set('button-microphone', muted ? 'off' : 'on');
    }
  }

  canUnmuteChanged(canUnmute: boolean): void {
    this.app.session.logger.info(`[DEMO] canUnmute = ${canUnmute}`);
  }

  metrics(report: ClientMetricReport): void {
    this.app.stats?.update(
      report,
      this.app.session.lastRedRecoveryDescription,
      this.app.devices?.backgroundStatus(report.customStatsReports)
    );
    const videoMetrics = report.getObservableVideoMetrics();
    this.app.tiles?.showVideoWebRTCStats(videoMetrics);
  }

  sessionConnecting(reconnecting: boolean): void {
    if (reconnecting) {
      Toast.show({ message: STRINGS.reconnecting, durationMs: 4000 });
      if (this.app.config.get('abortOnReconnect')) {
        this.app.fatal(new Error('reconnect occurred with abort-on-reconnect set to true'));
      }
    }
  }

  sessionStarted(): void {
    // A reconnect starts the session again; the clock keeps counting from the first start.
    const startedAt = this.meetingStartedAt ?? Date.now();
    this.meetingStartedAt = startedAt;
    this.joinedAt = this.joinedAt ?? startedAt;
    if (!this.timer) {
      this.timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.elements.timer.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
      }, 1000);
    }
    void this.app.session
      .relayProtocol()
      .then(protocol => this.app.stats?.setRelayProtocol(protocol));
  }

  sessionStopped(status: MeetingSessionStatus): void {
    clearInterval(this.timer);
    this.timer = undefined;
    this.elements.timer.textContent = '';
    this.elements.connectionIndicator.hidden = true;
    clearTimeout(this.speakerSwitchTimer);
    clearTimeout(this.poorConnectionTimer);
    for (const timer of this.speakingTimers.values()) {
      clearTimeout(timer);
    }
    this.speakingTimers.clear();
    this.speaking.clear();
    this.muted.clear();
    this.meetingStartedAt = undefined;
    this.joinedAt = undefined;
    this.featuredSpeaker = '';
    this.speakerCandidate = '';
    this.poorConnectionPrompted = false;
    const behavior = this.app.rejoinRequested
      ? 'rejoin'
      : this.app.config.get('behaviorAfterLeave');
    if (behavior === 'nothing') {
      return;
    }
    this.app.rememberMediaState();
    if (behavior === 'rejoin') {
      Toast.show({ message: STRINGS.rejoining, durationMs: 2000 });
    }
    void this.app
      .cleanUp()
      .catch(error => this.app.session.logger.warn(`[DEMO] Clean up failed: ${error}`))
      .then(() => {
        if (behavior === 'rejoin') {
          void this.app.rejoinInPlace();
        } else if (behavior === 'halt') {
          this.app.halt();
        } else {
          this.app.showLeftScreen(
            this.app.endedByMe ? 'ended' : SessionEventHandler.leftReason(status)
          );
        }
      });
  }

  private static leftReason(status: MeetingSessionStatus): LeftReason {
    switch (status.statusCode()) {
      case MeetingSessionStatusCode.Left:
        return 'left';
      case MeetingSessionStatusCode.MeetingEnded:
        return 'ended';
      case MeetingSessionStatusCode.AudioAttendeeRemoved:
        return 'removed';
      default:
        return 'disconnected';
    }
  }

  videoAvailabilityChanged(canStartLocalVideo: boolean): void {
    this.app.toolbar.set('button-camera', canStartLocalVideo ? 'off' : 'disabled');
    Toast.show({
      message: canStartLocalVideo ? STRINGS.cameraAvailable : STRINGS.cameraAtCapacity,
      durationMs: 5000,
    });
  }

  videoSendUnavailable(): void {
    this.app.toolbar.set('button-camera', 'disabled');
    Toast.show({ message: STRINGS.cannotStartCamera });
  }

  videoInputStreamEnded(): void {
    if (this.app.toolbar.isOn('button-camera')) {
      this.app.toolbar.set('button-camera', 'off');
    }
  }

  contentShareStateChanged(started: boolean): void {
    this.app.toolbar.setOn('button-content-share', started);
    this.app.setSharingBannerVisible(started);
  }

  demotedFromPrimary(status: MeetingSessionStatus): void {
    this.app.applyReplicaPromotionState('demoted');
    Toast.show({
      message: STRINGS.demoted(String(status)),
      buttons: [{ text: STRINGS.retryPromotion, onClick: () => void this.app.togglePromotion() }],
    });
  }

  tilePausedByPolicy(tileId: number, paused: boolean): void {
    paused
      ? this.app.tiles?.bandwidthConstrainedTiles.add(tileId)
      : this.app.tiles?.bandwidthConstrainedTiles.delete(tileId);
  }

  /** Header indicator at once; after a sustained weak connection, offer to stop incoming video. */
  connectionQualityChanged(poor: boolean): void {
    this.elements.connectionIndicator.hidden = !poor;
    clearTimeout(this.poorConnectionTimer);
    if (!poor) {
      return;
    }
    Toast.show({ message: STRINGS.weakConnection, durationMs: 5000 });
    if (this.poorConnectionPrompted || this.app.tiles?.isIncomingVideoPaused) {
      return;
    }
    this.poorConnectionTimer = setTimeout(() => {
      this.poorConnectionPrompted = true;
      Toast.show({
        message: STRINGS.weakConnectionStill,
        durationMs: 15000,
        buttons: [
          {
            text: STRINGS.turnOffIncomingVideo,
            onClick: () => this.app.setIncomingVideoPaused(true),
          },
        ],
      });
    }, POOR_CONNECTION_PROMPT_MS);
  }

  simulcastLayersChanged(description: string): void {
    this.app.stats?.setSimulcastLayers(description);
  }

  audioInputsChanged(devices: MediaDeviceInfo[]): void {
    void this.app.devices?.onAudioInputsChanged(devices);
  }

  videoInputsChanged(): void {
    void this.app.devices?.refreshVideoInputs();
  }

  audioOutputsChanged(): void {
    void this.app.devices?.refreshAudioOutputs();
  }

  /**
   * Device labels need a permission grant. Explain the prompt while it is up; when it is denied,
   * explain how to unblock the site and let the user retry or carry on with unnamed devices.
   */
  async needDeviceLabels(): Promise<MediaStream> {
    const { flows } = this.app;
    const previous = flows.currentFlow;
    // Already allowed (the browser only withholds names until a device is opened): no card, since
    // the browser will not ask either.
    const alreadyGranted =
      (await permissionState('microphone')) === 'granted' &&
      (await permissionState('camera')) === 'granted';
    try {
      for (let attempt = 0; ; attempt++) {
        if (!(alreadyGranted && attempt === 0)) {
          flows.show('flow-need-permission');
        }
        try {
          return await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } catch (error) {
          const name = (error as Error).name;
          if (name !== 'NotAllowedError' && name !== 'PermissionDeniedError') {
            throw error;
          }
          this.elements.permissionDeniedReason.textContent =
            (error as Error).message || STRINGS.browserDidNotGrantAccess;
          flows.show('flow-permission-denied');
          if (!(await this.waitForPermissionChoice())) {
            return new MediaStream();
          }
        }
      }
    } finally {
      flows.show(
        previous && !['flow-need-permission', 'flow-permission-denied'].includes(previous)
          ? previous
          : 'flow-devices'
      );
    }
  }

  /** Resolves true for "Try again", false for "Continue without them". */
  private waitForPermissionChoice(): Promise<boolean> {
    return new Promise(resolve => {
      const retry = this.elements.permissionRetry;
      const skip = this.elements.permissionContinue;
      const done = (choice: boolean): void => {
        retry.removeEventListener('click', onRetry);
        skip.removeEventListener('click', onSkip);
        resolve(choice);
      };
      const onRetry = (): void => done(true);
      const onSkip = (): void => done(false);
      retry.addEventListener('click', onRetry);
      skip.addEventListener('click', onSkip);
    });
  }
}
