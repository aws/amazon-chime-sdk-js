// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { AudioVideoFacade, VideoEncodingParameters } from 'amazon-chime-sdk-js';

import Dialog from '../ui/Dialog';

export interface SimulcastLayerInputs {
  maxBitrateKbps: HTMLInputElement;
  scaleFactor: HTMLInputElement;
  maxFramerate: HTMLInputElement;
}

/** The developer "Content share options" dialog. */
export interface ContentShareOptionsElements {
  dialog: HTMLDialogElement;
  save: HTMLButtonElement;
  frameRate: HTMLInputElement;
  volumeReduction: HTMLInputElement;
  simulcastSection: HTMLElement;
  simulcast: HTMLInputElement;
  simulcastLow: SimulcastLayerInputs;
  simulcastHigh: SimulcastLayerInputs;
  svcSection: HTMLElement;
  svc: HTMLInputElement;
}

const numberValue = (input: HTMLInputElement): number | undefined =>
  parseInt(input.value, 10) || undefined;

/**
 * The developer content share options: frame rate and volume reduction for the next share, and
 * simulcast or SVC (never both) set on the session. The inputs also apply at construction, so the
 * first share of a session uses them.
 */
export default class ContentShareOptions {
  private _frameRate: number | undefined = undefined;
  private _volumeReduction = false;
  private readonly dialog: Dialog;
  private readonly listeners: [EventTarget, string, EventListener][] = [];

  constructor(
    private readonly elements: ContentShareOptionsElements,
    private readonly audioVideo: AudioVideoFacade,
    private readonly supportsSimulcast: boolean,
    private readonly supportsSVC: boolean,
    private readonly onVolumeReductionChange: (on: boolean) => void
  ) {
    this.dialog = new Dialog(elements.dialog);
    elements.simulcastSection.hidden = !supportsSimulcast;
    elements.svcSection.hidden = !supportsSVC;
    this.listen(elements.simulcast, 'change', () => this.updateSimulcastAndSVCInputs());
    this.listen(elements.svc, 'change', () => this.updateSimulcastAndSVCInputs());
    this.updateSimulcastAndSVCInputs();
    this.listen(elements.save, 'click', () => {
      this.apply();
      this.dialog.close();
    });
    this.apply();
  }

  get frameRate(): number | undefined {
    return this._frameRate;
  }

  get volumeReduction(): boolean {
    return this._volumeReduction;
  }

  open(): void {
    this.dialog.open();
  }

  destroy(): void {
    for (const [target, type, listener] of this.listeners) {
      target.removeEventListener(type, listener);
    }
    this.listeners.length = 0;
    this.dialog.destroy();
  }

  private listen(target: EventTarget, type: string, listener: EventListener): void {
    target.addEventListener(type, listener);
    this.listeners.push([target, type, listener]);
  }

  private apply(): void {
    const { elements } = this;
    this._frameRate = numberValue(elements.frameRate);

    if (this._volumeReduction !== elements.volumeReduction.checked) {
      this._volumeReduction = elements.volumeReduction.checked;
      this.onVolumeReductionChange(this._volumeReduction);
    }

    if (elements.simulcast.checked) {
      const layer = (inputs: SimulcastLayerInputs): VideoEncodingParameters => ({
        maxBitrateKbps: numberValue(inputs.maxBitrateKbps),
        scaleResolutionDownBy: numberValue(inputs.scaleFactor),
        maxFramerate: numberValue(inputs.maxFramerate),
      });
      this.audioVideo.enableSimulcastForContentShare(true, {
        low: layer(elements.simulcastLow),
        high: layer(elements.simulcastHigh),
      });
    } else {
      this.audioVideo.enableSimulcastForContentShare(false);
      this.audioVideo.enableSVCForContentShare(elements.svc.checked);
    }
  }

  private updateSimulcastAndSVCInputs(): void {
    const { simulcast, svc } = this.elements;
    if (simulcast.checked) {
      svc.checked = false;
      svc.disabled = true;
      return;
    }
    svc.disabled = !this.supportsSVC;
    if (!this.supportsSVC) {
      svc.checked = false;
    }
    simulcast.disabled = svc.checked || !this.supportsSimulcast;
    if (!this.supportsSimulcast) {
      simulcast.checked = false;
    }
  }
}
