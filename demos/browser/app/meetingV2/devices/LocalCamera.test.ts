// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// @vitest-environment happy-dom
import type { AudioVideoFacade, Logger } from 'amazon-chime-sdk-js';
import { describe, expect, it, Mock, vi } from 'vitest';

import type { MeetingConfig } from '../config/MeetingConfig';
import LocalCamera from './LocalCamera';

const { FakeProcessor, FakeTransformDevice } = vi.hoisted(() => {
  class FakeProcessor {
    static created: FakeProcessor[] = [];
    destroyed = false;
    static async create(): Promise<FakeProcessor> {
      const processor = new FakeProcessor();
      FakeProcessor.created.push(processor);
      return processor;
    }
    getModelType(): string {
      return 'selfie_multiclass';
    }
    setModelType(): void {}
    setConfig(): void {}
    async destroy(): Promise<void> {
      this.destroyed = true;
    }
  }
  class FakeTransformDevice {
    static created: FakeTransformDevice[] = [];
    stopped = false;
    constructor(
      _logger: unknown,
      private readonly inner: unknown,
      public readonly processors: unknown[]
    ) {
      FakeTransformDevice.created.push(this);
    }
    getInnerDevice(): unknown {
      return this.inner;
    }
    chooseNewInnerDevice(inner: unknown): FakeTransformDevice {
      return new FakeTransformDevice(undefined, inner, this.processors);
    }
    async stop(): Promise<void> {
      this.stopped = true;
    }
  }
  return { FakeProcessor, FakeTransformDevice };
});

// The SDK's CommonJS bundle does not load under vitest (an import cycle): use its sources.
vi.mock('amazon-chime-sdk-js', async () => {
  const constants =
    await import('../../../../../src/backgroundsegmentation/BackgroundSegmentationConstants');
  return {
    BackgroundSegmentationBlurStrength: constants.BlurStrength,
    ModelType: constants.ModelType,
    ProcessorEffect: constants.ProcessorEffect,
    BackgroundSegmentationVideoFrameProcessor: FakeProcessor,
    DefaultVideoTransformDevice: FakeTransformDevice,
  };
});

// The Settings dialog module pulls in the whole dialog; the camera needs only the preview ids.
vi.mock('./DeviceSettings', () => ({
  DEVICE_SETTINGS_IDS: {
    videoPreview: 'settings-video-preview',
    videoPreviewPlaceholder: 'settings-video-preview-placeholder',
  },
}));

const logger = { info: () => {}, warn: () => {}, error: () => {} } as unknown as Logger;

function setUp(effect: string = 'none'): {
  camera: LocalCamera;
  audioVideo: Record<string, Mock>;
  values: Record<string, string>;
  remembered: Record<string, string>;
  onVideoFilterChanged: Mock;
} {
  const audioVideo = {
    startVideoInput: vi.fn(async (_device: unknown) => {}),
    stopVideoInput: vi.fn(async () => {}),
    startVideoPreviewForVideoInput: vi.fn(),
    stopVideoPreviewForVideoInput: vi.fn(async () => {}),
    hasStartedLocalVideoTile: vi.fn(() => false),
    chooseVideoInputQuality: vi.fn(),
    setVideoMaxBandwidthKbps: vi.fn(),
  };
  const values: Record<string, string> = {
    backgroundEffect: effect,
    backgroundBlurStrength: 'high',
    backgroundColor: '#123456',
    backgroundModel: 'multiclass',
  };
  const remembered: Record<string, string> = {};
  const config = {
    values,
    backgroundImage: null,
    get: (key: string) => values[key],
    set: (key: string, value: string) => {
      values[key] = value;
    },
    rememberDevice: (kind: string, value: string) => {
      remembered[kind] = value;
    },
  };
  const callbacks = { onVideoFilterChanged: vi.fn(), onError: vi.fn(), onDeviceProblem: vi.fn() };
  const camera = new LocalCamera(
    audioVideo as unknown as AudioVideoFacade,
    logger,
    config as unknown as MeetingConfig,
    callbacks,
    {
      previewVideo: document.createElement('video'),
      previewPlaceholder: document.createElement('div'),
    },
    {
      isBot: () => false,
      inMeeting: () => false,
      pickerValue: () => 'cam-1',
      cameraIds: () => ['cam-1', 'cam-2'],
    }
  );
  return {
    camera,
    audioVideo,
    values,
    remembered,
    onVideoFilterChanged: callbacks.onVideoFilterChanged,
  };
}

const quality720 = {
  value: '720p',
  label: '720p HD',
  width: 1280,
  height: 720,
  frameRate: 15,
  maxBitrateKbps: 1500,
};

describe('LocalCamera', () => {
  it('remembers a camera picked while the preview is off, without opening it', async () => {
    const { camera, audioVideo, remembered } = setUp();
    await camera.select('cam-2', true);
    expect(audioVideo.startVideoInput).not.toHaveBeenCalled();
    expect(remembered).toEqual({ videoInput: 'cam-2' });
    expect(camera.cameraForLocalVideo()).toBe('cam-2');
  });

  it('switches to a camera picked while the preview is on', async () => {
    const { camera, audioVideo } = setUp();
    await camera.open('cam-1', true);
    await camera.select('cam-2', true);
    expect(audioVideo.startVideoInput.mock.calls).toEqual([['cam-1'], ['cam-2']]);
  });

  it('tears the transform device down when the effect goes back to none', async () => {
    const { camera, audioVideo, values, onVideoFilterChanged } = setUp('blur');
    await camera.open('cam-1', true);
    const transform = FakeTransformDevice.created.at(-1)!;
    const processor = FakeProcessor.created.at(-1)!;
    expect(audioVideo.startVideoInput).toHaveBeenLastCalledWith(transform);

    values.backgroundEffect = 'none';
    await camera.applyBackgroundEffect();
    expect(transform.stopped).toBe(true);
    expect(processor.destroyed).toBe(true);
    expect(audioVideo.startVideoInput).toHaveBeenLastCalledWith('cam-1');
    expect(onVideoFilterChanged).toHaveBeenCalledWith('none');
  });

  it('restarts an open camera for a quality change and leaves a closed one closed', async () => {
    const { camera, audioVideo, remembered } = setUp();
    await camera.applyQuality(quality720, true);
    expect(audioVideo.startVideoInput).not.toHaveBeenCalled();

    await camera.open('cam-1', true);
    await camera.applyQuality(quality720, true);
    expect(audioVideo.chooseVideoInputQuality).toHaveBeenLastCalledWith(1280, 720, 15);
    expect(audioVideo.setVideoMaxBandwidthKbps).toHaveBeenLastCalledWith(1500);
    expect(remembered.videoQuality).toBe('720p');
    expect(audioVideo.startVideoInput.mock.calls).toEqual([['cam-1'], ['cam-1']]);
  });
});
