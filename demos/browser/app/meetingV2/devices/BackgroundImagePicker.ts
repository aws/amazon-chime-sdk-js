// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MeetingConfig } from '../config/MeetingConfig';
import { STRINGS } from '../strings';
import { byId } from '../ui/dom';
import Toast from '../ui/Toast';
import { DEFAULT_BACKGROUND_IMAGE, imageFileToDataUrl } from './BackgroundEffect';
import { DEVICE_SETTINGS_IDS } from './DeviceSettings';

/**
 * The Settings row for the image effect: a thumbnail of the current background and an upload
 * button. It works before and during a meeting; `DeviceManager` applies the image by listening
 * to the config.
 */
export default class BackgroundImagePicker {
  private readonly row = byId(DEVICE_SETTINGS_IDS.backgroundImageRow);
  private readonly preview = byId<HTMLImageElement>(DEVICE_SETTINGS_IDS.backgroundImagePreview);
  private readonly file = byId<HTMLInputElement>(DEVICE_SETTINGS_IDS.backgroundImageFile);

  constructor(private readonly config: MeetingConfig) {
    byId(DEVICE_SETTINGS_IDS.backgroundImageUpload).addEventListener('click', () =>
      this.file.click()
    );
    this.file.addEventListener('change', () => void this.upload());
    config.onChange(key => {
      if (key === 'backgroundEffect') {
        this.refresh();
      }
    });
    config.onBackgroundImageChange(() => this.refresh());
    this.refresh();
  }

  private refresh(): void {
    this.row.hidden = this.config.get('backgroundEffect') !== 'image';
    this.preview.src = this.config.backgroundImage ?? DEFAULT_BACKGROUND_IMAGE;
  }

  private async upload(): Promise<void> {
    const file = this.file.files?.[0];
    this.file.value = '';
    if (!file) {
      return;
    }
    let dataUrl: string;
    try {
      dataUrl = await imageFileToDataUrl(file);
    } catch {
      Toast.show({ message: STRINGS.backgroundImageUnreadable, durationMs: 6000 });
      return;
    }
    if (!this.config.setBackgroundImage(dataUrl)) {
      Toast.show({ message: STRINGS.backgroundImageNotSaved, durationMs: 6000 });
    }
    this.config.set('backgroundEffect', 'image');
  }
}
