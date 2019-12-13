// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import DefaultJPEGDecoderController from '../../src/jpegdecoder/controller/DefaultJPEGDecoderController';
import ScreenViewingComponentContext from '../../src/screenviewing/context/ScreenViewingComponentContext';
import DefaultScreenViewing from '../../src/screenviewing/DefaultScreenViewing';
import ScreenObserver from '../../src/screenviewing/observer/ScreenObserver';
import ScreenViewingSessionConnectionRequest from '../../src/screenviewing/session/ScreenViewingSessionConnectionRequest';
import SignalingSession from '../../src/screenviewing/signalingsession/SignalingSession';

describe('DefaultScreenViewing', () => {
  const assert: Chai.AssertStatic = chai.assert;

  describe('Open', () => {
    it('returns a task', () => {
      const controller: SubstituteOf<DefaultJPEGDecoderController> = Substitute.for();
      controller.init().returns(Promise.resolve());

      const signalingSession: SubstituteOf<SignalingSession> = Substitute.for();
      signalingSession.open(Arg.any()).returns(Promise.resolve());

      const context: SubstituteOf<ScreenViewingComponentContext> = Substitute.for();
      context.jpegDecoderController.returns(controller);
      assert.exists(new DefaultScreenViewing(context).open(Substitute.for()));
    });
  });

  describe('close', () => {
    it('calls viewer close', () => {
      return new DefaultScreenViewing({
        ...Substitute.for(),
        viewer: {
          ...Substitute.for(),
          stop(): void {},
        },
        signalingSession: {
          ...Substitute.for(),
          close(): Promise<void> {
            return Promise.resolve();
          },
        },
        viewingSession: {
          ...Substitute.for(),
          closeConnection(): Promise<void> {
            return Promise.resolve();
          },
        },
      }).close();
    });
  });

  describe('start', () => {
    it('calls viewer start', () => {
      return new DefaultScreenViewing({
        ...Substitute.for(),
        viewer: {
          ...Substitute.for(),
          start(_canvasContainer: HTMLDivElement): void {},
        },
        viewingSession: {
          ...Substitute.for(),
          openConnection(_request: ScreenViewingSessionConnectionRequest): Promise<Event> {
            return Promise.resolve(Substitute.for());
          },
        },
      }).start(Substitute.for());
    });
  });

  describe('stop', () => {
    it('calls viewer stop', (done: MochaDone) => {
      return new DefaultScreenViewing({
        ...Substitute.for(),
        viewer: {
          ...Substitute.for(),
          stop(): void {
            done();
          },
        },
      }).stop();
    });
  });

  describe('presentScaleToFit', () => {
    it('calls changePresentationPolicy', (done: MochaDone) => {
      new DefaultScreenViewing({
        ...Substitute.for(),
        deltaRenderer: {
          ...Substitute.for(),
          changePresentationPolicy(): void {
            done();
          },
        },
      }).presentScaleToFit();
    });
  });

  describe('presentDragAndZoom', () => {
    it('calls changePresentationPolicy', (done: MochaDone) => {
      new DefaultScreenViewing({
        ...Substitute.for(),
        deltaRenderer: {
          ...Substitute.for(),
          changePresentationPolicy(): void {
            done();
          },
        },
      }).presentDragAndZoom();
    });
  });

  describe('zoomIn', () => {
    it('calls zoom', (done: MochaDone) => {
      new DefaultScreenViewing({
        ...Substitute.for(),
        deltaRenderer: {
          ...Substitute.for(),
          zoomRelative(): void {
            done();
          },
        },
      }).zoomIn();
    });
  });

  describe('zoomOut', () => {
    it('calls zoom', (done: MochaDone) => {
      new DefaultScreenViewing({
        ...Substitute.for(),
        deltaRenderer: {
          ...Substitute.for(),
          zoomRelative(): void {
            done();
          },
        },
      }).zoomOut();
    });
  });

  describe('zoomReset', () => {
    it('calls zoomReset', (done: MochaDone) => {
      new DefaultScreenViewing({
        ...Substitute.for(),
        deltaRenderer: {
          ...Substitute.for(),
          zoomReset(): void {
            done();
          },
        },
      }).zoomReset();
    });
  });

  describe('zoom', () => {
    it('calls zoomReset', (done: MochaDone) => {
      new DefaultScreenViewing({
        ...Substitute.for(),
        deltaRenderer: {
          ...Substitute.for(),
          zoomAbsolute(): void {
            done();
          },
        },
      }).zoom(1);
    });
  });

  describe('registerObserver', () => {
    it('calls registerObserver', (done: MochaDone) => {
      new DefaultScreenViewing({
        ...Substitute.for(),
        signalingSession: {
          ...Substitute.for(),
          registerObserver(_observer: ScreenObserver): void {
            done();
          },
        },
      }).registerObserver(Substitute.for());
    });
  });

  describe('unregisterObserver', () => {
    it('calls unregisterObserver', (done: MochaDone) => {
      new DefaultScreenViewing({
        ...Substitute.for(),
        signalingSession: {
          ...Substitute.for(),
          unregisterObserver(_observer: ScreenObserver): void {
            done();
          },
        },
      }).unregisterObserver(Substitute.for());
    });
  });
});
