// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioMixObserver from '../audiomixobserver/AudioMixObserver';
import BrowserBehavior from '../browserbehavior/BrowserBehavior';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import Logger from '../logger/Logger';
import MediaStreamBrokerObserver from '../mediastreambrokerobserver/MediaStreamBrokerObserver';
import AsyncScheduler from '../scheduler/AsyncScheduler';
import AudioMixController from './AudioMixController';

/** @internal */
interface AudioElementWithSinkId extends HTMLAudioElement {
  sinkId: string;
  setSinkId: (id: string) => void;
}

export default class DefaultAudioMixController
  implements AudioMixController, MediaStreamBrokerObserver {
  private audioDevice: MediaDeviceInfo | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioStream: MediaStream | null = null;
  private browserBehavior: BrowserBehavior = new DefaultBrowserBehavior();
  private observers: Set<AudioMixObserver> = new Set<AudioMixObserver>();

  constructor(private logger?: Logger) {}

  async bindAudioElement(element: HTMLAudioElement): Promise<void> {
    if (!element) {
      throw new Error(`Cannot bind audio element: ${element}`);
    }
    this.audioElement = element;
    this.audioElement.autoplay = true;
    return this.bindAudioMix();
  }

  unbindAudioElement(): void {
    if (!this.audioElement) {
      return;
    }
    this.audioElement.srcObject = null;
    this.audioElement = null;
    this.forEachObserver((observer: AudioMixObserver) => {
      if (this.audioStream) {
        observer.meetingAudioStreamBecameInactive(this.audioStream);
      }
    });
  }

  async bindAudioStream(stream: MediaStream): Promise<void> {
    if (!stream) {
      return;
    }

    this.audioStream = stream;

    try {
      await this.bindAudioMix();
    } catch (error) {
      /* istanbul ignore else */
      if (this.logger) {
        this.logger.warn(`Failed to bind audio stream: ${error}`);
      }
    }
  }

  async bindAudioDevice(device: MediaDeviceInfo | null): Promise<void> {
    /**
     * Throw error if browser doesn't even support setSinkId
     * Read more: https://caniuse.com/?search=setSinkId
     */
    if (device && !this.browserBehavior.supportsSetSinkId()) {
      throw new Error(
        'Cannot select audio output device. This browser does not support setSinkId.'
      );
    }

    // Always set device -- we might be setting it back to `null` to reselect
    // the default, and even in that case we need to call `bindAudioMix` in
    // order to update the sink ID to the empty string.
    this.audioDevice = device;
    return this.bindAudioMix();
  }

  private forEachObserver(observerFunc: (observer: AudioMixObserver) => void): void {
    for (const observer of this.observers) {
      AsyncScheduler.nextTick(() => {
        observerFunc(observer);
      });
    }
  }

  private async bindAudioMix(): Promise<void> {
    if (!this.audioElement) {
      return;
    }

    const previousStream = this.audioElement.srcObject as MediaStream;

    if (this.audioStream) {
      this.audioElement.srcObject = this.audioStream;
    }

    if (previousStream !== this.audioStream) {
      this.forEachObserver((observer: AudioMixObserver) => {
        if (previousStream) {
          observer.meetingAudioStreamBecameInactive(previousStream);
        }
        if (this.audioStream) {
          observer.meetingAudioStreamBecameActive(this.audioStream);
        }
      });
    }

    // In usual operation, the output device is undefined, and so is the element
    // sink ID. In this case, don't throw an error -- we're being called as a side
    // effect of just binding the audio element, not choosing an output device.
    const shouldSetSinkId =
      this.audioDevice?.deviceId !== (this.audioElement as AudioElementWithSinkId).sinkId;

    if (
      shouldSetSinkId &&
      typeof (this.audioElement as AudioElementWithSinkId).sinkId === 'undefined'
    ) {
      throw new Error(
        'Cannot select audio output device. This browser does not support setSinkId.'
      );
    }

    const newSinkId = this.audioDevice ? this.audioDevice.deviceId : '';
    const oldSinkId: string = (this.audioElement as AudioElementWithSinkId).sinkId;
    if (newSinkId === oldSinkId) {
      return;
    }

    // Take the existing stream and temporarily unbind it while we change
    // the sink ID.

    const existingAudioElement: AudioElementWithSinkId = this
      .audioElement as AudioElementWithSinkId;
    const existingStream = this.audioStream;
    if (this.browserBehavior.hasChromiumWebRTC()) {
      existingAudioElement.srcObject = null;
    }

    if (shouldSetSinkId) {
      try {
        await existingAudioElement.setSinkId(newSinkId);
      } catch (error) {
        this.logger?.error(`Failed to set sinkId for audio element: ${error}`);
        throw error;
      }
    }

    if (this.browserBehavior.hasChromiumWebRTC()) {
      existingAudioElement.srcObject = existingStream;
    }
  }

  async getCurrentMeetingAudioStream(): Promise<MediaStream | null> {
    return this.audioStream;
  }

  async addAudioMixObserver(observer: AudioMixObserver): Promise<void> {
    this.observers.add(observer);
  }

  async removeAudioMixObserver(observer: AudioMixObserver): Promise<void> {
    this.observers.delete(observer);
  }

  async audioOutputDidChange(device: MediaDeviceInfo | null): Promise<void> {
    this.logger.info('Receive an audio output change event');
    return this.bindAudioDevice(device);
  }
}
