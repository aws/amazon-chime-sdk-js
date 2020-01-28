// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import Logger from '../logger/Logger';
import Maybe from '../maybe/Maybe';
import MediaRecordingFactory from '../mediarecording/MediaRecordingFactory';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import PromisedWebSocket from '../promisedwebsocket/PromisedWebSocket';
import TimeoutScheduler from '../scheduler/TimeoutScheduler';
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
    private logger: Logger,
    private browserBehavior: DefaultBrowserBehavior = new DefaultBrowserBehavior()
  ) {
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

    this.webSocket.addEventListener('reconnect_error', (event: CustomEvent<ErrorEvent>) => {
      this.logger.warn('reconnect attempt failed');
      this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
        Maybe.of(observer.didFailReconnectAttempt).map(f => f.bind(observer)(event));
      });
    });

    this.webSocket.addEventListener('open', (event: Event) => {
      this.logger.warn('screen sharing connection opened');
      this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
        Maybe.of(observer.didOpen).map(f => f.bind(observer)(event));
      });
    });
  }

  open(timeoutMs: number): Promise<Event> {
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

  async start(sourceId?: string, timeoutMs?: number): Promise<void> {
    /* istanbul ignore next */
    if (timeoutMs === null || timeoutMs === undefined) {
      timeoutMs = 3000;
    }
    if (this.stream !== null) {
      throw new Error('started');
    }
    if (this.browserBehavior.screenShareUnsupported()) {
      throw new Error('Safari browser does not support screen sharing');
    }

    const input = await this.mediaStreamBroker.acquireDisplayInputStream(
      this.constraintsProvider(sourceId)
    );

    if (timeoutMs > 0) {
      await this.ping(timeoutMs);
    }

    const stream = this.screenShareStreamFactory.create(this.mediaRecordingFactory.create(input));

    stream.addEventListener(
      ScreenShareStreamingEvent.MessageEvent,
      (event: CustomEvent<ScreenSharingMessage>) => {
        try {
          this.send(event.detail);
          this.logger.debug(() => 'dispatched screen sharing stream message event');
        } catch (error) {
          this.logger.error(error);
        }
      }
    );

    stream.addEventListener(ScreenShareStreamingEvent.EndedEvent, () => {
      this.logger.info('stream ended');
      this.stop().then(() => {});
    });

    stream.start(this.timeSliceMs);
    this.stream = stream;

    this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
      Maybe.of(observer.didStartScreenSharing).map(f => f.bind(observer)());
    });

    this.logger.info('screen sharing stream started');
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.stream === null) {
        return reject(new Error('not started'));
      }
      this.stream
        .stop()
        .then(() => {
          this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
            Maybe.of(observer.didStopScreenSharing).map(f => f.bind(observer)());
          });
        })
        .then(() => {
          this.logger.info('screen sharing stream stopped');
        })
        .finally(() => {
          this.stream = null;
        })
        .then(resolve);
    });
  }

  pause(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.stream === null) {
        return reject(new Error('not started'));
      }
      this.stream.pause().then(() => {
        this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
          Maybe.of(observer.didPauseScreenSharing).map(f => f.bind(observer)());
        });
      });
      this.logger.info('screen sharing stream paused');
      resolve();
    });
  }

  unpause(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.stream === null) {
        return reject(new Error('not started'));
      }
      this.stream.unpause().then(() => {
        this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
          Maybe.of(observer.didUnpauseScreenSharing).map(f => f.bind(observer)());
        });
      });
      this.logger.info('screen sharing stream unpaused');
      resolve();
    });
  }

  /* istanbul ignore next */
  async ping(timeoutMs: number): Promise<void> {
    const self = this;
    const promise = new Promise<void>(resolve => {
      const observer: ScreenSharingSessionObserver = {
        didReceiveHeartbeatResponse(): void {
          self.deregisterObserver(this);
          resolve();
        },
      };
      const request: ScreenSharingMessage = {
        type: ScreenSharingMessageType.HeartbeatRequestType,
        flags: [ScreenSharingMessageFlag.Local],
        data: new Uint8Array([]),
      };
      this.registerObserver(observer);
      this.send(request);
    });
    const timeout = new Promise<void>((resolve, reject) => {
      new TimeoutScheduler(timeoutMs).start(() => {
        reject(new Error('ping timed out after ' + timeoutMs + 'ms'));
      });
    });
    return Promise.race([promise, timeout]);
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
      case ScreenSharingMessageType.HeartbeatResponseType:
        return this.didReceiveHeartbeatResponseMessage();
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

  private didReceiveHeartbeatResponseMessage(): void {
    this.logger.info('received heartbeat response message');
    this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
      Maybe.of(observer.didReceiveHeartbeatResponse).map(f => f.bind(observer)());
    });
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

    try {
      this.send(response);
      this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
        Maybe.of(observer.didSendHeartbeatResponse).map(f => f.bind(observer)());
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  private send(message: ScreenSharingMessage): ScreenSharingMessage {
    try {
      this.webSocket.send(this.messageSerialization.serialize(message));
      this.logger.debug(() => 'sent screen sharing message');
      this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
        Maybe.of(observer.didSendScreenSharingMessage).map(f => f.bind(observer)(message.type));
      });
      return message;
    } catch (error) {
      this.observerQueue.forEach((observer: ScreenSharingSessionObserver) => {
        Maybe.of(observer.didFailSend).map(f => f.bind(observer)(error));
      });
      throw error;
    }
  }
}
