// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DOMWebSocket from '../../src/domwebsocket/DOMWebSocket';
import Maybe from '../../src/maybe/Maybe';

export default class DOMWebSocketMock implements DOMWebSocket {
  get url(): string {
    return 'ws://localhost';
  }
  onerror: EventListener | null = null;
  onopen: EventListener | null = null;
  onmessage: EventListener | null = null;
  onclose: EventListener | null = null;
  binaryType: BinaryType = 'arraybuffer';
  private callbacks = new Map<string, Set<EventListener>>();

  addEventListener(type: string, listener: EventListener): void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, new Set<EventListener>());
    }
    this.callbacks.get(type).add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    if (this.callbacks.has(type)) {
      this.callbacks.get(type).delete(listener);
    }
  }

  dispatchEvent(event: Event): boolean {
    if (this.callbacks.get(event.type)) {
      this.callbacks.get(event.type).forEach((listener: EventListener) => {
        listener(event);
      });
    }
    switch (event.type) {
      case 'error':
        Maybe.of(this.onerror).map(f => f(event));
        break;
      case 'message':
        Maybe.of(this.onmessage).map(f => f(event));
        break;
      case 'open':
        Maybe.of(this.onopen).map(f => f(event));
        break;
      case 'close':
        Maybe.of(this.onclose).map(f => f(event));
        break;
      default:
        break;
    }
    return event.defaultPrevented;
  }

  close(_code?: number, _reason?: string): void {}

  send(_data: string | ArrayBuffer | Blob | ArrayBufferView): void {}
}
