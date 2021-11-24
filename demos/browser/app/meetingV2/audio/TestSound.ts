// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  DefaultAudioMixController,
  DefaultBrowserBehavior,
  Logger,
  TimeoutScheduler,
} from 'amazon-chime-sdk-js';

import { fatal } from '../meetingV2'

export default class TestSound {
  static testAudioElement = new Audio();

  constructor(
    private logger: Logger,
    private sinkId: string | null,
    private frequency: number = 440,
    private durationSec: number = 1,
    private rampSec: number = 0.1,
    private maxGainValue: number = 0.1
  ) { }

  async init(): Promise<void> {
    const audioContext: AudioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    const oscillatorNode = audioContext.createOscillator();
    oscillatorNode.frequency.value = this.frequency;
    oscillatorNode.connect(gainNode);
    const destinationStream = audioContext.createMediaStreamDestination();
    gainNode.connect(destinationStream);
    const currentTime = audioContext.currentTime;
    const startTime = currentTime + 0.1;
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
        // @ts-ignore
        await audioMixController.bindAudioDevice({ deviceId: this.sinkId });
      } catch (e) {
        fatal(e);
        this.logger?.error(`Failed to bind audio device: ${e}`);
      }
    }
    try {
      await audioMixController.bindAudioElement(TestSound.testAudioElement);
    } catch (e) {
      fatal(e);
      this.logger?.error(`Failed to bind audio element: ${e}`);
    }
    await audioMixController.bindAudioStream(destinationStream.stream);
    new TimeoutScheduler((this.rampSec * 2 + this.durationSec + 1) * 1000).start(() => {
      audioContext.close();
    });
  }
}