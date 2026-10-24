// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// @vitest-environment happy-dom
import type { AudioVideoFacade } from 'amazon-chime-sdk-js';
import { describe, expect, it, vi } from 'vitest';

import ContentShareOptions, { ContentShareOptionsElements } from './ContentShareOptions';

function setUp(
  supportsSimulcast: boolean,
  supportsSVC: boolean
): {
  options: ContentShareOptions;
  elements: ContentShareOptionsElements;
  audioVideo: {
    enableSimulcastForContentShare: ReturnType<typeof vi.fn>;
    enableSVCForContentShare: ReturnType<typeof vi.fn>;
  };
  volumeReductionChanges: boolean[];
} {
  const input = (type = 'text'): HTMLInputElement => {
    const element = document.createElement('input');
    element.type = type;
    return element;
  };
  const layer = (): ContentShareOptionsElements['simulcastLow'] => ({
    maxBitrateKbps: input(),
    scaleFactor: input(),
    maxFramerate: input(),
  });
  const elements: ContentShareOptionsElements = {
    dialog: document.createElement('dialog'),
    save: document.createElement('button'),
    frameRate: input(),
    volumeReduction: input('checkbox'),
    simulcastSection: document.createElement('div'),
    simulcast: input('checkbox'),
    simulcastLow: layer(),
    simulcastHigh: layer(),
    svcSection: document.createElement('div'),
    svc: input('checkbox'),
  };
  const audioVideo = {
    enableSimulcastForContentShare: vi.fn(),
    enableSVCForContentShare: vi.fn(),
  };
  const volumeReductionChanges: boolean[] = [];
  const options = new ContentShareOptions(
    elements,
    audioVideo as unknown as AudioVideoFacade,
    supportsSimulcast,
    supportsSVC,
    on => volumeReductionChanges.push(on)
  );
  return { options, elements, audioVideo, volumeReductionChanges };
}

const toggle = (checkbox: HTMLInputElement, checked: boolean): void => {
  checkbox.checked = checked;
  checkbox.dispatchEvent(new Event('change'));
};

describe('ContentShareOptions', () => {
  it('lets simulcast or SVC be chosen, not both', () => {
    const { elements } = setUp(true, true);
    expect([elements.simulcast.disabled, elements.svc.disabled]).toEqual([false, false]);

    toggle(elements.simulcast, true);
    expect([elements.svc.checked, elements.svc.disabled]).toEqual([false, true]);

    toggle(elements.simulcast, false);
    expect([elements.simulcast.disabled, elements.svc.disabled]).toEqual([false, false]);

    toggle(elements.svc, true);
    expect([elements.simulcast.checked, elements.simulcast.disabled]).toEqual([false, true]);

    toggle(elements.svc, false);
    expect(elements.simulcast.disabled).toBe(false);
  });

  it('hides and disables what the browser does not support', () => {
    const { elements } = setUp(true, false);
    expect([elements.simulcastSection.hidden, elements.svcSection.hidden]).toEqual([false, true]);
    expect(elements.svc.disabled).toBe(true);

    toggle(elements.svc, true);
    expect([elements.svc.checked, elements.simulcast.disabled]).toEqual([false, false]);

    const noSimulcast = setUp(false, true).elements;
    expect(noSimulcast.simulcast.disabled).toBe(true);
    toggle(noSimulcast.svc, true);
    toggle(noSimulcast.svc, false);
    expect(noSimulcast.simulcast.disabled).toBe(true);
  });

  it('applies the inputs at construction and again on save', () => {
    const { options, elements, audioVideo, volumeReductionChanges } = setUp(true, true);
    expect(audioVideo.enableSimulcastForContentShare.mock.calls).toEqual([[false]]);
    expect(audioVideo.enableSVCForContentShare.mock.calls).toEqual([[false]]);
    expect(options.frameRate).toBeUndefined();

    elements.frameRate.value = '15';
    elements.volumeReduction.checked = true;
    toggle(elements.simulcast, true);
    elements.simulcastLow.maxBitrateKbps.value = '300';
    elements.simulcastHigh.scaleFactor.value = '2';
    elements.save.click();

    expect(options.frameRate).toBe(15);
    expect(options.volumeReduction).toBe(true);
    expect(volumeReductionChanges).toEqual([true]);
    expect(audioVideo.enableSimulcastForContentShare).toHaveBeenLastCalledWith(true, {
      low: { maxBitrateKbps: 300, scaleResolutionDownBy: undefined, maxFramerate: undefined },
      high: { maxBitrateKbps: undefined, scaleResolutionDownBy: 2, maxFramerate: undefined },
    });
    expect(audioVideo.enableSVCForContentShare).toHaveBeenCalledTimes(1);

    elements.save.click();
    expect(volumeReductionChanges).toEqual([true]);
  });

  it('removes its listeners on destroy', () => {
    const { options, elements, audioVideo } = setUp(true, true);
    options.destroy();

    toggle(elements.simulcast, true);
    elements.save.click();

    expect(elements.svc.disabled).toBe(false);
    expect(audioVideo.enableSimulcastForContentShare).toHaveBeenCalledTimes(1);
  });
});
