// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
import MeetingSession from '../../src/meetingsession/MeetingSession';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import DefaultScreenShareFacade from '../../src/screensharefacade/DefaultScreenShareFacade';
import ScreenShareFacade from '../../src/screensharefacade/ScreenShareFacade';
import DefaultScreenShareViewFacade from '../../src/screenshareviewfacade/DefaultScreenShareViewFacade';
import ScreenShareViewFacade from '../../src/screenshareviewfacade/ScreenShareViewFacade';
import DisplayMediaState from '../dommock/DisplayMediaState';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import UserMediaState from '../dommock/UserMediaState';

describe('DefaultMeetingReadinessChecker', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger();
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let deviceController: DefaultDeviceController;
  let meetingSession: MeetingSession;
  let meetingReadinessCheckerController: DefaultMeetingReadinessChecker;
  let attendeeAudioVideoController: TestAudioVideoController;
  let contentAudioVideoController: TestAudioVideoController;

  function makeSessionConfiguration(): MeetingSessionConfiguration {
    const configuration = new MeetingSessionConfiguration();
    configuration.enableWebAudio = false;
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
      this.deviceController.enableWebAudio(configuration.enableWebAudio);
      attendeeAudioVideoController = new TestAudioVideoController(this.configuration);
      this.audioVideoController = attendeeAudioVideoController;
      deviceController.bindToAudioVideoController(this.audioVideoController);
      this.screenShare = new DefaultScreenShareFacade(
        this.configuration,
        this.logger,
        deviceController
      );
      this.screenShareView = new DefaultScreenShareViewFacade(this.configuration, this.logger);
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
    readonly screenShare: ScreenShareFacade;
    readonly screenShareView: ScreenShareViewFacade;
  }

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    deviceController = new DefaultDeviceController(logger);
    meetingSession = new TestMeetingSession(makeSessionConfiguration(), logger, deviceController);
    meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(logger, meetingSession);
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
      expect(audioCheckFeedback).to.equal(CheckAudioInputFeedback.Success);
    });

    it('granted permission by user', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      domMockBehavior.asyncWaitMs = 100;
      const audioCheckFeedback: CheckAudioInputFeedback = await meetingReadinessCheckerController.checkAudioInput(
        getMediaDeviceInfo('1', 'audioinput', 'label', 'group-id')
      );
      expect(audioCheckFeedback).to.equal(CheckAudioInputFeedback.Success);
    });

    it('denies the permission by browser', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      const audioCheckFeedback: CheckAudioInputFeedback = await meetingReadinessCheckerController.checkAudioInput(
        new MediaDeviceInfo()
      );
      expect(audioCheckFeedback).to.equal(CheckAudioInputFeedback.PermissionDenied);
    });

    it('denies the permission by user', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
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
      expect(audioCheckFeedback).to.equal(CheckAudioInputFeedback.Failure);
    });
  });

  describe('checks audio output', () => {
    it('successful after playing tone', async () => {
      const successCallback = (): Promise<boolean> => {
        return new Promise(resolve => {
          resolve(true);
        });
      };

      const audioOutputFeedback: CheckAudioOutputFeedback = await meetingReadinessCheckerController.checkAudioOutput(
        getMediaDeviceInfo('1', 'audiooutput', 'label', 'group-id'),
        successCallback
      );
      expect(audioOutputFeedback).to.equal(CheckAudioOutputFeedback.Success);
    });

    it('use null device id if unavailable', async () => {
      const successCallback = (): Promise<boolean> => {
        return new Promise(resolve => {
          resolve(true);
        });
      };

      const audioOutputFeedback: CheckAudioOutputFeedback = await meetingReadinessCheckerController.checkAudioOutput(
        undefined,
        successCallback
      );
      expect(audioOutputFeedback).to.equal(CheckAudioOutputFeedback.Success);
    });

    it('unsuccessful after playing tone', async () => {
      const failureCallback = (): Promise<boolean> => {
        return new Promise(resolve => {
          resolve(false);
        });
      };

      const audioOutputFeedback: CheckAudioOutputFeedback = await meetingReadinessCheckerController.checkAudioOutput(
        getMediaDeviceInfo('1', 'audiooutput', 'label', 'group-id'),
        failureCallback
      );
      expect(audioOutputFeedback).to.equal(CheckAudioOutputFeedback.Failure);
    });

    it('unsuccessful after playing tone - callback throws error', async () => {
      const failureCallback = (): Promise<boolean> => {
        throw new Error();
      };

      const audioOutputFeedback: CheckAudioOutputFeedback = await meetingReadinessCheckerController.checkAudioOutput(
        getMediaDeviceInfo('1', 'audiooutput', 'label', 'group-id'),
        failureCallback
      );
      expect(audioOutputFeedback).to.equal(CheckAudioOutputFeedback.Failure);
    });
  });

  describe('checks video input', () => {
    it('granted permission by browser', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      const videoCheckFeedback: CheckVideoInputFeedback = await meetingReadinessCheckerController.checkVideoInput(
        getMediaDeviceInfo('1', 'videoinput', 'label', 'group-id')
      );
      expect(videoCheckFeedback).to.equal(CheckVideoInputFeedback.Success);
    });

    it('granted permission by user', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      domMockBehavior.asyncWaitMs = 100;
      const videoCheckFeedback: CheckVideoInputFeedback = await meetingReadinessCheckerController.checkVideoInput(
        getMediaDeviceInfo('1', 'videoinput', 'label', 'group-id')
      );
      expect(videoCheckFeedback).to.equal(CheckVideoInputFeedback.Success);
    });

    it('denies the permission by browser', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      const videoCheckFeedback: CheckVideoInputFeedback = await meetingReadinessCheckerController.checkVideoInput(
        new MediaDeviceInfo()
      );
      expect(videoCheckFeedback).to.equal(CheckVideoInputFeedback.PermissionDenied);
    });

    it('denies the permission by user', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
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
      expect(videoCheckFeedback).to.equal(CheckVideoInputFeedback.Failure);
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
      expect(cameraResolutionFeedback).to.equal(CheckCameraResolutionFeedback.Success);
    });

    it('checks for 240 x 320 resolution - failure', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.Failure;
      const cameraResolutionFeedback: CheckCameraResolutionFeedback = await meetingReadinessCheckerController.checkCameraResolution(
        new MediaDeviceInfo(),
        240,
        320
      );
      expect(cameraResolutionFeedback).to.equal(CheckCameraResolutionFeedback.Failure);
    });

    it('checks for 7680 × 4320 resolution - overconstrained', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      domMockBehavior.getUserMediaResult = UserMediaState.OverConstrained;
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
      domMockBehavior.getUserMediaResult = UserMediaState.PermissionDenied;
      const cameraResolutionFeedback: CheckCameraResolutionFeedback = await meetingReadinessCheckerController.checkCameraResolution(
        new MediaDeviceInfo(),
        240,
        320
      );
      expect(cameraResolutionFeedback).to.equal(CheckCameraResolutionFeedback.PermissionDenied);
    });
  });

  describe('checks content share connectivity', () => {
    it('permission denied', async () => {
      domMockBehavior.getDisplayMediaResult = DisplayMediaState.PermissionDenied;
      const result: CheckContentShareConnectivityFeedback = await meetingReadinessCheckerController.checkContentShareConnectivity();
      expect(result).to.equal(CheckContentShareConnectivityFeedback.PermissionDenied);
    }).timeout(5000);

    it('failure', async () => {
      domMockBehavior.getDisplayMediaResult = DisplayMediaState.Failure;
      const result: CheckContentShareConnectivityFeedback = await meetingReadinessCheckerController.checkContentShareConnectivity();
      expect(result).to.equal(CheckContentShareConnectivityFeedback.Failure);
    }).timeout(5000);

    it('start content share success', async () => {
      domMockBehavior.getDisplayMediaResult = DisplayMediaState.Success;
      const result: CheckContentShareConnectivityFeedback = await meetingReadinessCheckerController.checkContentShareConnectivity();
      expect(result).to.equal(CheckContentShareConnectivityFeedback.Success);
    }).timeout(10000);

    it('connection failure', async () => {
      attendeeAudioVideoController.skipStart = true;
      const result: CheckContentShareConnectivityFeedback = await meetingReadinessCheckerController.checkContentShareConnectivity();
      expect(result).to.equal(CheckContentShareConnectivityFeedback.ConnectionFailure);
    }).timeout(15000);

    it('start content share timed out', async () => {
      contentAudioVideoController.attendeePresenceId = 'attendeeId2';
      const result: CheckContentShareConnectivityFeedback = await meetingReadinessCheckerController.checkContentShareConnectivity();
      expect(result).to.equal(CheckContentShareConnectivityFeedback.Timeout);
    }).timeout(20000);
  });

  describe('checks audio connection', () => {
    it('permission denied', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      const result = await meetingReadinessCheckerController.checkAudioConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckAudioConnectivityFeedback.AudioInputPermissionDenied);
    });

    it('fail to get audio input', async () => {
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(
        logger,
        new TestMeetingSession(makeSessionConfiguration(), logger, new NoOpDeviceController())
      );
      const result = await meetingReadinessCheckerController.checkAudioConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckAudioConnectivityFeedback.FailureToGetAudioInput);
    });

    it('connection failure', async () => {
      attendeeAudioVideoController.skipStart = true;
      const result = await meetingReadinessCheckerController.checkAudioConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckAudioConnectivityFeedback.ConnectionFailure);
    }).timeout(15000);

    it('time out with no audio presence', async () => {
      attendeeAudioVideoController.attendeePresenceId = 'attendeeId2';
      const result = await meetingReadinessCheckerController.checkAudioConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckAudioConnectivityFeedback.NoAudioPresence);
    }).timeout(20000);

    it('success', async () => {
      const result = await meetingReadinessCheckerController.checkAudioConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckAudioConnectivityFeedback.Success);
    }).timeout(10000);
  });

  describe('check video connection', () => {
    it('permission denied', async () => {
      domMockBehavior.getUserMediaSucceeds = false;
      const result = await meetingReadinessCheckerController.checkVideoConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckVideoConnectivityFeedback.VideoInputPermissionDenied);
    });

    it('fail to get video input', async () => {
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(
        logger,
        new TestMeetingSession(makeSessionConfiguration(), logger, new NoOpDeviceController())
      );
      const result = await meetingReadinessCheckerController.checkVideoConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckVideoConnectivityFeedback.FailureToGetVideoInput);
    });

    it('connection failure', async () => {
      attendeeAudioVideoController.skipStart = true;
      const result = await meetingReadinessCheckerController.checkVideoConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckVideoConnectivityFeedback.ConnectionFailure);
    }).timeout(15000);

    it('no rtc connection', async () => {
      attendeeAudioVideoController.noRTCConnection = true;
      const result = await meetingReadinessCheckerController.checkVideoConnectivity(
        new MediaDeviceInfo()
      );
      expect(result).to.equal(CheckVideoConnectivityFeedback.NoPackageSentToServer);
    }).timeout(20000);

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
      expect(result).to.equal(CheckVideoConnectivityFeedback.NoPackageSentToServer);
    }).timeout(20000);

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
      expect(result).to.equal(CheckVideoConnectivityFeedback.Success);
    }).timeout(10000);
  });

  describe('check TCP connection', () => {
    it('meeting session not initialized', async () => {
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(logger, null);
      const result = await meetingReadinessCheckerController.checkNetworkTCPConnectivity();
      expect(result).to.equal(CheckNetworkTCPConnectivityFeedback.MeetingSessionNotInitialized);
    });

    it('connection failure', async () => {
      attendeeAudioVideoController.skipStart = true;
      const result = await meetingReadinessCheckerController.checkNetworkTCPConnectivity();
      expect(result).to.equal(CheckNetworkTCPConnectivityFeedback.ConnectionFailure);
    }).timeout(15000);

    it('no rtc connection', async () => {
      attendeeAudioVideoController.noRTCConnection = true;
      const result = await meetingReadinessCheckerController.checkNetworkTCPConnectivity();
      expect(result).to.equal(CheckNetworkTCPConnectivityFeedback.ICENegotiationUnsuccessful);
    }).timeout(20000);

    it('no candidate-pair info', async () => {
      domMockBehavior.rtcPeerConnectionGetStatsReport = {
        kind: 'audio',
        mediaType: 'audio',
        type: 'outbound-rtp',
      };
      const result = await meetingReadinessCheckerController.checkNetworkTCPConnectivity();
      expect(result).to.equal(CheckNetworkTCPConnectivityFeedback.ICENegotiationUnsuccessful);
    }).timeout(20000);

    it('success', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      domMockBehavior.rtcPeerConnectionGetStatsReport = {
        state: 'succeeded',
        type: 'candidate-pair',
      };
      const result = await meetingReadinessCheckerController.checkNetworkTCPConnectivity();
      expect(result).to.equal(CheckNetworkTCPConnectivityFeedback.Success);
    }).timeout(10000);
  });

  describe('check UDP connection', () => {
    it('meeting session not initialized', async () => {
      meetingReadinessCheckerController = new DefaultMeetingReadinessChecker(logger, null);
      const result = await meetingReadinessCheckerController.checkNetworkUDPConnectivity();
      expect(result).to.equal(CheckNetworkUDPConnectivityFeedback.MeetingSessionNotInitialized);
    });

    it('connection failure', async () => {
      attendeeAudioVideoController.skipStart = true;
      const result = await meetingReadinessCheckerController.checkNetworkUDPConnectivity();
      expect(result).to.equal(CheckNetworkUDPConnectivityFeedback.ConnectionFailure);
    }).timeout(15000);

    it('no rtc connection', async () => {
      attendeeAudioVideoController.noRTCConnection = true;
      const result = await meetingReadinessCheckerController.checkNetworkUDPConnectivity();
      expect(result).to.equal(CheckNetworkUDPConnectivityFeedback.ICENegotiationUnsuccessful);
    }).timeout(20000);

    it('no candidate-pair info', async () => {
      domMockBehavior.rtcPeerConnectionGetStatsReport = {
        kind: 'audio',
        mediaType: 'audio',
        type: 'outbound-rtp',
      };
      const result = await meetingReadinessCheckerController.checkNetworkUDPConnectivity();
      expect(result).to.equal(CheckNetworkUDPConnectivityFeedback.ICENegotiationUnsuccessful);
    }).timeout(20000);

    it('success', async () => {
      domMockBehavior.getUserMediaSucceeds = true;
      domMockBehavior.rtcPeerConnectionGetStatsReport = {
        state: 'succeeded',
        type: 'candidate-pair',
      };
      const result = await meetingReadinessCheckerController.checkNetworkUDPConnectivity();
      expect(result).to.equal(CheckNetworkUDPConnectivityFeedback.Success);
    }).timeout(10000);
  });
});
