// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import Logger from '../logger/Logger';
import AudioMixController from './AudioMixController';

export default class DefaultAudioMixController implements AudioMixController {
  private audioDevice: MediaDeviceInfo | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioStream: MediaStream | null = null;
  private browserBehavior: BrowserBehavior = new DefaultBrowserBehavior();

  constructor(private logger?: Logger) {}

  async bindAudioElement(element: HTMLAudioElement): Promise<void> {
    if (element) {
      this.audioElement = element;
      this.audioElement.autoplay = true;
      return this.bindAudioMix();
    } else {
      throw new Error(`cannot bind audio element: ${element}`);
    }
  }

  unbindAudioElement(): void {
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }
  }

  async bindAudioStream(stream: MediaStream): Promise<void> {
    if (stream) {
      this.audioStream = stream;
      try {
        await this.bindAudioMix();
      } catch (error) {
        this.logger?.error(`Failed to bind audio stream: ${error}`);
      }
    }
  }

  async bindAudioDevice(device: MediaDeviceInfo | null): Promise<void> {
    /**
     * Throw error if browser doesn't even support setSinkId
     * Read more: https://caniuse.com/?search=setSinkId
     */
    if (!this.browserBehavior.supportsSetSinkId()) {
      throw new Error(
        'Cannot select audio output device. This browser does not support setSinkId.'
      );
    }

    if (device) {
      this.audioDevice = device;
      return this.bindAudioMix();
    }
  }

  private async bindAudioMix(): Promise<void> {
    if (!this.audioElement) {
      return;
    }

    if (this.audioStream) {
      this.audioElement.srcObject = this.audioStream;
    }
    // @ts-ignore
    if (typeof this.audioElement.sinkId === 'undefined') {
      throw new Error(
        'Cannot select audio output device. This browser does not support setSinkId.'
      );
    }

    const newSinkId = this.audioDevice ? this.audioDevice.deviceId : '';
    // @ts-ignore
    const oldSinkId: string = this.audioElement.sinkId;
    if (newSinkId === oldSinkId) {
      return;
    }

    const existingAudioElement = this.audioElement;
    const existingStream = this.audioStream;
    if (this.browserBehavior.hasChromiumWebRTC()) {
      existingAudioElement.srcObject = null;
    }
    try {
      // @ts-ignore
      await existingAudioElement.setSinkId(newSinkId);
    } catch (error) {
      this.logger?.error(`Failed to set sinkId for audio element: ${error}`);
      throw error;
    }
    if (this.browserBehavior.hasChromiumWebRTC()) {
      existingAudioElement.srcObject = existingStream;
    }
  }
}
