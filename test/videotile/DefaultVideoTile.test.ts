// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoController from '../../src/audiovideocontroller/AudioVideoController';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DevicePixelRatioMonitor from '../../src/devicepixelratiomonitor/DevicePixelRatioMonitor';
import DevicePixelRatioObserver from '../../src/devicepixelratioobserver/DevicePixelRatioObserver';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import NoOpVideoElementFactory from '../../src/videoelementfactory/NoOpVideoElementFactory';
import DefaultVideoTile from '../../src/videotile/DefaultVideoTile';
import VideoTileController from '../../src/videotilecontroller/VideoTileController';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
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
  let domMockBehavior: DOMMockBehavior;
  let tileControllerSpy: sinon.SinonSpy;
  let mockVideoStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    monitor = new InvokingDevicePixelRatioMonitor();
    audioVideoController = new NoOpAudioVideoController();
    tileController = audioVideoController.videoTileController;
    tileControllerSpy = sinon.spy(tileController, 'sendTileStateUpdate');
    mockVideoStream = new MediaStream();
    // @ts-ignore
    mockVideoTrack = new MediaStreamTrack('attach-media-input-task-video-track-id', 'video');
    mockVideoStream.addTrack(mockVideoTrack);
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

      tile.bindVideoStream('attendee', true, mockVideoStream, 1, 1, 1);

      expect(tile.state().tileId).to.equal(tileId);
      expect(tile.state().boundVideoElement.srcObject).to.equal(mockVideoStream);

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
      const videoStreamContentWidth = 1;
      const videoStreamContentHeight = 1;
      const streamId = 1;

      tile.bindVideoStream(
        boundAttendeeId,
        localTile,
        mockVideoStream,
        videoStreamContentWidth,
        videoStreamContentHeight,
        streamId
      );

      expect(tile.state().boundAttendeeId).to.equal(boundAttendeeId);
      expect(tile.state().localTile).to.equal(localTile);
      expect(tile.state().boundVideoStream).to.equal(mockVideoStream);
      expect(tile.state().videoStreamContentWidth).to.equal(videoStreamContentWidth);
      expect(tile.state().videoStreamContentHeight).to.equal(videoStreamContentHeight);
      expect(tile.state().streamId).to.equal(streamId);
      expect(tile.state().isContent).to.be.false;

      expect(tileControllerSpy.called).to.be.true;
    });

    it('binds a content video stream', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);

      const boundAttendeeId = 'attendee#content';
      const localTile = true;
      const videoStreamContentWidth = 1;
      const videoStreamContentHeight = 1;
      const streamId = 1;

      tile.bindVideoStream(
        boundAttendeeId,
        localTile,
        mockVideoStream,
        videoStreamContentWidth,
        videoStreamContentHeight,
        streamId
      );

      expect(tile.state().boundAttendeeId).to.equal(boundAttendeeId);
      expect(tile.state().localTile).to.equal(localTile);
      expect(tile.state().boundVideoStream).to.equal(mockVideoStream);
      expect(tile.state().videoStreamContentWidth).to.equal(videoStreamContentWidth);
      expect(tile.state().videoStreamContentHeight).to.equal(videoStreamContentHeight);
      expect(tile.state().streamId).to.equal(streamId);
      expect(tile.state().isContent).to.be.true;

      expect(tileControllerSpy.called).to.be.true;
    });

    it('binds a video stream in Safari', done => {
      domMockBehavior.browserName = 'safari';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      const videoElement = videoElementFactory.create();
      const videoElementSpy = sinon.spy(videoElement, 'play');
      tile.bindVideoElement(videoElement);

      const boundAttendeeId = 'attendee';
      const localTile = true;
      const videoStreamContentWidth = 1;
      const videoStreamContentHeight = 1;
      const streamId = 1;

      tile.bindVideoStream(
        boundAttendeeId,
        localTile,
        mockVideoStream,
        videoStreamContentWidth,
        videoStreamContentHeight,
        streamId
      );

      expect(tile.state().boundAttendeeId).to.equal(boundAttendeeId);
      expect(tile.state().localTile).to.equal(localTile);
      expect(tile.state().boundVideoStream).to.equal(mockVideoStream);
      expect(tile.state().videoStreamContentWidth).to.equal(videoStreamContentWidth);
      expect(tile.state().videoStreamContentHeight).to.equal(videoStreamContentHeight);
      expect(tile.state().streamId).to.equal(streamId);
      expect(tile.state().isContent).to.be.false;

      expect(tileControllerSpy.called).to.be.true;
      new TimeoutScheduler(10).start(() => {
        expect(videoElementSpy.calledOnce).to.be.true;
        done();
      });
    });

    it('unbinds a video stream', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      tile.bindVideoStream('attendee', true, mockVideoStream, 1, 1, 1);
      tile.bindVideoStream(null, true, null, null, null, null);

      expect(tile.state().boundAttendeeId).to.equal(null);
      expect(tile.state().localTile).to.equal(true);
      expect(tile.state().boundVideoStream).to.equal(null);
      expect(tile.state().videoStreamContentWidth).to.equal(null);
      expect(tile.state().videoStreamContentHeight).to.equal(null);
      expect(tile.state().streamId).to.equal(null);
      expect(tile.state().isContent).to.be.false;

      expect(tileControllerSpy.called).to.be.true;
    });

    it('unbinds a video stream in Safari', done => {
      domMockBehavior.browserName = 'safari';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      const videoElement = videoElementFactory.create();
      tile.bindVideoElement(videoElement);

      const boundAttendeeId = 'attendee';
      const localTile = true;
      const videoStreamContentWidth = 1;
      const videoStreamContentHeight = 1;
      const streamId = 1;

      tile.bindVideoStream(
        boundAttendeeId,
        localTile,
        mockVideoStream,
        videoStreamContentWidth,
        videoStreamContentHeight,
        streamId
      );
      tile.bindVideoStream(null, true, null, null, null, null);

      expect(tile.state().boundAttendeeId).to.equal(null);
      expect(tile.state().localTile).to.equal(true);
      expect(tile.state().boundVideoStream).to.equal(null);
      expect(tile.state().videoStreamContentWidth).to.equal(null);
      expect(tile.state().videoStreamContentHeight).to.equal(null);
      expect(tile.state().streamId).to.equal(null);
      expect(tile.state().isContent).to.be.false;

      expect(tileControllerSpy.called).to.be.true;
      new TimeoutScheduler(10).start(() => {
        expect(videoElement.srcObject).to.be.null;
        done();
      });
    });

    it("does not remove a video element's srcObject again until it binds a new stream", () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);

      const videoElement = videoElementFactory.create();
      tile.bindVideoElement(videoElement);

      tile.bindVideoStream('attendee', true, mockVideoStream, 1, 1, 1);
      expect(videoElement.srcObject).to.equal(mockVideoStream);

      tile.bindVideoStream('attendee', true, mockVideoStream, 2, 2, 1);
      expect(videoElement.srcObject).to.equal(mockVideoStream);

      // @ts-ignore
      const mockMediaStream2: MediaStream = new MediaStream();
      // @ts-ignore
      mockMediaStream2.addTrack(new MediaStreamTrack('mockMediaStream2', 'video'));
      tile.bindVideoStream('attendee', true, mockMediaStream2, 2, 2, 1);
      expect(videoElement.srcObject).to.equal(mockMediaStream2);
    });
  });

  describe('bindVideoStream with externalUserId', () => {
    it('binds a video stream with externalUser', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);

      const boundAttendeeId = 'attendee';
      const localTile = true;
      const videoStreamContentWidth = 1;
      const videoStreamContentHeight = 1;
      const streamId = 1;
      const boundExternalUserId = 'external-user-id';

      tile.bindVideoStream(
        boundAttendeeId,
        localTile,
        mockVideoStream,
        videoStreamContentWidth,
        videoStreamContentHeight,
        streamId,
        boundExternalUserId
      );

      expect(tile.state().boundAttendeeId).to.equal(boundAttendeeId);
      expect(tile.state().localTile).to.equal(localTile);
      expect(tile.state().boundVideoStream).to.equal(mockVideoStream);
      expect(tile.state().videoStreamContentWidth).to.equal(videoStreamContentWidth);
      expect(tile.state().videoStreamContentHeight).to.equal(videoStreamContentHeight);
      expect(tile.state().streamId).to.equal(streamId);
      expect(tile.state().boundExternalUserId).to.equal(boundExternalUserId);
      expect(tile.state().isContent).to.be.false;
      expect(tileControllerSpy.called).to.be.true;
    });
  });

  describe('bindVideoElement', () => {
    it('binds a video element', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);

      const videoElement = videoElementFactory.create();
      const removeAttributeSpy = sinon.spy(videoElement, 'removeAttribute');
      const setAttributeSpy = sinon.spy(videoElement, 'setAttribute');

      tile.bindVideoElement(videoElement);
      tile.bindVideoStream('attendee', false, mockVideoStream, 1, 1, 1);

      expect(tile.state().boundVideoElement).to.equal(videoElement);
      expect(tile.state().videoElementCSSWidthPixels).to.equal(videoElement.clientWidth);
      expect(tile.state().videoElementCSSHeightPixels).to.equal(videoElement.clientHeight);

      expect(removeAttributeSpy.callCount).to.equal(0);
      expect(setAttributeSpy.calledWith('autoplay', 'true')).to.be.true;
      expect(setAttributeSpy.calledWith('playsinline', 'true')).to.be.true;
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
        attr === 'controls' || attr === 'autoplay' || attr === 'muted' || attr === 'playsinline';

      const removeAttributeSpy = sinon.spy(videoElement, 'removeAttribute');
      const setAttributeSpy = sinon.spy(videoElement, 'setAttribute');

      tile.bindVideoElement(videoElement);
      tile.bindVideoStream('attendee', false, mockVideoStream, 1, 1, 1);

      expect(removeAttributeSpy.calledWith('controls')).to.be.true;
      expect(setAttributeSpy.callCount).to.equal(0);
    });

    it('disables picture-in-picture and remote playback and mirror on local tiles', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      const videoElement = videoElementFactory.create();
      // @ts-ignore
      videoElement.disablePictureInPicture = false;
      // @ts-ignore
      videoElement.disableRemotePlayback = false;
      tile.bindVideoElement(videoElement);
      tile.bindVideoStream('attendee', true, mockVideoStream, 1, 1, 1);
      // @ts-ignore
      expect(videoElement.disablePictureInPicture).to.be.true;
      // @ts-ignore
      expect(videoElement.disableRemotePlayback).to.be.true;
      expect(videoElement.style.transform).to.eq('rotateY(180deg)');
    });

    it('do not mirror local video for rear-facing camera', () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 640,
        height: 480,
        deviceId: 'testCamera',
        facingMode: 'environment',
      };
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      const videoElement = videoElementFactory.create();
      // @ts-ignore
      videoElement.disablePictureInPicture = false;
      // @ts-ignore
      videoElement.disableRemotePlayback = false;
      tile.bindVideoElement(videoElement);
      tile.bindVideoStream('attendee', true, mockVideoStream, 1, 1, 1);
      // @ts-ignore
      expect(videoElement.disablePictureInPicture).to.be.true;
      // @ts-ignore
      expect(videoElement.disableRemotePlayback).to.be.true;
      expect(videoElement.style.transform).to.be.empty;
    });
  });

  describe('pause', () => {
    it('pauses', () => {
      tile = new DefaultVideoTile(tileId, true, tileController, monitor);
      expect(tileControllerSpy.callCount).to.equal(1);
      const videoElement = videoElementFactory.create();
      tile.bindVideoElement(videoElement);

      expect(tileControllerSpy.callCount).to.equal(2);

      tile.pause();
      expect(tile.state().paused).to.equal(true);
      expect(tileControllerSpy.callCount).to.equal(3);
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

    it("cannot mark a poor connection if it's already marked", () => {
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

    it("cannot unmark a poor connection if it's already unmarked", () => {
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
      tile.bindVideoStream('attendee', true, mockVideoStream, 1, 1, 1);

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
      tile.bindVideoStream('attendee', true, mockVideoStream, 1, 1, 1);

      const image = tile.capture();
      expect(image.width).to.equal(videoElement.width);
      expect(image.height).to.equal(videoElement.height);
    });
  });
});
