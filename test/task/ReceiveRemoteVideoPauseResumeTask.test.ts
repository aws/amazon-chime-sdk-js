// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import {
  DefaultDevicePixelRatioMonitor,
  DefaultVideoTile,
  DevicePixelRatioWindowSource,
} from '../../src';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionTURNCredentials from '../../src/meetingsession/MeetingSessionTURNCredentials';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClientEvent from '../../src/signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../../src/signalingclient/SignalingClientEventType';
import {
  SdkIndexFrame,
  SdkPauseResumeFrame,
  SdkSignalFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
} from '../../src/signalingprotocol/SignalingProtocol';
import ReceiveRemoteVideoPauseResume from '../../src/task/ReceiveRemoteVideoPauseResumeTask';
import AllHighestVideoBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/AllHighestVideoBandwidthPolicy';
import VideoAdaptiveProbePolicy from '../../src/videodownlinkbandwidthpolicy/VideoAdaptiveProbePolicy';
import VideoDownlinkObserver from '../../src/videodownlinkbandwidthpolicy/VideoDownlinkObserver';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import VideoTile from '../../src/videotile/VideoTile';
import DefaultVideoTileController from '../../src/videotilecontroller/DefaultVideoTileController';
import DefaultVideoTileFactory from '../../src/videotilefactory/DefaultVideoTileFactory';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('ReceiveRemoteVideoPauseResumeTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let context: AudioVideoControllerState;
  let task: ReceiveRemoteVideoPauseResume;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let signalingClient: DefaultSignalingClient;
  let testCredentials: MeetingSessionTURNCredentials;
  const logger: NoOpDebugLogger = new NoOpDebugLogger();

  before(() => {
    testCredentials = new MeetingSessionTURNCredentials();
    testCredentials.username = 'fakeUsername';
    testCredentials.password = 'fakeTURNCredentials';
    testCredentials.ttl = Infinity;
    testCredentials.uris = ['fakeUDPURI', 'fakeTCPURI'];
  });

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    webSocketAdapter = new DefaultWebSocketAdapter(context.logger);
    signalingClient = new DefaultSignalingClient(webSocketAdapter, context.logger);
    context.signalingClient = signalingClient;
    context.videoTileController = new DefaultVideoTileController(
      new DefaultVideoTileFactory(),
      context.audioVideoController,
      context.logger
    );
    context.meetingSessionConfiguration = new MeetingSessionConfiguration();
    context.meetingSessionConfiguration.urls = new MeetingSessionURLs();
    context.meetingSessionConfiguration.urls.turnControlURL = 'http://example.com';
    context.meetingSessionConfiguration.meetingId = 'testId';
    context.meetingSessionConfiguration.credentials = new MeetingSessionCredentials();
    context.meetingSessionConfiguration.credentials.joinToken = 'testToken';
    task = new ReceiveRemoteVideoPauseResume(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('run', () => {
    it('can register as observer to signaling client', async () => {
      await task.run();
      expect(context.removableObservers.length).to.deep.equal(1);
    });

    it('can remove from signaling client observer', async () => {
      await task.run();
      task.removeObserver();
      expect(context.removableObservers.length).to.deep.equal(1);
    });
  });

  describe('handleSignalingClientEvent', () => {
    function prepareIndex(streamIds: number[]): DefaultVideoStreamIndex {
      const index: DefaultVideoStreamIndex = new DefaultVideoStreamIndex(logger);
      const sources: SdkStreamDescriptor[] = [];
      for (const id of streamIds) {
        sources.push(
          new SdkStreamDescriptor({
            streamId: id,
            groupId: id,
            maxBitrateKbps: 100,
            mediaType: SdkStreamMediaType.VIDEO,
            attendeeId: `attendee-${id}`,
          })
        );
      }
      index.integrateIndexFrame(
        new SdkIndexFrame({
          atCapacity: false,
          sources: sources,
        })
      );
      return index;
    }

    it('does not throw error when handling unexpected frame', async () => {
      context.videoDownlinkBandwidthPolicy = new AllHighestVideoBandwidthPolicy('test');
      const frame = SdkPauseResumeFrame.create();
      const signalFrame = SdkSignalFrame.create();
      signalFrame.type = SdkSignalFrame.Type.PAUSE;
      signalFrame.pause = frame;
      let event = new SignalingClientEvent(
        signalingClient,
        SignalingClientEventType.WebSocketClosed,
        signalFrame
      );
      await task.run();
      task.handleSignalingClientEvent(event);
      expect(context.removableObservers.length).to.deep.equal(1);

      signalFrame.type = SdkSignalFrame.Type.INDEX;
      signalFrame.pause = frame;
      event = new SignalingClientEvent(
        signalingClient,
        SignalingClientEventType.ReceivedSignalFrame,
        signalFrame
      );
      task.handleSignalingClientEvent(event);
      expect(context.removableObservers.length).to.deep.equal(1);
    });

    it('cannot handle Pause frame when usiong AllHighestVideoBandwidthPolicy', async () => {
      context.videoDownlinkBandwidthPolicy = new AllHighestVideoBandwidthPolicy('test');
      const frame = SdkPauseResumeFrame.create();
      const signalFrame = SdkSignalFrame.create();
      signalFrame.type = SdkSignalFrame.Type.PAUSE;
      signalFrame.pause = frame;
      const event = new SignalingClientEvent(
        signalingClient,
        SignalingClientEventType.ReceivedSignalFrame,
        signalFrame
      );
      await task.run();
      task.handleSignalingClientEvent(event);

      //@ts-ignore
      expect(task.serverPausedVideoTileIds.has(7)).to.be.false;
    });

    it('skip handling downlink observer if video tile not found', async () => {
      const policy = new VideoAdaptiveProbePolicy(new NoOpDebugLogger());
      class MockObserver implements VideoDownlinkObserver {
        tileWillBePausedByDownlinkPolicy = sinon.stub();
        tileWillBeUnpausedByDownlinkPolicy = sinon.stub();
      }
      const observer = new MockObserver();
      policy.addObserver(observer);
      context.videoDownlinkBandwidthPolicy = policy;
      const frame = SdkPauseResumeFrame.create();
      frame.groupIds = [7, 8];
      frame.streamIds = new DefaultVideoStreamIdSet([7, 8]).array();
      context.videoStreamIndex = prepareIndex([7, 8]);

      const pauseFrame = SdkSignalFrame.create();
      pauseFrame.type = SdkSignalFrame.Type.PAUSE;
      pauseFrame.pause = frame;
      const event = new SignalingClientEvent(
        signalingClient,
        SignalingClientEventType.ReceivedSignalFrame,
        pauseFrame
      );
      await task.run();
      task.handleSignalingClientEvent(event);

      //@ts-ignore
      expect(task.serverPausedVideoTileIds.has(7)).to.be.false;
    });

    it('can handle Pause/Resume frame when using VideoAdaptiveProbePolicy  ', async () => {
      const tile7 = new DefaultVideoTile(
        7,
        false,
        context.videoTileController,
        new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
      );

      const tile8 = new DefaultVideoTile(
        8,
        false,
        context.videoTileController,
        new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
      );
      tile8.pause();

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          if (_attendeeId === 'attendee-7') {
            return tile7;
          } else if (_attendeeId === 'attendee-8') {
            return tile8;
          }
        }
      }
      context.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        context.audioVideoController,
        null
      );

      const policy = new VideoAdaptiveProbePolicy(new NoOpDebugLogger());
      class MockObserver implements VideoDownlinkObserver {
        tileWillBePausedByDownlinkPolicy = sinon.stub();
        tileWillBeUnpausedByDownlinkPolicy = sinon.stub();
      }
      const observer = new MockObserver();
      policy.addObserver(observer);
      context.videoDownlinkBandwidthPolicy = policy;
      context.videoStreamIndex = prepareIndex([7, 8]);

      // first send pause frame
      const frame = SdkPauseResumeFrame.create();
      frame.groupIds = [7, 8];
      frame.streamIds = new DefaultVideoStreamIdSet([7, 8]).array();
      const pauseFrame = SdkSignalFrame.create();
      pauseFrame.type = SdkSignalFrame.Type.PAUSE;
      pauseFrame.pause = frame;
      const event = new SignalingClientEvent(
        signalingClient,
        SignalingClientEventType.ReceivedSignalFrame,
        pauseFrame
      );
      await task.run();
      task.handleSignalingClientEvent(event);

      //@ts-ignore
      expect(task.serverPausedVideoTileIds.has(7)).to.be.true;
      //@ts-ignore
      expect(task.serverPausedVideoTileIds.has(8)).to.be.false;
      //@ts-ignore
      expect(tile7.state().paused).to.be.true;
      //@ts-ignore
      expect(tile8.state().paused).to.be.true;

      // then send resume frame
      tile8.unpause();
      const resumeFrame = SdkSignalFrame.create();
      resumeFrame.type = SdkSignalFrame.Type.RESUME;
      const frame2 = SdkPauseResumeFrame.create();
      frame2.groupIds = [7, 8];
      frame2.streamIds = new DefaultVideoStreamIdSet([7, 8]).array();
      resumeFrame.pause = frame2;
      const event2 = new SignalingClientEvent(
        signalingClient,
        SignalingClientEventType.ReceivedSignalFrame,
        resumeFrame
      );
      task.handleSignalingClientEvent(event2);

      //@ts-ignore
      expect(task.serverPausedVideoTileIds.has(7)).to.be.false;
      //@ts-ignore
      expect(tile7.state().paused).to.be.false;
      //@ts-ignore
      expect(tile8.state().paused).to.be.false;
    });

    it('Will create new video tile for paused video if one does not already exist', async () => {
      context.videoTileController = new DefaultVideoTileController(
        new DefaultVideoTileFactory(),
        context.audioVideoController,
        null
      );

      const policy = new VideoAdaptiveProbePolicy(new NoOpDebugLogger());
      class MockObserver implements VideoDownlinkObserver {
        tileWillBePausedByDownlinkPolicy = sinon.stub();
        tileWillBeUnpausedByDownlinkPolicy = sinon.stub();
      }
      const observer = new MockObserver();
      policy.addObserver(observer);
      context.videoDownlinkBandwidthPolicy = policy;

      // first send pause frame
      const frame = SdkPauseResumeFrame.create();
      frame.groupIds = [7, 8];
      frame.streamIds = new DefaultVideoStreamIdSet([7, 8]).array();
      const pauseFrame = SdkSignalFrame.create();
      pauseFrame.type = SdkSignalFrame.Type.PAUSE;
      pauseFrame.pause = frame;
      const event = new SignalingClientEvent(
        signalingClient,
        SignalingClientEventType.ReceivedSignalFrame,
        pauseFrame
      );
      await task.run();

      // Additional test to no-op pauses that we don't expect
      context.videoStreamIndex = prepareIndex([]);
      task.updateSubscribedGroupdIds(new Set([7]));
      task.handleSignalingClientEvent(event);

      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-7')).to.be.undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-8')).to.be.undefined;

      context.videoStreamIndex = prepareIndex([7, 8]);
      task.updateSubscribedGroupdIds(new Set([7, 8]));
      task.handleSignalingClientEvent(event);

      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-7')).to.not.be
        .undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-7').state().paused).to
        .be.true;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-8')).to.not.be
        .undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-8').state().paused).to
        .be.true;

      // Add a stream without messing with previous
      context.videoStreamIndex = prepareIndex([7, 8, 9]);
      task.updateSubscribedGroupdIds(new Set([7, 8, 9]));
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-7')).to.not.be
        .undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-7').state().paused).to
        .be.true;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-8')).to.not.be
        .undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-8').state().paused).to
        .be.true;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-9')).to.not.be
        .undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-9').state().paused).to
        .be.false;

      // then send resume frame
      const resumeFrame = SdkSignalFrame.create();
      resumeFrame.type = SdkSignalFrame.Type.RESUME;
      const frame2 = SdkPauseResumeFrame.create();
      frame2.groupIds = [7, 8];
      resumeFrame.pause = frame2;
      const event2 = new SignalingClientEvent(
        signalingClient,
        SignalingClientEventType.ReceivedSignalFrame,
        resumeFrame
      );
      task.handleSignalingClientEvent(event2);

      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-7')).to.not.be
        .undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-7').state().paused).to
        .be.false;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-8')).to.not.be
        .undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-8').state().paused).to
        .be.false;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-9')).to.not.be
        .undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-9').state().paused).to
        .be.false;
    });

    it('Will not resume user paused tiles', async () => {
      context.videoTileController = new DefaultVideoTileController(
        new DefaultVideoTileFactory(),
        context.audioVideoController,
        null
      );

      const policy = new VideoAdaptiveProbePolicy(new NoOpDebugLogger());
      class MockObserver implements VideoDownlinkObserver {
        tileWillBePausedByDownlinkPolicy = sinon.stub();
        tileWillBeUnpausedByDownlinkPolicy = sinon.stub();
      }
      const observer = new MockObserver();
      policy.addObserver(observer);
      context.videoDownlinkBandwidthPolicy = policy;

      const pausedResumeFrame = SdkPauseResumeFrame.create();
      pausedResumeFrame.groupIds = [7, 8];
      pausedResumeFrame.streamIds = new DefaultVideoStreamIdSet([7, 8]).array();
      const pauseFrame = SdkSignalFrame.create();
      pauseFrame.type = SdkSignalFrame.Type.PAUSE;
      pauseFrame.pause = pausedResumeFrame;
      const pauseEvent = new SignalingClientEvent(
        signalingClient,
        SignalingClientEventType.ReceivedSignalFrame,
        pauseFrame
      );
      await task.run();

      const resumeFrame = SdkSignalFrame.create();
      resumeFrame.type = SdkSignalFrame.Type.RESUME;
      const frame2 = SdkPauseResumeFrame.create();
      frame2.groupIds = [7, 8];
      frame2.streamIds = new DefaultVideoStreamIdSet([7, 8]).array();
      resumeFrame.pause = frame2;
      const resumeEvent = new SignalingClientEvent(
        signalingClient,
        SignalingClientEventType.ReceivedSignalFrame,
        resumeFrame
      );

      context.videoStreamIndex = prepareIndex([7, 8]);
      task.updateSubscribedGroupdIds(new Set([7, 8]));
      task.handleSignalingClientEvent(pauseEvent);

      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-7')).to.not.be
        .undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-7').state().paused).to
        .be.true;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-8')).to.not.be
        .undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-8').state().paused).to
        .be.true;

      // Additional test to allow reseting paused groups
      task.updateSubscribedGroupdIds(new Set([]));

      // Manually pause
      context.videoTileController.getVideoTileForAttendeeId('attendee-7').stateRef().paused = true;

      // then send resume frame
      task.handleSignalingClientEvent(resumeEvent);

      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-7')).to.not.be
        .undefined;
      expect(context.videoTileController.getVideoTileForAttendeeId('attendee-7').state().paused).to
        .be.true;
    });
  });
});
