// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MeetingConfig } from '../config/MeetingConfig';
import { STRINGS } from '../strings';
import { byId, el } from '../ui/dom';
import { iconElement } from '../ui/icons';
import Toast from '../ui/Toast';
import { BACKGROUND_IMAGE_SAMPLES, imageFileToDataUrl } from './BackgroundEffect';
import { DEVICE_SETTINGS_IDS } from './DeviceSettings';

const BACKGROUND_COLORS: { color: string; name: keyof typeof STRINGS.backgroundColorNames }[] = [
  { color: '#1d4ed8', name: 'blue' },
  { color: '#0f766e', name: 'teal' },
  { color: '#15803d', name: 'green' },
  { color: '#7e22ce', name: 'purple' },
  { color: '#be123c', name: 'red' },
  { color: '#334155', name: 'slate' },
  { color: '#e7e5e4', name: 'stone' },
];

/** Sample, uploaded and colour backgrounds; `DeviceManager` applies a choice from the config. */
export default class BackgroundImagePicker {
  private readonly images = byId(DEVICE_SETTINGS_IDS.backgroundImages);
  private readonly file = byId<HTMLInputElement>(DEVICE_SETTINGS_IDS.backgroundImageFile);
  private readonly imageTiles = new Map<string, HTMLButtonElement>();
  private readonly colorTiles = new Map<string, HTMLButtonElement>();
  private readonly customColor: HTMLInputElement;
  private readonly customTile: HTMLElement;

  constructor(private readonly config: MeetingConfig) {
    this.file.addEventListener('change', () => void this.upload());
    const colors = byId(DEVICE_SETTINGS_IDS.backgroundColors);
    for (const { color, name } of BACKGROUND_COLORS) {
      const tile = this.tile(STRINGS.backgroundColorNames[name], () => this.chooseColor(color));
      tile.classList.add('background-swatch');
      tile.style.setProperty('--swatch', color);
      this.colorTiles.set(color, tile);
      colors.append(tile);
    }
    // The integration tests set the colour through this id.
    this.customColor = el('input', {
      type: 'color',
      id: 'background-color',
      class: 'background-color-input',
      'aria-label': STRINGS.customColor,
    });
    for (const type of ['input', 'change']) {
      this.customColor.addEventListener(type, () => this.chooseColor(this.customColor.value));
    }
    this.customTile = el(
      'label',
      { class: 'background-tile background-swatch background-custom', title: STRINGS.customColor },
      iconElement('pipette'),
      this.customColor
    );
    colors.append(this.customTile);
    config.onChange(key => {
      if (key === 'backgroundEffect' || key === 'backgroundColor') {
        this.refresh();
      }
    });
    config.onBackgroundImageChange(() => this.renderImages());
    this.renderImages();
  }

  private tile(label: string, onclick: () => void): HTMLButtonElement {
    return el('button', {
      type: 'button',
      class: 'background-tile',
      'aria-pressed': 'false',
      'aria-label': label,
      title: label,
      onclick,
    });
  }

  private renderImages(): void {
    this.imageTiles.clear();
    const tiles: HTMLElement[] = [];
    for (const sample of BACKGROUND_IMAGE_SAMPLES) {
      const tile = this.tile(STRINGS.backgroundSampleNames[sample.id], () =>
        this.chooseImage(sample.id)
      );
      tile.append(el('img', { src: sample.url, alt: '' }));
      this.imageTiles.set(sample.id, tile);
      tiles.push(tile);
    }
    this.config.backgroundImages.forEach((image, index) => {
      const tile = this.tile(STRINGS.uploadedImage(index + 1), () => this.chooseImage(image.id));
      tile.append(el('img', { src: image.dataUrl, alt: '' }));
      this.imageTiles.set(image.id, tile);
      tiles.push(
        el(
          'div',
          { class: 'background-tile-slot' },
          tile,
          el(
            'button',
            {
              type: 'button',
              class: 'background-tile-delete',
              'aria-label': STRINGS.deleteUploadedImage(index + 1),
              title: STRINGS.deleteUploadedImage(index + 1),
              onclick: () => this.config.removeBackgroundImage(image.id),
            },
            iconElement('x')
          )
        )
      );
    });
    const upload = this.tile(STRINGS.uploadImage, () => this.file.click());
    upload.classList.add('background-tile-add');
    upload.removeAttribute('aria-pressed');
    upload.append(iconElement('imagePlus'));
    tiles.push(upload);
    this.images.replaceChildren(...tiles);
    this.refresh();
  }

  private refresh(): void {
    const effect = this.config.get('backgroundEffect');
    const chosen = this.config.chosenBackgroundImage;
    const image = chosen && this.imageTiles.has(chosen) ? chosen : BACKGROUND_IMAGE_SAMPLES[0].id;
    for (const [id, tile] of this.imageTiles) {
      tile.setAttribute('aria-pressed', String(effect === 'image' && id === image));
    }
    const color = this.config.get('backgroundColor').toLowerCase();
    for (const [preset, tile] of this.colorTiles) {
      tile.setAttribute('aria-pressed', String(effect === 'color' && preset === color));
    }
    const custom = effect === 'color' && !this.colorTiles.has(color);
    this.customTile.toggleAttribute('data-selected', custom);
    this.customTile.style.setProperty('--swatch', custom ? color : '');
    if (this.customColor.value !== color) {
      this.customColor.value = color;
    }
  }

  private chooseImage(id: string): void {
    this.config.chooseBackgroundImage(id);
    this.config.set('backgroundEffect', 'image');
  }

  private chooseColor(color: string): void {
    this.config.set('backgroundColor', color.toLowerCase());
    this.config.set('backgroundEffect', 'color');
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
    if (!this.config.addBackgroundImage(dataUrl).saved) {
      Toast.show({ message: STRINGS.backgroundImageNotSaved, durationMs: 6000 });
    }
    this.config.set('backgroundEffect', 'image');
  }
}
