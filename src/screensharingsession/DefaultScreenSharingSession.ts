// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import Maybe from '../maybe/Maybe';
import MediaRecording from '../mediarecording/MediaRecording';
import MediaRecordingFactory from '../mediarecording/MediaRecordingFactory';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import PromisedWebSocket from '../promisedwebsocket/PromisedWebSocket';
import ScreenShareStreamFactory from '../screensharestreaming/ScreenShareStreamFactory';
import ScreenShareStreaming from '../screensharestreaming/ScreenShareStreaming';
import ScreenShareStreamingEvent from '../screensharestreaming/ScreenShareStreamingEvent';
import ScreenSharingMessage from '../screensharingmessage/ScreenSharingMessage';
import ScreenSharingMessageFlag from '../screensharingmessage/ScreenSharingMessageFlag';
import ScreenSharingMessageType from '../screensharingmessage/ScreenSharingMessageType';
import ScreenSharingMessageSerialization from '../screensharingmessageserialization/ScreenSharingMessageSerialization';
import ScreenSharingSession from './ScreenSharingSession';
import ScreenSharingSessionObserver from './ScreenSharingSessionObserver';

export default class DefaultScreenSharingSession implements ScreenSharingSession {
  private observerQueue = new Set<ScreenSharingSessionObserver>();
  private stream: ScreenShareStreaming | null = null;

  constructor(
    private webSocket: PromisedWebSocket,
    private constraintsProvider: (sourceId?: string) => MediaStreamConstraints,
    private timeSliceMs: number,
    private messageSerialization: ScreenSharingMessageSerialization,
    private mediaStreamBroker: MediaStreamBroker,
    private screenShareStreamFactory: ScreenShareStreamFactory,
    private mediaRecordingFactory: MediaRecordingFactory,
    private logger: Logger
  ) {}

  open(timeoutMs: number): Promise<Event> {
    this.webSocket.addEventListener('message', (event: MessageEvent) => {
      this.didReceiveMessageEvent(event);
      this.logger.debug(() => 'dispatched message event');
    });

    this.webSocket.addEventListener('close', (event: CloseEvent) => {
      this.logger.warn('screen sharing connection closed');
      this.stop().catch(() => {});
      this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
        Maybe.of(observer.didClose).map(f => f.bind(observer)(event));
      });
    });

    this.webSocket.addEventListener('reconnect', (event: Event) => {
      this.logger.warn('screen sharing connection reconnecting');
      this.stop().catch(() => {});
      this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
        Maybe.of(observer.willReconnect).map(f => f.bind(observer)(event));
      });
    });

    this.webSocket.addEventListener('open', (event: Event) => {
      this.logger.warn('screen sharing connection opened');
      this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
        Maybe.of(observer.didOpen).map(f => f.bind(observer)(event));
      });
    });

    this.logger.info(`opening screen sharing connection to ${this.webSocket.url}`);

    return this.webSocket.open(timeoutMs);
  }

  close(timeoutMs: number): Promise<Event> {
    return this.webSocket.close(timeoutMs).then((event: CloseEvent) => {
      this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
        Maybe.of(observer.didClose).map(f => f.bind(observer)(event));
      });
      return event;
    });
  }

  start(sourceId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.stream !== null) {
        reject(new Error('started'));
      }
      return this.mediaStreamBroker
        .acquireDisplayInputStream(this.constraintsProvider(sourceId))
        .then((mediaStream: MediaStream) => {
          return this.mediaRecordingFactory.create(mediaStream);
        })
        .then((mediaRecording: MediaRecording) => {
          return this.screenShareStreamFactory.create(mediaRecording);
        })
        .then((stream: ScreenShareStreaming) => {
          stream.addEventListener(
            ScreenShareStreamingEvent.MessageEvent,
            (event: CustomEvent<ScreenSharingMessage>) => {
              this.send(event.detail);
              this.logger.debug(() => 'dispatched screen sharing stream message event');
            }
          );
          stream.addEventListener(ScreenShareStreamingEvent.EndedEvent, () => {
            this.logger.info('stream ended');
            this.stop().then(() => {});
          });
          (this.stream = stream).start(this.timeSliceMs);
        })
        .then(() => {
          this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
            Maybe.of(observer.didStartScreenSharing).map(f => f.bind(observer)());
          });
        })
        .then(() => {
          this.logger.info('screen sharing stream started');
        })
        .then(resolve);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.stream === null) {
        reject(new Error('not started'));
      }
      this.stream
        .stop()
        .then(() => {
          this.stream = null;
        })
        .then(() => {
          this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
            Maybe.of(observer.didStopScreenSharing).map(f => f.bind(observer)());
          });
        })
        .then(() => {
          this.logger.info('screen sharing stream stopped');
        })
        .then(resolve);
    });
  }

  registerObserver(observer: ScreenSharingSessionObserver): ScreenSharingSession {
    this.observerQueue.add(observer);
    return this;
  }

  deregisterObserver(observer: ScreenSharingSessionObserver): ScreenSharingSession {
    this.observerQueue.delete(observer);
    return this;
  }

  private didReceiveMessageEvent(event: MessageEvent): void {
    this.logger.debug(() => `didReceiveMessageEvent: ${new Uint8Array(event.data)}`);
    const message = this.messageSerialization.deserialize(new Uint8Array(event.data));
    switch (message.type) {
      case ScreenSharingMessageType.HeartbeatRequestType:
        return this.didReceiveHeartbeatRequestMessage();
      case ScreenSharingMessageType.StreamStop:
        return this.didReceiveStreamStopMessage();
      case ScreenSharingMessageType.KeyRequest:
        return this.didReceiveKeyRequest();
      default:
        return this.didReceiveUnknownMessage();
    }
  }

  private didReceiveKeyRequest(): void {
    this.logger.info('received key request message');
    this.stream.key();
  }

  private didReceiveStreamStopMessage(): void {
    this.logger.debug(() => 'received stream stop message');
    this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
      Maybe.of(observer.didReceiveStreamStopMessage).map(f => f.bind(observer)());
    });
    this.stop().then(() => {});
  }

  private didReceiveUnknownMessage(): void {
    this.logger.debug(() => 'received unknown message');
    this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
      Maybe.of(observer.didReceiveUnknownMessage).map(f => f.bind(observer)());
    });
  }

  private didReceiveHeartbeatRequestMessage(): void {
    this.logger.debug(() => 'received heartbeat request');

    this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
      Maybe.of(observer.didReceiveHeartbeatRequest).map(f => f.bind(observer)());
    });

    const response: ScreenSharingMessage = {
      type: ScreenSharingMessageType.HeartbeatResponseType,
      flags: [ScreenSharingMessageFlag.Local],
      data: new Uint8Array([]),
    };

    this.send(response);

    this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
      Maybe.of(observer.didSendHeartbeatResponse).map(f => f.bind(observer)());
    });
  }

  private send(message: ScreenSharingMessage): ScreenSharingMessage {
    this.webSocket.send(this.messageSerialization.serialize(message));
    this.logger.debug(() => 'sent screen sharing message');
    this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
      Maybe.of(observer.didSendScreenSharingMessage).map(f => f.bind(observer)(message.type));
    });
    return message;
  }
}
