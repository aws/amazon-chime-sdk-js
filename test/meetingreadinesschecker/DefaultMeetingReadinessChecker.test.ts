// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoController from '../../src/audiovideocontroller/AudioVideoController';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoFacade from '../../src/audiovideofacade/AudioVideoFacade';
import DefaultAudioVideoFacade from '../../src/audiovideofacade/DefaultAudioVideoFacade';
import ContentShareController from '../../src/contentsharecontroller/ContentShareController';
import ContentShareMediaStreamBroker from '../../src/contentsharecontroller/ContentShareMediaStreamBroker';
import DefaultContentShareController from '../../src/contentsharecontroller/DefaultContentShareController';
import DefaultDeviceController from '../../src/devicecontroller/DefaultDeviceController';
import DeviceController from '../../src/devicecontroller/DeviceController';
import NoOpDeviceController from '../../src/devicecontroller/NoOpDeviceController';
import Logger from '../../src/logger/Logger';
import NoOpLogger from '../../src/logger/NoOpLogger';
import Maybe from '../../src/maybe/Maybe';
import DeviceControllerBasedMediaStreamBroker from '../../src/mediastreambroker/DeviceControllerBasedMediaStreamBroker';
import CheckAudioConnectivityFeedback from '../../src/meetingreadinesschecker/CheckAudioConnectivityFeedback';
import CheckAudioInputFeedback from '../../src/meetingreadinesschecker/CheckAudioInputFeedback';
import CheckAudioOutputFeedback from '../../src/meetingreadinesschecker/CheckAudioOutputFeedback';
import CheckCameraResolutionFeedback from '../../src/meetingreadinesschecker/CheckCameraResolutionFeedback';
import CheckContentShareConnectivityFeedback from '../../src/meetingreadinesschecker/CheckContentShareConnectivityFeedback';
import CheckNetworkTCPConnectivityFeedback from '../../src/meetingreadinesschecker/CheckNetworkTCPConnectivityFeedback';
import CheckNetworkUDPConnectivityFeedback from '../../src/meetingreadinesschecker/CheckNetworkUDPConnectivityFeedback';
import CheckVideoConnectivityFeedback from '../../src/meetingreadinesschecker/CheckVideoConnectivityFeedback';
import CheckVideoInputFeedback from '../../src/meetingreadinesschecker/CheckVideoInputFeedback';
import DefaultMeetingReadinessChecker from '../../src/meetingreadinesschecker/DefaultMeetingReadinessChecker';
import MeetingReadinessCheckerConfiguration from '../../src/meetingreadinesschecker/MeetingReadinessCheckerConfiguration';
import MeetingSession from '../../src/meetingsession/MeetingSession';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DisplayMediaState from '../dommock/DisplayMediaState';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import UserMediaState from '../dommock/UserMediaState';

interface AudioElementWithSinkId extends HTMLAudioElement {
  sinkId: string;
  setSinkId: (id: string) => void;
}

describe('DefaultMeetingReadinessChecker', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger();
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let deviceController: DefaultDeviceController;
  let meetingSession: MeetingSession;
  let meetingReadinessCheckerController: DefaultMeetingReadinessChecker;
  let meetingReadinessCheckerConfiguration: MeetingReadinessCheckerConfiguration;
  let attendeeAudioVideoController: TestAudioVideoController;
  let contentAudioVideoController: TestAudioVideoController;

  function makeSessionConfiguration(): MeetingSessionConfiguration {
    const configuration = new MeetingSessionConfiguration();
    configuration.meetingId = 'foo-meeting';
    configuration.urls = new MeetingSessionURLs();
    configuration.urls.audioHostURL = 'https://audiohost.test.example.com';
    configuration.urls.turnControlURL = 'https://turncontrol.test.example.com';
    configuration.urls.signalingURL = 'https://signaling.test.example.com';
    configuration.urls.screenSharingURL = 'https://signaling.test.example.com';
    configuration.urls.screenDataURL = 'https://signaling.test.example.com';
    configuration.urls.screenViewingURL = 'https://signaling.test.example.com';
    configuration.urls.urlRewriter = (url: string) => {
      return url;
    };
    configuration.credentials = new MeetingSessionCredentials();
    configuration.credentials.attendeeId = 'attendeeId';
    configuration.credentials.joinToken = 'foo-join-token';
    configuration.attendeePresenceTimeoutMs = 5000;
    return configuration;
  }

  function getMediaDeviceInfo(
    deviceId: string,
    kind: MediaDeviceKind,
    label: string,
    groupId?: string
  ): MediaDeviceInfo {
    // @ts-ignore
    return {
      deviceId,
      kind,
      label,
      groupId,
    };
  }

  async function delay(timeoutMs: number): Promise<void> {
    await new Promise(resolve => new TimeoutScheduler(timeoutMs).start(resolve));
  }

  class TestAudioVideoController extends NoOpAudioVideoController {
    skipStart = false;
    attendeePresenceId = 'attendeeId';
    noRTCConnection = false;

    start(): void {
      this.configuration.urls.urlRewriter('fakeUDPURI?transport=udp');
      this.configuration.urls.urlRewriter('fakeTCPURI?transport=tcp');
      if (this.skipStart) {
        return;
      }
      this.forEachObserver(observer => {
        Maybe.of(observer.audioVideoDidStart).map(f => f.bind(observer)());
      });
      this.realtimeController.realtimeSetAttendeeIdPresence(
        this.attendeePresenceId,
        true,
        'external-id',
        null,
        null
      );
      attendeeAudioVideoController.realtimeController.realtimeSetAttendeeIdPresence(
        `${this.attendeePresenceId}#content`,
        true,
        'external-id',
        null,
        null
      );
    }

    stop(): void {
      if (this.skipStart) {
        return;
      }
      this.forEachObserver(observer => {
        Maybe.of(observer.audioVideoDidStop).map(f =>
          f.bind(observer)(new MeetingSessionStatus(MeetingSessionStatusCode.Left))
        );
      });

      this.realtimeController.realtimeSetAttendeeIdPresence(
        this.attendeePresenceId,
        false,
        'external-id',
        null,
        null
      );

      if (attendeeAudioVideoController.realtimeController !== this.realtimeController) {
        attendeeAudioVideoController.realtimeController.realtimeSetAttendeeIdPresence(
          `${this.attendeePresenceId}#content`,
          false,
          'external-id',
          null,
          null
        );
      }
    }

    getRTCPeerConnectionStats(_selector?: MediaStreamTrack): Promise<RTCStatsReport> {
      return !this.noRTCConnection ? new RTCPeerConnection().getStats() : null;
    }
  }

  class TestMeetingSession implements MeetingSession {
    constructor(
      configuration: MeetingSessionConfiguration,
      logger: Logger,
      deviceController: DeviceControllerBasedMediaStreamBroker
    ) {
      this.configuration = configuration;
      this.logger = logger;

      this.deviceController = deviceController;
      attendeeAudioVideoController = new TestAudioVideoController(this.configuration);
      this.audioVideoController = attendeeAudioVideoController;
      deviceController.bindToAudioVideoController(this.audioVideoController);
      const contentShareMediaStreamBroker = new ContentShareMediaStreamBroker(this.logger);
      contentAudioVideoController = new TestAudioVideoController(
        DefaultContentShareController.createContentShareMeetingSessionConfigure(this.configuration)
      );
      this.contentShare = new DefaultContentShareController(
        contentShareMediaStreamBroker,
        contentAudioVideoController,
        this.audioVideoController
      );
      this.audioVideo = new DefaultAudioVideoFacade(
        this.audioVideoController,
        this.audioVideoController.videoTileController,
        this.audioVideoController.realtimeController,
        this.audioVideoController.audioMixController,
        this.deviceController,
        this.contentShare
      );
    }

    readonly audioVideo: AudioVideoFacade;
    readonly audioVideoController: AudioVideoController;
    readonly configuration: MeetingSessionConfiguration;
    readonly contentShare: ContentShareController;
    readonly deviceController: DeviceController;
    readonly logger: Logger;
  }

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    deviceController = new DefaultDeviceController(logger);
    meetingSession = new TestMeetingSession(makeSessionConfiguration(), logger, deviceController);
    meetingReadinessCheckerConfiguration = new MeetingReadinessCheckerConfiguration();
    meetingReadinessCheckerConfiguration.timeoutMs = 10;
    meetingReadinessCheckerConfiguration.waitDurationMs = 3;
    meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(
      logger,
      meetingSession,
      meetingReadinessCheckerConfiguration
    );
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('checks audio input', () => {
    it('granted permission by browser', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      const audioCheckFeedback: CheckAudioInputFeedback = await meetingReadinessCheckerController.checkAudioInput(
        getMediaDeviceInfo('1', 'audioinput', 'label', 'group-id')
      );
      expect(audioCheckFeedback).to.equal(CheckAudioInputFeedback.Succeeded);
    });

    it('granted permission by user', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      domMockBehavior.asyncWaitMs = 100;
      const audioCheckFeedback: CheckAudioInputFeedback = await meetingReadinessCheckerController.checkAudioInput(
        getMediaDeviceInfo('1', 'audioinput', 'label', 'group-id')
      );
      expect(audioCheckFeedback).to.equal(CheckAudioInputFeedback.Succeeded);
    });

    it('denies the permission by browser', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      const audioCheckFeedback: CheckAudioInputFeedback = await meetingReadinessCheckerController.checkAudioInput(
        new MediaDeviceInfo()
      );
      expect(audioCheckFeedback).to.equal(CheckAudioInputFeedback.PermissionDenied);
    });

    it('denies the permission by user', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      domMockBehavior.asyncWaitMs = 600;
      const audioCheckFeedback: CheckAudioInputFeedback = await meetingReadinessCheckerController.checkAudioInput(
        getMediaDeviceInfo('1', 'audioinput', 'label', 'group-id')
      );
      expect(audioCheckFeedback).to.equal(CheckAudioInputFeedback.PermissionDenied);
    });

    it('fails to get audio input', async () => {
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(
        logger,
        new TestMeetingSession(makeSessionConfiguration(), logger, new NoOpDeviceController())
      );

      const audioCheckFeedback: CheckAudioInputFeedback = await meetingReadinessCheckerController.checkAudioInput(
        null
      );
      expect(audioCheckFeedback).to.equal(CheckAudioInputFeedback.Failed);
    });
  });

  describe('checks audio output', () => {
    it('successful after playing tone', async () => {
      const successCallback = (): Promise<boolean> => Promise.resolve(true);

      const audioOutputFeedback: CheckAudioOutputFeedback = await meetingReadinessCheckerController.checkAudioOutput(
        getMediaDeviceInfo('1', 'audiooutput', 'label', 'group-id'),
        successCallback
      );
      expect(audioOutputFeedback).to.equal(CheckAudioOutputFeedback.Succeeded);
    });

    it('can be called multiple times', async () => {
      const successCallback = (): Promise<boolean> => {
        return new Promise(resolve => {
          delay(100);
          resolve(true);
        });
      };

      const audioOutputFeedback1Promise = meetingReadinessCheckerController.checkAudioOutput(
        getMediaDeviceInfo('1', 'audiooutput', 'label', 'group-id'),
        successCallback
      );
      const audioOutputFeedback2Promise = meetingReadinessCheckerController.checkAudioOutput(
        getMediaDeviceInfo('1', 'audiooutput', 'label', 'group-id'),
        successCallback
      );
      const audioOutputFeedback1 = await audioOutputFeedback1Promise;
      const audioOutputFeedback2 = await audioOutputFeedback2Promise;
      expect(audioOutputFeedback1).to.equal(CheckAudioOutputFeedback.Succeeded);
      expect(audioOutputFeedback2).to.equal(CheckAudioOutputFeedback.Succeeded);
    });

    it('use null device id if unavailable', async () => {
      const successCallback = (): Promise<boolean> => Promise.resolve(true);

      const audioOutputFeedback: CheckAudioOutputFeedback = await meetingReadinessCheckerController.checkAudioOutput(
        undefined,
        successCallback,
        new Audio()
      );
      expect(audioOutputFeedback).to.equal(CheckAudioOutputFeedback.Succeeded);
    });

    it('will just log failure if the audio mix controller bombs', async () => {
      domMockBehavior.setSinkIdSupported = true;
      domMockBehavior.setSinkIdSucceeds = false;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      const successCallback = (): Promise<boolean> => Promise.resolve(true);

      const audio: AudioElementWithSinkId = new Audio() as AudioElementWithSinkId;

      // We need to do this so that code inside the AudioMixController knows
      // that we support sinkId.
      audio.sinkId = '';
      audio.setSinkId = (_id: string): void => {
        throw new Error('oh no');
      };

      const audioOutputFeedback: CheckAudioOutputFeedback = await meetingReadinessCheckerController.checkAudioOutput(
        getMediaDeviceInfo('1', 'audiooutput', 'label', 'group-id'),
        successCallback,
        audio
      );
      expect(audioOutputFeedback).to.equal(CheckAudioOutputFeedback.Succeeded);
    });

    it('unsuccessful after playing tone', async () => {
      const failureCallback = (): Promise<boolean> => Promise.resolve(false);

      const audioOutputFeedback: CheckAudioOutputFeedback = await meetingReadinessCheckerController.checkAudioOutput(
        getMediaDeviceInfo('foobar', 'audiooutput', 'label', 'group-id'),
        failureCallback
      );
      expect(audioOutputFeedback).to.equal(CheckAudioOutputFeedback.Failed);
    });

    it('unsuccessful after playing tone - callback throws error', async () => {
      domMockBehavior.setSinkIdSupported = false;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      deviceController = new DefaultDeviceController(logger);
      meetingSession = new TestMeetingSession(makeSessionConfiguration(), logger, deviceController);
      meetingReadinessCheckerConfiguration = new MeetingReadinessCheckerConfiguration();
      meetingReadinessCheckerConfiguration.timeoutMs = 10;
      meetingReadinessCheckerConfiguration.waitDurationMs = 3;
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(
        logger,
        meetingSession,
        meetingReadinessCheckerConfiguration
      );
      const failureCallback = (): Promise<boolean> => Promise.reject(new Error());

      const audioOutputFeedback: CheckAudioOutputFeedback = await meetingReadinessCheckerController.checkAudioOutput(
        getMediaDeviceInfo('1', 'audiooutput', 'label', 'group-id'),
        failureCallback
      );
      expect(audioOutputFeedback).to.equal(CheckAudioOutputFeedback.Failed);
    });

    it('return early from stopTone if there is no audio context', async () => {
      DefaultDeviceController.closeAudioContext();
      domMockBehavior.createMediaStreamDestinationSuccess = false;
      const successCallback = (): Promise<boolean> => Promise.resolve(true);

      const audioOutputFeedback: CheckAudioOutputFeedback = await meetingReadinessCheckerController.checkAudioOutput(
        getMediaDeviceInfo('1', 'audiooutput', 'label', 'group-id'),
        successCallback
      );
      expect(audioOutputFeedback).to.equal(CheckAudioOutputFeedback.Failed);
    });
  });

  describe('checks video input', () => {
    it('granted permission by browser', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      const videoCheckFeedback: CheckVideoInputFeedback = await meetingReadinessCheckerController.checkVideoInput(
        getMediaDeviceInfo('1', 'videoinput', 'label', 'group-id')
      );
      expect(videoCheckFeedback).to.equal(CheckVideoInputFeedback.Succeeded);
    });

    it('granted permission by user', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      domMockBehavior.asyncWaitMs = 100;
      const videoCheckFeedback: CheckVideoInputFeedback = await meetingReadinessCheckerController.checkVideoInput(
        getMediaDeviceInfo('1', 'videoinput', 'label', 'group-id')
      );
      expect(videoCheckFeedback).to.equal(CheckVideoInputFeedback.Succeeded);
    });

    it('denies the permission by browser', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      const videoCheckFeedback: CheckVideoInputFeedback = await meetingReadinessCheckerController.checkVideoInput(
        new MediaDeviceInfo()
      );
      expect(videoCheckFeedback).to.equal(CheckVideoInputFeedback.PermissionDenied);
    });

    it('denies the permission by user', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      domMockBehavior.asyncWaitMs = 600;
      const videoCheckFeedback: CheckVideoInputFeedback = await meetingReadinessCheckerController.checkVideoInput(
        new MediaDeviceInfo()
      );
      expect(videoCheckFeedback).to.equal(CheckVideoInputFeedback.PermissionDenied);
    });

    it('fails to get video input', async () => {
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(
        logger,
        new TestMeetingSession(makeSessionConfiguration(), logger, new NoOpDeviceController())
      );

      const videoCheckFeedback: CheckVideoInputFeedback = await meetingReadinessCheckerController.checkVideoInput(
        null
      );
      expect(videoCheckFeedback).to.equal(CheckVideoInputFeedback.Failed);
    });
  });

  describe('check camera resolution', () => {
    it('checks for 240 x 320 resolution - success', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      const cameraResolutionFeedback: CheckCameraResolutionFeedback = await meetingReadinessCheckerController.checkCameraResolution(
        new MediaDeviceInfo(),
        240,
        320
      );
      expect(cameraResolutionFeedback).to.equal(CheckCameraResolutionFeedback.Succeeded);
    });

    it('checks for 240 x 320 resolution - failure', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.Failure;
      const cameraResolutionFeedback: CheckCameraResolutionFeedback = await meetingReadinessCheckerController.checkCameraResolution(
        new MediaDeviceInfo(),
        240,
        320
      );
      expect(cameraResolutionFeedback).to.equal(CheckCameraResolutionFeedback.Failed);
    });

    it('checks for 7680 × 4320 resolution - overconstrained', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.OverconstrainedError;
      const cameraResolutionFeedback: CheckCameraResolutionFeedback = await meetingReadinessCheckerController.checkCameraResolution(
        new MediaDeviceInfo(),
        7680,
        4320
      );
      expect(cameraResolutionFeedback).to.equal(
        CheckCameraResolutionFeedback.ResolutionNotSupported
      );
    });

    it('checks for 240 x 320 resolution - permission denied', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.NotAllowedError;
      const cameraResolutionFeedback: CheckCameraResolutionFeedback = await meetingReadinessCheckerController.checkCameraResolution(
        new MediaDeviceInfo(),
        240,
        320
      );
      expect(cameraResolutionFeedback).to.equal(CheckCameraResolutionFeedback.PermissionDenied);
    });

    it('Do not use exact if browser does not support', async () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.browserName = 'ios12.0';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(
        logger,
        meetingSession
      );
      const cameraResolutionFeedback: CheckCameraResolutionFeedback = await meetingReadinessCheckerController.checkCameraResolution(
        new MediaDeviceInfo(),
        240,
        320
      );
      expect(cameraResolutionFeedback).to.equal(CheckCameraResolutionFeedback.Succeeded);
    });
  });

  describe('checks content share connectivity', () => {
    it('permission denied', async () => {
      domMockBehavior.getDisplayMediaResult = DisplayMediaState.PermissionDenied;
      const result: CheckContentShareConnectivityFeedback = await meetingReadinessCheckerController.checkContentShareConnectivity();
      expect(result).to.equal(CheckContentShareConnectivityFeedback.PermissionDenied);
    });

    it('failure', async () => {
      domMockBehavior.getDisplayMediaResult = DisplayMediaState.Failure;
      const result: CheckContentShareConnectivityFeedback = await meetingReadinessCheckerController.checkContentShareConnectivity();
      expect(result).to.equal(CheckContentShareConnectivityFeedback.Failed);
    });

    it('start content share success', async () => {
      domMockBehavior.getDisplayMediaResult = DisplayMediaState.Success;
      const result: CheckContentShareConnectivityFeedback = await meetingReadinessCheckerController.checkContentShareConnectivity();
      expect(result).to.equal(CheckContentShareConnectivityFeedback.Succeeded);
    });

    it('start content share success with source id', async () => {
      domMockBehavior.getDisplayMediaResult = DisplayMediaState.Success;
      domMockBehavior.triggeredEndedEventForStopStreamTrack = false;
      const result: CheckContentShareConnectivityFeedback = await meetingReadinessCheckerController.checkContentShareConnectivity(
        'sourceId'
      );
      expect(result).to.equal(CheckContentShareConnectivityFeedback.Succeeded);
    });

    it('connection failure', async () => {
      attendeeAudioVideoController.skipStart = true;
      const result: CheckContentShareConnectivityFeedback = await meetingReadinessCheckerController.checkContentShareConnectivity();
      expect(result).to.equal(CheckContentShareConnectivityFeedback.ConnectionFailed);
    });

    it('start content share timed out', async () => {
      contentAudioVideoController.attendeePresenceId = 'attendeeId2';
      const result: CheckContentShareConnectivityFeedback = await meetingReadinessCheckerController.checkContentShareConnectivity();
      expect(result).to.equal(CheckContentShareConnectivityFeedback.TimedOut);
    });
  });

  describe('checks audio connection', () => {
    it('permission denied', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      const result = await meetingReadinessCheckerController.checkAudioConnectivity(
        getMediaDeviceInfo('1', 'audioinput', 'label', 'group-id')
      );
      expect(result).to.equal(CheckAudioConnectivityFeedback.AudioInputPermissionDenied);
    });

    it('fail to get audio input', async () => {
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(
        logger,
        new TestMeetingSession(makeSessionConfiguration(), logger, new NoOpDeviceController()),
        meetingReadinessCheckerConfiguration
      );
      const result = await meetingReadinessCheckerController.checkAudioConnectivity(
        getMediaDeviceInfo('1', 'audioinput', 'label', 'group-id')
      );
      expect(result).to.equal(CheckAudioConnectivityFeedback.AudioInputRequestFailed);
    });

    it('connection failure', async () => {
      attendeeAudioVideoController.skipStart = true;
      const result = await meetingReadinessCheckerController.checkAudioConnectivity(
        getMediaDeviceInfo('1', 'audioinput', 'label', 'group-id')
      );
      expect(result).to.equal(CheckAudioConnectivityFeedback.ConnectionFailed);
    });

    it('time out with no audio presence', async () => {
      attendeeAudioVideoController.attendeePresenceId = 'attendeeId2';
      const result = await meetingReadinessCheckerController.checkAudioConnectivity(
        getMediaDeviceInfo('1', 'audioinput', 'label', 'group-id')
      );
      expect(result).to.equal(CheckAudioConnectivityFeedback.AudioNotReceived);
    });

    it('success', async () => {
      const result = await meetingReadinessCheckerController.checkAudioConnectivity(
        getMediaDeviceInfo('1', 'audioinput', 'label', 'group-id')
      );
      expect(result).to.equal(CheckAudioConnectivityFeedback.Succeeded);
    });
  });

  describe('check video connection', () => {
    it('permission denied', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDeniedError;
      const result = await meetingReadinessCheckerController.checkVideoConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckVideoConnectivityFeedback.VideoInputPermissionDenied);
    });

    it('fail to get video input', async () => {
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(
        logger,
        new TestMeetingSession(makeSessionConfiguration(), logger, new NoOpDeviceController()),
        meetingReadinessCheckerConfiguration
      );
      const result = await meetingReadinessCheckerController.checkVideoConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckVideoConnectivityFeedback.VideoInputRequestFailed);
    });

    it('connection failure', async () => {
      attendeeAudioVideoController.skipStart = true;
      const result = await meetingReadinessCheckerController.checkVideoConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckVideoConnectivityFeedback.ConnectionFailed);
    });

    it('no rtc connection', async () => {
      attendeeAudioVideoController.noRTCConnection = true;
      const result = await meetingReadinessCheckerController.checkVideoConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckVideoConnectivityFeedback.VideoNotSent);
    });

    it('no outbound-rtp info', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      domMockBehavior.rtcPeerConnectionGetStatsReport = {
        kind: 'audio',
        mediaType: 'audio',
        type: 'outbound-rtp',
      };
      const result = await meetingReadinessCheckerController.checkVideoConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckVideoConnectivityFeedback.VideoNotSent);
    });

    it('success', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      domMockBehavior.rtcPeerConnectionGetStatsReport = {
        bytesSent: 100000,
        packetsSent: 100,
        kind: 'video',
        mediaType: 'video',
        type: 'outbound-rtp',
      };
      const result = await meetingReadinessCheckerController.checkVideoConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckVideoConnectivityFeedback.Succeeded);
    });
  });

  describe('check TCP connection', () => {
    it('meeting session not initialized', async () => {
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(logger, null);
      const result = await meetingReadinessCheckerController.checkNetworkTCPConnectivity();
      expect(result).to.equal(CheckNetworkTCPConnectivityFeedback.MeetingSessionURLsNotInitialized);
    });

    it('connection failure', async () => {
      attendeeAudioVideoController.skipStart = true;
      const result = await meetingReadinessCheckerController.checkNetworkTCPConnectivity();
      expect(result).to.equal(CheckNetworkTCPConnectivityFeedback.ConnectionFailed);
    });

    it('no rtc connection', async () => {
      attendeeAudioVideoController.noRTCConnection = true;
      const result = await meetingReadinessCheckerController.checkNetworkTCPConnectivity();
      expect(result).to.equal(CheckNetworkTCPConnectivityFeedback.ICENegotiationFailed);
    });

    it('no candidate-pair info', async () => {
      domMockBehavior.rtcPeerConnectionGetStatsReport = {
        kind: 'audio',
        mediaType: 'audio',
        type: 'outbound-rtp',
      };
      const result = await meetingReadinessCheckerController.checkNetworkTCPConnectivity();
      expect(result).to.equal(CheckNetworkTCPConnectivityFeedback.ICENegotiationFailed);
    });

    it('success', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      domMockBehavior.rtcPeerConnectionGetStatsReport = {
        state: 'succeeded',
        type: 'candidate-pair',
      };
      const result = await meetingReadinessCheckerController.checkNetworkTCPConnectivity();
      expect(result).to.equal(CheckNetworkTCPConnectivityFeedback.Succeeded);
    });
  });

  describe('check UDP connection', () => {
    it('meeting session not initialized', async () => {
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(logger, null);
      const result = await meetingReadinessCheckerController.checkNetworkUDPConnectivity();
      expect(result).to.equal(CheckNetworkUDPConnectivityFeedback.MeetingSessionURLsNotInitialized);
    });

    it('connection failure', async () => {
      attendeeAudioVideoController.skipStart = true;
      const result = await meetingReadinessCheckerController.checkNetworkUDPConnectivity();
      expect(result).to.equal(CheckNetworkUDPConnectivityFeedback.ConnectionFailed);
    });

    it('no rtc connection', async () => {
      attendeeAudioVideoController.noRTCConnection = true;
      const result = await meetingReadinessCheckerController.checkNetworkUDPConnectivity();
      expect(result).to.equal(CheckNetworkUDPConnectivityFeedback.ICENegotiationFailed);
    });

    it('no candidate-pair info', async () => {
      domMockBehavior.rtcPeerConnectionGetStatsReport = {
        kind: 'audio',
        mediaType: 'audio',
        type: 'outbound-rtp',
      };
      const result = await meetingReadinessCheckerController.checkNetworkUDPConnectivity();
      expect(result).to.equal(CheckNetworkUDPConnectivityFeedback.ICENegotiationFailed);
    });

    it('success', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      domMockBehavior.rtcPeerConnectionGetStatsReport = {
        state: 'succeeded',
        type: 'candidate-pair',
      };
      const result = await meetingReadinessCheckerController.checkNetworkUDPConnectivity();
      expect(result).to.equal(CheckNetworkUDPConnectivityFeedback.Succeeded);
    });
  });
});
