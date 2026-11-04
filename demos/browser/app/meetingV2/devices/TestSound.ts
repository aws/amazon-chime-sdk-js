// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  DefaultAudioMixController,
  DefaultBrowserBehavior,
  Logger,
  TimeoutScheduler,
} from 'amazon-chime-sdk-js';

/** Plays a short sine tone through the chosen output device so the user can confirm the speaker. */
export default class TestSound {
  static testAudioElement = new Audio();
  /** How long the default tone plays, ramps included. */
  static readonly PLAY_MS = 1300;

  constructor(
    private logger: Logger | undefined,
    private sinkId: string | null,
    private frequency: number = 440,
    private durationSec: number = 1,
    private rampSec: number = 0.1,
    private maxGainValue: number = 0.1
  ) {}

  async init(): Promise<void> {
    const audioContext: AudioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    const oscillatorNode = audioContext.createOscillator();
    oscillatorNode.frequency.value = this.frequency;
    oscillatorNode.connect(gainNode);
    const destinationStream = audioContext.createMediaStreamDestination();
    gainNode.connect(destinationStream);
    const startTime = audioContext.currentTime + 0.1;
    gainNode.gain.linearRampToValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(this.maxGainValue, startTime + this.rampSec);
    gainNode.gain.linearRampToValueAtTime(
      this.maxGainValue,
      startTime + this.rampSec + this.durationSec
    );
    gainNode.gain.linearRampToValueAtTime(0, startTime + this.rampSec * 2 + this.durationSec);
    oscillatorNode.start();
    const audioMixController = new DefaultAudioMixController(this.logger);
    if (new DefaultBrowserBehavior().supportsSetSinkId()) {
      try {
        // @ts-ignore bindAudioDevice accepts a MediaDeviceInfo-like object.
        await audioMixController.bindAudioDevice({ deviceId: this.sinkId });
      } catch (e) {
        this.logger?.error(`Failed to bind audio device: ${e}`);
      }
    }
    try {
      await audioMixController.bindAudioElement(TestSound.testAudioElement);
    } catch (e) {
      this.logger?.error(`Failed to bind audio element: ${e}`);
    }
    await audioMixController.bindAudioStream(destinationStream.stream);
    new TimeoutScheduler((this.rampSec * 2 + this.durationSec + 1) * 1000).start(() => {
      audioContext.close();
    });
  }
}
