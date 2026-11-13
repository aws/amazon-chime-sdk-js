// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MeetingConfig, RememberedChoice } from '../config/MeetingConfig';
import { STRINGS } from '../strings';
import { byId, clear, el } from '../ui/dom';
import { VIDEO_QUALITIES } from './DeviceManager';
import { DEVICE_SETTINGS_IDS } from './DeviceSettings';
import LevelMeter from './LevelMeter';

/**
 * Settings device pickers before there is an SDK device controller. Choices go to `MeetingConfig`,
 * where the pre-join form and `DeviceManager` read their defaults.
 */
export default class PreCallDevices {
  private readonly selects: { select: HTMLSelectElement; kind: RememberedChoice }[] = [
    { select: byId(DEVICE_SETTINGS_IDS.audioInput), kind: 'audioInput' },
    { select: byId(DEVICE_SETTINGS_IDS.audioOutput), kind: 'audioOutput' },
    { select: byId(DEVICE_SETTINGS_IDS.videoInput), kind: 'videoInput' },
    { select: byId(DEVICE_SETTINGS_IDS.videoQuality), kind: 'videoQuality' },
  ];
  private readonly notes = [
    byId(DEVICE_SETTINGS_IDS.permissionNoteAudio),
    byId(DEVICE_SETTINGS_IDS.permissionNoteVideo),
  ];
  private readonly allowButtons: { button: HTMLButtonElement; kind: 'audio' | 'video' }[] = [
    { button: byId(DEVICE_SETTINGS_IDS.allowDevicesAudio), kind: 'audio' },
    { button: byId(DEVICE_SETTINGS_IDS.allowDevicesVideo), kind: 'video' },
  ];
  private readonly onChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const entry = this.selects.find(candidate => candidate.select === target);
    if (entry && target.value) {
      this.config.rememberDevice(entry.kind, target.value);
    }
    if (entry?.kind === 'audioInput' && this.levelActive) {
      void this.startLevel();
    }
    if (entry?.kind === 'videoInput' && this.videoActive) {
      void this.startVideo();
    }
  };
  private videoActive = false;
  private videoStream: MediaStream | undefined;
  private videoSequence = 0;
  private readonly levelMeter = new LevelMeter(() => [byId(DEVICE_SETTINGS_IDS.audioLevel)]);
  private levelActive = false;
  private level: { stream: MediaStream; context: AudioContext } | undefined;
  private levelSequence = 0;
  private readonly onDeviceChange = (): void => void this.refresh();
  private readonly onAllow = (event: Event): void => {
    const entry = this.allowButtons.find(candidate => candidate.button === event.currentTarget);
    void this.requestAccess(entry?.kind ?? 'audio');
  };
  private readonly unsubscribeConfig: () => void;
  private disposed = false;

  constructor(private readonly config: MeetingConfig) {
    for (const { select } of this.selects) {
      select.addEventListener('change', this.onChange);
    }
    for (const { button } of this.allowButtons) {
      button.addEventListener('click', this.onAllow);
    }
    navigator.mediaDevices?.addEventListener('devicechange', this.onDeviceChange);
    this.unsubscribeConfig = config.onChange(key => {
      if (key === 'developerMode') {
        this.fillVideoChoices();
      }
    });
    this.fillVideoChoices();
    void this.refresh();
  }

  async refresh(): Promise<void> {
    if (this.disposed || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    let devices: MediaDeviceInfo[] = [];
    try {
      devices = await navigator.mediaDevices.enumerateDevices();
    } catch {
      // Leave the pickers empty.
    }
    if (this.disposed) {
      return;
    }
    const kinds: [RememberedChoice, MediaDeviceKind, string][] = [
      ['audioInput', 'audioinput', STRINGS.microphone],
      ['audioOutput', 'audiooutput', STRINGS.speaker],
      ['videoInput', 'videoinput', STRINGS.camera],
    ];
    for (const [kind, deviceKind, generic] of kinds) {
      const select = this.selectFor(kind);
      const matching = devices.filter(device => device.kind === deviceKind);
      this.fill(
        select,
        matching.map((device, index) => ({
          value: device.deviceId,
          label: device.label || STRINGS.genericDevice(generic, index + 1),
        })),
        this.config.rememberedDevice(kind)
      );
    }
    // Names stay blank until the Allow button opens a device. Never ask on load: Firefox reports a
    // one-time grant from an earlier visit as granted, and still prompts.
    const namesHidden = devices.length > 0 && devices.every(device => !device.label);
    for (const note of this.notes) {
      note.hidden = !namesHidden;
    }
    if (this.levelActive && !this.level) {
      void this.startLevel();
    }
    if (this.videoActive && !this.videoStream) {
      void this.startVideo();
    }
  }

  /** Only once the site has microphone access, so opening Settings never prompts. */
  setLevelActive(active: boolean): void {
    this.levelActive = active;
    if (active) {
      void this.startLevel();
    } else {
      this.stopLevel();
    }
  }

  private async startLevel(): Promise<void> {
    this.stopLevel();
    const select = this.selectFor('audioInput');
    // Without access the browser lists devices with empty ids.
    const granted = this.notes.every(note => note.hidden);
    const deviceId = select.value;
    if (!granted || !deviceId || !navigator.mediaDevices?.getUserMedia) {
      return;
    }
    const sequence = ++this.levelSequence;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
    } catch {
      return;
    }
    if (sequence !== this.levelSequence || !this.levelActive || this.disposed) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    context.createMediaStreamSource(stream).connect(analyser);
    this.level = { stream, context };
    this.levelMeter.attach(analyser);
  }

  setVideoPreviewActive(active: boolean): void {
    this.videoActive = active;
    if (active) {
      void this.startVideo();
    } else {
      this.stopVideo();
    }
  }

  private async startVideo(): Promise<void> {
    this.stopVideo();
    const deviceId = this.selectFor('videoInput').value;
    const granted = this.notes.every(note => note.hidden);
    if (!granted || !deviceId || !navigator.mediaDevices?.getUserMedia) {
      return;
    }
    const sequence = ++this.videoSequence;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
    } catch {
      return;
    }
    if (sequence !== this.videoSequence || !this.videoActive || this.disposed) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    this.videoStream = stream;
    byId<HTMLVideoElement>(DEVICE_SETTINGS_IDS.videoPreview).srcObject = stream;
    byId(DEVICE_SETTINGS_IDS.videoPreviewPlaceholder).hidden = true;
  }

  private stopVideo(): void {
    this.videoSequence += 1;
    this.videoStream?.getTracks().forEach(track => track.stop());
    this.videoStream = undefined;
    byId<HTMLVideoElement>(DEVICE_SETTINGS_IDS.videoPreview).srcObject = null;
    byId(DEVICE_SETTINGS_IDS.videoPreviewPlaceholder).hidden = false;
  }

  private stopLevel(): void {
    this.levelSequence += 1;
    this.levelMeter.detach();
    if (this.level) {
      this.level.stream.getTracks().forEach(track => track.stop());
      void this.level.context.close();
      this.level = undefined;
    }
  }

  dispose(): void {
    this.levelActive = false;
    this.stopLevel();
    this.videoActive = false;
    this.stopVideo();
    this.disposed = true;
    for (const { select } of this.selects) {
      select.removeEventListener('change', this.onChange);
    }
    for (const { button } of this.allowButtons) {
      button.removeEventListener('click', this.onAllow);
    }
    navigator.mediaDevices?.removeEventListener('devicechange', this.onDeviceChange);
    this.unsubscribeConfig();
    for (const note of this.notes) {
      note.hidden = true;
    }
  }

  private selectFor(kind: RememberedChoice): HTMLSelectElement {
    return this.selects.find(entry => entry.kind === kind)!.select;
  }

  private fillVideoChoices(): void {
    this.fill(
      this.selectFor('videoQuality'),
      VIDEO_QUALITIES.map(quality => ({ value: quality.value, label: quality.label })),
      this.config.rememberedDevice('videoQuality') ?? '540p'
    );
  }

  private fill(
    select: HTMLSelectElement,
    choices: { value: string; label: string }[],
    preferred: string | null
  ): void {
    clear(select);
    for (const choice of choices) {
      select.appendChild(el('option', { value: choice.value, text: choice.label }));
    }
    if (choices.length === 0) {
      select.appendChild(el('option', { value: '', text: STRINGS.noDevicesFound }));
    }
    if (preferred && choices.some(choice => choice.value === preferred)) {
      select.value = preferred;
    }
  }

  // One kind at a time: asking for both fails outright on a machine without a camera.
  private async requestAccess(kind: 'audio' | 'video'): Promise<void> {
    for (const { button } of this.allowButtons) {
      button.disabled = true;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ [kind]: true });
      stream.getTracks().forEach(track => track.stop());
    } catch {
    } finally {
      for (const { button } of this.allowButtons) {
        button.disabled = false;
      }
    }
    await this.refresh();
  }
}
