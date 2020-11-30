// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoController from '../../src/audiovideocontroller/AudioVideoController';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import ContentShareConstants from '../../src/contentsharecontroller/ContentShareConstants';
import ContentShareController from '../../src/contentsharecontroller/ContentShareController';
import ContentShareMediaStreamBroker from '../../src/contentsharecontroller/ContentShareMediaStreamBroker';
import DefaultContentShareController from '../../src/contentsharecontroller/DefaultContentShareController';
import ContentShareObserver from '../../src/contentshareobserver/ContentShareObserver';
import NoOpLogger from '../../src/logger/NoOpLogger';
import Maybe from '../../src/maybe/Maybe';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

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

    start(): void {
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

  async function delay(timeoutMs: number = domMockBehavior.asyncWaitMs * 5): Promise<void> {
    await new Promise(resolve => new TimeoutScheduler(timeoutMs).start(resolve));
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
    beforeEach(() => {
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      const meetingSessionConfigure = makeSessionConfiguration();
      const contentShareMeetingSessionConfigure = DefaultContentShareController.createContentShareMeetingSessionConfigure(
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
      expect(videoTileSpy.calledOnce).to.be.true;
      await delay();
      expect(contentShareObserverSpy.calledOnce).to.be.true;
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
      await delay();
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
      await delay();
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
      expect(videoTileSpy.calledOnce).to.be.true;
      await delay();
      expect(contentShareObserverSpy.calledOnce).to.be.true;
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
      expect(videoTileSpy.calledOnce).to.be.true;
      await delay();
      expect(contentShareObserverSpy.calledOnce).to.be.true;
      expect(selfVideoTileSpy.calledOnce).to.be.true;
    });

    it(' did not add local video tile for other attendee presence events', async () => {
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

    it('startContentShareFromScreenCapture', async () => {
      const mediaStreamBrokerSpy = sinon.spy(
        contentShareMediaStreamBroker,
        'acquireScreenCaptureDisplayInputStream'
      );
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStart');
      await contentShareController.startContentShareFromScreenCapture();
      expect(mediaStreamBrokerSpy.calledOnce).to.be.true;
      await delay();
      expect(contentShareObserverSpy.calledOnce).to.be.true;
    });

    it('stopContentShare', async () => {
      const audioVideoSpy = sinon.spy(contentAudioVideoController, 'stop');
      const mediaStreamBrokerSpy = sinon.spy(contentShareMediaStreamBroker, 'cleanup');
      const contentShareObserverSpy = sinon.spy(contentShareObserver, 'contentShareDidStop');
      contentShareController.stopContentShare();
      expect(audioVideoSpy.calledOnce).to.be.true;
      expect(mediaStreamBrokerSpy.calledOnce).to.be.true;
      await delay();
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
      mediaVideoTrack.stop();
      expect(contentShareControllerSpy.calledOnce).to.be.true;
      await delay();
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
      await delay();
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
      await delay();
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
      await delay();
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
      await delay();
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
      await delay();
      expect(contentShareObserverSpy.notCalled).to.be.true;
    });
  });
});
