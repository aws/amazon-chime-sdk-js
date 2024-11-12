// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import VideoQualitySettings from '../../src/devicecontroller/VideoQualitySettings';
import NoOpLogger from '../../src/logger/NoOpLogger';
import NoOpMediaStreamBroker from '../../src/mediastreambroker/NoOpMediaStreamBroker';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import ReceiveVideoInputTask from '../../src/task/ReceiveVideoInputTask';
import DefaultVideoCaptureAndEncodeParameters from '../../src/videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import SimulcastVideoStreamIndex from '../../src/videostreamindex/SimulcastVideoStreamIndex';
import DefaultSimulcastUplinkPolicy from '../../src/videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicy';
import NoVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NoVideoUplinkBandwidthPolicy';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder, { StoppableMediaStreamTrack } from '../dommock/DOMMockBuilder';

interface MockMediaStreamBrokerConfigs {
  acquireVideoInputDeviceSucceeds: boolean;
  useMockedVideoStream: boolean;
}

class MockMediaStreamBroker extends NoOpMediaStreamBroker {
  constructor(private configs: MockMediaStreamBrokerConfigs) {
    super();
  }

  acquireVideoInputStream(): Promise<MediaStream> {
    if (this.configs.acquireVideoInputDeviceSucceeds) {
      if (this.configs.useMockedVideoStream) {
        const mediaStream = new MediaStream();
        const track = new MediaStreamTrack() as StoppableMediaStreamTrack;
        // @ts-ignore
        track.kind = 'video';
        mediaStream.addTrack(track);
        return Promise.resolve(mediaStream);
      }
      const constraints: MediaStreamConstraints = { video: true, audio: false };
      return navigator.mediaDevices.getUserMedia(constraints);
    } else {
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }
  }
}

describe('ReceiveVideoInputTask', () => {
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let context: AudioVideoControllerState;
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;

  function makeSessionConfiguration(): MeetingSessionConfiguration {
    const configuration = new MeetingSessionConfiguration();
    configuration.meetingId = 'foo-meeting';
    configuration.urls = new MeetingSessionURLs();
    configuration.urls.audioHostURL = 'https://audiohost.test.example.com';
    configuration.urls.turnControlURL = 'https://turncontrol.test.example.com';
    configuration.urls.signalingURL = 'https://signaling.test.example.com';
    configuration.credentials = new MeetingSessionCredentials();
    configuration.credentials.attendeeId = 'foo-attendee';
    configuration.credentials.externalUserId = 'external-user-id';
    configuration.credentials.joinToken = 'foo-join-token';
    return configuration;
  }

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    context.videoTileController = context.audioVideoController.videoTileController;
    context.meetingSessionConfiguration = makeSessionConfiguration();
    context.videoCaptureAndEncodeParameter = new DefaultVideoCaptureAndEncodeParameters(
      1,
      1,
      1,
      1,
      false
    );
    context.videoUplinkBandwidthPolicy = new NoVideoUplinkBandwidthPolicy();
    context.videoStreamIndex = new SimulcastVideoStreamIndex(new NoOpLogger());
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('run', () => {
    it('will acquire the video input', async () => {
      context.videoTileController.startLocalVideoTile();
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireVideoInputDeviceSucceeds: true,
        useMockedVideoStream: false,
      });
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      assert.exists(context.activeVideoInput);
    });

    it('will acquire the video input and query constraint', async () => {
      context.videoStreamIndex = new SimulcastVideoStreamIndex(new NoOpLogger());
      context.enableSimulcast = true;
      context.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
        'attendee',
        new NoOpLogger()
      );
      context.videoTileController.startLocalVideoTile();
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireVideoInputDeviceSucceeds: true,
        useMockedVideoStream: false,
      });
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      assert.exists(context.activeVideoInput);
    });

    it('will acquire the video input and query constraint with applyConstraintSucceeds set to false', async () => {
      domMockBehavior.applyConstraintSucceeds = false;
      context.videoStreamIndex = new SimulcastVideoStreamIndex(new NoOpLogger());
      context.enableSimulcast = true;
      context.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
        'attendee',
        new NoOpLogger()
      );
      context.videoTileController.startLocalVideoTile();
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireVideoInputDeviceSucceeds: true,
        useMockedVideoStream: false,
      });
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      assert.exists(context.activeVideoInput);
    });

    it('will stop if an active video input is available', async () => {
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireVideoInputDeviceSucceeds: true,
        useMockedVideoStream: false,
      });
      context.activeVideoInput = new MediaStream();
      assert.exists(context.activeVideoInput);
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      expect(context.activeVideoInput).to.be.undefined;
    });

    it('will not acquire video input if video tile is not started from controller', async () => {
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      expect(context.activeVideoInput).to.be.undefined;
    });

    it('will fail gracefully if a device permission is not granted', async () => {
      context.videoTileController.startLocalVideoTile();
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireVideoInputDeviceSucceeds: false,
        useMockedVideoStream: false,
      });
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      expect(context.activeVideoInput).to.be.undefined;
    });

    it('will fail gracefully if a video input is not available from device', async () => {
      context.videoTileController.startLocalVideoTile();
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireVideoInputDeviceSucceeds: false,
        useMockedVideoStream: false,
      });
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      expect(context.activeVideoInput).to.be.undefined;
    });

    it('will fail gracefully if a video input does not contain media stream track', async () => {
      context.videoTileController.startLocalVideoTile();
      class MockEmptyMediaStreamBroker extends NoOpMediaStreamBroker {
        acquireVideoInputStream(): Promise<MediaStream> {
          return Promise.resolve(new MediaStream());
        }
      }
      context.mediaStreamBroker = new MockEmptyMediaStreamBroker();
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      expect(context.activeVideoInput.getVideoTracks()).to.be.empty;
    });

    it('will not apply constraint if content does not exceed limit', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 2560,
        height: 1440,
        deviceId: '',
      };
      context.videoStreamIndex = new SimulcastVideoStreamIndex(new NoOpLogger());
      context.meetingSessionConfiguration.credentials.attendeeId = 'attendee#content';
      context.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
        'attendee',
        new NoOpLogger()
      );
      context.videoTileController.startLocalVideoTile();
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireVideoInputDeviceSucceeds: true,
        useMockedVideoStream: true,
      });
      context.meetingSessionConfiguration.meetingFeatures.contentMaxResolution =
        VideoQualitySettings.VideoResolutionUHD;
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      assert.exists(context.activeVideoInput);
    });

    it('will apply constraint if exceeds limit', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 2560,
        height: 1440,
        deviceId: '',
      };
      context.videoStreamIndex = new SimulcastVideoStreamIndex(new NoOpLogger());
      context.meetingSessionConfiguration.credentials.attendeeId = 'attendee#content';
      context.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
        'attendee',
        new NoOpLogger()
      );
      context.videoTileController.startLocalVideoTile();
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireVideoInputDeviceSucceeds: true,
        useMockedVideoStream: true,
      });
      context.meetingSessionConfiguration.meetingFeatures.contentMaxResolution =
        VideoQualitySettings.VideoResolutionFHD;
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      assert.exists(context.activeVideoInput);
    });

    it('will throw error if apply content constraint failed', async () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 2560,
        height: 1440,
        deviceId: '',
      };
      domMockBehavior.applyConstraintSucceeds = false;
      context.videoStreamIndex = new SimulcastVideoStreamIndex(new NoOpLogger());
      context.meetingSessionConfiguration.credentials.attendeeId = 'attendee#content';
      context.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
        'attendee',
        new NoOpLogger()
      );
      context.videoTileController.startLocalVideoTile();
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireVideoInputDeviceSucceeds: true,
        useMockedVideoStream: true,
      });
      context.meetingSessionConfiguration.meetingFeatures.contentMaxResolution =
        VideoQualitySettings.VideoResolutionFHD;
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      assert.exists(context.activeVideoInput);
    });

    it('will throw error if apply video constraint failed', async () => {
      domMockBehavior.applyConstraintSucceeds = false;
      context.videoStreamIndex = new SimulcastVideoStreamIndex(new NoOpLogger());
      context.meetingSessionConfiguration.credentials.attendeeId = 'attendee';
      context.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
        'attendee',
        new NoOpLogger()
      );
      context.videoTileController.startLocalVideoTile();
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireVideoInputDeviceSucceeds: true,
        useMockedVideoStream: false,
      });
      const task = new ReceiveVideoInputTask(context);
      await task.run();
      assert.exists(context.activeVideoInput);
    });
  });

  describe('run with simulcast enabled', () => {
    beforeEach(() => {
      context.enableSimulcast = true;
      context.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
        'self-attendee',
        new NoOpLogger()
      );
    });

    it('will update video stream index if video is enabled', done => {
      const spy = sinon.spy(context.videoStreamIndex, 'integrateUplinkPolicyDecision');
      context.videoTileController.startLocalVideoTile();
      context.mediaStreamBroker = new MockMediaStreamBroker({
        acquireVideoInputDeviceSucceeds: true,
        useMockedVideoStream: false,
      });
      const task = new ReceiveVideoInputTask(context);
      task.run().then(() => {
        expect(spy.calledOnce).to.equal(true);
        done();
      });
    });
  });
});
