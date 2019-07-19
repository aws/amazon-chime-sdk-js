// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoController from '../../src/audiovideocontroller/AudioVideoController';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DevicePixelRatioMonitor from '../../src/devicepixelratiomonitor/DevicePixelRatioMonitor';
import DevicePixelRatioObserver from '../../src/devicepixelratioobserver/DevicePixelRatioObserver';
import NoOpVideoElementFactory from '../../src/videoelementfactory/NoOpVideoElementFactory';
import DefaultVideoTile from '../../src/videotile/DefaultVideoTile';
import VideoTileController from '../../src/videotilecontroller/VideoTileController';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

class InvokingDevicePixelRatioMonitor implements DevicePixelRatioMonitor {
  private observerQueue: Set<DevicePixelRatioObserver>;

  constructor() {
    this.observerQueue = new Set<DevicePixelRatioObserver>();
  }

  registerObserver(observer: DevicePixelRatioObserver): void {
    this.observerQueue.add(observer);
    observer.devicePixelRatioChanged(1);
  }

  removeObserver(observer: DevicePixelRatioObserver): void {
    this.observerQueue.delete(observer);
  }

  invokeDevicePixelRatioChanged(newDevicePixelRatio: number): void {
    this.observerQueue.forEach(tileObserver => {
      tileObserver.devicePixelRatioChanged(newDevicePixelRatio);
    });
  }
}

describe('DefaultVideoTile', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const videoElementFactory = new NoOpVideoElementFactory();
  const tileId = 1;
  let monitor: InvokingDevicePixelRatioMonitor;
  let audioVideoController: AudioVideoController;
  let tileController: VideoTileController;
  let tile: DefaultVideoTile;
  let domMockBuilder: DOMMockBuilder;
  let tileControllerSpy: sinon.SinonSpy;

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder();
    monitor = new InvokingDevicePixelRatioMonitor();
    audioVideoController = new NoOpAudioVideoController();
    tileController = audioVideoController.videoTileController;
    tileControllerSpy = sinon.spy(tileController, 'sendTileStateUpdate');
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      tile = new DefaultVideoTile(tileId, false, tileController, monitor);
      assert.exists(tile);
    });
  });

  describe('destroy', () => {
    it('initializes the state', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);

      const videoElement = videoElementFactory.create();
      tile.bindVideoElement(videoElement);

      // @ts-ignore
      const mediaStream: MediaStream = { fake: 'stream' };
      tile.bindVideoStream('attendee', true, mediaStream, 1, 1, 1);

      expect(tile.state().tileId).to.equal(tileId);
      expect(tile.state().boundVideoElement.srcObject).to.equal(mediaStream);

      tile.destroy();
      expect(tile.state().tileId).to.equal(null);
      expect(tile.state().boundVideoElement).to.equal(null);
    });

    it('removes an observer', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tile.state().devicePixelRatio).to.equal(1);
      tile.destroy();

      monitor.invokeDevicePixelRatioChanged(2);
      expect(tile.state().devicePixelRatio).to.equal(0);
    });
  });

  describe('property getters', () => {
    it('returns id', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tile.id()).to.equal(tileId);
    });

    it('returns the cloned state', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tile.state()).to.not.equal(tile.state());
      expect(tile.state()).to.deep.equal(tile.state());
    });

    it('returns the same state object', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tile.stateRef()).to.equal(tile.stateRef());
    });
  });

  describe('bindVideoStream', () => {
    it('binds a video stream', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);

      const boundAttendeeId = 'attendee';
      const localTile = true;
      // @ts-ignore
      const boundVideoStream: MediaStream = { fake: 'stream' };
      const videoStreamContentWidth = 1;
      const videoStreamContentHeight = 1;
      const streamId = 1;

      tile.bindVideoStream(
        boundAttendeeId,
        localTile,
        boundVideoStream,
        videoStreamContentWidth,
        videoStreamContentHeight,
        streamId
      );

      expect(tile.state().boundAttendeeId).to.equal(boundAttendeeId);
      expect(tile.state().localTile).to.equal(localTile);
      expect(tile.state().boundVideoStream).to.equal(boundVideoStream);
      expect(tile.state().videoStreamContentWidth).to.equal(videoStreamContentWidth);
      expect(tile.state().videoStreamContentHeight).to.equal(videoStreamContentHeight);
      expect(tile.state().streamId).to.equal(streamId);

      expect(tileControllerSpy.called).to.be.true;
    });

    it('unbinds a video stream', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      // @ts-ignore
      tile.bindVideoStream('attendee', true, { fake: 'stream' }, 1, 1, 1);
      tile.bindVideoStream(null, true, null, null, null, null);

      expect(tile.state().boundAttendeeId).to.equal(null);
      expect(tile.state().localTile).to.equal(true);
      expect(tile.state().boundVideoStream).to.equal(null);
      expect(tile.state().videoStreamContentWidth).to.equal(null);
      expect(tile.state().videoStreamContentHeight).to.equal(null);
      expect(tile.state().streamId).to.equal(null);

      expect(tileControllerSpy.called).to.be.true;
    });

    it("does not remove a video element's srcObject again until it binds a new stream", () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);

      const videoElement = videoElementFactory.create();
      tile.bindVideoElement(videoElement);

      // @ts-ignore
      const mediaStream: MediaStream = { fake: 'stream' };
      tile.bindVideoStream('attendee', true, mediaStream, 1, 1, 1);
      expect(videoElement.srcObject).to.equal(mediaStream);

      tile.bindVideoStream('attendee', true, mediaStream, 2, 2, 1);
      expect(videoElement.srcObject).to.equal(mediaStream);

      // @ts-ignore
      const mediaStream2: MediaStream = { fake: 'stream' };
      tile.bindVideoStream('attendee', true, mediaStream2, 2, 2, 1);
      expect(videoElement.srcObject).to.equal(mediaStream2);
    });
  });

  describe('bindVideoElement', () => {
    it('binds a video element', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);

      const videoElement = videoElementFactory.create();
      const removeAttributeSpy = sinon.spy(videoElement, 'removeAttribute');
      const setAttributeSpy = sinon.spy(videoElement, 'setAttribute');

      tile.bindVideoElement(videoElement);
      // @ts-ignore
      tile.bindVideoStream('attendee', false, { fake: 'stream' }, 1, 1, 1);

      expect(tile.state().boundVideoElement).to.equal(videoElement);
      expect(tile.state().videoElementCSSWidthPixels).to.equal(videoElement.clientWidth);
      expect(tile.state().videoElementCSSHeightPixels).to.equal(videoElement.clientHeight);

      expect(removeAttributeSpy.callCount).to.equal(0);
      expect(setAttributeSpy.calledWith('autoplay', 'true')).to.be.true;
      expect(setAttributeSpy.calledWith('muted', 'true')).to.be.true;
    });

    it('does not bind the same video element again', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tileControllerSpy.callCount).to.equal(1);

      const videoElement = videoElementFactory.create();
      tile.bindVideoElement(videoElement);
      tile.bindVideoElement(videoElement);

      expect(tileControllerSpy.callCount).to.equal(2);
    });

    it('unbinds a video element', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tileControllerSpy.callCount).to.equal(1);

      const videoElement = videoElementFactory.create();
      tile.bindVideoElement(videoElement);
      tile.bindVideoElement(null);

      expect(tile.state().boundVideoElement).to.equal(null);
      expect(tile.state().videoElementCSSWidthPixels).to.equal(null);
      expect(tile.state().videoElementCSSHeightPixels).to.equal(null);

      expect(tileControllerSpy.callCount).to.equal(3);
    });

    it('binds a video element with attributes', () => {
      tile = new DefaultVideoTile(tileId, false, tileController, monitor);

      const videoElement = videoElementFactory.create();
      // @ts-ignore
      videoElement.hasAttribute = (attr: string): boolean =>
        attr === 'controls' || attr === 'autoplay' || attr === 'muted';

      const removeAttributeSpy = sinon.spy(videoElement, 'removeAttribute');
      const setAttributeSpy = sinon.spy(videoElement, 'setAttribute');

      tile.bindVideoElement(videoElement);
      // @ts-ignore
      tile.bindVideoStream('attendee', false, { fake: 'stream' }, 1, 1, 1);

      expect(removeAttributeSpy.calledWith('controls')).to.be.true;
      expect(setAttributeSpy.callCount).to.equal(0);
    });

    it('disables picture-in-picture and remote playback on local tiles', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      const videoElement = videoElementFactory.create();
      // @ts-ignore
      videoElement.disablePictureInPicture = false;
      // @ts-ignore
      videoElement.disableRemotePlayback = false;
      tile.bindVideoElement(videoElement);
      // @ts-ignore
      tile.bindVideoStream('attendee', true, { fake: 'stream' }, 1, 1, 1);
      // @ts-ignore
      expect(videoElement.disablePictureInPicture).to.be.true;
      // @ts-ignore
      expect(videoElement.disableRemotePlayback).to.be.true;
    });
  });

  describe('pause', () => {
    it('pauses', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tileControllerSpy.callCount).to.equal(1);

      tile.pause();
      expect(tile.state().paused).to.equal(true);
      expect(tileControllerSpy.callCount).to.equal(2);
    });

    it("cannot pause a tile if it's already paused", () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tileControllerSpy.callCount).to.equal(1);

      tile.pause();
      expect(tileControllerSpy.callCount).to.equal(2);

      tile.pause();
      expect(tileControllerSpy.callCount).to.equal(2);
    });
  });

  describe('unpause', () => {
    it('unpauses a paused tile', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tileControllerSpy.callCount).to.equal(1);

      tile.pause();
      expect(tile.state().paused).to.equal(true);
      expect(tileControllerSpy.callCount).to.equal(2);

      tile.unpause();
      expect(tile.state().paused).to.equal(false);
      expect(tileControllerSpy.callCount).to.equal(3);
    });

    it("cannot unpause a tile if it's already unpaused", () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tileControllerSpy.callCount).to.equal(1);

      tile.unpause();
      expect(tileControllerSpy.callCount).to.equal(1);
    });
  });

  describe('markPoorConnection', () => {
    it('marks a poor connection', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tileControllerSpy.callCount).to.equal(1);

      tile.markPoorConnection();
      expect(tile.state().poorConnection).to.equal(true);
      expect(tileControllerSpy.callCount).to.equal(2);
    });

    it("cannot mark a poor connexction if it's already marked", () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tileControllerSpy.callCount).to.equal(1);

      tile.markPoorConnection();
      expect(tileControllerSpy.callCount).to.equal(2);

      tile.markPoorConnection();
      expect(tileControllerSpy.callCount).to.equal(2);
    });
  });

  describe('unmarkPoorConnection', () => {
    it('unmarks a poor connection', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tileControllerSpy.callCount).to.equal(1);

      tile.markPoorConnection();
      expect(tile.state().poorConnection).to.equal(true);
      expect(tileControllerSpy.callCount).to.equal(2);

      tile.unmarkPoorConnection();
      expect(tile.state().poorConnection).to.equal(false);
      expect(tileControllerSpy.callCount).to.equal(3);
    });

    it("cannot unmark a poor connexction if it's already unmarked", () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tileControllerSpy.callCount).to.equal(1);

      tile.unmarkPoorConnection();
      expect(tileControllerSpy.callCount).to.equal(1);
    });
  });

  describe('capture', () => {
    it('returns null if a tile is not active', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tile.capture()).to.equal(null);
    });

    it('returns a captured image', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);

      const videoElement = videoElementFactory.create();
      tile.bindVideoElement(videoElement);
      // @ts-ignore
      tile.bindVideoStream('attendee', true, { fake: 'stream' }, 1, 1, 1);

      const image = tile.capture();
      expect(image.width).to.equal(videoElement.videoWidth);
      expect(image.height).to.equal(videoElement.videoHeight);
    });

    it('uses width and height if videoWidth and videoHeight do not exist', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);

      const videoElement = videoElementFactory.create();
      // @ts-ignore
      delete videoElement.videoWidth;
      // @ts-ignore
      delete videoElement.videoHeight;

      tile.bindVideoElement(videoElement);
      // @ts-ignore
      tile.bindVideoStream('attendee', true, { fake: 'stream' }, 1, 1, 1);

      const image = tile.capture();
      expect(image.width).to.equal(videoElement.width);
      expect(image.height).to.equal(videoElement.height);
    });
  });
});
