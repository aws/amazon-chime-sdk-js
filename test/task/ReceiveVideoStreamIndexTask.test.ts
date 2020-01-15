// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import NoOpLogger from '../../src/logger/NoOpLogger';
import MeetingSessionVideoAvailability from '../../src/meetingsession/MeetingSessionVideoAvailability';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import {
  SdkIndexFrame,
  SdkSignalFrame,
  SdkStreamServiceType,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import ReceiveVideoStreamIndexTask from '../../src/task/ReceiveVideoStreamIndexTask';
import DefaultVideoCaptureAndEncodeParameter from '../../src/videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import NoVideoDownlinkBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/NoVideoDownlinkBandwidthPolicy';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import DefaultVideoSubscribeContext from '../../src/videosubscribecontext/DefaultVideoSubscribeContext';
import DefaultVideoTileController from '../../src/videotilecontroller/DefaultVideoTileController';
import DefaultVideoTileFactory from '../../src/videotilefactory/DefaultVideoTileFactory';
import NoVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NoVideoUplinkBandwidthPolicy';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('ReceiveVideoStreamIndexTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const behavior = new DOMMockBehavior();
  const logger = new NoOpLogger();
  let task: ReceiveVideoStreamIndexTask;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let signalingClient: DefaultSignalingClient;
  let context: AudioVideoControllerState;
  let request: SignalingClientConnectionRequest;
  let domMockBuilder: DOMMockBuilder | null = null;

  const createIndexSignalBuffer = (
    atCapacity: boolean = false,
    pausedAtSourceIds: number[] | null = null
  ): Uint8Array => {
    const indexFrame = SdkIndexFrame.create();
    indexFrame.atCapacity = atCapacity;
    indexFrame.pausedAtSourceIds = pausedAtSourceIds;
    const indexSignal = SdkSignalFrame.create();
    indexSignal.type = SdkSignalFrame.Type.INDEX;
    indexSignal.index = indexFrame;
    const buffer = SdkSignalFrame.encode(indexSignal).finish();
    const indexSignalBuffer = new Uint8Array(buffer.length + 1);
    indexSignalBuffer[0] = 0x5;
    indexSignalBuffer.set(buffer, 1);
    return indexSignalBuffer;
  };

  beforeEach(async () => {
    domMockBuilder = new DOMMockBuilder(behavior);
    webSocketAdapter = new DefaultWebSocketAdapter(logger);
    signalingClient = new DefaultSignalingClient(webSocketAdapter, logger);

    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    context.signalingClient = signalingClient;
    context.videoTileController = new DefaultVideoTileController(
      new DefaultVideoTileFactory(),
      context.audioVideoController,
      logger
    );

    context.videoDownlinkBandwidthPolicy = new NoVideoDownlinkBandwidthPolicy();
    context.videoUplinkBandwidthPolicy = new NoVideoUplinkBandwidthPolicy();
    context.lastKnownVideoAvailability = new MeetingSessionVideoAvailability();
    context.videoSubscribeContext = new DefaultVideoSubscribeContext();
    context.videoSubscribeContext.updateVideoStreamIndex(new DefaultVideoStreamIndex(logger));
    task = new ReceiveVideoStreamIndexTask(context);

    request = new SignalingClientConnectionRequest('ws://localhost:9999/control', 'test-auth');

    signalingClient.openConnection(request);

    await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
    expect(signalingClient.ready()).to.equal(true);
  });

  afterEach(async () => {
    signalingClient.closeConnection();
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('run', () => {
    it('updates bandwidth policies', done => {
      const videoDownlinkBandwidthPolicySpy: sinon.SinonSpy = sinon.spy(
        context.videoDownlinkBandwidthPolicy,
        'updateIndex'
      );
      const videoUplinkBandwidthPolicySpy: sinon.SinonSpy = sinon.spy(
        context.videoUplinkBandwidthPolicy,
        'updateIndex'
      );

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await new Promise(resolve =>
          new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
        );
        expect(videoDownlinkBandwidthPolicySpy.called).to.be.true;
        expect(videoUplinkBandwidthPolicySpy.called).to.be.true;
        done();
      });
      task.run();
    });
  });

  describe('resubscribe', () => {
    it('attempts to resubscribe if video downlink bandwidth policy wants to resubscribe', done => {
      const ids: number[] = [1, 2, 3];
      class TestVideoDownlinkBandwidthPolicy extends NoVideoDownlinkBandwidthPolicy {
        wantsResubscribe(): boolean {
          return true;
        }
        chooseSubscriptions(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet(ids);
        }
      }
      context.videoDownlinkBandwidthPolicy = new TestVideoDownlinkBandwidthPolicy();

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await new Promise(resolve =>
          new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
        );
        expect(
          context.nextVideoSubscribeContext
            .videosToReceive()
            .equal(new DefaultVideoStreamIdSet(ids))
        ).to.be.true;
        done();
      });

      task.run();
    });

    it('attempts to resubscribe if video uplink bandwidth policy wants to resubscribe', done => {
      const captureWidth = 400;
      const captureHeight = 300;
      const captureFrameRate = 30;
      const maxEncodeBitrateKbps = 768;

      class TestVideoUplinkBandwidthPolicy extends NoVideoUplinkBandwidthPolicy {
        wantsResubscribe(): boolean {
          return true;
        }
        chooseCaptureAndEncodeParameters(): DefaultVideoCaptureAndEncodeParameter {
          return new DefaultVideoCaptureAndEncodeParameter(
            captureWidth,
            captureHeight,
            captureFrameRate,
            maxEncodeBitrateKbps,
            false
          );
        }
      }
      context.videoUplinkBandwidthPolicy = new TestVideoUplinkBandwidthPolicy();
      context.videoDuplexMode = SdkStreamServiceType.DUPLEX;

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await new Promise(resolve =>
          new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
        );
        expect(
          context.videoCaptureAndEncodeParameter.equal(
            new DefaultVideoCaptureAndEncodeParameter(
              captureWidth,
              captureHeight,
              captureFrameRate,
              maxEncodeBitrateKbps,
              false
            )
          )
        ).to.be.true;
        done();
      });

      task.run();
    });
  });

  describe('updateVideoAvailability', () => {
    it('updates video availability', done => {
      class TestVideoDownlinkPolicy extends NoVideoDownlinkBandwidthPolicy {
        wantsResubscribe(): boolean {
          return true;
        }
      }
      class TestAudioVideoObserver implements AudioVideoObserver {
        videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void {
          const videoAvailability = new MeetingSessionVideoAvailability();
          videoAvailability.remoteVideoAvailable = false;
          videoAvailability.canStartLocalVideo = true;
          expect(availability.equal(videoAvailability)).to.be.true;
          done();
        }
      }
      context.videoDownlinkBandwidthPolicy = new TestVideoDownlinkPolicy();
      context.audioVideoController.addObserver(new TestAudioVideoObserver());

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await new Promise(resolve =>
          new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
        );
      });

      task.run();
    });

    it('updates video availability with remote video available but cannot start local video', done => {
      class TestVideoDownlinkBandwidthPolicy extends NoVideoDownlinkBandwidthPolicy {
        wantsResubscribe(): boolean {
          return true;
        }
        chooseSubscriptions(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet([1, 2, 3]);
        }
      }
      class TestAudioVideoObserver implements AudioVideoObserver {
        videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void {
          const videoAvailability = new MeetingSessionVideoAvailability();
          videoAvailability.remoteVideoAvailable = true;
          videoAvailability.canStartLocalVideo = false;
          expect(availability.equal(videoAvailability)).to.be.true;
          done();
        }
      }

      context.videoDownlinkBandwidthPolicy = new TestVideoDownlinkBandwidthPolicy();
      context.audioVideoController.addObserver(new TestAudioVideoObserver());

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer(true));
        await new Promise(resolve =>
          new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
        );
      });

      task.run();
    });

    describe('no update', () => {
      it('does not update video availability if no uplink or downlink resubscription change', async () => {
        class TestVideoDownlinkBandwidthPolicy extends NoVideoDownlinkBandwidthPolicy {
          wantsResubscribe(): boolean {
            return false;
          }
        }
        class TestAudioVideoObserver implements AudioVideoObserver {
          videoAvailabilityDidChange(_availability: MeetingSessionVideoAvailability): void {
            assert.fail();
          }
        }

        context.videoDownlinkBandwidthPolicy = new TestVideoDownlinkBandwidthPolicy();
        context.audioVideoController.addObserver(new TestAudioVideoObserver());

        new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
          webSocketAdapter.send(createIndexSignalBuffer(true));
          await new Promise(resolve =>
            new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
          );
        });

        task.run();
      });

      it('does not update video availability if new video availability equals last known video availability', done => {
        class TestVideoDownlinkBandwidthPolicy extends NoVideoDownlinkBandwidthPolicy {
          wantsResubscribe(): boolean {
            return true;
          }
        }
        const videoAvailability = new MeetingSessionVideoAvailability();
        videoAvailability.remoteVideoAvailable = false;
        videoAvailability.canStartLocalVideo = true;
        context.lastKnownVideoAvailability = videoAvailability;
        context.videoDownlinkBandwidthPolicy = new TestVideoDownlinkBandwidthPolicy();
        class TestAudioVideoObserver implements AudioVideoObserver {
          videoAvailabilityDidChange(_availability: MeetingSessionVideoAvailability): void {
            assert.fail();
          }
        }
        context.audioVideoController.addObserver(new TestAudioVideoObserver());

        new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
          webSocketAdapter.send(createIndexSignalBuffer());
          await new Promise(resolve =>
            new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
          );
          done();
        });

        task.run();
      });
    });
  });

  describe('handleIndexVideosPausedAtSource', () => {
    it('unmarks the tile as having a poor connection', done => {
      const tile1 = context.videoTileController.addVideoTile();
      const tile2 = context.videoTileController.addVideoTile();
      tile1.markPoorConnection();
      tile2.markPoorConnection();

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await new Promise(resolve =>
          new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
        );
        expect(tile1.state().poorConnection).to.be.false;
        expect(tile2.state().poorConnection).to.be.false;
        done();
      });

      task.run();
    });

    it('marks a tile as having a poor connection', done => {
      const tile = context.videoTileController.addVideoTile();
      tile.unmarkPoorConnection();
      // @ts-ignore
      tile.bindVideoStream('xy1', false, {}, 0, 0, 1);

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer(false, [1]));
        await new Promise(resolve =>
          new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
        );
        expect(tile.state().poorConnection).to.be.true;
        done();
      });

      task.run();
    });

    it('unmarks a non-poor connection tile as having a poor connection', done => {
      const tile1 = context.videoTileController.addVideoTile();
      tile1.unmarkPoorConnection();

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await new Promise(resolve =>
          new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
        );
        expect(tile1.state().poorConnection).to.be.false;
        done();
      });

      task.run();
    });

    it('marks a poor connection tile as having a poor connection', done => {
      const tile = context.videoTileController.addVideoTile();
      tile.markPoorConnection();
      // @ts-ignore
      tile.bindVideoStream('xy1', false, {}, 0, 0, 1);

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer(false, [1]));
        await new Promise(resolve =>
          new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
        );
        expect(tile.state().poorConnection).to.be.true;
        done();
      });

      task.run();
    });
  });

  describe('cancel', () => {
    it('can cancel using the context', done => {
      const videoStreamIndexSpy: sinon.SinonSpy = sinon.spy(
        context.videoSubscribeContext.videoStreamIndexRef(),
        'integrateIndexFrame'
      );

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await new Promise(resolve =>
          new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve)
        );
        expect(videoStreamIndexSpy.called).to.be.false;
        done();
      });

      task.run().then(() => {
        expect(context.removableObservers.length).to.equal(1);
        context.removableObservers[0].removeObserver();
      });
    });
  });
});
