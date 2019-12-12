// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class DOMMediaRecorderMock implements EventTarget {
  private listeners = new Map<string, Set<EventListener>>();

  constructor(readonly stream: MediaStream, _options?: MediaRecorderOptions) {
    stream.addEventListener('dataavailable', (event: BlobEvent) => {
      this.dispatchEvent(event);
    });
  }

  start(_timeSliceMs: number): void {}

  stop(): void {
    this.dispatchEvent(new CustomEvent('stop'));
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
