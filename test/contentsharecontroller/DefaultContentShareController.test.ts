// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { VideoCodecCapability } from '../../src';
import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoController from '../../src/audiovideocontroller/AudioVideoController';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import ContentShareConstants from '../../src/contentsharecontroller/ContentShareConstants';
import ContentShareController from '../../src/contentsharecontroller/ContentShareController';
import ContentShareMediaStreamBroker from '../../src/contentsharecontroller/ContentShareMediaStreamBroker';
import DefaultContentShareController from '../../src/contentsharecontroller/DefaultContentShareController';
import ContentShareObserver from '../../src/contentshareobserver/ContentShareObserver';
import VideoQualitySettings from '../../src/devicecontroller/VideoQualitySettings';
import NoOpLogger from '../../src/logger/NoOpLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import { Maybe } from '../../src/utils/Types';
import { wait as delay } from '../../src/utils/Utils';
import DefaultSimulcastUplinkPolicyForContentShare from '../../src/videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicyForContentShare';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder, { StoppableMediaStreamTrack } from '../dommock/DOMMockBuilder';

describe('DefaultContentShareController', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const domMockBehavior = new DOMMockBehavior();
  let contentShareController: ContentShareController;
  let contentShareMediaStreamBroker: ContentShareMediaStreamBroker;
  let contentShareObserver: NoOpContentShareObserver;
  let contentAudioVideoController: AudioVideoController;
  let attendeeAudioVideoController: AudioVideoController;
  let mediaStream: MediaStream;
  let domMockBuilder: DOMMockBuilder;

  const defaultDelay = domMockBehavior.asyncWaitMs * 5;

  function makeSessionConfiguration(): MeetingSessionConfiguration {
    const configuration = new MeetingSessionConfiguration();
    configuration.meetingId = 'foo-meeting';
    configuration.urls = new MeetingSessionURLs();
    configuration.urls.audioHostURL = 'https://audiohost.test.example.com';
    configuration.urls.turnControlURL = 'https://turncontrol.test.example.com';
    configuration.urls.signalingURL = 'https://signaling.test.example.com';
    configuration.credentials = new MeetingSessionCredentials();
    configuration.credentials.attendeeId = 'foo-attendee';
    configuration.credentials.externalUserId = 'foo-external-id';
    configuration.credentials.joinToken = 'foo-join-token';
    return configuration;
  }

  class ContentShareMediaStreamBrokerMock extends ContentShareMediaStreamBroker {
    async acquireAudioInputStream(): Promise<MediaStream> {
      return this.mediaStream;
    }

    async acquireVideoInputStream(): Promise<MediaStream> {
      return this.mediaStream;
    }

    async acquireDisplayInputStream(
      _streamConstraints: MediaStreamConstraints
    ): Promise<MediaStream> {
      return new MediaStream();
    }
  }

  class NoOpContentShareObserver implements ContentShareObserver {
    contentShareDidStart(): void {}

    contentShareDidStop(): void {}

    contentShareDidPause(): void {}

    contentShareDidUnpause(): void {}
  }

  class TestAudioVideoController extends NoOpAudioVideoController {
    audioProfile: AudioProfile = null;

    setAudioProfile(audioProfile: AudioProfile): void {
      this.audioProfile = audioProfile;
    }

    async start(): Promise<void> {
      await delay(1);
      this.forEachObserver(observer => {
        Maybe.of(observer.audioVideoDidStart).map(f => f.bind(observer)());
      });
      attendeeAudioVideoController.realtimeController.realtimeSetAttendeeIdPresence(
        'foo-attendee#content',
        true,
        'foo-external-id',
        null,
        null
      );
    }

    stop(): void {
      this.forEachObserver(observer => {
        Maybe.of(observer.audioVideoDidStop).map(f =>
          f.bind(observer)(new MeetingSessionStatus(MeetingSessionStatusCode.Left))
        );
      });
      attendeeAudioVideoController.realtimeController.realtimeSetAttendeeIdPresence(
        'foo-attendee#content',
        false,
        'foo-external-id',
        null,
        null
      );
    }
  }

  it('content share meeting session configure', () => {
    const meetingSessionConfigure = makeSessionConfiguration();
    const contentShareMeetingSessionConfigure = DefaultContentShareController.createContentShareMeetingSessionConfigure(
      meetingSessionConfigure
    );
    expect(contentShareMeetingSessionConfigure.meetingId).to.equal(
      meetingSessionConfigure.meetingId
    );
    expect(contentShareMeetingSessionConfigure.urls).to.equal(meetingSessionConfigure.urls);
    expect(contentShareMeetingSessionConfigure.credentials.attendeeId).to.equal(
      meetingSessionConfigure.credentials.attendeeId + ContentShareConstants.Modality
    );
    expect(contentShareMeetingSessionConfigure.credentials.joinToken).to.equal(
      meetingSessionConfigure.credentials.joinToken + ContentShareConstants.Modality
    );
  });

  describe('content share APIs', () => {
    let contentShareMeetingSessionConfigure: MeetingSessionConfiguration = undefined;

    beforeEach(() => {
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      const meetingSessionConfigure = makeSessionConfiguration();
      contentShareMeetingSessionConfigure = DefaultContentShareController.createContentShareMeetingSessionConfigure(
        meetingSessionConfigure
      );

      contentShareMediaStreamBroker = new ContentShareMediaStreamBrokerMock(new NoOpLogger());
      attendeeAudioVideoController = new NoOpAudioVideoController(meetingSessionConfigure);
      contentAudioVideoController = new TestAudioVideoController(
        contentShareMeetingSessionConfigure
      );

      contentShareController = new DefaultContentShareController(
        contentShareMediaStreamBroker,
        contentAudioVideoController,
        attendeeAudioVideoController
      );
      mediaStream = new MediaStream();

      contentShareObserver = new NoOpContentShareObserver();
      contentShareController.addContentShareObserver(contentShareObserver);
    });

    afterEach(() => {
      if (domMockBuilder) {
        domMockBuilder.cleanup();
        domMockBuilder = null;
      }
      contentShareController.removeContentShareObserver(contentShareObserver);
    });

    it('can be constructed', () => {
      expect(contentShareController).to.exist;
    });

    it('can call setContentAudioProfile', () => {
      const audioProfile = new AudioProfile();
      contentShareController.setContentAudioProfile(audioProfile);
      // @ts-ignore
      expect(contentShareController.contentAudioVideo.audioProfile).to.equal(audioProfile);
    });

    describe('enableSimulcastForContentShare', () => {
      it('can be enabled and disabled', () => {
        contentShareController.enableSimulcastForContentShare(true);
        expect(
          contentShareMeetingSessionConfigure.enableSimulcastForUnifiedPlanChromiumBasedBrowsers
        ).to.be.true;
        expect(
          contentShareMeetingSessionConfigure.videoUplinkBandwidthPolicy instanceof
            DefaultSimulcastUplinkPolicyForContentShare
        ).to.be.true;

        contentShareController.enableSimulcastForContentShare(false);
        expect(
          contentShareMeetingSessionConfigure.enableSimulcastForUnifiedPlanChromiumBasedBrowsers
        ).to.be.false;
        expect(contentShareMeetingSessionConfigure.videoUplinkBandwidthPolicy).to.be.undefined;
      });

      it('can override low and high encoding params', () => {
        const encodingParams = {
          low: {
            maxBitrateKbps: 100,
            scaleResolutionDownBy: 4,
            maxFramerate: 3,
          },
          high: {
            maxBitrateKbps: 1000,
            scaleResolutionDownBy: 2,
            maxFramerate: 10,
          },
        };
        contentShareController.enableSimulcastForContentShare(true, encodingParams);
        expect(
          contentShareMeetingSessionConfigure.enableSimulcastForUnifiedPlanChromiumBasedBrowsers
        ).to.be.true;
        expect(
          contentShareMeetingSessionConfigure.videoUplinkBandwidthPolicy instanceof
            DefaultSimulcastUplinkPolicyForContentShare
        ).to.be.true;
        const policy = contentShareMeetingSessionConfigure.videoUplinkBandwidthPolicy as DefaultSimulcastUplinkPolicyForContentShare;
        // @ts-ignore
        expect(policy.encodingParams).to.deep.equal(encodingParams);
      });
    });

    describe('enableSVCForContentShare', () => {
      it('can be enabled and disabled', () => {
        contentShareController.enableSVCForContentShare(true);
        expect(contentShareMeetingSessionConfigure.enableSVC).to.be.true;

        contentShareController.enableSVCForContentShare(false);
        expect(contentShareMeetingSessionConfigure.enableSVC).to.be.false;
      });
    });

    it('startContentShare with video track and meetingFeatures.contentMaxResolution set to None', async () => {
      contentShareMeetingSessionConfigure.meetingFeatures.contentMaxResolution =
        VideoQualitySettings.VideoDisabled;
      // @ts-ignore
      mediaStream.addTrack(new MediaStreamTrack('video-track-id', 'video'));
      const audioVideoSpy = sinon.spy(contentAudioVideoController, 'start');
      const videoTileSpy = sinon.spy(
        contentAudioVideoController.videoTileController,
        'startLocalVideoTile'
      );
      const selfVideoTileSpy = sinon.spy(
        attendeeAudioVideoController.videoTileController,
        'addVideoTile'
      );
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStart');
      await contentShareController.startContentShare(mediaStream);
      expect(audioVideoSpy.notCalled).to.be.true;
      await delay(defaultDelay);
      expect(contentShareObserverSpy.notCalled).to.be.true;
      expect(videoTileSpy.notCalled).to.be.true;
      expect(selfVideoTileSpy.notCalled).to.be.true;
    });

    it('startContentShare with video track', async () => {
      // @ts-ignore
      mediaStream.addTrack(new MediaStreamTrack('video-track-id', 'video'));
      const audioVideoSpy = sinon.spy(contentAudioVideoController, 'start');
      const videoTileSpy = sinon.spy(
        contentAudioVideoController.videoTileController,
        'startLocalVideoTile'
      );
      const selfVideoTileSpy = sinon.spy(
        attendeeAudioVideoController.videoTileController,
        'addVideoTile'
      );
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStart');
      await contentShareController.startContentShare(mediaStream);
      expect(audioVideoSpy.calledOnce).to.be.true;
      await delay(defaultDelay);
      expect(contentShareObserverSpy.calledOnce).to.be.true;
      expect(videoTileSpy.calledOnce).to.be.true;
      expect(selfVideoTileSpy.calledOnce).to.be.true;
    });

    it('startContentShare without video track', async () => {
      const audioVideoSpy = sinon.spy(contentAudioVideoController, 'start');
      const videoTileSpy = sinon.spy(
        contentAudioVideoController.videoTileController,
        'startLocalVideoTile'
      );
      const selfVideoTileSpy = sinon.spy(
        attendeeAudioVideoController.videoTileController,
        'addVideoTile'
      );
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStart');
      await contentShareController.startContentShare(mediaStream);
      expect(audioVideoSpy.calledOnce).to.be.true;
      expect(videoTileSpy.notCalled).to.be.true;
      await delay(defaultDelay);
      expect(contentShareObserverSpy.calledOnce).to.be.true;
      expect(selfVideoTileSpy.notCalled).to.be.true;
    });

    it('startContentShare does not error out if media stream is deleted', async () => {
      // @ts-ignore
      mediaStream.addTrack(new MediaStreamTrack('video-track-id', 'video'));
      const audioVideoSpy = sinon.spy(contentAudioVideoController, 'start');
      const videoTileSpy = sinon.spy(
        contentAudioVideoController.videoTileController,
        'startLocalVideoTile'
      );
      const selfVideoTileSpy = sinon.spy(
        attendeeAudioVideoController.videoTileController,
        'addVideoTile'
      );
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStart');
      contentShareController.startContentShare(mediaStream);
      contentShareMediaStreamBroker.mediaStream = null;
      await delay(defaultDelay);
      expect(audioVideoSpy.calledOnce).to.be.true;
      expect(videoTileSpy.notCalled).to.be.true;
      expect(contentShareObserverSpy.calledOnce).to.be.true;
      expect(selfVideoTileSpy.notCalled).to.be.true;
    });

    it('startContentShare with null stream', async () => {
      const audioVideoSpy = sinon.spy(contentAudioVideoController, 'start');
      const videoTileSpy = sinon.spy(
        contentAudioVideoController.videoTileController,
        'startLocalVideoTile'
      );
      const selfVideoTileSpy = sinon.spy(
        attendeeAudioVideoController.videoTileController,
        'addVideoTile'
      );
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStart');
      await contentShareController.startContentShare(null);
      expect(audioVideoSpy.notCalled).to.be.true;
      expect(videoTileSpy.notCalled).to.be.true;
      await delay(defaultDelay);
      expect(contentShareObserverSpy.notCalled).to.be.true;
      expect(selfVideoTileSpy.notCalled).to.be.true;
    });

    it('startContentShare does not bind local content share stream twice', async () => {
      // @ts-ignore
      mediaStream.addTrack(new MediaStreamTrack('video-track-id', 'video'));
      const audioVideoSpy = sinon.spy(contentAudioVideoController, 'start');
      const videoTileSpy = sinon.spy(
        contentAudioVideoController.videoTileController,
        'startLocalVideoTile'
      );
      const selfVideoTileSpy = sinon.spy(
        attendeeAudioVideoController.videoTileController,
        'addVideoTile'
      );
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStart');
      await contentShareController.startContentShare(mediaStream);
      expect(audioVideoSpy.calledOnce).to.be.true;
      await delay(defaultDelay);
      expect(contentShareObserverSpy.calledOnce).to.be.true;
      expect(videoTileSpy.calledOnce).to.be.true;
      expect(selfVideoTileSpy.calledOnce).to.be.true;
      attendeeAudioVideoController.realtimeController.realtimeSetAttendeeIdPresence(
        'foo-attendee#content',
        true,
        'foo-external-id',
        null,
        null
      );
      expect(selfVideoTileSpy.calledOnce).to.be.true;
    });

    it('uses getCapabilities if getSettings is not available in the track', async () => {
      // @ts-ignore
      mediaStream.addTrack(new MediaStreamTrack('video-track-id', 'video'));
      domMockBehavior.mediaStreamTrackCapabilities = {
        width: 640,
        height: 480,
      };

      // eslint-disable-next-line
      delete MediaStreamTrack.prototype['getSettings'];

      const audioVideoSpy = sinon.spy(contentAudioVideoController, 'start');
      const videoTileSpy = sinon.spy(
        contentAudioVideoController.videoTileController,
        'startLocalVideoTile'
      );
      const selfVideoTileSpy = sinon.spy(
        attendeeAudioVideoController.videoTileController,
        'addVideoTile'
      );
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStart');
      await contentShareController.startContentShare(mediaStream);
      expect(audioVideoSpy.calledOnce).to.be.true;
      await delay(defaultDelay);
      expect(contentShareObserverSpy.calledOnce).to.be.true;
      expect(videoTileSpy.calledOnce).to.be.true;
      expect(selfVideoTileSpy.calledOnce).to.be.true;
    });

    it('did not add local video tile for other attendee presence events', async () => {
      const selfVideoTileSpy = sinon.spy(
        attendeeAudioVideoController.videoTileController,
        'addVideoTile'
      );
      attendeeAudioVideoController.realtimeController.realtimeSetAttendeeIdPresence(
        'foo-attendee2#content',
        true,
        'foo-external-id',
        null,
        null
      );
      expect(selfVideoTileSpy.notCalled).to.be.true;
    });

    it('did not add local video tile for same attendee presence events if no media stream', async () => {
      const selfVideoTileSpy = sinon.spy(
        attendeeAudioVideoController.videoTileController,
        'addVideoTile'
      );
      attendeeAudioVideoController.realtimeController.realtimeSetAttendeeIdPresence(
        'foo-attendee#content',
        true,
        'foo-external-id',
        null,
        null
      );
      expect(selfVideoTileSpy.notCalled).to.be.true;
    });

    it('startContentShareFromScreenCapture', async () => {
      const mediaStreamBrokerSpy = sinon.spy(
        contentShareMediaStreamBroker,
        'acquireScreenCaptureDisplayInputStream'
      );
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStart');
      await contentShareController.startContentShareFromScreenCapture();
      expect(mediaStreamBrokerSpy.calledOnce).to.be.true;
      await delay(defaultDelay);
      expect(contentShareObserverSpy.calledOnce).to.be.true;
    });

    it('stopContentShare', async () => {
      const audioVideoSpy = sinon.spy(contentAudioVideoController, 'stop');
      const mediaStreamBrokerSpy = sinon.spy(contentShareMediaStreamBroker, 'cleanup');
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStop');
      contentShareController.stopContentShare();
      expect(audioVideoSpy.calledOnce).to.be.true;
      expect(mediaStreamBrokerSpy.calledOnce).to.be.true;
      await delay(defaultDelay);
      expect(contentShareObserverSpy.calledOnce).to.be.true;
    });

    it('stopContentShare is called if stream ended', async () => {
      const contentShareControllerSpy = sinon.spy(contentShareController, 'stopContentShare');
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStop');
      const selfVideoTileSpy = sinon.spy(
        attendeeAudioVideoController.videoTileController,
        'removeVideoTile'
      );
      // @ts-ignore
      const mediaVideoTrack = new MediaStreamTrack('video-track-id', 'video');
      mediaStream.addTrack(mediaVideoTrack);
      await contentShareController.startContentShare(mediaStream);
      await delay(defaultDelay);
      (mediaVideoTrack as StoppableMediaStreamTrack).externalStop();
      await delay(defaultDelay);
      expect(contentShareControllerSpy.calledOnce).to.be.true;
      expect(contentShareObserverSpy.calledOnce).to.be.true;
      expect(selfVideoTileSpy.calledOnce).to.be.true;
    });

    it('pauseContentShare and trigger pause event', async () => {
      const mediaStreamBrokerSpy = sinon.spy(contentShareMediaStreamBroker, 'toggleMediaStream');
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidPause');
      // @ts-ignore
      const mediaVideoTrack = new MediaStreamTrack('video-track-id', 'video');
      mediaVideoTrack.enabled = true;
      mediaStream.addTrack(mediaVideoTrack);
      contentShareMediaStreamBroker.mediaStream = mediaStream;
      contentShareController.pauseContentShare();
      mediaStreamBrokerSpy.calledOnceWith(true);
      await delay(defaultDelay);
      expect(contentShareObserverSpy.calledOnce).to.be.true;
    });

    it('do not trigger pause event if the track is already paused', async () => {
      const mediaStreamBrokerSpy = sinon.spy(contentShareMediaStreamBroker, 'toggleMediaStream');
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidPause');
      // @ts-ignore
      const mediaVideoTrack = new MediaStreamTrack('video-track-id', 'video');
      mediaVideoTrack.enabled = false;
      mediaStream.addTrack(mediaVideoTrack);
      contentShareMediaStreamBroker.mediaStream = mediaStream;
      contentShareController.pauseContentShare();
      mediaStreamBrokerSpy.calledOnceWith(true);
      await delay(defaultDelay);
      expect(contentShareObserverSpy.notCalled).to.be.true;
    });

    it('unpauseContentShare', async () => {
      const mediaStreamBrokerSpy = sinon.spy(contentShareMediaStreamBroker, 'toggleMediaStream');
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidUnpause');
      // @ts-ignore
      const mediaVideoTrack = new MediaStreamTrack('video-track-id', 'video');
      mediaVideoTrack.enabled = false;
      mediaStream.addTrack(mediaVideoTrack);
      contentShareMediaStreamBroker.mediaStream = mediaStream;
      contentShareController.unpauseContentShare();
      mediaStreamBrokerSpy.calledOnceWith(false);
      await delay(defaultDelay);
      expect(contentShareObserverSpy.calledOnce).to.be.true;
    });

    it('do not trigger pause event if the track is already enabled', async () => {
      const mediaStreamBrokerSpy = sinon.spy(contentShareMediaStreamBroker, 'toggleMediaStream');
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidUnpause');
      // @ts-ignore
      const mediaVideoTrack = new MediaStreamTrack('video-track-id', 'video');
      mediaVideoTrack.enabled = true;
      mediaStream.addTrack(mediaVideoTrack);
      contentShareMediaStreamBroker.mediaStream = mediaStream;
      contentShareController.unpauseContentShare();
      mediaStreamBrokerSpy.calledOnceWith(false);
      await delay(defaultDelay);
      expect(contentShareObserverSpy.notCalled).to.be.true;
    });

    it('does not call the observer if it has been removed', async () => {
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidPause');
      // @ts-ignore
      const mediaVideoTrack = new MediaStreamTrack('video-track-id', 'video');
      mediaVideoTrack.enabled = true;
      mediaStream.addTrack(mediaVideoTrack);
      contentShareMediaStreamBroker.mediaStream = mediaStream;
      contentShareController.pauseContentShare();
      contentShareController.removeContentShareObserver(contentShareObserver);
      await delay(defaultDelay);
      expect(contentShareObserverSpy.notCalled).to.be.true;
    });

    it('setContentShareVideoCodecPreferences', async () => {
      const audioVideoSpy = sinon.spy(contentAudioVideoController, 'setVideoCodecSendPreferences');
      contentShareController.setContentShareVideoCodecPreferences([VideoCodecCapability.vp8()]);
      expect(audioVideoSpy.calledOnceWith([VideoCodecCapability.vp8()])).to.be.true;
    });
  });
});
