// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';

import Maybe from '../../src/maybe/Maybe';
import PromisedWebSocket from '../../src/promisedwebsocket/PromisedWebSocket';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';

export default class PromisedWebSocketMock implements PromisedWebSocket {
  private callbacks = new Map<string, Set<EventListener>>();

  constructor(private closeDelay: number = 0) {}

  get url(): string {
    return 'ws://localhost';
  }

  open(_timeoutMs: number): Promise<Event> {
    const event = Substitute.for<Event>();
    event.type.returns('open');
    this.dispatchEvent(event);
    return Promise.resolve(event);
  }

  close(timeoutMs: number): Promise<Event> {
    const event = Substitute.for<CloseEvent>();
    event.type.returns('close');

    if (this.closeDelay > 0) {
      const promise = new Promise<CloseEvent>(resolve => {
        setTimeout(() => {
          resolve(event);
        }, this.closeDelay);
      });
      return this.withTimeout(promise, timeoutMs);
    } else {
      return Promise.resolve(event);
    }
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

  private withTimeout(promise: Promise<Event>, timeoutMs: number): Promise<Event> {
    const timeout = new Promise<Event>((resolve, reject) => {
      new TimeoutScheduler(timeoutMs).start(() => {
        reject(new Error('Promise timed out after ' + timeoutMs + 'ms'));
      });
    });
    return Promise.race([promise, timeout]);
  }
}
