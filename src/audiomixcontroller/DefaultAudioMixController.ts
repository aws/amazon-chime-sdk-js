// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import AudioMixController from './AudioMixController';

export default class DefaultAudioMixController implements AudioMixController {
  private audioDevice: MediaDeviceInfo | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioStream: MediaStream | null = null;
  private browserBehavior: BrowserBehavior = new DefaultBrowserBehavior();

  bindAudioElement(element: HTMLAudioElement): boolean {
    if (element) {
      this.audioElement = element;
      this.audioElement.autoplay = true;
      return this.bindAudioMix();
    }
    return false;
  }

  unbindAudioElement(): void {
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }
  }

  bindAudioStream(stream: MediaStream): boolean {
    if (stream) {
      this.audioStream = stream;
      return this.bindAudioMix();
    }
    return false;
  }

  bindAudioDevice(device: MediaDeviceInfo | null): boolean {
    if (device) {
      this.audioDevice = device;
      return this.bindAudioMix();
    }
    return false;
  }

  private bindAudioMix(): boolean {
    if (this.audioElement) {
      if (this.audioStream) {
        this.audioElement.srcObject = this.audioStream;
      }
      // @ts-ignore
      if (typeof this.audioElement.sinkId !== 'undefined') {
        const newSinkId = this.audioDevice ? this.audioDevice.deviceId : '';
        // @ts-ignore
        const oldSinkId: string = this.audioElement.sinkId;
        if (newSinkId !== oldSinkId) {
          if (this.browserBehavior.hasChromiumWebRTC()) {
            const existingAudioElement = this.audioElement;
            const existingstream = this.audioStream;
            existingAudioElement.srcObject = null;
            // @ts-ignore
            existingAudioElement.setSinkId(newSinkId).then(() => {
              if (this.audioElement === existingAudioElement) {
                existingAudioElement.srcObject = existingstream;
              }
            });
          } else {
            // @ts-ignore
            this.audioElement.setSinkId(newSinkId);
          }
        }
        return true;
      }
    }
    return false;
  }
}
