// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import * as sinon from 'sinon';

import NoOpLogger from '../../src/logger/NoOpLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import DefaultScreenShareViewFacade from '../../src/screenshareviewfacade/DefaultScreenShareViewFacade';
import ScreenShareViewFacade from '../../src/screenshareviewfacade/ScreenShareViewFacade';
import ScreenObserver from '../../src/screenviewing/observer/ScreenObserver';
import ScreenViewing from '../../src/screenviewing/ScreenViewing';
import ScreenViewingSessionConnectionRequest from '../../src/screenviewing/session/ScreenViewingSessionConnectionRequest';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

class NoOpScreenViewing implements ScreenViewing {
  async open(_request: ScreenViewingSessionConnectionRequest): Promise<void> {}
  async close(): Promise<void> {}
  async start(_canvasContainer: HTMLDivElement): Promise<void> {}
  async stop(): Promise<void> {}
  presentScaleToFit(): void {}
  presentDragAndZoom(): void {}
  zoomIn(_relativeZoomFactor?: number): void {}
  zoomOut(_relativeZoomFactor?: number): void {}
  zoom(_absoluteZoomFactor: number): void {}
  zoomReset(): void {}
  registerObserver(_observer: ScreenObserver): void {}
  unregisterObserver(_observer: ScreenObserver): void {}
}

describe('DefaultScreenShareViewFacade', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const screenViewingFake = new NoOpScreenViewing();
  let facade: ScreenShareViewFacade | null = null;
  let domMockBuilder: DOMMockBuilder;

  describe('api', () => {
    beforeEach(() => {
      domMockBuilder = new DOMMockBuilder();
      facade = new DefaultScreenShareViewFacade(
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
        new NoOpLogger()
      );
      domMockBuilder.cleanup();
      domMockBuilder = null;
      // @ts-ignore
      facade.screenViewing = screenViewingFake;
    });

    afterEach(() => {
      facade = null;
    });

    it('will create a drag observer with the factory', () => {
      // @ts-ignore
      const object = facade.dragObserverFactory(
        Substitute.for<Window>(),
        () => {},
        Substitute.for<HTMLElement>()
      );
      assert(!!object);
    });

    it('will call open', () => {
      const spy = sinon.spy(screenViewingFake, 'open');
      facade.open();
      assert(spy.calledOnce);
    });

    it('will call close', () => {
      const spy = sinon.spy(screenViewingFake, 'close');
      facade.close();
      assert(spy.calledOnce);
    });

    it('will call start', () => {
      const spy = sinon.spy(screenViewingFake, 'start');
      // @ts-ignore
      const arg1: HTMLDivElement = {};
      facade.start(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call stop', () => {
      const spy = sinon.spy(screenViewingFake, 'stop');
      facade.stop();
      assert(spy.calledOnce);
    });

    it('will call presentScaleToFit', () => {
      const spy = sinon.spy(screenViewingFake, 'presentScaleToFit');
      facade.presentScaleToFit();
      assert(spy.calledOnce);
    });

    it('will call presentDragAndZoom', () => {
      const spy = sinon.spy(screenViewingFake, 'presentDragAndZoom');
      facade.presentDragAndZoom();
      assert(spy.calledOnce);
    });

    it('will call zoomIn', () => {
      const spy = sinon.spy(screenViewingFake, 'zoomIn');
      facade.zoomIn(1);
      assert(spy.calledOnceWith(1));
    });

    it('will call zoomOut', () => {
      const spy = sinon.spy(screenViewingFake, 'zoomOut');
      facade.zoomOut(1);
      assert(spy.calledOnceWith(1));
    });

    it('will call zoom', () => {
      const spy = sinon.spy(screenViewingFake, 'zoom');
      facade.zoom(1);
      assert(spy.calledOnceWith(1));
    });

    it('will call zoomReset', () => {
      const spy = sinon.spy(screenViewingFake, 'zoomReset');
      facade.zoomReset();
      assert(spy.calledOnce);
    });

    it('will call registerObserver', () => {
      const spy = sinon.spy(screenViewingFake, 'registerObserver');
      const arg1: ScreenObserver = {};
      facade.registerObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });

    it('will call unregisterObserver', () => {
      const spy = sinon.spy(screenViewingFake, 'unregisterObserver');
      const arg1: ScreenObserver = {};
      facade.unregisterObserver(arg1);
      assert(spy.calledOnceWith(arg1));
    });
  });
});
