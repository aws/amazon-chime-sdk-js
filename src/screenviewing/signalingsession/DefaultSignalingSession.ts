// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Maybe from '../../maybe/Maybe';
import ScreenSignalingSession from '../../screensignalingsession/ScreenSignalingSession';
import ScreenSignalingSessionEventType from '../../screensignalingsession/ScreenSignalingSessionEventType';
import ScreenSignalingSessionFactory from '../../screensignalingsession/ScreenSignalingSessionFactory';
import ScreenObserver from '../observer/ScreenObserver';
import ScreenViewingSessionConnectionRequest from '../session/ScreenViewingSessionConnectionRequest';
import SignalingSession from './SignalingSession';

export default class DefaultSignalingSession implements SignalingSession {
  private readonly DEFAULT_TIMEOUT_MS: number = 500;
  private session: ScreenSignalingSession;
  private observers = new Set<ScreenObserver>();

  constructor(private screenSignalingSessionFactory: ScreenSignalingSessionFactory) {}

  open(connectionRequest: ScreenViewingSessionConnectionRequest): Promise<void> {
    if (this.session) {
      return Promise.reject(new Error('Must close connection before opening another'));
    }
    this.session = this.screenSignalingSessionFactory.create(
      connectionRequest.screenDataURL,
      connectionRequest.sessionToken
    );
    this.session.addEventListener(
      ScreenSignalingSessionEventType.StreamStart,
      (event: CustomEvent) => {
        this.observers.forEach(observer => {
          Maybe.of(observer.streamDidStart).map(f => f(event.detail));
        });
      }
    );
    this.session.addEventListener(
      ScreenSignalingSessionEventType.StreamEnd,
      (event: CustomEvent) => {
        this.observers.forEach(observer => {
          Maybe.of(observer.streamDidStop).map(f => f(event.detail));
        });
      }
    );
    this.session.addEventListener(
      ScreenSignalingSessionEventType.StreamSwitch,
      (event: CustomEvent) => {
        this.observers.forEach(observer =>
          Maybe.of(observer.streamDidSwitch).map(f => f(event.detail))
        );
      }
    );
    return this.session.open(connectionRequest.timeoutMs).then(() => {});
  }

  close(): Promise<void> {
    if (!this.session) {
      return Promise.resolve();
    }
    const session = this.session;
    this.session = null;
    return session.close(this.DEFAULT_TIMEOUT_MS).then(() => {});
  }

  registerObserver(observer: ScreenObserver): void {
    this.observers.add(observer);
  }

  unregisterObserver(observer: ScreenObserver): void {
    this.observers.delete(observer);
  }
}
