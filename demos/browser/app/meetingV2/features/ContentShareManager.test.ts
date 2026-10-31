// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// @vitest-environment happy-dom
import type { AudioVideoFacade, Logger } from 'amazon-chime-sdk-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ContentShareManager, { ContentShareElements, SourceId } from './ContentShareManager';

// The SDK's CommonJS bundle does not load under vitest (an import cycle); these paths only need
// the names to exist.
vi.mock('amazon-chime-sdk-js', () => ({
  CanvasVideoFrameBuffer: class {},
  DefaultBrowserBehavior: class {
    hasFirefoxWebRTC(): boolean {
      return false;
    }
  },
}));

const FILE_ITEM: SourceId = 'dropdown-item-content-share-file-item';
const TEST_VIDEO: SourceId = 'dropdown-item-content-share-screen-test-video';
const SCREEN: SourceId = 'dropdown-item-content-share-screen-capture';

function setUp(startContentShare: () => Promise<void>): {
  manager: ContentShareManager;
  elements: ContentShareElements;
  started: boolean[];
  track: { stop: ReturnType<typeof vi.fn> };
} {
  const ids = ContentShareManager.SourceOptionElementIds;
  document.body.innerHTML = `
    <div id="toast-container"></div>
    <video id="content-share-video"></video>
    <button id="button"></button>
    <div id="menu">${ids.map(id => `<button id="${id}"></button>`).join('')}</div>
    <input id="file" type="file">
    <dialog id="dialog"></dialog>`;
  const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
  const input = (): HTMLInputElement => document.createElement('input');
  const layer = (): ContentShareElements['options']['simulcastLow'] => ({
    maxBitrateKbps: input(),
    scaleFactor: input(),
    maxFramerate: input(),
  });
  const elements: ContentShareElements = {
    button: byId('button'),
    menu: byId('menu'),
    sources: Object.fromEntries(ids.map(id => [id, byId(id)])) as ContentShareElements['sources'],
    fileInput: byId('file'),
    includeAudio: document.createElement('button'),
    optimizeForVideo: document.createElement('button'),
    optionsItem: document.createElement('button'),
    options: {
      dialog: byId('dialog'),
      save: document.createElement('button'),
      frameRate: input(),
      volumeReduction: input(),
      simulcastSection: document.createElement('div'),
      simulcast: input(),
      simulcastLow: layer(),
      simulcastHigh: layer(),
      svcSection: document.createElement('div'),
      svc: input(),
    },
  };
  const track = { stop: vi.fn() };
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
    getAudioTracks: () => [],
  };
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  Object.defineProperty(HTMLMediaElement.prototype, 'captureStream', {
    configurable: true,
    value: () => stream,
  });
  const audioVideo = {
    addContentShareObserver: vi.fn(),
    removeContentShareObserver: vi.fn(),
    startContentShare: vi.fn(startContentShare),
    stopContentShare: vi.fn(),
    enableSimulcastForContentShare: vi.fn(),
    enableSVCForContentShare: vi.fn(),
  } as unknown as AudioVideoFacade;
  const logger = { info: vi.fn(), error: vi.fn() } as unknown as Logger;
  const started: boolean[] = [];
  const manager = new ContentShareManager(logger, audioVideo, elements, false, true, true, on =>
    started.push(on)
  );
  return { manager, elements, started, track };
}

const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};

const toasts = (): string[] =>
  Array.from(document.querySelectorAll('.toast-message')).map(toast => toast.textContent ?? '');

describe('ContentShareManager', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports a share that fails to start and releases its stream', async () => {
    const { manager, elements, started, track } = setUp(() =>
      Promise.reject(new Error('Unsupported media'))
    );

    elements.sources[TEST_VIDEO].click();
    await flush();

    expect(manager.isStarted).toBe(false);
    expect(started[started.length - 1]).toBe(false);
    expect(track.stop).toHaveBeenCalled();
    expect(toasts()).toEqual(['Failed starting content share: Unsupported media']);
  });

  it('revokes the blob URL of a shared file when the share stops', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:shared-file');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const { manager, elements } = setUp(() => Promise.resolve());
    Object.defineProperty(elements.fileInput, 'files', {
      value: [new File(['x'], 'clip.webm')],
    });

    elements.sources[FILE_ITEM].click();
    elements.fileInput.dispatchEvent(new Event('change'));
    await flush();
    expect(manager.isStarted).toBe(true);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    await manager.stop();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:shared-file');
  });

  it('optimizes a running screen share for video and back, sharing sound as Zoom does', async () => {
    const { manager, elements } = setUp(() => Promise.resolve());
    const screenTrack = { contentHint: '', stop: vi.fn() };
    const getDisplayMedia = vi.fn(async () => ({
      getTracks: () => [screenTrack],
      getVideoTracks: () => [screenTrack],
      getAudioTracks: () => [],
    }));
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getDisplayMedia },
    });
    elements.includeAudio.click();
    expect(elements.includeAudio.getAttribute('aria-checked')).toBe('false');

    elements.sources[SCREEN].click();
    await flush();
    expect(getDisplayMedia).toHaveBeenCalledWith({ audio: false, video: true });
    expect(screenTrack.contentHint).toBe('');
    expect(manager.canOptimizeForVideo).toBe(true);

    elements.optimizeForVideo.click();
    await flush();
    expect(screenTrack.contentHint).toBe('motion');
    expect(elements.optimizeForVideo.getAttribute('aria-checked')).toBe('true');
    expect(elements.includeAudio.getAttribute('aria-checked')).toBe('true');

    manager.setOptimizeForVideo(false);
    expect(screenTrack.contentHint).toBe('');
    expect(elements.includeAudio.getAttribute('aria-checked')).toBe('true');

    await manager.stop();
    expect(manager.canOptimizeForVideo).toBe(false);
  });

  it('restarts a running share when volume reduction is saved', async () => {
    const { elements, started } = setUp(() => Promise.resolve());
    elements.sources[TEST_VIDEO].click();
    await flush();

    elements.options.volumeReduction.checked = true;
    elements.options.save.click();
    await flush();

    expect(started).toEqual([true, false, true]);
  });

  it('removes its listeners and observer on destroy', async () => {
    const { manager, elements } = setUp(() => Promise.resolve());
    manager.destroy();

    elements.sources[TEST_VIDEO].click();
    elements.options.simulcast.checked = true;
    elements.options.simulcast.dispatchEvent(new Event('change'));
    await flush();

    expect(manager.isStarted).toBe(false);
    expect(elements.options.svc.disabled).toBe(false);
  });
});
