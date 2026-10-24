// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';

const created = vi.hoisted(() => ({ transformers: 0, devices: 0 }));

vi.mock('amazon-chime-sdk-js', () => {
  class FakeDevice {
    constructor(public readonly inner: unknown) {}
    addObserver(): void {}
    async observeMeetingAudio(): Promise<void> {}
    async chooseNewInnerDevice(inner: unknown): Promise<FakeDevice> {
      return new FakeDevice(inner);
    }
    async stop(): Promise<void> {}
  }
  class FakeTransformer {
    isSupported(): boolean {
      return true;
    }
    async createTransformDevice(inner: unknown): Promise<FakeDevice> {
      created.devices += 1;
      await new Promise(resolve => setTimeout(resolve, 5));
      return new FakeDevice(inner);
    }
  }
  return {
    ConsoleLogger: class {},
    LogLevel: { INFO: 2 },
    VoiceFocusTransformDevice: FakeDevice,
    VoiceFocusDeviceTransformer: {
      isSupported: async () => true,
      configure: async () => ({ supported: true, model: { variant: 'c50' } }),
      create: async () => {
        created.transformers += 1;
        await new Promise(resolve => setTimeout(resolve, 10));
        return new FakeTransformer();
      },
    },
  };
});

import VoiceFocus from './VoiceFocus';

describe('VoiceFocus', () => {
  it('builds one transformer and one device when wraps overlap the model download', async () => {
    const voiceFocus = new VoiceFocus({}, 2);
    voiceFocus.supported = true;
    const audioVideo = {} as never;
    await Promise.all([
      voiceFocus.wrap('mic-1', {}, audioVideo),
      voiceFocus.wrap('mic-1', {}, audioVideo),
      voiceFocus.wrap('mic-2', {}, audioVideo),
    ]);
    expect(created.transformers).toBe(1);
    expect(created.devices).toBe(1);
  });
});
