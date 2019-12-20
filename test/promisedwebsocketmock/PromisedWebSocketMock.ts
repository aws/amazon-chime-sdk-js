// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';

import Maybe from '../../src/maybe/Maybe';
import PromisedWebSocket from '../../src/promisedwebsocket/PromisedWebSocket';

export default class PromisedWebSocketMock implements PromisedWebSocket {
  private callbacks = new Map<string, Set<EventListener>>();

  get url(): string {
    return 'ws://localhost';
  }

  open(_timeoutMs: number): Promise<Event> {
    const event = Substitute.for<Event>();
    event.type.returns('open');
    this.dispatchEvent(event);
    return Promise.resolve(event);
  }

  close(_timeoutMs: number): Promise<Event> {
    const event = Substitute.for<CloseEvent>();
    event.type.returns('close');
    this.dispatchEvent(event);
    return Promise.resolve(event);
  }

  send(_data: string | ArrayBufferLike | Blob | ArrayBufferView): Promise<void> {
    return Promise.resolve();
  }

  dispatchEvent(event: Event): boolean {
    Maybe.of(this.callbacks.get(event.type)).map(listeners =>
      listeners.forEach((listener: EventListener) => listener(event))
    );
    return event.defaultPrevented;
  }

  addEventListener(type: string, listener: EventListener): void {
    Maybe.of(this.callbacks.get(type))
      .defaulting(new Set<EventListener>())
      .map(listeners => listeners.add(listener))
      .map(listeners => this.callbacks.set(type, listeners));
  }

  removeEventListener(type: string, listener: EventListener): void {
    Maybe.of(this.callbacks.get(type)).map(f => f.delete(listener));
  }
}
