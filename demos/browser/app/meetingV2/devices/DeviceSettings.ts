// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { OptionGroup } from '../config/schema';
import { STRINGS } from '../strings';
import { el } from '../ui/dom';
import { iconElement } from '../ui/icons';

/**
 * Device pickers for the Settings dialog's Audio and Video tabs. They mirror the pre-join form's
 * controls (same options, same selection) so devices can be changed from Settings during a
 * meeting, the way Teams and Zoom do it. `DeviceManager` finds them by id and keeps them in sync.
 */
export const DEVICE_SETTINGS_IDS = {
  audioInput: 'settings-audio-input',
  audioOutput: 'settings-audio-output',
  testSpeaker: 'settings-test-speaker',
  audioLevel: 'settings-audio-level',
  videoPreview: 'settings-video-preview',
  videoPreviewPlaceholder: 'settings-video-preview-placeholder',
  videoInput: 'settings-video-input',
  videoQuality: 'settings-video-quality',
  /** Settings renders the background options (schema `slot`) into this. */
  backgroundOptions: 'settings-background',
  backgroundImageRow: 'settings-background-image',
  backgroundImagePreview: 'settings-background-image-preview',
  backgroundImageUpload: 'settings-background-image-upload',
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

  /** A labelled picker; `extra` (a level meter or a Test button) sits on the same line. */
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
  // Shown for the image effect (BackgroundImagePicker). The wrapper carries that; the Settings
  // filter sets `hidden` on the row itself.
  const backgroundImage = el(
    'div',
    { id: DEVICE_SETTINGS_IDS.backgroundImageRow, hidden: true },
    el(
      'div',
      { class: 'setting' },
      el('span', { class: 'setting-label' }, el('span', { text: STRINGS.backgroundImage })),
      el(
        'span',
        { class: 'background-image-field' },
        el('img', {
          id: DEVICE_SETTINGS_IDS.backgroundImagePreview,
          class: 'background-image-preview',
          alt: '',
        }),
        el('button', {
          type: 'button',
          id: DEVICE_SETTINGS_IDS.backgroundImageUpload,
          class: 'button button-ghost button-small',
          text: STRINGS.uploadImage,
        }),
        el('input', {
          type: 'file',
          id: DEVICE_SETTINGS_IDS.backgroundImageFile,
          accept: 'image/*',
          hidden: true,
        })
      )
    )
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
      // The preview sits beside the camera's pickers.
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
          developerOnly(field(STRINGS.resolution, videoQuality)),
          el('div', { id: DEVICE_SETTINGS_IDS.backgroundOptions }),
          backgroundImage
        )
      ),
      permissionNote(
        DEVICE_SETTINGS_IDS.permissionNoteVideo,
        DEVICE_SETTINGS_IDS.allowDevicesVideo
      ),
      el('h3', { class: 'settings-section-title', text: STRINGS.options }),
    ],
  };
}
