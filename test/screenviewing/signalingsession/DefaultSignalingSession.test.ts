// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute, SubstituteOf } from '@fluffy-spoon/substitute';

import PromisedWebSocket from '../../../src/promisedwebsocket/PromisedWebSocket';
import DefaultScreenSignalingSession from '../../../src/screensignalingsession/DefaultScreenSignalingSession';
import ScreenSignalingSession from '../../../src/screensignalingsession/ScreenSignalingSession';
import ScreenSignalingSessionEventType from '../../../src/screensignalingsession/ScreenSignalingSessionEventType';
import ScreenSignalingSessionFactory from '../../../src/screensignalingsession/ScreenSignalingSessionFactory';
import ScreenObserver from '../../../src/screenviewing/observer/ScreenObserver';
import ScreenViewingSessionConnectionRequest from '../../../src/screenviewing/session/ScreenViewingSessionConnectionRequest';
import DefaultSignalingSession from '../../../src/screenviewing/signalingsession/DefaultSignalingSession';
import CustomEventMock from '../../customeventmock/CustomEventMock';

describe('DefaultSignalingSession', () => {
  const screenViewingURL = 'screen-viewing-url';
  const screenDataURL = 'screen-data-url';
  const sessionToken = 'session-token';
  const timeoutMS = 100;
  const request = new ScreenViewingSessionConnectionRequest(
    screenViewingURL,
    screenDataURL,
    sessionToken,
    timeoutMS
  );

  describe('open', () => {
    it('fails if theres already a connection', (done: MochaDone) => {
      const session: SubstituteOf<ScreenSignalingSession> = Substitute.for();
      session.open(Arg.any()).returns(Promise.resolve(Substitute.for()));

      const factory: SubstituteOf<ScreenSignalingSessionFactory> = Substitute.for();
      factory.create(Arg.any(), Arg.any()).returns(session);

      const signalingSession = new DefaultSignalingSession(factory);
      signalingSession.registerObserver(Substitute.for());

      signalingSession
        .open(request)
        .then(_value => signalingSession.open(request))
        .catch(_reason => done());
    });

    it('opens a screen signaling session', () => {
      const session: SubstituteOf<ScreenSignalingSession> = Substitute.for();
      session.open(Arg.any()).returns(Promise.resolve(Substitute.for()));

      const factory: SubstituteOf<ScreenSignalingSessionFactory> = Substitute.for();
      factory.create(Arg.any(), Arg.any()).returns(session);

      const signalingSession = new DefaultSignalingSession(factory);
      signalingSession.registerObserver(Substitute.for());

      return signalingSession.open(request).then(_value => session.received().open(timeoutMS));
    });
  });

  describe('close', () => {
    it(`does nothing if there's no screen signaling session`, () => {
      const factory: SubstituteOf<ScreenSignalingSessionFactory> = Substitute.for();

      const signalingSession = new DefaultSignalingSession(factory);

      return signalingSession.close();
    });

    it(`closes an open screen signaling session`, () => {
      const session: SubstituteOf<ScreenSignalingSession> = Substitute.for();
      session.open(Arg.any()).returns(Promise.resolve(Substitute.for()));
      session.close(Arg.any()).returns(Promise.resolve(Substitute.for()));

      const factory: SubstituteOf<ScreenSignalingSessionFactory> = Substitute.for();
      factory.create(Arg.any(), Arg.any()).returns(session);

      const signalingSession = new DefaultSignalingSession(factory);

      return signalingSession
        .open(request)
        .then(_value => signalingSession.close())
        .then(_value => session.received().close(Arg.any()));
    });
  });

  describe('registerObserver', () => {
    it(`does nothing if there's no screen signaling session`, () => {
      const signalingSession = new DefaultSignalingSession(Substitute.for());

      signalingSession.registerObserver(Substitute.for());
    });

    it(`adds event listeners`, () => {
      const session: SubstituteOf<ScreenSignalingSession> = Substitute.for();
      session.open(Arg.any()).returns(Promise.resolve(Substitute.for()));

      const factory: SubstituteOf<ScreenSignalingSessionFactory> = Substitute.for();
      factory.create(Arg.any(), Arg.any()).returns(session);

      const signalingSession = new DefaultSignalingSession(factory);

      return signalingSession
        .open(request)
        .then(_value => signalingSession.registerObserver(Substitute.for()))
        .then(_value => session.received().addEventListener(Arg.any(), Arg.any()));
    });

    it(`will call the callbacks`, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobalAny = global as any;
      GlobalAny.CustomEvent = CustomEventMock;

      const webSocket: SubstituteOf<PromisedWebSocket> = Substitute.for();
      webSocket.open(Arg.any()).returns(Promise.resolve(Substitute.for()));
      const session: ScreenSignalingSession = new DefaultScreenSignalingSession(
        webSocket,
        Substitute.for(),
        Substitute.for()
      );

      const factory: SubstituteOf<ScreenSignalingSessionFactory> = Substitute.for();
      factory.create(Arg.any(), Arg.any()).returns(session);

      const signalingSession = new DefaultSignalingSession(factory);

      return signalingSession.open(request).then(_value => {
        const observer: SubstituteOf<ScreenObserver> = Substitute.for();
        signalingSession.registerObserver(observer);
        session.dispatchEvent(new CustomEvent(ScreenSignalingSessionEventType.StreamStart));
        session.dispatchEvent(new CustomEvent(ScreenSignalingSessionEventType.StreamEnd));
        session.dispatchEvent(new CustomEvent(ScreenSignalingSessionEventType.StreamSwitch));
        observer.received().streamDidStart(Arg.any());
        observer.received().streamDidStop(Arg.any());
        observer.received().streamDidSwitch(Arg.any());
      });
    });

    describe('unregisterObserver', () => {
      it(`unregisters`, () => {
        const session: SubstituteOf<ScreenSignalingSession> = Substitute.for();
        session.open(Arg.any()).returns(Promise.resolve(Substitute.for()));

        const factory: SubstituteOf<ScreenSignalingSessionFactory> = Substitute.for();
        factory.create(Arg.any(), Arg.any()).returns(session);

        const signalingSession = new DefaultSignalingSession(factory);

        const observer: SubstituteOf<ScreenObserver> = Substitute.for();
        return signalingSession
          .open(request)
          .then(_value => signalingSession.registerObserver(observer))
          .then(_value => signalingSession.unregisterObserver(observer));
      });
    });
  });
});
