// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoTileController from '../../src/audiovideocontroller/AudioVideoController';
import NoOpAudioVideoTileController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import VideoQualitySettings from '../../src/devicecontroller/VideoQualitySettings';
import NoOpVideoElementFactory from '../../src/videoelementfactory/NoOpVideoElementFactory';
import VideoTileState from '../../src/videotile/VideoTileState';
import VideoTileController, {
  VideoTileResolutionObserver,
} from '../../src/videotilecontroller/VideoTileController';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { createFakeTimers } from '../utils/fakeTimerHelper';

describe('DefaultVideoTileController', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  let clock: sinon.SinonFakeTimers;
  const videoElementFactory = new NoOpVideoElementFactory();
  let audioVideoController: AudioVideoTileController;
  let tileController: VideoTileController;
  let domMockBuilder: DOMMockBuilder;
  let mockMediaStream: MediaStream;
  let resizeCallback: (entries: ResizeObserverEntry[]) => void;
  const observer = new (class implements VideoTileResolutionObserver {
    videoTileResolutionDidChange(
      _attendeeId: string,
      _newWidth: number,
      _newHeight: number
    ): void {}
    videoTileUnbound(_attendeeId: string): void {}
  })();

  beforeEach(() => {
    clock = createFakeTimers();
    domMockBuilder = new DOMMockBuilder();
    global.ResizeObserver = class MockResizeObserver {
      constructor(callback: (entries: ResizeObserverEntry[]) => void) {
        resizeCallback = callback;
      }
      observe(_target: Element): void {}
      unobserve(_target: Element): void {}
      disconnect(): void {}
    } as typeof ResizeObserver;

    audioVideoController = new NoOpAudioVideoTileController();
    tileController = audioVideoController.videoTileController;
    mockMediaStream = new MediaStream();
    // @ts-ignore
    mockMediaStream.addTrack(new MediaStreamTrack('mock-track', 'video'));
    tileController.registerVideoTileResolutionObserver(observer);
  });

  afterEach(async () => {
    tileController.removeVideoTileResolutionObserver(observer);
    await (audioVideoController as NoOpAudioVideoTileController).destroy();
    domMockBuilder.cleanup();
    clock.restore();
  });

  describe('bindVideoElement', () => {
    it('binds a video element', async () => {
      let called = 0;
      const videoElement = videoElementFactory.create();

      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(tileState: VideoTileState): void {
          if (called === 1) {
            expect(tileState.boundVideoElement).to.equal(videoElement);
          }
          called += 1;
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());

      const tileId = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId, videoElement);

      resizeCallback([
        {
          contentRect: { width: 1280, height: 720 },
        } as ResizeObserverEntry,
      ]);
      await clock.tickAsync(0);
      expect(called).to.equal(2);
    });

    it('binds a null video element', async () => {
      let called = 0;
      const videoElement = videoElementFactory.create();

      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(tileState: VideoTileState): void {
          if (called === 2) {
            expect(tileState.boundVideoElement).to.equal(null);
          }
          called += 1;
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());

      const tileId = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId, videoElement);
      tileController.bindVideoElement(tileId, null);

      resizeCallback([
        {
          contentRect: { width: 1280, height: 720 },
        } as ResizeObserverEntry,
      ]);
      await clock.tickAsync(0);
      expect(called).to.equal(3);
    });

    it('ignores binding to a non-existent tile', async () => {
      let called = 0;

      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(_tileState: VideoTileState): void {
          if (called === 1) {
            assert.fail();
          }
          called += 1;
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());
      tileController.bindVideoElement(0, null);
      await clock.tickAsync(10);
      expect(called).to.equal(0);
    });
  });

  describe('unbindVideoElement', () => {
    it('unbinds a video element', async () => {
      let called = 0;
      const videoElement = videoElementFactory.create();

      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(tileState: VideoTileState): void {
          if (called === 2) {
            expect(tileState.boundVideoElement).to.equal(null);
          }
          called += 1;
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());

      const tileId = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId, videoElement);
      tileController.unbindVideoElement(tileId);
      await clock.tickAsync(0);
      expect(called).to.equal(3);
    });

    it('default - clears srcObject with unbindVideoElement', () => {
      let videoElement = document.createElement('video');
      const tileId = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId, videoElement);
      const tile = tileController.getVideoTile(tileId);
      tile.bindVideoStream('attendee', false, mockMediaStream, 1, 1, 1);
      expect(videoElement.srcObject).to.eq(mockMediaStream);
      tileController.unbindVideoElement(tileId);
      expect(videoElement.srcObject).to.eq(null);
      videoElement = null;
    });

    it('does not clear srcObject with unbindVideoElement when cleanUpVideoElement parameter is false', () => {
      let videoElement = document.createElement('video');
      const tileId = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId, videoElement);
      const tile = tileController.getVideoTile(tileId);
      tile.bindVideoStream('attendee', false, mockMediaStream, 1, 1, 1);
      expect(videoElement.srcObject).to.eq(mockMediaStream);
      tileController.unbindVideoElement(tileId, false);
      expect(videoElement.srcObject).to.eq(mockMediaStream);
      videoElement = null;
    });

    it('ignores if no tile bound to a tileId', () => {
      const loggerSpy = sinon.spy(audioVideoController.logger, 'warn');
      tileController.unbindVideoElement(0);
      expect(loggerSpy.calledWith('Ignoring video element unbinding for unknown tile id 0')).to.be
        .true;
    });
  });

  describe('startLocalVideoTile', () => {
    it('starts, stops, and removes a local tile', async () => {
      tileController.startLocalVideoTile();

      await clock.tickAsync(10);
      expect(tileController.getLocalVideoTile()).to.not.equal(null);
      tileController.stopLocalVideoTile();

      await clock.tickAsync(10);
      expect(tileController.getLocalVideoTile()).to.not.equal(null);
      tileController.removeLocalVideoTile();
      expect(tileController.getLocalVideoTile()).to.equal(null);
    });

    it('becomes active after starting and binding it and inactive after stopping it', async () => {
      let waitingForActiveToBecomeFalse = false;
      let inactiveCalled = false;
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(tileState: VideoTileState): void {
          if (tileState.active) {
            tileController.stopLocalVideoTile();
            waitingForActiveToBecomeFalse = true;
            expect(tileController.getLocalVideoTile().state().active).to.equal(false);
          } else if (waitingForActiveToBecomeFalse) {
            inactiveCalled = true;
          }
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());

      tileController.startLocalVideoTile();

      setTimeout(() => {
        tileController.getLocalVideoTile().bindVideoElement(videoElementFactory.create());
        tileController
          .getLocalVideoTile()
          .bindVideoStream('attendee', true, mockMediaStream, 1, 1, 1);
      }, 10);

      await clock.tickAsync(20);
      expect(inactiveCalled).to.be.true;
    });

    it('returns the same local tile ID if it has already started', () => {
      const tileId = tileController.startLocalVideoTile();
      expect(tileController.startLocalVideoTile()).to.equal(tileId);
    });

    it('will ignore the call if video is disabled', async () => {
      audioVideoController.configuration.meetingFeatures.videoMaxResolution =
        VideoQualitySettings.VideoDisabled;
      tileController.startLocalVideoTile();

      await clock.tickAsync(10);
      expect(tileController.getLocalVideoTile()).to.equal(null);
      tileController.stopLocalVideoTile();

      await clock.tickAsync(10);
      expect(tileController.getLocalVideoTile()).to.equal(null);
      tileController.removeLocalVideoTile();
      expect(tileController.getLocalVideoTile()).to.equal(null);
    });
  });

  describe('stopLocalVideoTile', () => {
    it('does not throw an error when a local tile does not exist', () => {
      tileController.stopLocalVideoTile();
    });
  });

  describe('removeLocalVideoTile', () => {
    it('does not throw an error when a local tile does not exist', () => {
      tileController.removeLocalVideoTile();
    });
  });

  describe('pauseVideoTile', () => {
    it('pauses a tile', () => {
      const spy = sinon.spy(audioVideoController, 'pauseReceivingStream');
      const tileId = tileController.addVideoTile().id();
      tileController.pauseVideoTile(tileId);
      expect(spy.callCount).to.equal(1);
      expect(tileController.getVideoTile(tileId).state().paused).to.equal(true);
      tileController.pauseVideoTile(tileId);
      expect(spy.callCount).to.equal(1);
    });

    it('does not throw an error when a tile does not exist', () => {
      tileController.pauseVideoTile(0);
    });
  });

  describe('unpauseVideoTile', () => {
    it('unpauses a tile', () => {
      const spy = sinon.spy(audioVideoController, 'resumeReceivingStream');
      const tileId = tileController.addVideoTile().id();
      tileController.pauseVideoTile(tileId);
      tileController.unpauseVideoTile(tileId);
      expect(spy.callCount).to.equal(1);
      expect(!tileController.getVideoTile(tileId).state().paused).to.equal(true);
      tileController.unpauseVideoTile(tileId);
      expect(spy.callCount).to.equal(1);
      tileController.pauseVideoTile(tileId);
      expect(spy.callCount).to.equal(1);
    });

    it('does not throw an error when a tile does not exist', () => {
      tileController.unpauseVideoTile(0);
    });
  });

  describe('getVideoTile', () => {
    it('returns null if a tile does not exist', () => {
      expect(tileController.getVideoTile(0)).to.equal(null);
    });
  });

  describe('getVideoTileArea', () => {
    it('returns a tile area', () => {
      const videoElement = videoElementFactory.create();
      const tile = tileController.addVideoTile();
      tileController.bindVideoElement(tile.id(), videoElement);
      expect(tileController.getVideoTileArea(tile)).to.equal(120000);
    });

    it('returns 0 if no bound element exists', () => {
      const tile = tileController.addVideoTile();
      expect(tileController.getVideoTileArea(tile)).to.equal(0);
    });
  });

  describe('getAllRemoteVideoTiles', () => {
    it('returns all remote tiles', () => {
      tileController.startLocalVideoTile();
      const remoteTile1 = tileController.addVideoTile();
      const remoteTile2 = tileController.addVideoTile();
      expect(tileController.getAllRemoteVideoTiles()).to.deep.equal([remoteTile1, remoteTile2]);
    });

    it('returns an empty array if a remote tile does not exist', () => {
      tileController.startLocalVideoTile();
      expect(tileController.getAllRemoteVideoTiles()).to.deep.equal([]);
    });
  });

  describe('addVideoTile', () => {
    it('makes incrementing tile ids for each tile added', () => {
      const firstTile = tileController.addVideoTile().id();
      const secondTile = tileController.addVideoTile().id();
      expect(firstTile < secondTile).to.equal(true);
    });
  });

  describe('removeVideoTile', () => {
    it('returns null for a removed tile', () => {
      const tileId = tileController.addVideoTile().id();
      if (tileController.getVideoTile(tileId) === null) {
        assert.fail();
        return;
      }
      tileController.removeVideoTile(tileId);
      expect(tileController.getVideoTile(tileId)).to.equal(null);
    });

    it('sends a tile removed callback for a removed tile', async () => {
      let tileIdToRemove = 0;
      let removeCalled = false;
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(_tileState: VideoTileState): void {}
        videoTileWasRemoved(tileId: number): void {
          expect(tileId === tileIdToRemove).to.equal(true);
          removeCalled = true;
        }
      }
      audioVideoController.addObserver(new Observer());
      tileIdToRemove = tileController.addVideoTile().id();
      tileController.removeVideoTile(tileIdToRemove);
      await clock.tickAsync(0);
      expect(removeCalled).to.be.true;
    });

    it('does not throw an error when a tile does not exist', () => {
      tileController.removeVideoTile(0);
    });
  });

  describe('removeVideoTilesByAttendeeId', () => {
    it('sends a tile removed callback for a tile removed by attendee id', async () => {
      let tileIdToRemove = 0;
      let removeCalled = false;
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(_tileState: VideoTileState): void {}
        videoTileWasRemoved(tileId: number): void {
          expect(tileId === tileIdToRemove).to.equal(true);
          removeCalled = true;
        }
      }
      audioVideoController.addObserver(new Observer());
      tileController.addVideoTile();
      const tile = tileController.addVideoTile();
      tile.stateRef().boundAttendeeId = 'foo';
      tileIdToRemove = tile.id();
      const tileIdsRemoved = tileController.removeVideoTilesByAttendeeId(
        tile.state().boundAttendeeId
      );
      if (tileIdsRemoved.length !== 1 && tileIdsRemoved[0] !== tileIdToRemove) {
        assert.fail();
      }
      await clock.tickAsync(0);
      expect(removeCalled).to.be.true;
    });
  });

  describe('removeAllVideoTiles', () => {
    it('returns null for all previously added tiles', async () => {
      const tiles = [];
      for (let i = 0; i < 16; i++) {
        tiles.push(tileController.addVideoTile().id());
      }
      for (const tileId of tiles) {
        if (tileController.getVideoTile(tileId) === null) {
          assert.fail();
          return;
        }
      }
      tileController.removeAllVideoTiles();
      for (const tileId of tiles) {
        if (tileController.getVideoTile(tileId) !== null) {
          assert.fail();
          return;
        }
      }
      await clock.tickAsync(0);
    });
  });

  describe('haveVideoTilesWithStreams', () => {
    it('returns true if at least one tile has a bound stream and false otherwise', () => {
      expect(tileController.haveVideoTilesWithStreams()).to.equal(false);
      tileController.addVideoTile();
      expect(tileController.haveVideoTilesWithStreams()).to.equal(false);
      const tile = tileController.addVideoTile();
      // @ts-ignore
      const stream: MediaStream = {};
      tile.bindVideoStream('attendee', true, stream, 0, 0, 0);
      expect(tileController.haveVideoTilesWithStreams()).to.equal(true);
      tile.bindVideoStream('attendee', true, null, 0, 0, 0);
      expect(tileController.haveVideoTilesWithStreams()).to.equal(false);
    });
  });

  describe('haveVideoTileForAttendeeId', () => {
    it('returns true if a tile is associated with an attendee id', () => {
      expect(tileController.haveVideoTileForAttendeeId('unknown-attendee')).to.equal(false);
      const tile = tileController.addVideoTile();
      tile.bindVideoStream('attendee', true, null, 0, 0, 0);
      expect(tileController.haveVideoTileForAttendeeId('attendee')).to.equal(true);
      expect(tileController.haveVideoTileForAttendeeId('unknown-attendee')).to.equal(false);
    });
  });

  describe('sendTileStateUpdate', () => {
    it('sends a tile state update to session observers for the session set on the tile manager', async () => {
      let updateCalled = false;
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(_tileState: VideoTileState): void {
          updateCalled = true;
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());
      tileController.sendTileStateUpdate(new VideoTileState());
      await clock.tickAsync(0);
      expect(updateCalled).to.be.true;
    });
  });

  describe('sendTileStateUpdate', () => {
    it('sends a tile state update to session observers for the session set on the tile manager', async () => {
      let updateCalled = false;
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(_tileState: VideoTileState): void {
          updateCalled = true;
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());
      tileController.sendTileStateUpdate(new VideoTileState());
      await clock.tickAsync(0);
      expect(updateCalled).to.be.true;
    });
  });

  describe('captureVideoTile', () => {
    it('captures a tile', async () => {
      let captured = false;
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(tileState: VideoTileState): void {
          if (tileState.active) {
            const image = tileController.captureVideoTile(tileState.tileId);
            expect(image.width).to.equal(tileState.boundVideoElement.width);
            expect(image.height).to.equal(tileState.boundVideoElement.height);
            captured = true;
          }
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());
      tileController.startLocalVideoTile();

      setTimeout(() => {
        tileController.getLocalVideoTile().bindVideoElement(videoElementFactory.create());
        tileController
          .getLocalVideoTile()
          .bindVideoStream('attendee', true, mockMediaStream, 1, 1, 1);
      }, 50);

      await clock.tickAsync(100);
      expect(captured).to.be.true;
    });
  });

  it('returns null if a tile does not exist', () => {
    expect(tileController.captureVideoTile(0)).to.equal(null);
  });

  describe('videoTileFirstFrameDidRender via DOM mock', () => {
    it('fires for remote tile with groupId', async () => {
      let firedGroupId: number | undefined;
      const obs: VideoTileResolutionObserver = {
        videoTileResolutionDidChange: () => {},
        videoTileUnbound: () => {},
        videoTileFirstFrameDidRender: (groupId: number) => {
          firedGroupId = groupId;
        },
      };
      tileController.registerVideoTileResolutionObserver(obs);
      const tile = tileController.addVideoTile();
      tile.bindVideoStream('attendee', false, mockMediaStream, 1, 1, 1, 'ext', 5);
      const videoElement = document.createElement('video');
      tileController.bindVideoElement(tile.id(), videoElement);
      await clock.tickAsync(10);
      expect(firedGroupId).to.equal(5);
      tileController.removeVideoTileResolutionObserver(obs);
    });

    it('does not fire for tile with null groupId', async () => {
      let firedGroupId: number | undefined;
      const obs: VideoTileResolutionObserver = {
        videoTileResolutionDidChange: () => {},
        videoTileUnbound: () => {},
        videoTileFirstFrameDidRender: (groupId: number) => {
          firedGroupId = groupId;
        },
      };
      tileController.registerVideoTileResolutionObserver(obs);
      const tile = tileController.addVideoTile();
      tile.bindVideoStream('attendee', false, mockMediaStream, 1, 1, 1, 'ext');
      const videoElement = document.createElement('video');
      tileController.bindVideoElement(tile.id(), videoElement);
      await clock.tickAsync(10);
      expect(firedGroupId).to.be.undefined;
      tileController.removeVideoTileResolutionObserver(obs);
    });
  });

  describe('handleVideoElementMetrics via DOM mock', () => {
    it('does not fire for local tile', async () => {
      let metricsCalled = false;
      const obs: VideoTileResolutionObserver = {
        videoTileResolutionDidChange: () => {},
        videoTileUnbound: () => {},
        videoTileRenderMetricsDidReceive: () => {
          metricsCalled = true;
        },
      };
      tileController.registerVideoTileResolutionObserver(obs);
      tileController.startLocalVideoTile();
      const tile = tileController.getLocalVideoTile();
      tile.bindVideoStream('attendee', true, mockMediaStream, 1, 1, 1, 'ext');
      const videoElement = document.createElement('video');
      tileController.bindVideoElement(tile.id(), videoElement);
      // Tick enough for first frame + FPS window
      await clock.tickAsync(1100);
      expect(metricsCalled).to.be.false;
      tileController.removeVideoTileResolutionObserver(obs);
    });

    it('fires for remote tile', async () => {
      let firedGroupId: number | undefined;
      const obs: VideoTileResolutionObserver = {
        videoTileResolutionDidChange: () => {},
        videoTileUnbound: () => {},
        videoTileRenderMetricsDidReceive: (groupId: number) => {
          firedGroupId = groupId;
        },
      };
      tileController.registerVideoTileResolutionObserver(obs);
      const tile = tileController.addVideoTile();
      tile.bindVideoStream('attendee', false, mockMediaStream, 1, 1, 1, 'ext', 5);
      const videoElement = document.createElement('video');
      tileController.bindVideoElement(tile.id(), videoElement);
      // Tick enough for first frame + FPS window
      await clock.tickAsync(1100);
      expect(firedGroupId).to.equal(5);
      tileController.removeVideoTileResolutionObserver(obs);
    });
  });

  describe('videoTileBound callback', () => {
    it('fires videoTileBound when binding a remote tile', () => {
      let boundGroupId: number | undefined;
      const boundObserver: VideoTileResolutionObserver = {
        videoTileResolutionDidChange: () => {},
        videoTileUnbound: () => {},
        videoTileBound: (groupId: number) => {
          boundGroupId = groupId;
        },
      };
      tileController.registerVideoTileResolutionObserver(boundObserver);
      const tile = tileController.addVideoTile();
      tile.bindVideoStream('attendee', false, mockMediaStream, 1, 1, 1, 'ext', 5);
      const videoElement = videoElementFactory.create();
      tileController.bindVideoElement(tile.id(), videoElement);
      expect(boundGroupId).to.equal(5);
      tileController.removeVideoTileResolutionObserver(boundObserver);
    });

    it('does not fire videoTileBound for local tile', () => {
      let boundCalled = false;
      const boundObserver: VideoTileResolutionObserver = {
        videoTileResolutionDidChange: () => {},
        videoTileUnbound: () => {},
        videoTileBound: () => {
          boundCalled = true;
        },
      };
      tileController.registerVideoTileResolutionObserver(boundObserver);
      tileController.startLocalVideoTile();
      const tile = tileController.getLocalVideoTile();
      tileController.bindVideoElement(tile.id(), videoElementFactory.create());
      expect(boundCalled).to.be.false;
      tileController.removeVideoTileResolutionObserver(boundObserver);
    });

    it('does not fire videoTileBound when groupId is null', () => {
      let boundCalled = false;
      const boundObserver: VideoTileResolutionObserver = {
        videoTileResolutionDidChange: () => {},
        videoTileUnbound: () => {},
        videoTileBound: () => {
          boundCalled = true;
        },
      };
      tileController.registerVideoTileResolutionObserver(boundObserver);
      const tile = tileController.addVideoTile();
      // Don't set groupId (it defaults to null)
      tile.bindVideoStream('attendee', false, mockMediaStream, 1, 1, 1, 'ext');
      tileController.bindVideoElement(tile.id(), videoElementFactory.create());
      expect(boundCalled).to.be.false;
      tileController.removeVideoTileResolutionObserver(boundObserver);
    });

    it('does not fire videoTileBound when videoElement is null', () => {
      let boundCalled = false;
      const boundObserver: VideoTileResolutionObserver = {
        videoTileResolutionDidChange: () => {},
        videoTileUnbound: () => {},
        videoTileBound: () => {
          boundCalled = true;
        },
      };
      tileController.registerVideoTileResolutionObserver(boundObserver);
      const tile = tileController.addVideoTile();
      tile.bindVideoStream('attendee', false, mockMediaStream, 1, 1, 1, 'ext', 5);
      tileController.bindVideoElement(tile.id(), null);
      expect(boundCalled).to.be.false;
      tileController.removeVideoTileResolutionObserver(boundObserver);
    });
  });

  describe('handleVideoFirstFrameDidRender edge cases', () => {
    it('does not fire when tile is removed before callback', async () => {
      let firedGroupId: number | undefined;
      const obs: VideoTileResolutionObserver = {
        videoTileResolutionDidChange: () => {},
        videoTileUnbound: () => {},
        videoTileFirstFrameDidRender: (groupId: number) => {
          firedGroupId = groupId;
        },
      };
      tileController.registerVideoTileResolutionObserver(obs);
      const tile = tileController.addVideoTile();
      tile.bindVideoStream('attendee', false, mockMediaStream, 1, 1, 1, 'ext', 5);
      const videoElement = document.createElement('video');
      tileController.bindVideoElement(tile.id(), videoElement);
      tileController.removeVideoTile(tile.id());
      await clock.tickAsync(10);
      expect(firedGroupId).to.be.undefined;
      tileController.removeVideoTileResolutionObserver(obs);
    });
  });

  describe('handleVideoElementFrameMetrics edge cases', () => {
    it('does not fire metrics when tile is removed before callback', async () => {
      let metricsCalled = false;
      const obs: VideoTileResolutionObserver = {
        videoTileResolutionDidChange: () => {},
        videoTileUnbound: () => {},
        videoTileRenderMetricsDidReceive: () => {
          metricsCalled = true;
        },
      };
      tileController.registerVideoTileResolutionObserver(obs);
      const tile = tileController.addVideoTile();
      tile.bindVideoStream('attendee', false, mockMediaStream, 1, 1, 1, 'ext', 5);
      const videoElement = document.createElement('video');
      tileController.bindVideoElement(tile.id(), videoElement);
      tileController.removeVideoTile(tile.id());
      await clock.tickAsync(1100);
      expect(metricsCalled).to.be.false;
      tileController.removeVideoTileResolutionObserver(obs);
    });

    it('does not fire metrics for tile with null groupId', async () => {
      let metricsCalled = false;
      const obs: VideoTileResolutionObserver = {
        videoTileResolutionDidChange: () => {},
        videoTileUnbound: () => {},
        videoTileRenderMetricsDidReceive: () => {
          metricsCalled = true;
        },
      };
      tileController.registerVideoTileResolutionObserver(obs);
      const tile = tileController.addVideoTile();
      tile.bindVideoStream('attendee', false, mockMediaStream, 1, 1, 1, 'ext');
      const videoElement = document.createElement('video');
      tileController.bindVideoElement(tile.id(), videoElement);
      await clock.tickAsync(1100);
      expect(metricsCalled).to.be.false;
      tileController.removeVideoTileResolutionObserver(obs);
    });
  });
});
