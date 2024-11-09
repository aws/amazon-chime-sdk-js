// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import NoOpLogger from '../../src/logger/NoOpLogger';
import MeetingSessionVideoAvailability from '../../src/meetingsession/MeetingSessionVideoAvailability';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import VideoCodecCapability from '../../src/sdp/VideoCodecCapability';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import {
  SdkIndexFrame,
  SdkSignalFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
  SdkStreamServiceType,
  SdkVideoCodecCapability,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import ReceiveVideoStreamIndexTask from '../../src/task/ReceiveVideoStreamIndexTask';
import { wait as delay } from '../../src/utils/Utils';
import DefaultVideoCaptureAndEncodeParameter from '../../src/videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import AllHighestVideoBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/AllHighestVideoBandwidthPolicy';
import NoVideoDownlinkBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/NoVideoDownlinkBandwidthPolicy';
import VideoAdaptiveProbePolicy from '../../src/videodownlinkbandwidthpolicy/VideoAdaptiveProbePolicy';
import VideoSource from '../../src/videosource/VideoSource';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import DefaultVideoTileController from '../../src/videotilecontroller/DefaultVideoTileController';
import DefaultVideoTileFactory from '../../src/videotilefactory/DefaultVideoTileFactory';
import DefaultSimulcastUplinkPolicy from '../../src/videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicy';
import NoVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NoVideoUplinkBandwidthPolicy';
import NScaleVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { shortcut } from '../utils';

describe('ReceiveVideoStreamIndexTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const behavior = new DOMMockBehavior();
  const logger = new NoOpLogger();
  const _videoSubscriptionLimit = 25;
  let task: ReceiveVideoStreamIndexTask;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let signalingClient: DefaultSignalingClient;
  let context: AudioVideoControllerState;
  let request: SignalingClientConnectionRequest;
  let domMockBuilder: DOMMockBuilder | null = null;

  const createIndexSignalBuffer = (
    atCapacity: boolean = false,
    pausedAtSourceIds: number[] | null = null,
    sources: SdkStreamDescriptor[] | null = null,
    supportedReceiveCodecIntersection: SdkVideoCodecCapability[] | null = null
  ): Uint8Array => {
    const indexFrame = SdkIndexFrame.create();
    indexFrame.atCapacity = atCapacity;
    indexFrame.pausedAtSourceIds = pausedAtSourceIds;
    indexFrame.sources = sources;
    indexFrame.supportedReceiveCodecIntersection = supportedReceiveCodecIntersection;
    const indexSignal = SdkSignalFrame.create();
    indexSignal.type = SdkSignalFrame.Type.INDEX;
    indexSignal.index = indexFrame;
    const buffer = SdkSignalFrame.encode(indexSignal).finish();
    const indexSignalBuffer = new Uint8Array(buffer.length + 1);
    indexSignalBuffer[0] = 0x5;
    indexSignalBuffer.set(buffer, 1);
    return indexSignalBuffer;
  };

  const createStreamDescriptor = (
    attendeeId: string,
    groupId: number,
    streamId: number,
    maxBitrateKbps: number,
    avgBitrateBps: number
  ): SdkStreamDescriptor => {
    const streamDescriptor = SdkStreamDescriptor.create();
    streamDescriptor.attendeeId = attendeeId;
    streamDescriptor.groupId = groupId;
    streamDescriptor.streamId = streamId;
    streamDescriptor.mediaType = SdkStreamMediaType.VIDEO;
    streamDescriptor.maxBitrateKbps = maxBitrateKbps;
    streamDescriptor.avgBitrateBps = avgBitrateBps;
    return streamDescriptor;
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
    context.videoStreamIndex = new DefaultVideoStreamIndex(logger);
    context.videoDownlinkBandwidthPolicy = new NoVideoDownlinkBandwidthPolicy();
    context.videoUplinkBandwidthPolicy = new NoVideoUplinkBandwidthPolicy();
    context.lastKnownVideoAvailability = new MeetingSessionVideoAvailability();
    context.videosToReceive = context.videoDownlinkBandwidthPolicy.chooseSubscriptions().clone();

    task = new ReceiveVideoStreamIndexTask(context);

    request = new SignalingClientConnectionRequest('ws://localhost:9999/control', 'test-auth');

    signalingClient.openConnection(request);

    await delay(behavior.asyncWaitMs + 10);
    expect(signalingClient.ready()).to.equal(true);
  });

  afterEach(async () => {
    signalingClient.closeConnection();
    await (context.audioVideoController as NoOpAudioVideoController).destroy();
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
        await delay(behavior.asyncWaitMs + 10);
        expect(videoDownlinkBandwidthPolicySpy.calledWith(context.videoStreamIndex)).to.be.true;
        expect(videoUplinkBandwidthPolicySpy.calledWith(context.videoStreamIndex)).to.be.true;
        done();
      });

      task.run();
    });
  });

  describe('resubscribe', () => {
    it('attemps to resubscribe if video downlink bandwidth policy wants to resubscribe', done => {
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
      context.videoSubscriptionLimit = _videoSubscriptionLimit;

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await delay(behavior.asyncWaitMs + 10);
        expect(context.videosToReceive.equal(new DefaultVideoStreamIdSet(ids))).to.be.true;
        done();
      });

      task.run();
    });

    it('will not attempt to resubscribe if paused', done => {
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

      task.resumeIngestion();
      task.pauseIngestion();
      task.resumeIngestion();
      task.pauseIngestion();

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await delay(behavior.asyncWaitMs + 10);
        expect(context.videosToReceive.equal(new DefaultVideoStreamIdSet(ids))).to.be.false;
        done();
      });

      task.run();
    });

    it('will attempt to resubscribe if paused and resumed', done => {
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
      context.videoSubscriptionLimit = _videoSubscriptionLimit;

      task.pauseIngestion();

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await delay(behavior.asyncWaitMs + 10);
        task.resumeIngestion();
        expect(context.videosToReceive.equal(new DefaultVideoStreamIdSet(ids))).to.be.true;
        done();
      });

      task.run();
    });

    it('will attempt to resubscribe if paused and resumed', done => {
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
      context.videoSubscriptionLimit = _videoSubscriptionLimit;

      task.pauseIngestion();

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await delay(behavior.asyncWaitMs + 10);
        task.resumeIngestion();

        task.pauseIngestion();
        webSocketAdapter.send(createIndexSignalBuffer());
        await delay(behavior.asyncWaitMs + 10);
        task.resumeIngestion();

        expect(context.videosToReceive.equal(new DefaultVideoStreamIdSet(ids))).to.be.true;
        done();
      });

      task.run();
    });

    it('Truncates the videos to receive to a specified limit', done => {
      const ids: number[] = [1, 2, 3];
      const truncatedRecieveSetIds: number[] = [1];

      class TestVideoDownlinkBandwidthPolicy extends NoVideoDownlinkBandwidthPolicy {
        wantsResubscribe(): boolean {
          return true;
        }
        chooseSubscriptions(): DefaultVideoStreamIdSet {
          return new DefaultVideoStreamIdSet(ids);
        }
      }
      context.videoDownlinkBandwidthPolicy = new TestVideoDownlinkBandwidthPolicy();
      context.videoSubscriptionLimit = 1;

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await delay(behavior.asyncWaitMs + 10);
        expect(context.videosToReceive.equal(new DefaultVideoStreamIdSet(truncatedRecieveSetIds)))
          .to.be.true;
        done();
      });

      task.run();
    });

    it('attemps to resubscribe if video uplink bandwidth policy wants to resubscribe', done => {
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
        await delay(behavior.asyncWaitMs + 10);
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
      class TestAudioVideoObserver implements AudioVideoObserver {
        videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void {
          const videoAvailability = new MeetingSessionVideoAvailability();
          videoAvailability.remoteVideoAvailable = false;
          videoAvailability.canStartLocalVideo = true;
          expect(availability.equal(videoAvailability)).to.be.true;
          done();
        }
      }
      context.audioVideoController.addObserver(new TestAudioVideoObserver());

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await delay(behavior.asyncWaitMs + 10);
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
      context.videoSubscriptionLimit = _videoSubscriptionLimit;

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer(true));
        await delay(behavior.asyncWaitMs + 10);
      });

      task.run();
    });

    describe('no update', () => {
      it('does not update video availability if videosToReceive does not exist in the context', () => {
        context.videosToReceive = null;
      });

      it('does not update video availability if new video availability equals last known video availability', () => {
        const videoAvailability = new MeetingSessionVideoAvailability();
        videoAvailability.remoteVideoAvailable = false;
        videoAvailability.canStartLocalVideo = true;
        context.lastKnownVideoAvailability = videoAvailability;
      });

      // it('does not update video availability if session does not exist', () => {
      // });

      afterEach(done => {
        class TestAudioVideoObserver implements AudioVideoObserver {
          videoAvailabilityDidChange(_availability: MeetingSessionVideoAvailability): void {
            assert.fail();
          }
        }
        context.audioVideoController.addObserver(new TestAudioVideoObserver());

        new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
          webSocketAdapter.send(createIndexSignalBuffer());
          await delay(behavior.asyncWaitMs + 10);
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
        await delay(behavior.asyncWaitMs + 10);
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
        await delay(behavior.asyncWaitMs + 10);
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
        await delay(behavior.asyncWaitMs + 10);
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
        await delay(behavior.asyncWaitMs + 10);
        expect(tile.state().poorConnection).to.be.true;
        done();
      });

      task.run();
    });
  });

  describe('cancel', () => {
    it('can cancel using the context', done => {
      const videoStreamIndexSpy: sinon.SinonSpy = sinon.spy(
        context.videoStreamIndex,
        'integrateIndexFrame'
      );

      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(createIndexSignalBuffer());
        await delay(behavior.asyncWaitMs + 10);
        expect(videoStreamIndexSpy.called).to.be.false;
        done();
      });

      task.run().then(() => {
        expect(context.removableObservers.length).to.equal(1);
        context.removableObservers[0].removeObserver();
      });
    });
  });

  describe('process input index frame', () => {
    it('filter self content share video index', done => {
      context.audioVideoController.configuration.credentials.attendeeId = 'attendee-1';
      const streamDescriptor1 = createStreamDescriptor('attendee-1#content', 1, 1, 48, 24000);
      const streamDescriptor2 = createStreamDescriptor('attendee-2#content', 2, 2, 48, 24000);
      const indexSignalBuffer = createIndexSignalBuffer(false, null, [
        streamDescriptor1,
        streamDescriptor2,
      ]);
      const videoStreamIndexSpy = sinon.spy(context.videoStreamIndex, 'integrateIndexFrame');
      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(indexSignalBuffer);
        await delay(behavior.asyncWaitMs + 10);
        expect(videoStreamIndexSpy.calledOnce).to.be.true;
        const inputIndexFrame = videoStreamIndexSpy.getCall(0).args[0];
        expect(inputIndexFrame.sources.length).to.be.eq(1);
        expect(inputIndexFrame.sources[0].attendeeId).to.be.eq('attendee-2#content');
        context.audioVideoController.configuration.credentials.attendeeId = '';
        done();
      });

      task.run();
    });
  });

  describe('observer on remote sending videos change', () => {
    const compare = (videoSourceA: VideoSource, videoSourceB: VideoSource): number =>
      videoSourceA.attendee.attendeeId.localeCompare(videoSourceB.attendee.attendeeId);

    describe('NScaleVideoUplinkBandwidthPolicy (uplink) and AllHighestVideoBandwidthPolicy (downlink)', () => {
      it('deep compare received video sources', done => {
        const selfAttendeeId = 'attendee-1';
        context.audioVideoController.configuration.credentials.attendeeId = selfAttendeeId;
        context.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy(selfAttendeeId);
        context.videoDownlinkBandwidthPolicy = new AllHighestVideoBandwidthPolicy(selfAttendeeId);
        let calledTimes = 0;
        class TestObserver implements AudioVideoObserver {
          remoteVideoSourcesDidChange(videoSources: VideoSource[]): void {
            calledTimes += 1;
            expect([...videoSources].sort(compare)).to.deep.equal(
              [
                { attendee: { attendeeId: 'attendee-2', externalUserId: '' } },
                { attendee: { attendeeId: 'attendee-3', externalUserId: '' } },
              ].sort(compare)
            );
          }
        }
        context.audioVideoController.addObserver(new TestObserver());
        const streamDescriptor1 = createStreamDescriptor('attendee-1', 1, 1, 48, 24000);
        const streamDescriptor2 = createStreamDescriptor('attendee-2', 2, 2, 48, 24000);
        const streamDescriptor3 = createStreamDescriptor('attendee-3', 3, 3, 48, 24000);
        const indexSignalBuffer = createIndexSignalBuffer(false, null, [
          streamDescriptor1,
          streamDescriptor2,
          streamDescriptor3,
        ]);
        new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
          webSocketAdapter.send(indexSignalBuffer);
          await delay(behavior.asyncWaitMs + 10);
          expect(calledTimes).to.equal(1);
          done();
        });
        task.run();
      });

      it('remoteVideoSourcesDidChange call count check', done => {
        const selfAttendeeId = 'attendee-1';
        context.audioVideoController.configuration.credentials.attendeeId = selfAttendeeId;
        context.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy(selfAttendeeId);
        context.videoDownlinkBandwidthPolicy = new AllHighestVideoBandwidthPolicy(selfAttendeeId);
        let calledTimes = 0;
        class TestObserver implements AudioVideoObserver {
          remoteVideoSourcesDidChange(_videoSources: VideoSource[]): void {
            calledTimes += 1;
          }
        }
        context.audioVideoController.addObserver(new TestObserver());
        const streamDescriptor1 = createStreamDescriptor('attendee-1', 1, 1, 48, 24000);
        const streamDescriptor2 = createStreamDescriptor('attendee-2', 2, 2, 48, 24000);
        const streamDescriptor3 = createStreamDescriptor('attendee-3', 3, 3, 48, 24000);
        const streamDescriptor4 = createStreamDescriptor('attendee-4', 4, 4, 48, 24000);

        const indexSignalBuffer1 = createIndexSignalBuffer(false, null, [
          streamDescriptor1,
          streamDescriptor2,
          streamDescriptor3,
        ]);
        const indexSignalBuffer2 = createIndexSignalBuffer(false, null, [
          streamDescriptor1,
          streamDescriptor2,
          streamDescriptor4,
        ]);
        const indexSignalBuffer3 = createIndexSignalBuffer(false, null, [
          streamDescriptor1,
          streamDescriptor2,
          streamDescriptor3,
          streamDescriptor4,
        ]);
        new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
          webSocketAdapter.send(indexSignalBuffer1);
          await delay(behavior.asyncWaitMs + 10);
          webSocketAdapter.send(indexSignalBuffer2);
          await delay(behavior.asyncWaitMs + 10);
          webSocketAdapter.send(indexSignalBuffer2);
          await delay(behavior.asyncWaitMs + 10);
          webSocketAdapter.send(indexSignalBuffer3);
          await delay(behavior.asyncWaitMs + 10);
          expect(calledTimes).to.equal(3);
          done();
        });
        task.run();
      });
    });

    describe('SimulcastUplinkPolicy (uplink) and VideoAdaptiveProbePolicy (downlink)', () => {
      it('deep compare received video sources', async () => {
        const selfAttendeeId = 'attendee-1';
        context.audioVideoController.configuration.credentials.attendeeId = selfAttendeeId;
        context.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
          selfAttendeeId,
          logger
        );
        context.videoDownlinkBandwidthPolicy = new VideoAdaptiveProbePolicy(logger);

        const { done, wait } = shortcut<VideoSource[]>(behavior.asyncWaitMs + 100);

        class TestObserver implements AudioVideoObserver {
          remoteVideoSourcesDidChange(videoSources: VideoSource[]): void {
            done(videoSources);
          }
        }

        context.audioVideoController.addObserver(new TestObserver());
        const streamDescriptor1 = createStreamDescriptor('attendee-1', 1, 1, 48, 24000);
        const streamDescriptor2 = createStreamDescriptor('attendee-2', 2, 2, 48, 24000);
        const streamDescriptor3 = createStreamDescriptor('attendee-3', 3, 3, 48, 24000);
        const indexSignalBuffer = createIndexSignalBuffer(false, null, [
          streamDescriptor1,
          streamDescriptor2,
          streamDescriptor3,
        ]);

        webSocketAdapter.send(indexSignalBuffer);
        task.run();
        const sources = await wait;

        expect([...sources].sort(compare)).to.deep.equal(
          [
            { attendee: { attendeeId: 'attendee-2', externalUserId: '' } },
            { attendee: { attendeeId: 'attendee-3', externalUserId: '' } },
          ].sort(compare)
        );
      });

      it('remoteVideoSourcesDidChange call count check', done => {
        const selfAttendeeId = 'attendee-1';
        context.audioVideoController.configuration.credentials.attendeeId = selfAttendeeId;
        context.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
          selfAttendeeId,
          logger
        );
        context.videoDownlinkBandwidthPolicy = new VideoAdaptiveProbePolicy(logger);
        let calledTimes = 0;
        class TestObserver implements AudioVideoObserver {
          remoteVideoSourcesDidChange(_videoSources: VideoSource[]): void {
            calledTimes += 1;
          }
        }
        context.audioVideoController.addObserver(new TestObserver());
        const streamDescriptor1 = createStreamDescriptor('attendee-1', 1, 1, 48, 24000);
        const streamDescriptor2 = createStreamDescriptor('attendee-2', 2, 2, 48, 24000);
        const streamDescriptor3 = createStreamDescriptor('attendee-3', 3, 3, 48, 24000);
        const streamDescriptor4 = createStreamDescriptor('attendee-4', 4, 4, 48, 24000);

        const indexSignalBuffer1 = createIndexSignalBuffer(false, null, [
          streamDescriptor1,
          streamDescriptor2,
          streamDescriptor3,
        ]);
        const indexSignalBuffer2 = createIndexSignalBuffer(false, null, [
          streamDescriptor1,
          streamDescriptor2,
          streamDescriptor4,
        ]);
        const indexSignalBuffer3 = createIndexSignalBuffer(false, null, [
          streamDescriptor1,
          streamDescriptor2,
          streamDescriptor3,
          streamDescriptor4,
        ]);
        new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
          webSocketAdapter.send(indexSignalBuffer1);
          await delay(behavior.asyncWaitMs + 10);
          webSocketAdapter.send(indexSignalBuffer2);
          await delay(behavior.asyncWaitMs + 10);
          webSocketAdapter.send(indexSignalBuffer2);
          await delay(behavior.asyncWaitMs + 10);
          webSocketAdapter.send(indexSignalBuffer3);
          await delay(behavior.asyncWaitMs + 10);
          expect(calledTimes).to.equal(3);
          done();
        });
        task.run();
      });
    });
  });

  describe('handling supportedReceiveCodecIntersection', () => {
    it('calculates intersection', done => {
      context.videoSendCodecPreferences = [
        VideoCodecCapability.vp8(),
        VideoCodecCapability.h264(),
        VideoCodecCapability.vp9Profile0(),
      ];
      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(
          createIndexSignalBuffer(false, null, null, [
            SdkVideoCodecCapability.VP8,
            SdkVideoCodecCapability.VP9_PROFILE_0,
            SdkVideoCodecCapability.AV1_MAIN_PROFILE,
          ])
        );
        await delay(behavior.asyncWaitMs + 10);
        expect(context.meetingSupportedVideoSendCodecPreferences).to.be.deep.equal([
          VideoCodecCapability.vp8(),
          VideoCodecCapability.vp9Profile0(),
        ]);
        done();
      });

      task.run();
    });

    it('calculates intersection with degraded codecs', done => {
      context.videoSendCodecPreferences = [
        VideoCodecCapability.vp8(),
        VideoCodecCapability.h264(),
        VideoCodecCapability.vp9Profile0(),
      ];
      context.degradedVideoSendCodecs = [VideoCodecCapability.vp9Profile0()];
      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(
          createIndexSignalBuffer(false, null, null, [
            SdkVideoCodecCapability.VP8,
            SdkVideoCodecCapability.VP9_PROFILE_0,
            SdkVideoCodecCapability.AV1_MAIN_PROFILE,
          ])
        );
        await delay(behavior.asyncWaitMs + 10);
        expect(context.meetingSupportedVideoSendCodecPreferences).to.be.deep.equal([
          VideoCodecCapability.vp8(),
        ]);
        done();
      });

      task.run();
    });

    it('does not set intersection state if there is no overlap', done => {
      context.videoSendCodecPreferences = [VideoCodecCapability.vp8()];
      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(
          createIndexSignalBuffer(false, null, null, [
            SdkVideoCodecCapability.H264_CONSTRAINED_BASELINE_PROFILE,
            3239 as SdkVideoCodecCapability, // Add garbage signaling
          ])
        );
        await delay(behavior.asyncWaitMs + 10);
        expect(context.meetingSupportedVideoSendCodecPreferences).to.equal(undefined);
        done();
      });

      task.run();
    });

    it('does not set intersection state if there is no send codec preferences', done => {
      context.videoSendCodecPreferences = undefined;
      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(
          createIndexSignalBuffer(false, null, null, [
            SdkVideoCodecCapability.H264_CONSTRAINED_BASELINE_PROFILE,
          ])
        );
        await delay(behavior.asyncWaitMs + 10);
        expect(context.meetingSupportedVideoSendCodecPreferences).to.equal(undefined);
        done();
      });

      task.run();
    });

    it('requests update if currently sending codec changed', done => {
      const audioVideoControllerSpy: sinon.SinonSpy = sinon.spy(
        context.audioVideoController,
        'update'
      );
      context.videoSendCodecPreferences = [VideoCodecCapability.h264(), VideoCodecCapability.vp8()];
      context.currentVideoSendCodec = VideoCodecCapability.h264();
      context.prioritizedSendVideoCodecCapabilities = [
        VideoCodecCapability.h264(),
        VideoCodecCapability.vp8(),
      ];
      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(
          createIndexSignalBuffer(false, null, null, [SdkVideoCodecCapability.VP8])
        );
        await delay(behavior.asyncWaitMs + 10);
        expect(context.meetingSupportedVideoSendCodecPreferences).to.be.deep.equal([
          VideoCodecCapability.vp8(),
        ]);
        expect(audioVideoControllerSpy.calledWith({ needsRenegotiation: true })).to.be.true;
        done();
      });

      task.run();
    });

    it('does not request update if we do not support the higher preference codec', done => {
      const audioVideoControllerSpy: sinon.SinonSpy = sinon.spy(
        context.audioVideoController,
        'update'
      );
      context.videoSendCodecPreferences = [
        VideoCodecCapability.vp9(),
        VideoCodecCapability.vp8(),
        VideoCodecCapability.h264(),
      ];
      context.currentVideoSendCodec = VideoCodecCapability.vp8();
      context.prioritizedSendVideoCodecCapabilities = [
        VideoCodecCapability.vp8(),
        VideoCodecCapability.h264(),
      ];
      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(
          createIndexSignalBuffer(false, null, null, [
            SdkVideoCodecCapability.VP9_PROFILE_0,
            SdkVideoCodecCapability.VP8,
          ])
        );
        await delay(behavior.asyncWaitMs + 10);
        expect(context.meetingSupportedVideoSendCodecPreferences).to.be.deep.equal([
          VideoCodecCapability.vp9(),
          VideoCodecCapability.vp8(),
        ]);
        expect(audioVideoControllerSpy.calledWith({ needsRenegotiation: true })).to.be.false;
        done();
      });

      task.run();
    });

    it('calls setMeetingSupportedVideoSendCodecs if implemented', done => {
      context.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy('attendee');
      context.videoSendCodecPreferences = [
        VideoCodecCapability.vp8(),
        VideoCodecCapability.h264(),
        VideoCodecCapability.vp9Profile0(),
      ];
      new TimeoutScheduler(behavior.asyncWaitMs).start(async () => {
        webSocketAdapter.send(
          createIndexSignalBuffer(false, null, null, [
            SdkVideoCodecCapability.VP8,
            SdkVideoCodecCapability.VP9_PROFILE_0,
            SdkVideoCodecCapability.AV1_MAIN_PROFILE,
          ])
        );
        await delay(behavior.asyncWaitMs + 10);
        expect(context.meetingSupportedVideoSendCodecPreferences).to.be.deep.equal([
          VideoCodecCapability.vp8(),
          VideoCodecCapability.vp9Profile0(),
        ]);
        done();
      });

      task.run();
    });
  });
});
