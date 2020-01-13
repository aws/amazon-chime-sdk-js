// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DOMWebSocket from '../domwebsocket/DOMWebSocket';
import Maybe from '../maybe/Maybe';
import TimeoutScheduler from '../scheduler/TimeoutScheduler';
import PromisedWebSocket from './PromisedWebSocket';

export default class DefaultPromisedWebSocket implements PromisedWebSocket {
  private callbacks = new Map<string, Set<EventListener>>();

  constructor(private webSocket: DOMWebSocket) {}

  get url(): string {
    return this.webSocket.url;
  }

  async open(timeoutMs: number): Promise<Event> {
    const promise = new Promise<Event>((resolve, reject) => {
      this.webSocket.onclose = (event: CloseEvent) => {
        this.dispatchEvent(event);
      };
      this.webSocket.onmessage = (event: MessageEvent) => {
        this.dispatchEvent(event);
      };
      this.webSocket.onopen = (event: Event) => {
        this.dispatchEvent(event);
        resolve(event);
      };
      this.webSocket.onerror = (event: ErrorEvent) => {
        this.dispatchEvent(event);
        reject(event);
      };
    });
    return this.withTimeout(promise, timeoutMs);
  }

  async close(timeoutMs: number, code?: number, reason?: string): Promise<Event> {
    const promise = new Promise<Event>((resolve, reject) => {
      this.webSocket.onclose = (event: CloseEvent) => {
        this.dispatchEvent(event);
        resolve(event);
      };
      this.webSocket.onerror = (event: ErrorEvent) => {
        this.dispatchEvent(event);
        reject(event);
      };
      this.webSocket.close(code, reason);
    });
    return this.withTimeout(promise, timeoutMs);
  }

  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
    this.webSocket.send(data);
  }

  onMessage(fn: (event: MessageEvent) => void): PromisedWebSocket {
    this.addEventListener('message', fn);
    return this;
  }

  onClose(fn: (event: CloseEvent) => void): PromisedWebSocket {
    this.addEventListener('close', fn);
    return this;
  }

  dispatchEvent(event: Event): boolean {
    Maybe.of(this.callbacks.get(event.type)).map(listeners =>
      listeners.forEach(listener => listener(event))
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

  private async withTimeout(promise: Promise<Event>, timeoutMs: number): Promise<Event> {
    const timeout = new Promise<Event>((resolve, reject) => {
      new TimeoutScheduler(timeoutMs).start(() => {
        reject(new Error('Promise timed out after ' + timeoutMs + 'ms'));
      });
    });
    return Promise.race([promise, timeout]);
  }
}
