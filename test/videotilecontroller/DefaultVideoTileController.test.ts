// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoTileController from '../../src/audiovideocontroller/AudioVideoController';
import NoOpAudioVideoTileController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import NoOpVideoElementFactory from '../../src/videoelementfactory/NoOpVideoElementFactory';
import VideoTileState from '../../src/videotile/VideoTileState';
import VideoTileController from '../../src/videotilecontroller/VideoTileController';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultVideoTileController', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const videoElementFactory = new NoOpVideoElementFactory();
  let audioVideoController: AudioVideoTileController;
  let tileController: VideoTileController;
  let domMockBuilder: DOMMockBuilder;
  let mockMediaStream: MediaStream;

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder();
    audioVideoController = new NoOpAudioVideoTileController();
    tileController = audioVideoController.videoTileController;
    mockMediaStream = new MediaStream();
    // @ts-ignore
    mockMediaStream.addTrack(new MediaStreamTrack('mock-track', 'video'));
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('bindVideoElement', () => {
    it('binds a video element', done => {
      let called = 0;
      const videoElement = videoElementFactory.create();

      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(tileState: VideoTileState): void {
          if (called === 1) {
            expect(tileState.boundVideoElement).to.equal(videoElement);
            done();
          }
          called += 1;
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());

      const tileId = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId, videoElement);
    });

    it('binds a null video element', done => {
      let called = 0;
      const videoElement = videoElementFactory.create();

      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(tileState: VideoTileState): void {
          if (called === 2) {
            expect(tileState.boundVideoElement).to.equal(null);
            done();
          }
          called += 1;
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());

      const tileId = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId, videoElement);
      tileController.bindVideoElement(tileId, null);
    });

    it('ignores binding to a non-existent tile', done => {
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
      new TimeoutScheduler(10).start(done);
    });
  });

  describe('unbindVideoElement', () => {
    it('unbinds a video element', done => {
      let called = 0;
      const videoElement = videoElementFactory.create();

      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(tileState: VideoTileState): void {
          if (called === 2) {
            expect(tileState.boundVideoElement).to.equal(null);
            done();
          }
          called += 1;
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());

      const tileId = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId, videoElement);
      tileController.unbindVideoElement(tileId);
    });
  });

  describe('startLocalVideoTile', () => {
    it('starts, stops, and removes a local tile', done => {
      tileController.startLocalVideoTile();

      new TimeoutScheduler(10).start(() => {
        expect(tileController.getLocalVideoTile()).to.not.equal(null);
        tileController.stopLocalVideoTile();

        new TimeoutScheduler(10).start(() => {
          expect(tileController.getLocalVideoTile()).to.not.equal(null);
          tileController.removeLocalVideoTile();
          expect(tileController.getLocalVideoTile()).to.equal(null);
          done();
        });
      });
    });

    it('becomes active after starting and binding it and inactive after stopping it', done => {
      let waitingForActiveToBecomeFalse = false;
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(tileState: VideoTileState): void {
          if (tileState.active) {
            tileController.stopLocalVideoTile();
            waitingForActiveToBecomeFalse = true;
            expect(tileController.getLocalVideoTile().state().active).to.equal(false);
          } else if (waitingForActiveToBecomeFalse) {
            done();
          }
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());

      tileController.startLocalVideoTile();

      new TimeoutScheduler(10).start(() => {
        tileController.getLocalVideoTile().bindVideoElement(videoElementFactory.create());

        tileController
          .getLocalVideoTile()
          // @ts-ignore
          .bindVideoStream('attendee', true, mockMediaStream, 1, 1, 1);
      });
    });

    it('returns the same local tile ID if it has already started', () => {
      const tileId = tileController.startLocalVideoTile();
      expect(tileController.startLocalVideoTile()).to.equal(tileId);
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

    it('sends a tile removed callback for a removed tile', done => {
      let tileIdToRemove = 0;
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(_tileState: VideoTileState): void {}
        videoTileWasRemoved(tileId: number): void {
          expect(tileId === tileIdToRemove).to.equal(true);
          done();
        }
      }
      audioVideoController.addObserver(new Observer());
      tileIdToRemove = tileController.addVideoTile().id();
      tileController.removeVideoTile(tileIdToRemove);
    });

    it('does not throw an error when a tile does not exist', () => {
      tileController.removeVideoTile(0);
    });
  });

  describe('removeVideoTilesByAttendeeId', () => {
    it('sends a tile removed callback for a tile removed by attendee id', done => {
      let tileIdToRemove = 0;
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(_tileState: VideoTileState): void {}
        videoTileWasRemoved(tileId: number): void {
          expect(tileId === tileIdToRemove).to.equal(true);
          done();
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
    });
  });

  describe('removeAllVideoTiles', () => {
    it('returns null for all previously added tiles', done => {
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
      done();
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
    it('sends a tile state update to session observers for the session set on the tile manager', done => {
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(_tileState: VideoTileState): void {
          done();
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());
      tileController.sendTileStateUpdate(new VideoTileState());
    });
  });

  describe('sendTileStateUpdate', () => {
    it('sends a tile state update to session observers for the session set on the tile manager', done => {
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(_tileState: VideoTileState): void {
          done();
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());
      tileController.sendTileStateUpdate(new VideoTileState());
    });
  });

  describe('captureVideoTile', () => {
    it('captures a tile', done => {
      class Observer implements AudioVideoObserver {
        videoTileDidUpdate(tileState: VideoTileState): void {
          if (tileState.active) {
            const image = tileController.captureVideoTile(tileState.tileId);
            expect(image.width).to.equal(tileState.boundVideoElement.width);
            expect(image.height).to.equal(tileState.boundVideoElement.height);
            done();
          }
        }
        videoTileWasRemoved(_tileId: number): void {}
      }
      audioVideoController.addObserver(new Observer());
      tileController.startLocalVideoTile();

      new TimeoutScheduler(50).start(() => {
        tileController.getLocalVideoTile().bindVideoElement(videoElementFactory.create());

        tileController
          .getLocalVideoTile()
          // @ts-ignore
          .bindVideoStream('attendee', true, mockMediaStream, 1, 1, 1);
      });
    });
  });

  it('returns null if a tile does not exist', () => {
    expect(tileController.captureVideoTile(0)).to.equal(null);
  });
});
