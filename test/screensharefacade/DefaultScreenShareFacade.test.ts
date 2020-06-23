// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpLogger from '../../src/logger/NoOpLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import DefaultScreenShareFacade from '../../src/screensharefacade/DefaultScreenShareFacade';
import ScreenShareFacade from '../../src/screensharefacade/ScreenShareFacade';
import ScreenSharingSession from '../../src/screensharingsession/ScreenSharingSession';
import ScreenSharingSessionObserver from '../../src/screensharingsession/ScreenSharingSessionObserver';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

class NoOpScreenSharingSession implements ScreenSharingSession {
  async open(_timeoutMs: number): Promise<Event> {
    return null;
  }
  async close(_timeoutMs: number): Promise<Event> {
    return null;
  }
  async start(_sourceId?: string, _timeoutMs?: number): Promise<void> {
    return null;
  }
  async stop(): Promise<void> {
    return null;
  }
  async pause(): Promise<void> {
    return null;
  }
  async unpause(): Promise<void> {
    return null;
  }
  registerObserver(_observer: ScreenSharingSessionObserver): ScreenSharingSession {
    return null;
  }
  deregisterObserver(_observer: ScreenSharingSessionObserver): ScreenSharingSession {
    return null;
  }
}

describe('DefaultScreenShareFacade', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const screenSharingSessionFake = new NoOpScreenSharingSession();
  let facade: ScreenShareFacade | null = null;
  let domMockBuilder: DOMMockBuilder;

  describe('api', () => {
    beforeEach(() => {
      domMockBuilder = new DOMMockBuilder();
      facade = new DefaultScreenShareFacade(
        new MeetingSessionConfiguration(
          {
            MeetingId: 'meeting-id',
            MediaPlacement: {
              AudioHostUrl: 'audio-host-url',
              ScreenDataUrl: 'screen-data-url',
              ScreenSharingUrl: 'screen-sharing-url',
              ScreenViewingUrl: 'screen-viewing-url',
              SignalingUrl: 'signaling-url',
              TurnControlUrl: 'turn-control-url',
            },
          },
          {
            AttendeeId: 'attendee-id',
            JoinToken: 'join-token',
          }
        ),
        new NoOpLogger(),
        null
      );
      domMockBuilder.cleanup();
      domMockBuilder = null;
      // @ts-ignore
      facade.screenSharingSession = screenSharingSessionFake;
    });

    afterEach(() => {
      facade = null;
    });

    it('will call open', () => {
      const spy = sinon.spy(screenSharingSessionFake, 'open');
      facade.open();
      assert(spy.calledOnce);
    });

    it('will call close', () => {
      const spy = sinon.spy(screenSharingSessionFake, 'close');
      facade.close();
      assert(spy.calledOnce);
    });

    it('will call start', () => {
      const spy = sinon.spy(screenSharingSessionFake, 'start');
      const arg1 = 'source-id';
      facade.start(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call stop', () => {
      const spy = sinon.spy(screenSharingSessionFake, 'stop');
      facade.stop();
      assert(spy.calledOnce);
    });

    it('will call pause', () => {
      const spy = sinon.spy(screenSharingSessionFake, 'pause');
      facade.pause();
      assert(spy.calledOnce);
    });

    it('will call unpause', () => {
      const spy = sinon.spy(screenSharingSessionFake, 'unpause');
      facade.unpause();
      assert(spy.calledOnce);
    });

    it('will call registerObserver', () => {
      const spy = sinon.spy(screenSharingSessionFake, 'registerObserver');
      const arg1: ScreenSharingSessionObserver = {};
      facade.registerObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call unregisterObserver', () => {
      const spy = sinon.spy(screenSharingSessionFake, 'deregisterObserver');
      const arg1: ScreenSharingSessionObserver = {};
      facade.unregisterObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });
  });
});
