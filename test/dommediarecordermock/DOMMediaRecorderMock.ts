// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class DOMMediaRecorderMock implements EventTarget {
  private listeners = new Map<string, Set<EventListener>>();
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  public state: RecordingState = 'inactive';

  constructor(public readonly stream: MediaStream, _options?: MediaRecorderOptions) {
    stream.addEventListener('dataavailable', (event: BlobEvent) => {
      this.dispatchEvent(event);
    });
  }

  start(_timeSliceMs: number): void {
    this.state = 'recording';
  }

  stop(): void {
    this.state = 'inactive';
    this.dispatchEvent(new CustomEvent('stop'));
  }

  pause(): void {
    this.state = this.state === 'recording' ? 'paused' : this.state;
    this.dispatchEvent(new CustomEvent('pause'));
  }

  resume(): void {
    this.state = this.state === 'paused' ? 'recording' : this.state;
    this.dispatchEvent(new CustomEvent('unpause'));
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners.get(type)) {
      this.listeners.set(type, new Set<EventListener>());
    }
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    if (this.listeners.get(type)) {
      this.listeners.get(type).delete(listener);
    }
  }
  dispatchEvent(event: Event): boolean {
    if (this.listeners.get(event.type)) {
      this.listeners.get(event.type).forEach((listener: EventListener) => {
        listener(event);
      });
    }
    return event.defaultPrevented;
  }
}
