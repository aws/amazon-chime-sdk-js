// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from 'vitest';

import MicTest, { MicTestState } from './MicTest';

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  readonly mimeType = 'audio/webm';
  readonly listeners = new Map<string, () => void>();
  stopped = false;

  constructor() {
    FakeMediaRecorder.instances.push(this);
  }

  addEventListener(type: string, listener: () => void): void {
    this.listeners.set(type, listener);
  }

  start(): void {}

  stop(): void {
    this.stopped = true;
  }
}

function stubGetUserMedia(getUserMedia: () => Promise<unknown>): void {
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
}

describe('MicTest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    FakeMediaRecorder.instances = [];
  });

  it('is idle again after getUserMedia rejects', async () => {
    stubGetUserMedia(() => Promise.reject(new Error('Could not start audio source')));
    const states: MicTestState[] = [];
    const micTest = new MicTest();

    await expect(micTest.run('mic', 'speaker', state => states.push(state))).rejects.toThrow(
      'Could not start audio source'
    );

    expect(micTest.isRunning).toBe(false);
    expect(states).toEqual([{ phase: 'idle' }]);
  });

  it('stops the countdown and the tracks when the recorder fails', async () => {
    vi.useFakeTimers();
    const track = { stop: vi.fn() };
    stubGetUserMedia(() => Promise.resolve({ getTracks: () => [track] }));
    const states: MicTestState[] = [];
    const micTest = new MicTest();

    const run = micTest.run(undefined, undefined, state => states.push(state));
    await vi.waitFor(() => expect(FakeMediaRecorder.instances).toHaveLength(1));
    const [recorder] = FakeMediaRecorder.instances;
    recorder.listeners.get('error')!();
    await expect(run).rejects.toThrow('Recording failed.');
    vi.advanceTimersByTime(5000);

    expect(states).toEqual([{ phase: 'recording', secondsLeft: 3 }, { phase: 'idle' }]);
    expect(recorder.stopped).toBe(false);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(micTest.isRunning).toBe(false);
  });
});
