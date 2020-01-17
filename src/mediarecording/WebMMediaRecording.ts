// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import Maybe from '../maybe/Maybe';
import MediaRecording from './MediaRecording';
import MediaRecordingEvent from './MediaRecordingEvent';
import MediaRecordingOptions from './MediaRecordingOptions';

export default class WebMMediaRecording implements MediaRecording {
  private static readonly browser = new DefaultBrowserBehavior();
  private static readonly options: MediaRecorderOptions = {
    mimeType: 'video/webm; codecs=vp8',
  };

  private delegate: MediaRecorder | null = null;
  readonly options: MediaRecorderOptions;
  private timeSliceMs: number;
  private listeners = new Map<string, Set<EventListener>>();

  constructor(
    private mediaStream: MediaStream,
    options: MediaRecordingOptions = {},
    private browser: DefaultBrowserBehavior = WebMMediaRecording.browser
  ) {
    this.options = { ...options, ...WebMMediaRecording.options };
  }

  key(): void {
    if (this.delegate && this.delegate.state === 'paused') {
      return;
    }
    const delegate = this.delegate;
    const mediaStream = delegate === null ? this.mediaStream : this.mediaStream.clone();
    this.delegate = new MediaRecorder(mediaStream, this.options);
    this.delegate.addEventListener('dataavailable', (event: BlobEvent) => {
      this.dispatchEvent(event);
    });
    /**
     * Chrome 'ended' callback:
     * This is a Chrome-specific callback that we receive when the user clicks the "Stop Sharing" button
     * in the Chrome screen sharing bar.
     */
    this.delegate.stream.getTracks().forEach((track: MediaStreamTrack) => {
      track.addEventListener('ended', () => {
        const event = new CustomEvent(MediaRecordingEvent.EndedEvent, { detail: track });
        this.dispatchEvent(event);
      });
    });
    if (delegate !== null) {
      if (this.browser.isChrome()) {
        delegate.stream.getTracks().forEach(stream => stream.stop());
      }
      delegate.stop();
    }
    this.delegate.start(this.timeSliceMs);
  }

  start(timeSliceMs?: number): void {
    this.timeSliceMs = timeSliceMs;
    this.key();
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.delegate === null) {
        reject(new Error('not started'));
      }
      // this event should fire after any data is de-queued
      this.delegate.addEventListener('stop', () => {
        resolve();
      });
      this.delegate.stream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      this.delegate.stop();
    });
  }

  pause(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.delegate === null) {
        reject(new Error('not started'));
      }
      // this event should fire after any data is de-queued
      this.delegate.addEventListener('pause', () => {
        resolve();
      });
      this.delegate.pause();
    });
  }

  unpause(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.delegate === null) {
        reject(new Error('not started'));
      }
      resolve();
      this.delegate.resume();
    });
  }

  get recordingState(): RecordingState {
    return this.delegate.state;
  }

  addEventListener(type: string, listener: EventListener): void {
    Maybe.of(this.listeners.get(type))
      .defaulting(new Set<EventListener>())
      .map(listeners => listeners.add(listener))
      .map(listeners => this.listeners.set(type, listeners));
  }

  dispatchEvent(event: Event): boolean {
    Maybe.of(this.listeners.get(event.type)).map(listeners => {
      listeners.forEach(listener => listener(event));
    });
    return event.defaultPrevented;
  }

  removeEventListener(type: string, listener: EventListener): void {
    Maybe.of(this.listeners.get(type)).map(f => f.delete(listener));
  }
}
