// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { STRINGS } from '../strings';

export type MicTestState =
  | { phase: 'recording'; secondsLeft: number }
  | { phase: 'playing' }
  | { phase: 'idle' };

const RECORD_SECONDS = 3;

/**
 * Pre-join microphone check: record a few seconds from the chosen microphone, then play it back
 * through the chosen speaker, so the user hears what others will.
 */
export default class MicTest {
  private running = false;

  get isRunning(): boolean {
    return this.running;
  }

  async run(
    microphoneDeviceId: string | undefined,
    speakerDeviceId: string | undefined,
    onState: (state: MicTestState) => void
  ): Promise<void> {
    if (this.running || typeof MediaRecorder === 'undefined') {
      return;
    }
    this.running = true;
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: microphoneDeviceId ? { deviceId: { exact: microphoneDeviceId } } : true,
      });
      const clip = await this.record(stream, onState);
      await this.play(clip, speakerDeviceId, onState);
    } finally {
      stream?.getTracks().forEach(track => track.stop());
      this.running = false;
      onState({ phase: 'idle' });
    }
  }

  private record(stream: MediaStream, onState: (state: MicTestState) => void): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      let secondsLeft = RECORD_SECONDS;
      onState({ phase: 'recording', secondsLeft });
      const tick = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
          clearInterval(tick);
          recorder.stop();
        } else {
          onState({ phase: 'recording', secondsLeft });
        }
      }, 1000);
      recorder.addEventListener('dataavailable', event => chunks.push(event.data));
      recorder.addEventListener('stop', () =>
        resolve(new Blob(chunks, { type: recorder.mimeType }))
      );
      recorder.addEventListener('error', () => {
        clearInterval(tick);
        reject(new Error(STRINGS.micTestRecordingFailed));
      });
      recorder.start();
    });
  }

  private async play(
    clip: Blob,
    speakerDeviceId: string | undefined,
    onState: (state: MicTestState) => void
  ): Promise<void> {
    const audio = new Audio(URL.createObjectURL(clip));
    if (speakerDeviceId && 'setSinkId' in audio) {
      try {
        await (audio as HTMLAudioElement & { setSinkId(id: string): Promise<void> }).setSinkId(
          speakerDeviceId
        );
      } catch {
        // Fall back to the default output.
      }
    }
    onState({ phase: 'playing' });
    await new Promise<void>(resolve => {
      audio.addEventListener('ended', () => resolve(), { once: true });
      audio.addEventListener('error', () => resolve(), { once: true });
      void audio.play().catch(() => resolve());
    });
    URL.revokeObjectURL(audio.src);
  }
}
