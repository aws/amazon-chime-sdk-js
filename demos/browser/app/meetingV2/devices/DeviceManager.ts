// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AudioInputDevice,
  AudioVideoFacade,
  DefaultBrowserBehavior,
  Device,
  isAudioTransformDevice,
  Logger,
  RemovableAnalyserNode,
  VoiceFocusTransformDevice,
} from 'amazon-chime-sdk-js';

import { MeetingConfig } from '../config/MeetingConfig';
import { optionByKey } from '../config/schema';
import { JoinInfo } from '../session/ApiClient';
import VoiceFocus from '../session/VoiceFocus';
import { STRINGS } from '../strings';
import { byId, clear, el, maybeById, slug } from '../ui/dom';
import LinkedSelect from '../ui/LinkedSelect';
import Menu from '../ui/Menu';
import { BackgroundEffectKind, BackgroundStatus } from './BackgroundEffect';
import { DeviceKind } from './devicePermissions';
import { DEVICE_SETTINGS_IDS } from './DeviceSettings';
import LevelMeter from './LevelMeter';
import LocalCamera, { describeDeviceError } from './LocalCamera';
import {
  isTestAudioInput,
  SYNTHETIC_VIDEO_INPUTS,
  testAudioDevice,
  testAudioInputNames,
} from './testInputs';

export interface VideoQuality {
  value: string;
  label: string;
  width: number;
  height: number;
  frameRate: number;
  maxBitrateKbps: number;
}

/** One table for the resolution picker, the bitrate cap and the simulcast defaults. */
export const VIDEO_QUALITIES: VideoQuality[] = [
  { value: '360p', label: '360p', width: 640, height: 360, frameRate: 15, maxBitrateKbps: 600 },
  { value: '540p', label: '540p', width: 960, height: 540, frameRate: 15, maxBitrateKbps: 1400 },
  {
    value: '720p',
    label: '720p HD',
    width: 1280,
    height: 720,
    frameRate: 15,
    maxBitrateKbps: 1500,
  },
  {
    value: '1080p',
    label: '1080p Full HD',
    width: 1920,
    height: 1080,
    frameRate: 15,
    maxBitrateKbps: 2500,
  },
];

export const DEFAULT_VIDEO_QUALITY = '540p';

export type { DeviceKind };
export { describeDeviceError };

const KNOWN_DEVICE_ERRORS = new Set([
  'NotAllowedError',
  'PermissionDeniedError',
  'SecurityError',
  'NotReadableError',
  'TrackStartError',
  'NotFoundError',
  'DevicesNotFoundError',
  'OverconstrainedError',
]);

/**
 * The pre-join and dock elements the device manager drives. The Settings pickers are found by
 * their `DEVICE_SETTINGS_IDS`, since the Settings dialog builds them.
 */
export interface DeviceElements {
  audioInput: HTMLSelectElement;
  videoInput: HTMLSelectElement;
  audioOutput: HTMLSelectElement;
  videoFilter: HTMLSelectElement;
  videoFilterContainer: HTMLElement;
  voiceFocusSetting: HTMLElement;
  voiceFocusSwitch: HTMLInputElement;
  voiceFocusInfo: HTMLElement;
  previewVideo: HTMLVideoElement;
  previewPlaceholder: HTMLElement;
  levelBar: HTMLElement;
  microphoneMenu: HTMLElement;
  microphoneMenuButton: HTMLElement;
  cameraMenu: HTMLElement;
  cameraMenuButton: HTMLElement;
  meetingAudio: HTMLAudioElement;
  contentShareVideo: HTMLVideoElement;
}

export interface DeviceManagerCallbacks {
  onVideoFilterChanged: (effect: BackgroundEffectKind) => void;
  onOpenBackgroundSettings: () => void;
  onError: (error: Error, context: string) => void;
  /** Something the user should know about devices, e.g. an automatic switch after an unplug. */
  onNotice: (message: string) => void;
  /** Why the microphone or camera cannot be used right now; null once it works again. */
  onDeviceProblem: (kind: DeviceKind, reason: string | null) => void;
}

/**
 * Devices, Voice Focus and background effects. One source of truth feeds both the pre-join `<select>`
 * controls and the in-meeting dock menus, which the old demo populated separately. Synthetic test
 * inputs are offered only in developer mode. The camera half is a `LocalCamera` that only this
 * class uses.
 */
export default class DeviceManager {
  readonly browser = new DefaultBrowserBehavior();
  private readonly camera: LocalCamera;

  currentAudioInputDevice: AudioInputDevice | undefined;
  private audioInputQueue: Promise<void> = Promise.resolve();
  /** The real microphone last opened (a device id, or 'default'); undefined for synthetic inputs. */
  private openedAudioInput: string | undefined;
  private previewActive = false;
  private settingsLevelActive = false;
  private readonly levelMeter = new LevelMeter(() =>
    [this.elements.levelBar, maybeById(DEVICE_SETTINGS_IDS.audioLevel)].filter(
      (bar): bar is HTMLElement => bar !== null
    )
  );
  private analyserNode: RemovableAnalyserNode | undefined;
  private incomingAudioMuted = false;
  private audioInputs: MediaDeviceInfo[] = [];
  private videoInputs: MediaDeviceInfo[] = [];
  private audioOutputs: MediaDeviceInfo[] = [];
  private usingStereoProfile = false;
  private readonly microphoneMenu: Menu;
  private readonly cameraMenu: Menu;

  // Each picker exists on the pre-join form and again in Settings; LinkedSelect keeps them in step.
  private readonly audioInputSelect: LinkedSelect;
  private readonly videoInputSelect: LinkedSelect;
  private readonly audioOutputSelect: LinkedSelect;
  // Resolution is a developer option, so it lives only in Settings.
  private readonly videoQualitySelect: LinkedSelect;
  /** The pre-join effect picker; Settings renders its own from the schema. */
  private readonly effectSelect: HTMLSelectElement;
  private readonly preJoinVoiceFocusSwitch: HTMLInputElement;
  private readonly unsubscribeConfig: () => void;
  private readonly unsubscribeBackgroundImage: () => void;

  constructor(
    private readonly audioVideo: AudioVideoFacade,
    private readonly logger: Logger,
    private readonly config: MeetingConfig,
    private readonly voiceFocus: VoiceFocus,
    private readonly joinInfo: JoinInfo,
    /** Web Audio was enabled on the device controller at join; transform devices need it. */
    private readonly webAudioEnabled: boolean,
    private readonly callbacks: DeviceManagerCallbacks,
    private readonly elements: DeviceElements
  ) {
    this.audioInputSelect = new LinkedSelect(elements.audioInput, DEVICE_SETTINGS_IDS.audioInput);
    this.videoInputSelect = new LinkedSelect(elements.videoInput, DEVICE_SETTINGS_IDS.videoInput);
    this.audioOutputSelect = new LinkedSelect(
      elements.audioOutput,
      DEVICE_SETTINGS_IDS.audioOutput
    );
    this.videoQualitySelect = new LinkedSelect(
      byId<HTMLSelectElement>(DEVICE_SETTINGS_IDS.videoQuality)
    );
    this.effectSelect = elements.videoFilter;
    this.preJoinVoiceFocusSwitch = elements.voiceFocusSwitch;
    this.camera = new LocalCamera(audioVideo, logger, config, callbacks, elements, {
      isBot: () => this.isBot,
      inMeeting: () => this.inMeeting,
      pickerValue: () => this.videoInputSelect.value,
      cameraIds: () => this.cameraDeviceIds,
    });
    this.microphoneMenu = new Menu(elements.microphoneMenu, elements.microphoneMenuButton);
    this.cameraMenu = new Menu(elements.cameraMenu, elements.cameraMenuButton);
    this.microphoneMenu.onOpen(() => this.renderMicrophoneMenu());
    this.cameraMenu.onOpen(() => this.renderCameraMenu());
    this.videoQualitySelect.fill(
      VIDEO_QUALITIES.map(quality => ({ value: quality.value, label: quality.label })),
      DEFAULT_VIDEO_QUALITY
    );
    this.initPreJoinControls();
    this.applyRememberedVideoChoices();
    this.unsubscribeConfig = this.config.onChange(key => {
      if (key === 'noiseSuppression') {
        void this.applyNoiseSuppression();
      } else if (key === 'developerMode') {
        void this.refreshAll();
      } else if (key === 'backgroundEffect') {
        this.effectSelect.value = this.config.get('backgroundEffect');
        void this.camera.applyBackgroundEffect();
      } else if (
        key === 'backgroundBlurStrength' ||
        key === 'backgroundColor' ||
        key === 'backgroundModel'
      ) {
        this.camera.updateBackground();
      }
    });
    this.unsubscribeBackgroundImage = this.config.onBackgroundImageChange(() =>
      this.camera.updateBackground()
    );
    this.voiceFocus.onDegraded = reason => {
      this.logger.warn(`[DEMO] Voice Focus degraded: ${reason}`);
      // Switching the setting off re-selects the plain microphone and keeps the UI truthful.
      this.config.set('noiseSuppression', false);
      this.callbacks.onNotice(STRINGS.noiseSuppressionDegraded(reason));
    };
  }

  get cameraDeviceIds(): string[] {
    return this.videoInputs.map(device => device.deviceId);
  }

  /** Resolution picked earlier (pre-call Settings, or a previous session). */
  private applyRememberedVideoChoices(): void {
    const quality = this.config.rememberedDevice('videoQuality');
    if (quality && this.videoQualitySelect.hasValue(quality)) {
      this.videoQualitySelect.value = quality;
    }
  }

  backgroundStatus(customStatsReports: { [field: string]: unknown }[]): BackgroundStatus {
    return this.camera.backgroundStatus(customStatsReports);
  }

  /** The selected microphone when it is a real device (not a synthetic test input). */
  get selectedRealAudioInputId(): string | undefined {
    const value = this.audioInputSelect.value;
    return this.audioInputs.some(device => device.deviceId === value) ? value : undefined;
  }

  get selectedRealAudioOutputId(): string | undefined {
    const value = this.audioOutputSelect.value;
    return this.audioOutputs.some(device => device.deviceId === value) ? value : undefined;
  }

  get selectedAudioOutput(): string {
    return this.audioOutputSelect.value;
  }

  get selectedVideoQuality(): string {
    return this.videoQualitySelect.value;
  }

  get isVoiceFocusEnabled(): boolean {
    return this.voiceFocus.supported && this.config.get('noiseSuppression');
  }

  setUsingStereoProfile(stereo: boolean): void {
    this.usingStereoProfile = stereo;
  }

  private get isBot(): boolean {
    return this.config.role !== 'attendee';
  }

  async refreshAll(): Promise<void> {
    await Promise.all([
      this.refreshAudioInputs(),
      this.refreshVideoInputs(),
      this.refreshAudioOutputs(),
    ]);
    this.fillEffectSelect();
  }

  async refreshAudioInputs(): Promise<void> {
    this.audioInputs = await this.audioVideo.listAudioInputDevices();
    this.fillSelect(
      this.audioInputSelect,
      STRINGS.microphone,
      this.audioInputs,
      this.syntheticAudioInputs(),
      this.config.rememberedDevice('audioInput')
    );
  }

  async refreshVideoInputs(): Promise<void> {
    this.videoInputs = await this.audioVideo.listVideoInputDevices();
    this.fillSelect(
      this.videoInputSelect,
      STRINGS.camera,
      this.videoInputs,
      this.syntheticVideoInputs(),
      this.config.rememberedDevice('videoInput')
    );
  }

  async refreshAudioOutputs(): Promise<void> {
    this.audioOutputs = this.browser.supportsSetSinkId()
      ? await this.audioVideo.listAudioOutputDevices()
      : [];
    this.fillSelect(
      this.audioOutputSelect,
      STRINGS.speaker,
      this.audioOutputs,
      [],
      this.config.rememberedDevice('audioOutput')
    );
  }

  private syntheticVideoInputs(): string[] {
    return this.config.developerMode ? SYNTHETIC_VIDEO_INPUTS : [];
  }

  private syntheticAudioInputs(): string[] {
    if (!this.config.developerMode) {
      return [];
    }
    return testAudioInputNames({
      firefox: this.browser.hasFirefoxWebRTC(),
      stereo: this.usingStereoProfile,
    });
  }

  private fillSelect(
    select: LinkedSelect,
    genericName: string,
    devices: MediaDeviceInfo[],
    synthetic: string[],
    remembered: string | null
  ): void {
    select.fill(
      [
        ...devices.map((device, index) => ({
          value: device.label ? device.deviceId : '',
          label: device.label || STRINGS.genericDevice(genericName, index + 1),
        })),
        ...synthetic.map(name => ({ value: name, label: name, group: STRINGS.testInputs })),
      ],
      remembered,
      STRINGS.deviceSelectionUnavailable
    );
  }

  private get effectChoices(): { value: string; label: string }[] {
    const option = optionByKey('backgroundEffect');
    return option.type === 'select' ? option.choices : [];
  }

  private fillEffectSelect(): void {
    clear(this.effectSelect);
    for (const choice of this.effectChoices) {
      this.effectSelect.appendChild(el('option', { value: choice.value, text: choice.label }));
    }
    this.effectSelect.value = this.config.get('backgroundEffect');
  }

  private renderMicrophoneMenu(): void {
    const menu = this.microphoneMenu;
    menu.clear();
    menu.addHeader(STRINGS.microphone);
    const current = this.audioInputSelect.value;
    this.audioInputs.forEach((device, index) => {
      menu.addItem({
        label: device.label || STRINGS.genericDevice(STRINGS.microphone, index + 1),
        checked: current === device.deviceId,
        onSelect: () => this.selectAudioInputByValue(device.deviceId),
      });
    });
    for (const name of this.syntheticAudioInputs()) {
      menu.addItem({
        label: name,
        id: `dropdown-menu-microphone-${slug(name)}`,
        description: STRINGS.testInput,
        checked: current === name,
        onSelect: () => this.selectAudioInputByValue(name),
      });
    }
    if (this.webAudioEnabled) {
      menu.addSeparator();
      menu.addItem({
        label: STRINGS.noiseSuppression,
        description: STRINGS.noiseSuppressionDescription,
        icon: 'audioLines',
        id: 'toggle-dropdown-menu-microphone-Amazon-Voice-Focus',
        checked: this.isVoiceFocusEnabled,
        onSelect: () => this.toggleVoiceFocus(),
      });
    }
    menu.addSeparator();
    menu.addHeader(STRINGS.speaker);
    if (this.audioOutputs.length === 0) {
      menu.addItem({
        label: STRINGS.defaultSpeaker,
        checked: true,
        disabled: !this.browser.supportsSetSinkId(),
      });
    }
    const currentOutput = this.audioOutputSelect.value;
    this.audioOutputs.forEach((device, index) => {
      menu.addItem({
        label: device.label || STRINGS.genericDevice(STRINGS.speaker, index + 1),
        checked: currentOutput === device.deviceId,
        onSelect: () => this.selectAudioOutputByValue(device.deviceId),
      });
    });
    menu.addItem({
      label: STRINGS.muteIncomingAudio,
      icon: 'volumeX',
      id: 'toggle-dropdown-menu-microphone-Mute-incoming-audio',
      checked: this.incomingAudioMuted,
      onSelect: () => this.toggleIncomingAudio(),
    });
  }

  private renderCameraMenu(): void {
    const menu = this.cameraMenu;
    menu.clear();
    menu.addHeader(STRINGS.camera);
    const current = this.camera.selection;
    this.videoInputs.forEach((device, index) => {
      menu.addItem({
        label: device.label || STRINGS.genericDevice(STRINGS.camera, index + 1),
        checked: current === device.deviceId,
        onSelect: () => this.selectVideoInputFromMenu(device.deviceId),
      });
    });
    for (const name of this.syntheticVideoInputs()) {
      menu.addItem({
        label: name,
        id: `dropdown-menu-camera-${slug(name)}`,
        description: STRINGS.testInput,
        checked: current === name,
        onSelect: () => this.selectVideoInputFromMenu(name),
      });
    }
    if (this.config.developerMode) {
      menu.addSeparator();
      menu.addHeader(STRINGS.resolution);
      const allowed = this.videoQualitySelect.options.map(option => option.value);
      menu.addRadioGroup(
        VIDEO_QUALITIES.filter(quality => allowed.includes(quality.value)).map(quality => ({
          value: quality.value,
          label: quality.label,
        })),
        this.videoQualitySelect.value,
        value => {
          this.videoQualitySelect.value = value;
          void this.applyVideoQuality(value, false);
        }
      );
    }
    menu.addSeparator();
    // The effect and its strength, colour or image are chosen in Settings, beside the preview.
    menu.addItem({
      label: STRINGS.backgroundEffects,
      icon: 'sparkles',
      id: 'dropdown-menu-background-effects',
      onSelect: () => this.callbacks.onOpenBackgroundSettings(),
    });
  }

  private initPreJoinControls(): void {
    // Before the meeting the pickers drive the preview; during it they switch live devices.
    const inMeeting = (): boolean => this.inMeeting;
    this.audioInputSelect.onChange(async () => {
      this.logger.info('[DEMO] audio input device changed');
      if (inMeeting()) {
        await this.openAudioInputFromSelection();
      } else {
        await this.openAudioInputFromSelectionAndPreview();
      }
    });
    this.videoInputSelect.onChange(async value => {
      this.logger.info('[DEMO] video input device changed');
      if (inMeeting()) {
        await this.selectVideoInputFromMenu(value);
      } else {
        await this.camera.select(value, true);
      }
    });
    this.audioOutputSelect.onChange(async () => {
      await this.openAudioOutputFromSelection();
    });
    this.videoQualitySelect.onChange(async value => {
      await this.applyVideoQuality(value, !inMeeting());
    });
    this.effectSelect.addEventListener('change', this.onEffectSelectChange);
    this.preJoinVoiceFocusSwitch.addEventListener('change', this.onPreJoinVoiceFocusChange);
    this.elements.videoFilterContainer.hidden = false;
  }

  private get inMeeting(): boolean {
    return this.audioVideo.hasStartedLocalVideoTile() || this.joined;
  }

  private readonly onEffectSelectChange = (): void =>
    this.config.set('backgroundEffect', this.effectSelect.value as BackgroundEffectKind);

  private readonly onPreJoinVoiceFocusChange = (): void =>
    this.config.set('noiseSuppression', this.preJoinVoiceFocusSwitch.checked);

  /** The meeting has started: pickers now act on the live session instead of the preview. */
  joined = false;

  /** Pre-join noise suppression switch: mirrors the setting; disabled once support is known to be missing. */
  setupVoiceFocusUI(): void {
    const unsupported = this.voiceFocus.checked && !this.voiceFocus.supported;
    this.elements.voiceFocusSetting.hidden = !this.webAudioEnabled;
    this.preJoinVoiceFocusSwitch.checked = this.config.get('noiseSuppression');
    this.preJoinVoiceFocusSwitch.disabled = unsupported;
    this.elements.voiceFocusInfo.hidden = !unsupported;
  }

  /**
   * The noise suppression setting changed (Settings, pre-join switch or microphone menu). The
   * first time it is switched on the Voice Focus model is downloaded and support checked; then
   * the current input is re-wrapped so the change applies without a device switch.
   */
  private async applyNoiseSuppression(): Promise<void> {
    const wanted = this.config.get('noiseSuppression');
    this.preJoinVoiceFocusSwitch.checked = wanted;
    if (wanted && !this.webAudioEnabled) {
      this.config.set('noiseSuppression', false);
      this.callbacks.onNotice(STRINGS.noiseSuppressionNeedsWebAudio);
      return;
    }
    if (wanted && !this.voiceFocus.checked) {
      this.callbacks.onNotice(STRINGS.noiseSuppressionPreparing);
      await this.voiceFocus.checkSupport(this.joinInfo);
      this.setupVoiceFocusUI();
      if (!this.voiceFocus.supported) {
        this.config.set('noiseSuppression', false);
        this.callbacks.onNotice(STRINGS.noiseSuppressionUnsupported);
        return;
      }
    }
    if (!wanted && !(this.currentAudioInputDevice instanceof VoiceFocusTransformDevice)) {
      return;
    }
    if (this.joined) {
      await this.reselectAudioInput();
    } else {
      await this.openAudioInputFromSelectionAndPreview();
    }
  }

  async openAudioInputFromSelection(): Promise<void> {
    await this.selectAudioInputByValue(this.audioInputSelect.value, false);
  }

  async openAudioInputFromSelectionAndPreview(): Promise<void> {
    await this.stopAudioPreview();
    await this.openAudioInputFromSelection();
    this.startAudioPreview();
  }

  selectAudioInputByValue(value: string, updateSelect: boolean = true): Promise<void> {
    return this.enqueueAudioInput(() => this.doSelectAudioInput(value, updateSelect));
  }

  /** Audio input changes run one at a time, so overlapping ones cannot build two devices. */
  private enqueueAudioInput(task: () => Promise<void>): Promise<void> {
    const run = this.audioInputQueue.then(task);
    this.audioInputQueue = run.catch(() => {});
    return run;
  }

  private async doSelectAudioInput(value: string, updateSelect: boolean): Promise<void> {
    if (updateSelect && this.audioInputSelect.hasValue(value)) {
      this.audioInputSelect.value = value;
    }
    const real = !!value && !isTestAudioInput(value);
    this.openedAudioInput = real ? value : undefined;
    if (real) {
      this.config.rememberDevice('audioInput', value);
    }
    const device = await this.audioInputSelectionToDevice(value);
    // An empty value is what the browser lists when it withheld access to the microphones.
    const withheld = device === null && value === '' && !this.isBot && !this.config.get('viewOnly');
    await this.selectAudioInputDevice(device, withheld);
  }

  private async selectAudioInputDevice(
    device: AudioInputDevice,
    withheld: boolean = false
  ): Promise<void> {
    this.currentAudioInputDevice = device;
    this.logger.info(`[DEMO] Selecting audio input ${device}`);
    try {
      await this.audioVideo.startAudioInput(device);
      this.updateLevelMeter(true);
      this.callbacks.onDeviceProblem(
        'microphone',
        withheld ? STRINGS.deviceBlocked('microphone') : null
      );
    } catch (error) {
      this.logger.warn(`[DEMO] Audio input failed: ${(error as Error).name}`);
      this.callbacks.onDeviceProblem('microphone', describeDeviceError(error, 'microphone'));
      if (!KNOWN_DEVICE_ERRORS.has((error as Error).name)) {
        this.callbacks.onError(error as Error, 'starting audio input');
      }
    }
  }

  /**
   * Ask the browser for access again (after the user unblocked the site), then reopen the
   * microphone or relist the cameras.
   */
  async retryDeviceAccess(kind: DeviceKind): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === 'microphone' ? { audio: true } : { video: true }
      );
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      this.callbacks.onDeviceProblem(kind, describeDeviceError(error, kind));
      return;
    }
    if (kind === 'microphone') {
      await this.refreshAudioInputs();
      if (this.joined) {
        await this.openAudioInputFromSelection();
      } else {
        await this.openAudioInputFromSelectionAndPreview();
      }
    } else {
      await this.refreshVideoInputs();
      this.callbacks.onDeviceProblem('camera', null);
    }
  }

  /**
   * Called from the device change observer: reselect when the microphone in use disappeared.
   * Compares the device id that was opened, since the current device may be a Voice Focus or
   * other wrapper around it.
   */
  async onAudioInputsChanged(freshDevices: MediaDeviceInfo[]): Promise<void> {
    await this.refreshAudioInputs();
    const opened = this.openedAudioInput;
    if (!opened) {
      return;
    }
    if (opened === 'default') {
      // What "default" means may just have changed.
      this.logger.info('[DEMO] Reselecting default device.');
      await this.selectAudioInputByValue('default', false);
      return;
    }
    if (!freshDevices.some(device => device.deviceId === opened)) {
      this.logger.info('[DEMO] Existing device disappeared. Selecting a new one.');
      if (this.joined) {
        await this.openAudioInputFromSelection();
      } else {
        await this.openAudioInputFromSelectionAndPreview();
      }
      const label = this.audioInputSelect.options.find(
        option => option.value === this.audioInputSelect.value
      )?.text;
      this.callbacks.onNotice(STRINGS.microphoneDisconnected(label));
    }
  }

  private async audioInputSelectionToIntrinsicDevice(value: string): Promise<Device | null> {
    if (this.isBot) {
      return null;
    }
    return testAudioDevice(value, this.audioVideo, this.logger);
  }

  private async audioInputSelectionToDevice(
    value: string
  ): Promise<Device | VoiceFocusTransformDevice | null> {
    const inner = await this.audioInputSelectionToIntrinsicDevice(value);
    return this.withOptionalVoiceFocus(inner);
  }

  private async withOptionalVoiceFocus(
    device: Device | null
  ): Promise<Device | VoiceFocusTransformDevice | null> {
    if (device !== null && this.isVoiceFocusEnabled) {
      return this.voiceFocus.wrap(device, this.joinInfo, this.audioVideo);
    }
    return device;
  }

  toggleVoiceFocus(): void {
    this.config.set('noiseSuppression', !this.config.get('noiseSuppression'));
  }

  /** Re-wrap the current input so a Voice Focus change applies without a device switch. */
  private reselectAudioInput(): Promise<void> {
    return this.enqueueAudioInput(() => this.doReselectAudioInput());
  }

  private async doReselectAudioInput(): Promise<void> {
    const current = this.currentAudioInputDevice;
    if (current instanceof VoiceFocusTransformDevice) {
      await this.selectAudioInputDevice(
        await this.withOptionalVoiceFocus(current.getInnerDevice())
      );
    } else if (isAudioTransformDevice(current)) {
      await this.selectAudioInputDevice(current);
    } else {
      await this.selectAudioInputDevice(await this.withOptionalVoiceFocus(current ?? null));
    }
  }

  /**
   * The input level shows on the pre-join form while it is up and in Settings while that is
   * open; one analyser on the current microphone feeds both.
   */
  async stopAudioPreview(): Promise<void> {
    this.previewActive = false;
    this.updateLevelMeter();
  }

  startAudioPreview(): void {
    this.previewActive = true;
    this.updateLevelMeter(true);
  }

  /** Settings is showing its Audio tab, which has a level bar. */
  setSettingsLevelActive(active: boolean): void {
    this.settingsLevelActive = active;
    this.updateLevelMeter();
  }

  setSettingsPreviewActive(active: boolean): void {
    this.camera.setSettingsPreviewActive(active);
  }

  private updateLevelMeter(restart = false): void {
    const wanted = this.previewActive || this.settingsLevelActive;
    if (this.analyserNode && (!wanted || restart)) {
      this.levelMeter.detach();
      this.analyserNode.disconnect();
      this.analyserNode.removeOriginalInputs();
      this.analyserNode = undefined;
    }
    if (!wanted || this.analyserNode) {
      return;
    }
    const analyserNode = this.audioVideo.createAnalyserNodeForAudioInput();
    if (!analyserNode || !analyserNode.getByteTimeDomainData) {
      return;
    }
    this.analyserNode = analyserNode;
    this.levelMeter.attach(analyserNode);
  }

  async openAudioOutputFromSelection(): Promise<void> {
    if (this.browser.supportsSetSinkId()) {
      try {
        await this.chooseAudioOutput(this.audioOutputSelect.value);
      } catch (error) {
        this.callbacks.onError(error as Error, 'choosing audio output');
      }
    }
    await this.bindMeetingAudio();
  }

  async bindMeetingAudio(): Promise<void> {
    if (this.incomingAudioMuted) {
      return;
    }
    try {
      await this.audioVideo.bindAudioElement(this.elements.meetingAudio);
    } catch (error) {
      this.callbacks.onError(error as Error, 'binding audio element');
    }
  }

  async selectAudioOutputByValue(deviceId: string): Promise<void> {
    this.audioOutputSelect.value = deviceId;
    try {
      await this.chooseAudioOutput(deviceId);
    } catch (error) {
      this.callbacks.onError(error as Error, 'choosing audio output');
    }
  }

  private async chooseAudioOutput(deviceId: string): Promise<void> {
    if (deviceId) {
      this.config.rememberDevice('audioOutput', deviceId);
    }
    const contentVideo = this.elements.contentShareVideo;
    if (this.browser.supportsSetSinkId()) {
      try {
        // @ts-ignore setSinkId is not in lib.dom for HTMLMediaElement yet.
        await contentVideo.setSinkId(deviceId);
      } catch (error) {
        this.logger.warn(`[DEMO] Failed to set content audio output: ${error}`);
      }
    }
    await this.audioVideo.chooseAudioOutput(deviceId);
  }

  async toggleIncomingAudio(): Promise<void> {
    this.incomingAudioMuted = !this.incomingAudioMuted;
    if (this.incomingAudioMuted) {
      this.audioVideo.unbindAudioElement();
    } else {
      await this.bindMeetingAudio();
    }
  }

  openVideoInput(selection: string | null, showPreview: boolean): Promise<void> {
    return this.camera.open(selection, showPreview);
  }

  stopPreview(): Promise<void> {
    return this.camera.stopPreview();
  }

  private async selectVideoInputFromMenu(value: string): Promise<void> {
    this.videoInputSelect.value = value;
    await this.camera.select(value, false);
  }

  cameraForLocalVideo(): string {
    return this.camera.cameraForLocalVideo();
  }

  applyVideoQuality(value: string, preview: boolean): Promise<void> {
    const quality = VIDEO_QUALITIES.find(candidate => candidate.value === value);
    return quality ? this.camera.applyQuality(quality, preview) : Promise.resolve();
  }

  /** Force a quality (used when simulcast or FHD meeting features dictate it). */
  forceVideoQuality(value: string, lock: boolean): void {
    this.videoQualitySelect.value = value;
    this.videoQualitySelect.disabled = lock;
    this.camera.forceQuality(VIDEO_QUALITIES.find(candidate => candidate.value === value)!);
  }

  remove1080pOption(): void {
    this.videoQualitySelect.removeOption('1080p');
  }

  async destroy(): Promise<void> {
    this.unsubscribeConfig();
    // Release the page elements, which the next session's DeviceManager takes over.
    this.microphoneMenu.destroy();
    this.cameraMenu.destroy();
    for (const select of [
      this.audioInputSelect,
      this.videoInputSelect,
      this.audioOutputSelect,
      this.videoQualitySelect,
    ]) {
      select.destroy();
    }
    this.unsubscribeBackgroundImage();
    this.effectSelect.removeEventListener('change', this.onEffectSelectChange);
    this.preJoinVoiceFocusSwitch.removeEventListener('change', this.onPreJoinVoiceFocusChange);
    this.voiceFocus.onDegraded = undefined;
    this.settingsLevelActive = false;
    await this.stopAudioPreview();
    await this.voiceFocus.stop();
    await this.camera.destroy();
  }
}
