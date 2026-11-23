// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { OptionGroup } from '../config/schema';
import { STRINGS } from '../strings';
import { el } from '../ui/dom';
import { iconElement } from '../ui/icons';

/** Device pickers for the Settings dialog; `DeviceManager` finds them by id. */
export const DEVICE_SETTINGS_IDS = {
  audioInput: 'settings-audio-input',
  audioOutput: 'settings-audio-output',
  testSpeaker: 'settings-test-speaker',
  audioLevel: 'settings-audio-level',
  videoPreview: 'settings-video-preview',
  videoPreviewPlaceholder: 'settings-video-preview-placeholder',
  videoInput: 'settings-video-input',
  videoQuality: 'settings-video-quality',
  backgroundSection: 'settings-background-section',
  backgroundOptions: 'settings-background',
  backgroundImages: 'settings-background-images',
  backgroundColors: 'settings-background-colors',
  backgroundImageFile: 'settings-background-image-file',
  /** Shown before a meeting when the browser hides device names until access is granted. */
  permissionNoteAudio: 'settings-device-permission-audio',
  permissionNoteVideo: 'settings-device-permission-video',
  allowDevicesAudio: 'settings-allow-devices-audio',
  allowDevicesVideo: 'settings-allow-devices-video',
} as const;

export function buildDeviceSettingsSections(
  onTestSpeaker: (button: HTMLButtonElement) => void
): Partial<Record<OptionGroup, HTMLElement[]>> {
  const permissionNote = (noteId: string, buttonId: string): HTMLElement =>
    el(
      'div',
      { class: 'setting-help settings-permission-note', id: noteId, hidden: true },
      el('span', { text: STRINGS.deviceNamesHidden }),
      el('button', {
        type: 'button',
        id: buttonId,
        class: 'button button-ghost button-small',
        text: STRINGS.allowDevices,
      })
    );

  const field = (labelText: string, control: HTMLElement, extra?: HTMLElement): HTMLElement =>
    el(
      'label',
      { class: 'setting', for: control.id },
      el('span', { class: 'setting-label' }, el('span', { text: labelText })),
      extra ? el('span', { class: 'field-inline' }, control, extra) : control
    );

  const developerOnly = (row: HTMLElement): HTMLElement => {
    row.classList.add('developer-only');
    return row;
  };

  const audioInput = el('select', { id: DEVICE_SETTINGS_IDS.audioInput, class: 'select' });
  const audioOutput = el('select', { id: DEVICE_SETTINGS_IDS.audioOutput, class: 'select' });
  const testSpeaker = el('button', {
    type: 'button',
    id: DEVICE_SETTINGS_IDS.testSpeaker,
    class: 'button button-ghost button-small',
    text: STRINGS.test,
    onclick: (event: Event) => {
      event.preventDefault();
      onTestSpeaker(event.currentTarget as HTMLButtonElement);
    },
  });
  const videoInput = el('select', { id: DEVICE_SETTINGS_IDS.videoInput, class: 'select' });
  const videoQuality = el('select', { id: DEVICE_SETTINGS_IDS.videoQuality, class: 'select' });
  const backgroundGallery = el(
    'div',
    { class: 'background-gallery' },
    el('h4', { class: 'background-gallery-title', text: STRINGS.backgroundImages }),
    el('div', { class: 'background-tiles', id: DEVICE_SETTINGS_IDS.backgroundImages }),
    el('input', {
      type: 'file',
      id: DEVICE_SETTINGS_IDS.backgroundImageFile,
      accept: 'image/*',
      hidden: true,
    }),
    el('h4', { class: 'background-gallery-title', text: STRINGS.backgroundColors }),
    el('div', { class: 'background-tiles', id: DEVICE_SETTINGS_IDS.backgroundColors })
  );

  return {
    audio: [
      el('h3', { class: 'settings-section-title', text: STRINGS.devices }),
      field(
        STRINGS.microphone,
        audioInput,
        el(
          'div',
          { class: 'level', title: STRINGS.inputLevel, 'aria-hidden': 'true' },
          el('div', { class: 'level-bar', id: DEVICE_SETTINGS_IDS.audioLevel })
        )
      ),
      field(STRINGS.speaker, audioOutput, testSpeaker),
      permissionNote(
        DEVICE_SETTINGS_IDS.permissionNoteAudio,
        DEVICE_SETTINGS_IDS.allowDevicesAudio
      ),
      el('h3', { class: 'settings-section-title', text: STRINGS.options }),
    ],
    video: [
      el('h3', { class: 'settings-section-title', text: STRINGS.camera }),
      el(
        'div',
        { class: 'settings-camera' },
        el(
          'div',
          { class: 'preview-frame settings-preview' },
          el('video', {
            id: DEVICE_SETTINGS_IDS.videoPreview,
            autoplay: true,
            muted: true,
            playsinline: true,
          }),
          el('span', {
            class: 'background-starting',
            role: 'status',
            hidden: true,
            text: STRINGS.backgroundStarting,
          }),
          el(
            'div',
            { class: 'preview-placeholder', id: DEVICE_SETTINGS_IDS.videoPreviewPlaceholder },
            iconElement('videoOff'),
            el('span', { text: STRINGS.cameraIsOff })
          )
        ),
        el(
          'div',
          {},
          field(STRINGS.camera, videoInput),
          developerOnly(field(STRINGS.resolution, videoQuality))
        )
      ),
      permissionNote(
        DEVICE_SETTINGS_IDS.permissionNoteVideo,
        DEVICE_SETTINGS_IDS.allowDevicesVideo
      ),
      el('h3', {
        class: 'settings-section-title',
        id: DEVICE_SETTINGS_IDS.backgroundSection,
        text: STRINGS.backgroundSection,
      }),
      el(
        'div',
        { class: 'settings-background-layout' },
        el('div', { id: DEVICE_SETTINGS_IDS.backgroundOptions }),
        backgroundGallery
      ),
      el('h3', { class: 'settings-section-title', text: STRINGS.options }),
    ],
  };
}
