// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioNodeSubgraph from '../../src/devicecontroller/AudioNodeSubgraph';
import AudioTransformDevice from '../../src/devicecontroller/AudioTransformDevice';
import Device from '../../src/devicecontroller/Device';

abstract class BaseMockNodeTransformDevice implements AudioTransformDevice {
  constructor(private inner: Device) {}

  async intrinsicDevice(): Promise<Device> {
    return this.inner;
  }

  async mute(_muted: boolean): Promise<void> {
    return;
  }

  async stop(): Promise<void> {
    return;
  }

  abstract createAudioNode(context: AudioContext): Promise<AudioNodeSubgraph | undefined>;
}

export class MutingTransformDevice extends BaseMockNodeTransformDevice {
  muted: boolean[] = [];

  async createAudioNode(_context: AudioContext): Promise<AudioNodeSubgraph | undefined> {
    return undefined;
  }

  async mute(muted: boolean): Promise<void> {
    this.muted.push(muted);
  }
}

export class MockNodeTransformDevice extends BaseMockNodeTransformDevice {
  constructor(inner: Device, private delay?: number) {
    super(inner);
  }

  createAudioNode(context: AudioContext): Promise<AudioNodeSubgraph | undefined> {
    const gain = context.createGain();
    const out = { start: gain, end: gain };
    if (this.delay) {
      return new Promise((resolve, _reject) => {
        setTimeout(() => resolve(out), this.delay);
      });
    }
    return Promise.resolve(out);
  }
}

export class MockThrowingTransformDevice extends BaseMockNodeTransformDevice {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createAudioNode(context: AudioContext): Promise<AudioNodeSubgraph | undefined> {
    throw new Error('Cannot create audio node.');
  }
}

export class MockPassthroughTransformDevice extends BaseMockNodeTransformDevice {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createAudioNode(context: AudioContext): Promise<AudioNodeSubgraph | undefined> {
    return undefined;
  }
}
