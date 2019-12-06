// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MediaRecording from './MediaRecording';
import MediaRecordingEvent from './MediaRecordingEvent';
import MediaRecordingOptions from './MediaRecordingOptions';

/** @internal */
export default class WebMMediaRecording implements MediaRecording {
  private static options: MediaRecorderOptions = {
    mimeType: 'video/webm; codecs=vp8',
  };

  private delegate: MediaRecorder;

  constructor(mediaStream: MediaStream, options: MediaRecordingOptions = {}) {
    const mediaRecorderOptions = { ...options, ...WebMMediaRecording.options };
    this.delegate = new MediaRecorder(mediaStream, mediaRecorderOptions);
  }

  start(timeSliceMs?: number): void {
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
    this.delegate.start(timeSliceMs);
  }

  stop(): Promise<void> {
    return new Promise(resolve => {
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

  addEventListener(type: string, listener: EventListener): void {
    this.delegate.addEventListener(type, listener);
  }

  dispatchEvent(event: Event): boolean {
    return this.delegate.dispatchEvent(event);
  }

  removeEventListener(
    type: string,
    listener?: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ): void {
    this.delegate.removeEventListener(type, listener, options);
  }
}
