// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';

import ScreenShareStreaming from '../../src/screensharestreaming/ScreenShareStreaming';
import ScreenSharingMessage from '../../src/screensharingmessage/ScreenSharingMessage';

export default class ScreenShareStreamingMock implements ScreenShareStreaming {
  private listeners = new Map<string, Set<EventListener>>();

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

  start(_timeSliceMs?: number): ScreenSharingMessage {
    return Substitute.for<ScreenSharingMessage>();
  }

  stop(): Promise<void> {
    return Promise.resolve();
  }

  key(): void {}

  pause(): Promise<void> {
    return Promise.resolve();
  }

  unpause(): Promise<void> {
    return Promise.resolve();
  }
}
