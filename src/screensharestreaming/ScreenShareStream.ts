// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MediaRecording from '../mediarecording/MediaRecording';
import MediaRecordingEvent from '../mediarecording/MediaRecordingEvent';
import ScreenSharingMessage from '../screensharingmessage/ScreenSharingMessage';
import ScreenSharingMessageFlag from '../screensharingmessage/ScreenSharingMessageFlag';
import ScreenSharingMessageType from '../screensharingmessage/ScreenSharingMessageType';
import ScreenShareStreaming from './ScreenShareStreaming';
import ScreenShareStreamingEvent from './ScreenShareStreamingEvent';

export default class ScreenShareStream implements ScreenShareStreaming {
  private listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  constructor(private mediaRecording: MediaRecording) {}

  key(): void {
    return this.mediaRecording.key();
  }

  start(timeSliceMs?: number): void {
    this.mediaRecording.addEventListener('dataavailable', (event: BlobEvent) => {
      this.onDataAvailable(event);
    });

    this.mediaRecording.addEventListener(MediaRecordingEvent.EndedEvent, () => {
      this.dispatchEvent(new CustomEvent(ScreenShareStreamingEvent.EndedEvent));
    });

    const message: ScreenSharingMessage = {
      type: ScreenSharingMessageType.StreamStart,
      flags: [ScreenSharingMessageFlag.Local],
      data: new Uint8Array([]),
    };

    this.dispatchEvent(this.newMessageEvent(message));

    this.mediaRecording.start(timeSliceMs);
  }

  stop(): Promise<void> {
    return this.mediaRecording.stop().then(() => {
      const message: ScreenSharingMessage = {
        type: ScreenSharingMessageType.StreamEnd,
        flags: [ScreenSharingMessageFlag.Local],
        data: new Uint8Array([]),
      };
      this.dispatchEvent(this.newMessageEvent(message));
    });
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set<EventListener>());
    }
    this.listeners.get(type).add(listener);
  }

  dispatchEvent(event: Event): boolean {
    if (this.listeners.has(event.type)) {
      this.listeners.get(event.type).forEach((listener: EventListener) => {
        listener(event);
      });
    }
    return event.defaultPrevented;
  }

  removeEventListener(type: string, listener: EventListener): void {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(listener);
    }
  }

  private onDataAvailable(event: BlobEvent): void {
    if (event.data.size !== 0) {
      const message: ScreenSharingMessage = {
        type: ScreenSharingMessageType.WebM,
        flags: [ScreenSharingMessageFlag.Broadcast],
        data: event.data,
      };
      this.dispatchEvent(this.newMessageEvent(message));
    }
  }

  private newMessageEvent(message: ScreenSharingMessage): CustomEvent<ScreenSharingMessage> {
    return new CustomEvent<ScreenSharingMessage>(ScreenShareStreamingEvent.MessageEvent, {
      detail: message,
    });
  }
}
