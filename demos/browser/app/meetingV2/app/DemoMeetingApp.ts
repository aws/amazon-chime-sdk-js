// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AudioVideoFacade } from 'amazon-chime-sdk-js';

import { MeetingConfig } from '../config/MeetingConfig';
import { ConfigValues } from '../config/schema';
import BackgroundImagePicker from '../devices/BackgroundImagePicker';
import DeviceManager, { DeviceKind } from '../devices/DeviceManager';
import { buildDeviceSettingsSections } from '../devices/DeviceSettings';
import MicTest from '../devices/MicTest';
import PreCallDevices from '../devices/PreCallDevices';
import TestSound from '../devices/TestSound';
import Capabilities from '../features/Capabilities';
import ChatPanel from '../features/ChatPanel';
import ContentShareManager from '../features/ContentShareManager';
import Reactions from '../features/Reactions';
import Recording, { RecordingOption } from '../features/Recording';
import Roster from '../features/Roster';
import StatsPanel from '../features/StatsPanel';
import Transcription from '../features/Transcription';
import ApiClient from '../session/ApiClient';
import { videoCodecSupport } from '../session/codecSupport';
import MeetingSessionController, { AuthenticateResult } from '../session/MeetingSessionController';
import Dock, { DockActions } from '../shell/Dock';
import Flows from '../shell/Flows';
import JoinScreen from '../shell/JoinScreen';
import PreJoinScreen from '../shell/PreJoinScreen';
import SettingsDialog from '../shell/SettingsDialog';
import SidePanel from '../shell/SidePanel';
import Toolbar from '../shell/Toolbar';
import { STRINGS } from '../strings';
import { runAction } from '../ui/actions';
import Dialog from '../ui/Dialog';
import { byId, el } from '../ui/dom';
import { hydrateIcons } from '../ui/icons';
import Toast from '../ui/Toast';
import RemoteVideoManager from '../video/RemoteVideoManager';
import VideoTileCollection, { StageLayout } from '../video/VideoTileCollection';
import { pageElements } from './pageElements';
import SessionEventHandler, { LeftReason, SessionUi } from './SessionEvents';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    /** Set by test harnesses before the meeting starts to observe SDK events. */
    pendingEventObserver?: import('amazon-chime-sdk-js').EventObserver;
    app?: DemoMeetingApp;
  }
}

/**
 * Composition root. Owns the screens and wires the SDK session controller to the UI modules;
 * the SDK itself is only touched through `MeetingSessionController` and `DeviceManager`, SDK
 * callbacks arrive through `SessionEventHandler`, and dock clicks through `DockActions`.
 */
export default class DemoMeetingApp implements DockActions, SessionUi {
  readonly config: MeetingConfig;
  readonly api = new ApiClient();
  readonly flows = new Flows();
  readonly toolbar: Toolbar;
  readonly sidePanel: SidePanel;
  readonly settings: SettingsDialog;
  readonly roster: Roster;
  readonly session: MeetingSessionController;
  private preCallDevices: PreCallDevices | undefined;
  private readonly joinScreen: JoinScreen;
  private readonly preJoin: PreJoinScreen;
  private readonly infoDialog: Dialog;

  // Created once the session exists (setupMeetingModules); read-only to SessionEvents.
  private _devices: DeviceManager | undefined;
  private _tiles: VideoTileCollection | undefined;
  private _contentShare: ContentShareManager | undefined;
  private _reactions: Reactions | undefined;
  private _recording: Recording | undefined;
  private _stats: StatsPanel | undefined;
  private chat: ChatPanel | undefined;
  private transcription: Transcription | undefined;
  private capabilities: Capabilities | undefined;

  get devices(): DeviceManager | undefined {
    return this._devices;
  }

  get tiles(): VideoTileCollection | undefined {
    return this._tiles;
  }

  get contentShare(): ContentShareManager | undefined {
    return this._contentShare;
  }

  get reactions(): Reactions | undefined {
    return this._reactions;
  }

  get recording(): Recording | undefined {
    return this._recording;
  }

  get stats(): StatsPanel | undefined {
    return this._stats;
  }

  private removeFatalHandlers: (() => void) | undefined;
  private stageLayout: StageLayout = 'speaker';

  constructor(config: MeetingConfig = MeetingConfig.fromWindow()) {
    this.config = config;
    window.app = this;
    hydrateIcons();
    this.installFatalHandlers();
    this.applyTheme();
    this.applyDeveloperMode();
    this.applyMirror();

    this.session = new MeetingSessionController(
      config,
      this.api,
      new SessionEventHandler(this, pageElements.session())
    );
    this.settings = this.createSettings();
    new BackgroundImagePicker(config);
    // The Audio tab shows the microphone level and the Video tab the camera, while they show.
    this.settings.onViewChange((open, tab) => {
      const audio = open && tab === 'audio';
      const video = open && tab === 'video';
      if (this.devices) {
        this.devices.setSettingsLevelActive(audio);
        this.devices.setSettingsPreviewActive(video);
      } else {
        this.preCallDevices?.setLevelActive(audio);
        this.preCallDevices?.setVideoPreviewActive(video);
      }
    });
    this.preCallDevices = new PreCallDevices(config);
    config.onChange(key => this.onConfigChanged(key));

    this.toolbar = new Toolbar();
    this.sidePanel = new SidePanel();
    this.roster = new Roster(pageElements.roster());
    this.roster.onCountChange(count => {
      this.toolbar.setBadge('participant-count', count);
      this.toolbar.setBadge('dock-participant-count', count);
      this.updateInviteBanner(count);
    });
    this.infoDialog = Dialog.byId('meeting-info-dialog');

    this.joinScreen = new JoinScreen(config, this.api, this.flows, {
      onContinue: () => this.continueFromJoin(false),
      onOpenSettings: () => this.settings.open(),
    });
    this.preJoin = new PreJoinScreen({
      onJoin: () => this.joinFromPreJoin(),
      onBack: () => location.assign(this.config.toShareUrl()),
      onTestSpeaker: button => this.testSpeaker(button),
      onOpenSettings: () => this.settings.open('audio'),
      onTestMicrophone: button => this.testMicrophone(button),
      onMicToggle: on => this.config.set('joinMuted', !on),
      onCameraToggle: on => runAction(() => this.togglePreviewCamera(on), STRINGS.contextCamera),
      onRetryMicrophone: () =>
        runAction(() => this.devices?.retryDeviceAccess('microphone'), STRINGS.contextMute),
    });
    new Dock(this.sidePanel, this);
    this.sidePanel.onChange(showing => {
      this.toolbar.set('button-participants', showing.has('participants') ? 'on' : 'off');
      this.toolbar.set('button-chat', showing.has('chat') ? 'on' : 'off');
      this.chat?.setPanelVisible(showing.has('chat'));
      if (showing.has('chat')) {
        this.chat?.focusComposer();
      }
      if (showing.has('stats')) {
        this.stats?.render();
      }
    });

    this.wirePageButtons();
    if (config.role !== 'attendee') {
      this.config.name =
        config.role === 'recorder' ? '«Meeting Recorder»' : '«Meeting Broadcaster»';
      void this.continueFromJoin(true);
    } else {
      this.flows.show('flow-authenticate');
      this.joinScreen.focus();
    }
  }

  /**
   * Leave and come straight back into the same meeting with the current options, so settings
   * marked "Applies when you next join" take effect. The session is torn down and rebuilt in this
   * page (no reload); the camera and mute state carry over.
   */
  rejoinRequested = false;
  endedByMe = false;
  private mediaAtLeave = { cameraOn: false, muted: false };

  async rejoin(): Promise<void> {
    this.settings.close();
    this.rejoinRequested = true;
    await this.leave();
  }

  /** Called as the session stops, before teardown resets the dock. */
  rememberMediaState(): void {
    this.mediaAtLeave = {
      cameraOn: this.toolbar.isOn('button-camera'),
      muted: this.toolbar.state('button-microphone') === 'off',
    };
  }

  /** Join the same meeting again after `cleanUp()`, skipping the join and device screens. */
  async rejoinInPlace(): Promise<void> {
    const fromSettings = this.rejoinRequested;
    this.rejoinRequested = false;
    // A manual refresh after this keeps the options the rejoin applied.
    history.replaceState({}, this.config.meeting, this.config.toRejoinUrl());
    const { cameraOn, muted } = this.mediaAtLeave;
    const rejoinButton = byId<HTMLButtonElement>('left-rejoin');
    rejoinButton.disabled = true;
    try {
      await this.continueFromJoin(true);
    } finally {
      rejoinButton.disabled = false;
    }
    if (this.flows.currentFlow !== 'flow-meeting') {
      return;
    }
    if (muted) {
      this.session.audioVideo?.realtimeMuteLocalAudio();
    }
    if (cameraOn && this.toolbar.state('button-camera') === 'off') {
      await this.startLocalVideo();
    }
    if (fromSettings) {
      Toast.show({ message: STRINGS.rejoinedWithSettings, durationMs: 3000 });
    }
  }

  /** Rejoin from the Left screen, unless the meeting ended meanwhile (that would start a new one). */
  private async rejoinFromLeftScreen(): Promise<void> {
    const lookup = await this.api.lookupMeeting(this.config.meeting);
    if (lookup && !lookup.exists) {
      this.showLeftScreen('ended');
      return;
    }
    await this.rejoinInPlace();
  }

  /** Back to how the meeting screen looks before a join, for the next session in this page. */
  private resetMeetingUi(): void {
    for (const id of [
      'button-microphone',
      'button-camera',
      'button-content-share',
      'button-promote-to-primary',
    ]) {
      this.toolbar.set(id, 'off');
    }
    this.toolbar.setBlocked('button-microphone', null);
    this.toolbar.setBlocked('button-camera', null);
    delete this.toolbar.button('button-camera').dataset.videoFilter;
    for (const badge of ['dock-chat-unread', 'hand-count']) {
      this.toolbar.setBadge(badge, 0);
    }
    // Chat and transcript lines come back as data messages; keeping them would show them twice.
    for (const id of ['receive-message', 'transcript-container', 'reactions-overlay']) {
      byId(id).replaceChildren();
    }
    byId('captions-bar').hidden = true;
    byId('recording-indicator').hidden = true;
    byId('sharing-bar').hidden = true;
    byId('stage-invite').hidden = true;
    Toast.clearAll();
    this.settings.setInMeeting(false);
  }

  /** After leaving: what happened, with Rejoin unless the meeting is over. */
  showLeftScreen(reason: LeftReason): void {
    byId('left-title').textContent =
      reason === 'ended'
        ? STRINGS.meetingHasEnded
        : reason === 'removed'
          ? STRINGS.removedFromMeeting
          : reason === 'disconnected'
            ? STRINGS.disconnectedFromMeeting
            : STRINGS.leftMeeting;
    byId('left-meeting').textContent = STRINGS.meetingLabel(this.config.meeting);
    byId('left-rejoin').hidden = reason === 'ended' || reason === 'removed';
    this.flows.show('flow-left');
  }

  /** Buttons on the stage banners, the left-meeting screen and Settings that the app handles. */
  private wirePageButtons(): void {
    const on = (id: string, context: string, action: () => unknown): void =>
      byId(id).addEventListener('click', () => runAction(action, context));
    on('stage-invite-copy', STRINGS.contextCopyLink, () => this.copyJoinLink());
    on('stage-invite-dismiss', STRINGS.contextDismiss, () => {
      this.inviteDismissed = true;
      byId('stage-invite').hidden = true;
    });
    on('sharing-bar-stop', STRINGS.contextStopSharing, () => this.contentShare?.stop());
    on('settings-rejoin', STRINGS.contextRejoin, () => this.rejoin());
    on('left-rejoin', STRINGS.contextRejoin, () => this.rejoinFromLeftScreen());
    on('left-back', STRINGS.contextLeave, () => location.assign(this.config.toShareUrl()));
  }

  private inviteDismissed = false;

  /** Alone in the meeting: offer the join link, as Teams and Zoom do, until someone arrives. */
  private updateInviteBanner(count: number): void {
    byId('stage-invite').hidden =
      this.inviteDismissed || count !== 1 || this.config.role !== 'attendee';
  }

  setSharingBannerVisible(sharing: boolean): void {
    byId('sharing-bar').hidden = !sharing;
  }

  private installFatalHandlers(): void {
    const onError = (event: ErrorEvent): void =>
      this.fatal(event.error ?? new Error(String(event.message)));
    const onRejection = (event: PromiseRejectionEvent): void => this.fatal(event.reason);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    this.removeFatalHandlers = () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }

  /** Loud failure for development and canaries; muffled unless "Abort on fatal errors" is on. */
  fatal(error: unknown): void {
    if (!this.config.get('dieOnFatal')) {
      console.info('Ignoring fatal', error);
      return;
    }
    console.error(
      'Fatal error: this was going to be caught, but should not have been thrown.',
      error
    );
    byId('stack').textContent =
      error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
    this.flows.show('flow-fatal');
  }

  private report(error: Error, context: string): void {
    this.session.logger.error(`[DEMO] Failed ${context}: ${error.message}`);
    Toast.show({ message: STRINGS.failed(context, error.message) });
    this.fatal(error);
  }

  /** A short tone through the chosen speaker; the button says so while it plays. */
  private testSpeaker(button: HTMLButtonElement): void {
    // Before the meeting the pre-join picker is empty; use the remembered speaker.
    const sinkId =
      this.devices?.selectedRealAudioOutputId ??
      this.config.rememberedDevice('audioOutput') ??
      this.devices?.selectedAudioOutput ??
      '';
    const label = button.textContent;
    button.textContent = STRINGS.speakerTestPlaying;
    button.disabled = true;
    setTimeout(() => {
      button.textContent = label;
      button.disabled = false;
    }, TestSound.PLAY_MS);
    void new TestSound(this.session.logger, sinkId).init();
  }

  private readonly micTest = new MicTest();

  /** Record a few seconds from the selected microphone and play them back; the button shows progress. */
  private async testMicrophone(button: HTMLButtonElement): Promise<void> {
    if (this.micTest.isRunning || !this.devices) {
      return;
    }
    const label = button.textContent;
    button.disabled = true;
    try {
      await this.micTest.run(
        this.devices.selectedRealAudioInputId,
        this.devices.selectedRealAudioOutputId,
        state => {
          button.textContent =
            state.phase === 'recording'
              ? STRINGS.micTestRecording(state.secondsLeft)
              : state.phase === 'playing'
                ? STRINGS.micTestPlaying
                : label;
        }
      );
    } catch (error) {
      Toast.show({ message: STRINGS.micTestFailed((error as Error).message) });
    } finally {
      button.textContent = label;
      button.disabled = false;
    }
  }

  /** Options marked `live` in the schema take effect here; `join`/`create` ones are read at join. */
  private onConfigChanged(key: keyof ConfigValues): void {
    const audioVideo = this.session.audioVideo;
    switch (key) {
      case 'theme':
        this.applyTheme();
        break;
      case 'logLevel':
        this.session.logger.setLogLevel(this.session.logLevel);
        break;
      case 'contentCodec': {
        const codecs = MeetingSessionController.codecPreferences(this.config.get('contentCodec'));
        if (audioVideo && codecs.length > 0) {
          audioVideo.setContentShareVideoCodecPreferences?.(codecs);
        }
        break;
      }
      case 'allowAttendeeCapabilities':
        this.roster.setAllowSelection(this.config.get('allowAttendeeCapabilities'));
        break;
      case 'developerMode':
        this.applyDeveloperMode();
        if (!this.config.developerMode) {
          this.sidePanel.hide('stats');
          this.stats?.turnOffTileStats();
        }
        break;
      case 'mirrorSelfView':
        this.applyMirror();
        break;
      case 'videoOnlyStage':
        this.tiles?.setVideoOnly(this.config.get('videoOnlyStage'));
        break;
      case 'joinMuted':
        this.preJoin.setMicOn(!this.config.get('joinMuted'));
        break;
      case 'cameraOnAtJoin':
        this.preJoin.setCameraOn(this.config.get('cameraOnAtJoin'));
        break;
    }
  }

  private applyTheme(): void {
    document.documentElement.dataset.theme = this.config.get('theme');
  }

  private applyDeveloperMode(): void {
    document.body.classList.toggle('developer-mode', this.config.developerMode);
  }

  private applyMirror(): void {
    const mirror = this.config.get('mirrorSelfView');
    document.body.classList.toggle('no-mirror', !mirror);
    this.tiles?.setMirrorLocal(mirror);
  }

  private createSettings(): SettingsDialog {
    const settings = new SettingsDialog(
      this.config,
      buildDeviceSettingsSections(button => this.testSpeaker(button)),
      this.settingsActions()
    );
    settings.addConstraint((values, controls) => this.applyCodecConstraints(values, controls));
    settings.addConstraint((values, controls) => {
      const noiseSuppression = controls.get('noiseSuppression');
      if (noiseSuppression) {
        noiseSuppression.disabled = !values.webAudio;
      }
    });
    return settings;
  }

  private settingsActions(): HTMLElement[] {
    const copyLink = el('button', {
      type: 'button',
      class: 'button button-ghost button-small',
      text: STRINGS.copyJoinLinkWithOptions,
      onclick: () => runAction(() => this.copyJoinLink(), STRINGS.contextCopyLink),
    });
    const override = el('button', {
      type: 'button',
      class: 'button button-ghost button-small developer-only',
      id: 'open-join-info-override',
      text: STRINGS.joinInfoOverride,
      onclick: () => {
        this.settings.close();
        this.joinScreen.showOverrideDialog();
      },
    });
    return [el('div', { class: 'settings-actions' }, copyLink, override)];
  }

  /**
   * Simulcast and SVC switches follow `videoCodecSupport`. A switch the codec or browser cannot
   * honour is disabled with the reason, but its value is left alone: a URL that asked for it keeps
   * asking, and the session logs that the request was ignored.
   */
  private applyCodecConstraints(
    values: ConfigValues,
    controls: Map<keyof ConfigValues, HTMLInputElement | HTMLSelectElement>
  ): void {
    const browser = this.session.browser;
    const simulcast = controls.get('enableSimulcast');
    const svc = controls.get('enableSVC');
    const redundancy = controls.get('disableAudioRedundancy');
    if (!browser.hasChromiumWebRTC()) {
      controls.get('videoCodec')?.querySelector('#av1Main-video-codec')?.remove();
      controls.get('contentCodec')?.querySelector('#av1Main-content-codec')?.remove();
    }
    if (redundancy) {
      redundancy.disabled = !browser.supportsAudioRedundancy();
      redundancy.title = redundancy.disabled ? STRINGS.audioRedundancyUnavailable : '';
    }
    const support = videoCodecSupport(browser, values.videoCodec);
    if (simulcast) {
      simulcast.disabled = !support.simulcast || (values.enableSVC && !values.enableSimulcast);
      simulcast.title = support.simulcast ? '' : STRINGS.codecModeUnavailable;
    }
    if (svc) {
      svc.disabled = !support.svc || (values.enableSimulcast && support.simulcast);
      svc.title = support.svc ? '' : STRINGS.codecModeUnavailable;
    }
  }

  /** `skipDeviceCheck` is for the recorder and broadcaster roles, which join unattended. */
  private async continueFromJoin(skipDeviceCheck: boolean): Promise<void> {
    this.endedByMe = false;
    this.joinScreen.setBusy(true);
    let result: AuthenticateResult;
    try {
      result = await this.session.authenticate();
    } catch (error) {
      console.error(error);
      this.joinScreen.setBusy(false);
      this.joinScreen.showFailedMeeting(error as Error);
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set('m', this.config.meeting);
    history.replaceState({}, this.config.meeting, url.toString());

    this.showMeetingHeader(result.region);
    byId('chime-meeting-id').textContent = result.meetingId;
    byId('desktop-attendee-id').textContent = result.attendeeId;
    byId('info-join-link').textContent = this.config.toShareUrl();
    this.preJoin.setMeetingInfo(this.config.meeting, this.config.name);

    const devices = this.setupMeetingModules(result);

    if (result.videoDisabled) {
      this.toolbar.set('button-camera', 'disabled');
    }
    if (result.contentDisabled) {
      this.toolbar.set('button-content-share', 'disabled');
    }
    if (!result.videoIsFHD) {
      devices.remove1080pOption();
    }

    if (this.config.get('viewOnly')) {
      this.applyViewOnlyMode();
      await this.skipDeviceSelection(false);
      return;
    }

    await devices.refreshAll();
    devices.setupVoiceFocusUI();
    if (this.session.effectiveSimulcast) {
      devices.forceVideoQuality(result.videoIsFHD ? '1080p' : '720p', true);
    } else if (result.videoIsFHD) {
      devices.forceVideoQuality('1080p', false);
    } else {
      await devices.applyVideoQuality(devices.selectedVideoQuality, false);
    }

    const isReplica = !!result.primaryExternalMeetingId && !this.config.joinInfoOverride;
    this.toolbar.setVisible('button-promote-to-primary', isReplica);
    if (isReplica) {
      this.recording?.setReplica();
      this.applyReplicaPromotionState('demoted');
    }

    if (skipDeviceCheck) {
      await this.skipDeviceSelection(true);
      return;
    }

    this.preJoin.setMicOn(!this.config.get('joinMuted'));
    this.preJoin.setCameraOn(this.config.get('cameraOnAtJoin'));
    // Join stays disabled until the previews are up, so a fast click cannot race them.
    this.preJoin.setBusy(true);
    this.flows.show('flow-devices');
    this.deviceSetup = this.prepareDevices(devices);
    await this.deviceSetup;
    this.joinScreen.setBusy(false);
    this.preJoin.setBusy(false);
  }

  /** Pre-join: microphone and level meter, camera preview, speaker, and early signaling. */
  private deviceSetup: Promise<void> = Promise.resolve();

  private async prepareDevices(devices: DeviceManager): Promise<void> {
    await devices.openAudioInputFromSelectionAndPreview();
    if (this.config.get('cameraOnAtJoin')) {
      await this.togglePreviewCamera(true);
    }
    await devices.openAudioOutputFromSelection();
    if (this.config.get('preconnect')) {
      // Open signaling while the user checks devices so the join itself is fast.
      this.session.startSignalingOnly();
    }
  }

  /** The pre-join camera toggle: a camera that fails to start turns the toggle back off. */
  private async togglePreviewCamera(on: boolean): Promise<void> {
    this.config.set('cameraOnAtJoin', on);
    const devices = this.devices;
    if (!devices) {
      return;
    }
    try {
      await devices.openVideoInput(on ? devices.cameraForLocalVideo() : null, true);
    } catch (error) {
      this.preJoin.setCameraOn(false);
      this.config.set('cameraOnAtJoin', false);
      Toast.show({ message: (error as Error).message });
    }
  }

  /** A microphone or camera became unusable or usable again (see `DeviceManager`). */
  private applyDeviceProblem(kind: DeviceKind, reason: string | null): void {
    this.preJoin.setDeviceProblem(kind, reason);
    this.toolbar.setBlocked(kind === 'microphone' ? 'button-microphone' : 'button-camera', reason);
    if (
      kind === 'microphone' &&
      reason !== null &&
      this.session.audioVideo &&
      this.devices?.joined
    ) {
      // Nobody can hear this attendee; show them as muted to everyone.
      this.session.audioVideo.realtimeMuteLocalAudio();
    }
  }

  /** Title at the header's left, media region at its right; both in Meeting details. */
  private showMeetingHeader(region: string): void {
    const title = byId('meeting-id');
    title.textContent = this.config.meeting;
    title.title = this.config.meeting;
    const name = this.joinScreen.regionName(region);
    const label = byId('meeting-region');
    byId('meeting-region-name').textContent = name;
    label.title = STRINGS.mediaRegion(region);
    label.hidden = !region;
    byId('info-meeting-title').textContent = this.config.meeting;
    byId('info-media-region').replaceChildren(
      name,
      ...(name !== region ? [' ', el('span', { class: 'code muted', text: region })] : [])
    );
  }

  private setupMeetingModules(result: AuthenticateResult): DeviceManager {
    const audioVideo = this.session.audioVideo!;
    const devices = this.createDevices(audioVideo);
    this.createStage(audioVideo, result);
    this.createFeatures(audioVideo, result);
    return devices;
  }

  private createDevices(audioVideo: AudioVideoFacade): DeviceManager {
    // DeviceManager takes over the Settings pickers from the pre-call stand-in.
    this.preCallDevices?.dispose();
    this.preCallDevices = undefined;
    const devices = new DeviceManager(
      audioVideo,
      this.session.logger,
      this.config,
      this.session.voiceFocus,
      this.session.joinInfo,
      this.session.webAudioEnabled,
      {
        // Tests and the camera button's marker read the active effect from this attribute.
        onVideoFilterChanged: effect => {
          const camera = this.toolbar.button('button-camera');
          if (effect === 'none') {
            delete camera.dataset.videoFilter;
          } else {
            camera.dataset.videoFilter = effect;
          }
        },
        onOpenBackgroundSettings: () => this.settings.open('video'),
        onError: (error, context) => this.report(error, context),
        onNotice: message => Toast.show({ message, durationMs: 6000 }),
        onDeviceProblem: (kind, reason) => this.applyDeviceProblem(kind, reason),
      },
      pageElements.devices()
    );
    devices.setUsingStereoProfile(this.session.usingStereoProfile);
    this._devices = devices;
    return devices;
  }

  private createStage(audioVideo: AudioVideoFacade, result: AuthenticateResult): void {
    const logger = this.session.logger;
    this._tiles = new VideoTileCollection(
      audioVideo,
      logger,
      new RemoteVideoManager(logger, this.session.downlinkPolicy),
      {
        tileArea: byId('tile-area'),
        paginateLeft: byId<HTMLButtonElement>('video-paginate-left'),
        paginateRight: byId<HTMLButtonElement>('video-paginate-right'),
        emptyState: byId('stage-empty'),
        localAttendeeId: result.attendeeId,
        mirrorLocal: this.config.get('mirrorSelfView'),
        videoOnly: this.config.get('videoOnlyStage'),
        developerMode: () => this.config.developerMode,
        onMirrorToggle: () => this.config.set('mirrorSelfView', !this.config.get('mirrorSelfView')),
      }
    );
    audioVideo.addObserver(this._tiles);
    this._tiles.setLayout(this.stageLayout);
  }

  private createFeatures(audioVideo: AudioVideoFacade, result: AuthenticateResult): void {
    const logger = this.session.logger;
    this._contentShare = new ContentShareManager(
      logger,
      audioVideo,
      pageElements.contentShare(),
      this.session.usingStereoProfile,
      this.session.browser.hasChromiumWebRTC(),
      this.session.browser.supportsScalableVideoCoding(),
      started => this.toolbar.setOn('button-content-share', started)
    );
    this.chat = new ChatPanel(
      audioVideo,
      pageElements.chat(),
      result.attendeeId,
      result.externalUserId,
      count => {
        this.toolbar.setBadge('dock-chat-unread', count);
      }
    );
    this._reactions = new Reactions(audioVideo, pageElements.reactions(), result.attendeeId, {
      onHandRaised: (attendeeId, raised) => {
        const wasRaised = this.roster.isHandRaised(attendeeId);
        this.roster.setHandRaised(attendeeId, raised);
        this.tiles?.setAttendeeHandRaised(attendeeId, raised);
        const count = this.roster.raisedHandCount;
        // Counted in the participants panel, where the raised hands are listed first.
        this.toolbar.setBadge('hand-count', count > 0 ? `✋ ${count}` : '');
        byId('hand-count').title = count > 0 ? STRINGS.handsRaised(count) : '';
        const name = this.roster.nameOf(attendeeId);
        if (raised && !wasRaised && attendeeId !== result.attendeeId && name) {
          Toast.show({ message: STRINGS.raisedHand(name), durationMs: 5000 });
        }
      },
      onReaction: (attendeeId, emoji) => this.tiles?.showAttendeeReaction(attendeeId, emoji),
    });
    this.transcription = new Transcription(
      audioVideo,
      this.api,
      this.config,
      pageElements.transcription(),
      {
        onOpenTranscript: () => this.sidePanel.show('captions'),
        onOpenCaptionsSettings: () => this.settings.open('captions'),
      }
    );
    this.capabilities = new Capabilities(
      this.api,
      this.config.meeting,
      this.roster,
      pageElements.capabilities()
    );
    this.roster.setAllowSelection(this.config.get('allowAttendeeCapabilities'));
    this._recording = new Recording(
      audioVideo,
      this.api,
      this.config.meeting,
      result.attendeeId,
      pageElements.recording()
    );
    this.sidePanel.hide('captions');
    this._stats = new StatsPanel(pageElements.stats(), {
      onTileStatsChange: on => this.setShowingStats(on),
    });
    this.sidePanel.hide('stats');
  }

  private async skipDeviceSelection(autoSelectAudioInput: boolean): Promise<void> {
    const devices = this.devices!;
    if (autoSelectAudioInput) {
      await devices.openAudioInputFromSelection();
    }
    await devices.openAudioOutputFromSelection();
    await this.session.join();
    this.enterMeeting();
    this.joinScreen.setBusy(false);
  }

  private async joinFromPreJoin(): Promise<void> {
    const devices = this.devices!;
    this.preJoin.setBusy(true);
    try {
      await this.deviceSetup;
      await devices.stopAudioPreview();
      await devices.stopPreview();
      await devices.openVideoInput(null, false);
      // Avoid a race between the async preview teardown and the join: make sure audio input is up.
      await devices.openAudioInputFromSelection();
      await this.session.join();
      this.enterMeeting();
      if (this.preJoin.cameraOn) {
        await this.startLocalVideo();
      }
    } catch (error) {
      this.joinScreen.showFailedJoin(error as Error);
    } finally {
      this.preJoin.setBusy(false);
    }
  }

  private enterMeeting(): void {
    const audioVideo = this.session.audioVideo!;
    if (this.toolbar.blockedReason('button-microphone') !== undefined) {
      audioVideo.realtimeMuteLocalAudio();
    }
    if (this.toolbar.state('button-microphone') !== 'disabled') {
      this.toolbar.set('button-microphone', audioVideo.realtimeIsLocalAudioMuted() ? 'off' : 'on');
    }
    this.settings.setInMeeting(true);
    this.flows.show('flow-meeting');
    if (this.devices) {
      this.devices.joined = true;
    }
    this.reactions?.rebroadcastHand();
  }

  private applyViewOnlyMode(): void {
    for (const id of [
      'button-microphone',
      'button-camera',
      'button-content-share',
      'button-reactions',
    ]) {
      this.toolbar.set(id, 'disabled');
    }
    // View-only joins with a dummy audio device; keep it muted.
    this.session.audioVideo!.realtimeMuteLocalAudio();
  }

  applyReplicaPromotionState(state: 'promoted' | 'demoted'): void {
    const promoted = state === 'promoted';
    for (const id of ['button-microphone', 'button-camera', 'button-content-share']) {
      this.toolbar.set(id, promoted ? 'off' : 'disabled');
    }
    this.toolbar.set('button-promote-to-primary', promoted ? 'on' : 'off');
    if (!promoted) {
      this.session.audioVideo?.realtimeMuteLocalAudio();
      this.session.audioVideo?.stopLocalVideoTile();
    }
  }

  get layout(): StageLayout {
    return this.stageLayout;
  }

  get selfViewHidden(): boolean {
    return this.tiles?.isSelfViewHidden ?? false;
  }

  get transcriptionActive(): boolean {
    return this.transcription?.isActive ?? false;
  }

  get captions(): 'on' | 'off' | 'starting' {
    return this.transcription?.captions ?? 'off';
  }

  get recordingOptions(): readonly RecordingOption[] {
    return this._recording?.options ?? [];
  }

  get developerMode(): boolean {
    return this.config.developerMode;
  }

  get incomingVideoPaused(): boolean {
    return this.tiles?.isIncomingVideoPaused ?? false;
  }

  get contentShareActive(): boolean {
    return this.contentShare?.isStarted ?? false;
  }

  get contentSharePaused(): boolean {
    return this.contentShare?.isPaused ?? false;
  }

  get contentShareOptimizable(): boolean {
    return this.contentShare?.canOptimizeForVideo ?? false;
  }

  get contentShareOptimizedForVideo(): boolean {
    return this.contentShare?.isOptimizedForVideo ?? false;
  }

  setContentShareOptimizedForVideo(on: boolean): void {
    this.contentShare?.setOptimizeForVideo(on);
  }

  get videoOnlyStage(): boolean {
    return this.config.get('videoOnlyStage');
  }

  setVideoOnlyStage(on: boolean): void {
    this.config.set('videoOnlyStage', on);
  }

  async toggleContentSharePause(): Promise<void> {
    await this.contentShare?.togglePause();
  }

  private setShowingStats(on: boolean): void {
    this.tiles?.setShowingStats(on);
    if (on) {
      void this.session
        .relayProtocol()
        .then(protocol => this.session.logger.info(`[DEMO] Connection using ${protocol}`));
    }
  }

  setLayout(layout: StageLayout): void {
    this.stageLayout = layout;
    this.tiles?.setLayout(layout);
  }

  setSelfViewHidden(hidden: boolean): void {
    this.tiles?.setSelfViewHidden(hidden);
  }

  setIncomingVideoPaused(paused: boolean): void {
    this.tiles?.setIncomingVideoPaused(paused);
    Toast.show({
      message: paused ? STRINGS.incomingVideoOff : STRINGS.incomingVideoOn,
      durationMs: 3000,
    });
  }

  openSettings(): void {
    this.settings.open();
  }

  openMeetingInfo(): void {
    byId('info-join-link').textContent = this.config.toShareUrl();
    this.infoDialog.open();
  }

  /** Media metrics take the side panel on their own; the More menu is the only way in. */
  toggleStats(): void {
    this.sidePanel.toggle('stats');
  }

  get statsShowing(): boolean {
    return this.sidePanel.isShowing('stats');
  }

  async copyJoinLink(): Promise<void> {
    // Plain-HTTP pages other than localhost have no clipboard API.
    if (!navigator.clipboard) {
      throw new Error(STRINGS.clipboardUnavailable);
    }
    await navigator.clipboard.writeText(this.config.toShareUrl());
    Toast.show({ message: STRINGS.joinLinkCopied, durationMs: 2500 });
  }

  async endMeeting(): Promise<void> {
    this.endedByMe = true;
    try {
      await this.session.endMeeting();
    } catch (error) {
      this.endedByMe = false;
      throw error;
    }
  }

  setDeveloperMode(on: boolean): void {
    this.config.set('developerMode', on);
  }

  toggleMute(): void {
    const audioVideo = this.session.audioVideo;
    if (!audioVideo || this.toolbar.state('button-microphone') === 'disabled') {
      return;
    }
    const blocked = this.toolbar.blockedReason('button-microphone');
    if (blocked !== undefined) {
      Toast.show({
        message: blocked,
        buttons: [
          {
            text: STRINGS.tryAgain,
            onClick: () =>
              runAction(() => this.devices?.retryDeviceAccess('microphone'), STRINGS.contextMute),
          },
        ],
      });
      return;
    }
    if (audioVideo.realtimeIsLocalAudioMuted()) {
      audioVideo.realtimeUnmuteLocalAudio();
    } else {
      audioVideo.realtimeMuteLocalAudio();
    }
  }

  async toggleCamera(): Promise<void> {
    if (!this.session.audioVideo || this.toolbar.state('button-camera') === 'disabled') {
      return;
    }
    if (this.toolbar.isOn('button-camera')) {
      await this.devices?.openVideoInput(null, false);
      this.toolbar.set('button-camera', 'off');
    } else {
      await this.startLocalVideo();
    }
  }

  private async startLocalVideo(): Promise<void> {
    if (!this.session.canStartVideo) {
      Toast.show({ message: STRINGS.videoAtCapacity });
      return;
    }
    const devices = this.devices!;
    try {
      await devices.openVideoInput(devices.cameraForLocalVideo(), false);
      this.session.audioVideo!.startLocalVideoTile();
      this.toolbar.set('button-camera', 'on');
    } catch (error) {
      // The message comes from DeviceManager and is written for the user.
      this.toolbar.set('button-camera', 'off');
      Toast.show({ message: (error as Error).message });
      this.fatal(error);
    }
  }

  async toggleCaptions(): Promise<void> {
    await this.transcription?.toggleCaptions();
  }

  async stopTranscription(): Promise<void> {
    try {
      await this.transcription?.stop();
    } catch (error) {
      Toast.show({ message: STRINGS.couldNotStopTranscription((error as Error).message) });
    }
  }

  async togglePromotion(): Promise<void> {
    if (this.toolbar.isOn('button-promote-to-primary')) {
      await this.session.demoteFromPrimaryMeeting();
      return;
    }
    const status = await this.session.promoteToPrimaryMeeting();
    if (status.isFailure()) {
      Toast.show({
        message: STRINGS.promotionFailed(String(status)),
        buttons: [{ text: STRINGS.retry, onClick: () => void this.togglePromotion() }],
      });
    } else {
      Toast.show({ message: STRINGS.promoted, durationMs: 4000 });
      this.applyReplicaPromotionState('promoted');
    }
  }

  async leave(): Promise<void> {
    await this.session.leave();
  }

  async cleanUp(): Promise<void> {
    // Every step runs even when an earlier one fails, so a rejoin never starts on a half-torn-down
    // page (duplicate tiles, listeners on the old session).
    const steps: [string, () => unknown][] = [
      ['chat', () => this.chat?.destroy()],
      ['reactions', () => this.reactions?.destroy()],
      ['transcription', () => this.transcription?.destroy()],
      ['capabilities', () => this.capabilities?.destroy()],
      ['recording', () => this.recording?.destroy()],
      ['stats', () => this.stats?.destroy()],
      ['content share', () => this.contentShare?.stop()],
      ['content share', () => this.contentShare?.destroy()],
      ['devices', () => this.devices?.destroy()],
      ['stage', () => this._tiles?.destroy()],
      ['session', () => this.session.cleanUp()],
    ];
    for (const [name, step] of steps) {
      try {
        await step();
      } catch (error) {
        this.session.logger.warn(`[DEMO] Cleaning up ${name} failed: ${error}`);
      }
    }
    this.chat = undefined;
    this.transcription = undefined;
    this.capabilities = undefined;
    this._reactions = undefined;
    this._recording = undefined;
    this._stats = undefined;
    this._contentShare = undefined;
    this._devices = undefined;
    this._tiles = undefined;
    this.inviteDismissed = false;
    // The Settings device pickers work again before the next meeting.
    this.preCallDevices = new PreCallDevices(this.config);
    this.roster.clear();
    this.resetMeetingUi();
  }

  /** `behaviorAfterLeave=halt`: drop every reference so leaks can be measured from a heap snapshot. */
  halt(): void {
    this.preCallDevices?.dispose();
    this.preCallDevices = undefined;
    window.app = undefined;
    document.body.innerHTML = '<b>Gone</b>';
    this.removeFatalHandlers?.();
  }
}
