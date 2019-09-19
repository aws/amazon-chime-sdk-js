// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import Maybe from '../maybe/Maybe';
import PromisedWebSocket from '../promisedwebsocket/PromisedWebSocket';
import ScreenSharingMessage from '../screensharingmessage/ScreenSharingMessage';
import ScreenSharingMessageFlag from '../screensharingmessage/ScreenSharingMessageFlag';
import ScreenSharingMessageType from '../screensharingmessage/ScreenSharingMessageType';
import ScreenSharingMessageSerialization from '../screensharingmessageserialization/ScreenSharingMessageSerialization';
import ScreenSignalingSession from './ScreenSignalingSession';
import ScreenSignalingSessionEventType from './ScreenSignalingSessionEventType';

export default class DefaultScreenSignalingSession implements ScreenSignalingSession {
  static SessionKey = '_aws_wt_session';

  private listeners = new Map<string, Set<EventListener>>();

  constructor(
    private webSocket: PromisedWebSocket,
    private messageSerialization: ScreenSharingMessageSerialization,
    private logger: Logger
  ) {
    this.webSocket.addEventListener('message', (event: MessageEvent) => {
      this.onMessageHandler(event);
    });
    this.webSocket.addEventListener('close', (event: CloseEvent) => {
      this.dispatchEvent(event);
    });
  }

  open(timeoutMs: number): Promise<Event> {
    return this.webSocket.open(timeoutMs);
  }

  close(timeoutMs: number): Promise<Event> {
    return this.webSocket.close(timeoutMs);
  }

  addEventListener(type: ScreenSignalingSessionEventType, listener: EventListener): void {
    Maybe.of(this.listeners.get(type))
      .defaulting(new Set<EventListener>())
      .map(listeners => listeners.add(listener))
      .map(listeners => this.listeners.set(type, listeners));
  }

  dispatchEvent(event: Event): boolean {
    Maybe.of(this.listeners.get(event.type)).map(listeners =>
      listeners.forEach(listener => listener(event))
    );
    return event.defaultPrevented;
  }

  removeEventListener(type: ScreenSignalingSessionEventType, listener: EventListener): void {
    Maybe.of(this.listeners.get(type)).map(f => f.delete(listener));
  }

  private onMessageHandler(event: MessageEvent): void {
    const array = new Uint8Array(event.data);
    const message = this.messageSerialization.deserialize(array);
    switch (message.type) {
      case ScreenSharingMessageType.HeartbeatRequestType:
        this.logger.info('DefaultScreenSignalingSession received HeartbeatRequest');
        const response: ScreenSharingMessage = {
          type: ScreenSharingMessageType.HeartbeatResponseType,
          flags: [ScreenSharingMessageFlag.Local],
          data: new Uint8Array([]),
        };
        this.logger.info('Sending HeartbeatResponseType');
        this.webSocket.send(this.messageSerialization.serialize(response));
        this.dispatchEvent(new CustomEvent(ScreenSignalingSessionEventType.Heartbeat));
        break;
      case ScreenSharingMessageType.StreamStart:
        this.logger.info(`received StreamStart; ${JSON.stringify(message.detail)}`);
        const streamStart = new CustomEvent(ScreenSignalingSessionEventType.StreamStart, {
          detail: message.detail,
        });
        this.dispatchEvent(streamStart);
        break;
      case ScreenSharingMessageType.StreamEnd:
        this.logger.info(`received StreamEnd; ${JSON.stringify(message.detail)}`);
        const streamEnd = new CustomEvent(ScreenSignalingSessionEventType.StreamEnd, {
          detail: message.detail,
        });
        this.dispatchEvent(streamEnd);
        break;
      case ScreenSharingMessageType.PresenterSwitch:
        this.logger.info(`received PresenterSwitch; ${JSON.stringify(message.detail)}`);
        const streamSwitch = new CustomEvent(ScreenSignalingSessionEventType.StreamSwitch, {
          detail: message.detail,
        });
        this.dispatchEvent(streamSwitch);
        break;
    }
  }
}
