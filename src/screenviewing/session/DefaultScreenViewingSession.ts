// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../../logger/Logger';
import Maybe from '../../maybe/Maybe';
import PromisedWebSocket from '../../promisedwebsocket/PromisedWebSocket';
import ReconnectingPromisedWebSocketFactory from '../../promisedwebsocket/ReconnectingPromisedWebSocketFactory';
import ScreenViewingSessionObserver from '../clientobserver/ScreenViewingSessionObserver';
import ScreenViewingSession from './ScreenViewingSession';
import ScreenViewingSessionConnectionRequest from './ScreenViewingSessionConnectionRequest';

/**
 * [[DefaultScreenViewingSession]] is a default impl of the interface.
 */
export default class DefaultScreenViewingSession implements ScreenViewingSession {
  private static readonly DEFAULT_TIMEOUT: number = 1000;
  private webSocket?: PromisedWebSocket;
  private observer?: ScreenViewingSessionObserver;

  constructor(
    private webSocketFactory: ReconnectingPromisedWebSocketFactory,
    private logger: Logger
  ) {}

  withObserver(observer: ScreenViewingSessionObserver): ScreenViewingSession {
    this.observer = observer;
    return this;
  }
  openConnection(request: ScreenViewingSessionConnectionRequest): Promise<Event> {
    this.logger.info(`DefaultScreenViewingSession: Opening connection`);
    if (this.webSocket) {
      return Promise.reject(new Error('Must close existing connection before opening a new one'));
    }
    this.webSocket = this.webSocketFactory.create(
      request.screenViewingURL,
      request.protocols(),
      'arraybuffer'
    );

    this.webSocket.addEventListener('message', (event: MessageEvent) => {
      Maybe.of(this.observer).map(observer => {
        Maybe.of(observer.didReceiveWebSocketMessage).map(f => f.bind(this.observer)(event));
      });
    });

    this.webSocket.addEventListener('close', (event: CloseEvent) => {
      Maybe.of(this.observer).map(observer => {
        Maybe.of(observer.didCloseWebSocket).map(f => f.bind(this.observer)(event));
      });
    });

    return this.webSocket.open(request.timeoutMs);
  }

  closeConnection(): Promise<void> {
    this.logger.info(`DefaultScreenViewingSession: Closing connection`);
    if (!this.webSocket) {
      return Promise.reject(new Error('No websocket to close'));
    }
    return this.webSocket.close(DefaultScreenViewingSession.DEFAULT_TIMEOUT).then((): void => {
      this.webSocket = null;
    });
  }

  send(data: Uint8Array): void {
    this.logger.debug(() => `DefaultScreenViewingSession: Sending ${data.byteLength} bytes`);
    this.webSocket.send(data);
  }
}
