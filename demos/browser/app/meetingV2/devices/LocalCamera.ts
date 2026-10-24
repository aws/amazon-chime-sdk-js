// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AudioVideoFacade,
  DefaultVideoTransformDevice,
  Device,
  Logger,
  VideoInputDevice,
} from 'amazon-chime-sdk-js';

import type { MeetingConfig } from '../config/MeetingConfig';
import { STRINGS } from '../strings';
import { maybeById } from '../ui/dom';
import {
  BackgroundEffectKind,
  BackgroundEffectProcessor,
  BackgroundSettings,
  backgroundSettings,
  BackgroundStatus,
} from './BackgroundEffect';
import type { VideoQuality } from './DeviceManager';
import type { DeviceKind } from './devicePermissions';
import { DEVICE_SETTINGS_IDS } from './DeviceSettings';
import { isTestVideoInput, testVideoDevice } from './testInputs';

/** A sentence for the user about why a microphone or camera could not start, with no device ids. */
export function describeDeviceError(error: unknown, kind: DeviceKind): string {
  switch ((error as Error | undefined)?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return STRINGS.deviceBlocked(kind);
    case 'NotReadableError':
    case 'TrackStartError':
      return STRINGS.deviceInUse(kind);
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return STRINGS.deviceNotFound(kind);
    default:
      return STRINGS.deviceFailed(kind);
  }
}

export interface LocalCameraCallbacks {
  onVideoFilterChanged: (effect: BackgroundEffectKind) => void;
  onError: (error: Error, context: string) => void;
  onDeviceProblem: (kind: DeviceKind, reason: string | null) => void;
}

/** What the camera reads from DeviceManager, each time it needs it. */
export interface LocalCameraContext {
  isBot: () => boolean;
  /** Read live: DeviceManager is told it joined after the camera is built. */
  inMeeting: () => boolean;
  /** The camera picker's value. */
  pickerValue: () => string;
  cameraIds: () => string[];
}

/**
 * The local camera for DeviceManager: the device, background effect and resolution, and the
 * pre-join and Settings previews.
 *
 * Camera changes (device, effect, resolution, on/off) run one at a time through `videoQueue`, and
 * `cameraActive` is the one record of whether the camera is open, so a change made while the
 * preview is off is remembered without opening the camera.
 */
export default class LocalCamera {
  private readonly background: BackgroundEffectProcessor;
  private selectedVideoInput: string | null = null;
  private cameraActive = false;
  private videoQueue: Promise<void> = Promise.resolve();
  private settingsPreviewActive = false;
  private videoTransformDevice: DefaultVideoTransformDevice | undefined;
  private readonly previewVideo: HTMLVideoElement;
  private readonly previewPlaceholder: HTMLElement;

  constructor(
    private readonly audioVideo: AudioVideoFacade,
    private readonly logger: Logger,
    private readonly config: MeetingConfig,
    private readonly callbacks: LocalCameraCallbacks,
    elements: { previewVideo: HTMLVideoElement; previewPlaceholder: HTMLElement },
    private readonly context: LocalCameraContext
  ) {
    this.previewVideo = elements.previewVideo;
    this.previewPlaceholder = elements.previewPlaceholder;
    this.background = new BackgroundEffectProcessor(logger);
  }

  /** The camera opened or picked last, else the picker's value. */
  get selection(): string {
    return this.selectedVideoInput ?? this.context.pickerValue();
  }

  private get backgroundSettings(): BackgroundSettings {
    return backgroundSettings(this.config.values, this.config.backgroundImage);
  }

  /** After any camera work in flight, so a processor still being created gets the change too. */
  updateBackground(): void {
    void this.enqueueVideo(async () => this.background.update(this.backgroundSettings));
  }

  /** What the segmentation processor last reported, for the stats panel. */
  backgroundStatus(customStatsReports: { [field: string]: unknown }[]): BackgroundStatus {
    this.background.observe(customStatsReports);
    return this.background.status(this.config.get('backgroundEffect'));
  }

  /**
   * Settings is showing its Video tab: attach the camera that is already open (preview or local
   * video) to its preview, so no second capture starts. With the camera off it says so.
   */
  setSettingsPreviewActive(active: boolean): void {
    this.settingsPreviewActive = active;
    this.refreshSettingsPreview();
  }

  private setCameraActive(active: boolean): void {
    this.cameraActive = active;
    this.refreshSettingsPreview();
  }

  private refreshSettingsPreview(): void {
    const video = maybeById<HTMLVideoElement>(DEVICE_SETTINGS_IDS.videoPreview);
    const placeholder = maybeById(DEVICE_SETTINGS_IDS.videoPreviewPlaceholder);
    if (!video || !placeholder) {
      return;
    }
    const show = this.settingsPreviewActive && this.cameraActive;
    if (show) {
      this.audioVideo.startVideoPreviewForVideoInput(video);
    } else {
      this.audioVideo.stopVideoPreviewForVideoInput(video);
    }
    placeholder.hidden = show;
  }

  /** Run camera work after whatever camera work is already in flight. */
  private enqueueVideo<T>(work: () => Promise<T>): Promise<T> {
    const run = this.videoQueue.then(work);
    this.videoQueue = run.then(
      () => {},
      () => {}
    );
    return run;
  }

  private rememberVideoInput(selection: string): void {
    this.selectedVideoInput = selection;
    if (!isTestVideoInput(selection)) {
      this.config.rememberDevice('videoInput', selection);
    }
  }

  /** Switch to `selection` if the camera is open for `preview`, else remember it for later. */
  async select(selection: string, preview: boolean): Promise<void> {
    if (this.cameraIsOpenFor(preview)) {
      await this.open(selection, preview).catch(() => {
        // Reported through onDeviceProblem and, before the meeting, on the preview.
      });
    } else {
      this.rememberVideoInput(selection);
    }
  }

  /**
   * Open `selection` (null turns the camera off). Throws an Error whose message is meant for the
   * user when the camera cannot start; the problem is also reported through `onDeviceProblem`.
   */
  open(selection: string | null, showPreview: boolean): Promise<void> {
    return this.enqueueVideo(() => this.doOpenVideoInput(selection, showPreview));
  }

  private async doOpenVideoInput(selection: string | null, showPreview: boolean): Promise<void> {
    this.logger.info(`[DEMO] Switching to video input: ${selection}`);
    if (selection !== null) {
      this.rememberVideoInput(selection);
    }
    const device = await this.videoInputSelectionToDevice(selection);
    // An empty value is what the browser lists when it withheld access to the cameras.
    if (device === null && selection === '' && !this.context.isBot()) {
      this.setCameraActive(false);
      const reason = STRINGS.deviceBlocked('camera');
      this.callbacks.onDeviceProblem('camera', reason);
      if (showPreview) {
        this.showPreviewPlaceholder(reason);
      }
      throw new Error(reason);
    }
    if (device === null) {
      this.setCameraActive(false);
      try {
        await this.audioVideo.stopVideoInput();
      } catch (error) {
        this.callbacks.onError(error as Error, 'stopping video input');
      }
      if (showPreview) {
        await this.audioVideo.stopVideoPreviewForVideoInput(this.previewVideo);
        this.showPreviewPlaceholder(null);
      }
      return;
    }
    try {
      await this.audioVideo.startVideoInput(device);
    } catch (error) {
      this.setCameraActive(false);
      const reason = describeDeviceError(error, 'camera');
      this.logger.warn(`[DEMO] Video input failed: ${(error as Error).name}`);
      this.callbacks.onDeviceProblem('camera', reason);
      if (showPreview) {
        this.showPreviewPlaceholder(reason);
      }
      throw new Error(reason);
    }
    this.setCameraActive(true);
    this.callbacks.onDeviceProblem('camera', null);
    if (showPreview) {
      this.audioVideo.startVideoPreviewForVideoInput(this.previewVideo);
      this.previewPlaceholder.hidden = true;
    }
  }

  /** The "camera is off" card over the preview, with the reason when the camera failed. */
  private showPreviewPlaceholder(reason: string | null): void {
    this.previewPlaceholder.hidden = false;
    const label = this.previewPlaceholder.querySelector('.preview-placeholder-label');
    if (label) {
      label.textContent = reason ?? STRINGS.cameraIsOff;
    }
    this.previewPlaceholder.classList.toggle('preview-placeholder-error', reason !== null);
  }

  async stopPreview(): Promise<void> {
    await this.audioVideo.stopVideoPreviewForVideoInput(this.previewVideo);
    this.showPreviewPlaceholder(null);
  }

  /** Camera to use when the user turns video on: the selected one, else the first real camera. */
  cameraForLocalVideo(): string {
    const selected = this.selection;
    if (selected && selected !== 'None') {
      return selected;
    }
    return this.context.cameraIds()[0] ?? 'None';
  }

  private async videoInputSelectionToDevice(
    value: string | null
  ): Promise<VideoInputDevice | null> {
    if (this.context.isBot() || value === 'None' || value === null || value === '') {
      return null;
    }
    return this.withOptionalFilter(testVideoDevice(value));
  }

  private async withOptionalFilter(innerDevice: Device): Promise<VideoInputDevice> {
    const settings = this.backgroundSettings;
    if (settings.effect === 'none') {
      return innerDevice;
    }
    // The effect is already running: reconfigure it and only swap the inner device.
    if (this.videoTransformDevice && this.background.running) {
      this.background.update(settings);
      if (this.videoTransformDevice.getInnerDevice() !== innerDevice) {
        this.videoTransformDevice = this.videoTransformDevice.chooseNewInnerDevice(innerDevice);
      }
      return this.videoTransformDevice;
    }
    await this.videoTransformDevice?.stop();
    const processor = await this.background.create(settings);
    this.videoTransformDevice = new DefaultVideoTransformDevice(this.logger, innerDevice, [
      processor,
    ]);
    return this.videoTransformDevice;
  }

  /**
   * Apply the effect chosen in Settings, the pre-join picker or the camera menu. Between two
   * effects the running processor is reconfigured; turning one on or off reopens the camera, and
   * turning it off releases the processor. A failure goes back to no effect.
   */
  applyBackgroundEffect(): Promise<void> {
    const effect = this.config.get('backgroundEffect');
    return this.enqueueVideo(async () => {
      const preview = !this.context.inMeeting();
      try {
        if (effect !== 'none' && this.videoTransformDevice && this.background.running) {
          this.background.update(this.backgroundSettings);
        } else if (this.cameraIsOpenFor(preview)) {
          await this.doOpenVideoInput(this.cameraForLocalVideo(), preview);
        }
        if (effect === 'none') {
          await this.videoTransformDevice?.stop();
          this.videoTransformDevice = undefined;
          await this.background.destroy();
        }
        this.callbacks.onVideoFilterChanged(effect);
      } catch (error) {
        this.callbacks.onError(error as Error, 'applying the background effect');
        if (effect !== 'none') {
          this.config.set('backgroundEffect', 'none');
        }
      }
    });
  }

  /** Before the meeting the preview is what is open; during it, the local video tile. */
  private cameraIsOpenFor(preview: boolean): boolean {
    return preview ? this.cameraActive : this.audioVideo.hasStartedLocalVideoTile();
  }

  applyQuality(quality: VideoQuality, preview: boolean): Promise<void> {
    return this.enqueueVideo(async () => {
      this.audioVideo.chooseVideoInputQuality(quality.width, quality.height, quality.frameRate);
      this.audioVideo.setVideoMaxBandwidthKbps(quality.maxBitrateKbps);
      this.config.rememberDevice('videoQuality', quality.value);
      this.logger.info(
        `[DEMO] videoInputQuality change: ${quality.value}, maxBitrateKbps: ${quality.maxBitrateKbps}`
      );
      try {
        if (this.videoTransformDevice) {
          await this.videoTransformDevice.stop();
          this.videoTransformDevice = undefined;
        }
        if (this.cameraIsOpenFor(preview)) {
          await this.doOpenVideoInput(this.cameraForLocalVideo(), preview);
        }
      } catch (error) {
        this.callbacks.onError(error as Error, 'changing video quality');
      }
    });
  }

  forceQuality(quality: VideoQuality): void {
    this.audioVideo.chooseVideoInputQuality(quality.width, quality.height, quality.frameRate);
    this.audioVideo.setVideoMaxBandwidthKbps(quality.maxBitrateKbps);
  }

  async destroy(): Promise<void> {
    this.setSettingsPreviewActive(false);
    await this.videoTransformDevice?.stop();
    this.videoTransformDevice = undefined;
    await this.background.destroy();
  }
}
