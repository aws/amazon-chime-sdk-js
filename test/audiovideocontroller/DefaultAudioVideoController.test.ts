// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';

import {
  DefaultDevicePixelRatioMonitor,
  DefaultSignalingClient,
  DefaultTransceiverController,
  DefaultVideoStreamIdSet,
  DefaultVideoStreamIndex,
  DefaultVideoTile,
  DefaultVideoTileController,
  DefaultVideoTileFactory,
  DevicePixelRatioWindowSource,
  NoOpLogger,
  ServerSideNetworkAdaption,
  SignalingClientVideoSubscriptionConfiguration,
  TargetDisplaySize,
  VideoCodecCapability,
  VideoPriorityBasedPolicyConfig,
  VideoTile,
} from '../../src';
import Attendee from '../../src/attendee/Attendee';
import AudioProfile from '../../src/audioprofile/AudioProfile';
import DefaultAudioVideoController from '../../src/audiovideocontroller/DefaultAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import Backoff from '../../src/backoff/Backoff';
import ConnectionHealthPolicyConfiguration from '../../src/connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import ContentShareConstants from '../../src/contentsharecontroller/ContentShareConstants';
import NoOpDeviceController from '../../src/devicecontroller/NoOpDeviceController';
import VideoQualitySettings from '../../src/devicecontroller/VideoQualitySettings';
import DefaultEventController from '../../src/eventcontroller/DefaultEventController';
import EventAttributes from '../../src/eventcontroller/EventAttributes';
import EventController from '../../src/eventcontroller/EventController';
import EventName from '../../src/eventcontroller/EventName';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import NoOpMediaStreamBroker from '../../src/mediastreambroker/NoOpMediaStreamBroker';
import MediaStreamBrokerObserver from '../../src/mediastreambrokerobserver/MediaStreamBrokerObserver';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import DefaultReconnectController from '../../src/reconnectcontroller/DefaultReconnectController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import {
  SdkAudioMetadataFrame,
  SdkAudioStreamIdInfo,
  SdkAudioStreamIdInfoFrame,
  SdkIndexFrame,
  SdkJoinAckFrame,
  SdkLeaveAckFrame,
  SdkPrimaryMeetingJoinAckFrame,
  SdkPrimaryMeetingLeaveFrame,
  SdkServerSideNetworkAdaption,
  SdkSignalFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
  SdkSubscribeAckFrame,
  SdkTurnCredentials,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import SimulcastLayers from '../../src/simulcastlayers/SimulcastLayers';
import CleanStoppedSessionTask from '../../src/task/CleanStoppedSessionTask';
import OpenSignalingConnectionTask from '../../src/task/OpenSignalingConnectionTask';
import { wait as delay } from '../../src/utils/Utils';
import AllHighestVideoBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/AllHighestVideoBandwidthPolicy';
import VideoAdaptiveProbePolicy from '../../src/videodownlinkbandwidthpolicy/VideoAdaptiveProbePolicy';
import VideoPreference from '../../src/videodownlinkbandwidthpolicy/VideoPreference';
import { VideoPreferences } from '../../src/videodownlinkbandwidthpolicy/VideoPreferences';
import VideoPriorityBasedPolicy from '../../src/videodownlinkbandwidthpolicy/VideoPriorityBasedPolicy';
import VideoSource from '../../src/videosource/VideoSource';
import DefaultSimulcastUplinkPolicy from '../../src/videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicy';
import NoVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NoVideoUplinkBandwidthPolicy';
import NScaleVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import ChromeSDPMock from '../sdp/ChromeSDPMock';

const defaultDelay = new DOMMockBehavior().asyncWaitMs * 5;

// longjohn makes it possible for us to see async stack traces across timers,
// which is exceptionally useful when working in this file.
const longjohn = require('longjohn');
longjohn.async_trace_limit = -1; // unlimited

chai.use(chaiAsPromised);

describe('DefaultAudioVideoController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const rtpCandidateMock =
    'candidate:MOCK9004 1 udp 2122260223 10.88.178.121 52788 typ host generation 0 ufrag PWwO network-id 2 network-cost 50';

  const SAFARI_13_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.2 Safari/605.1.15';

  const CHROME_116_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';

  let audioVideoController: DefaultAudioVideoController;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let configuration: MeetingSessionConfiguration;
  let reconnectController: DefaultReconnectController;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let eventController: EventController;

  const defaultAttendeeId = 'foo-attendee';

  class TestBackoff implements Backoff {
    reset(): void {}

    nextBackoffAmountMs(): number {
      return 1;
    }
  }

  function setUserAgent(userAgent: string): void {
    // @ts-ignore
    navigator.userAgent = userAgent;
  }

  function makeSessionConfiguration(): MeetingSessionConfiguration {
    const configuration = new MeetingSessionConfiguration();
    configuration.meetingId = 'foo-meeting';
    configuration.urls = new MeetingSessionURLs();
    configuration.urls.audioHostURL = 'https://audiohost.test.example.com';
    configuration.urls.turnControlURL = 'https://turncontrol.test.example.com';
    configuration.urls.signalingURL = 'https://signaling.test.example.com';
    configuration.credentials = new MeetingSessionCredentials();
    configuration.credentials.attendeeId = defaultAttendeeId;
    configuration.credentials.joinToken = 'foo-join-token';
    configuration.attendeePresenceTimeoutMs = 5000;
    return configuration;
  }

  // For JoinAndReceiveIndexTask
  function makeJoinAckFrame(
    withJoinAckFrame: boolean = true,
    defaultServerSideNetworkAdaption: SdkServerSideNetworkAdaption = SdkServerSideNetworkAdaption.NONE
  ): Uint8Array {
    const joinAckFrame = SdkJoinAckFrame.create();
    joinAckFrame.turnCredentials = SdkTurnCredentials.create();
    joinAckFrame.turnCredentials.username = 'fake-username';
    joinAckFrame.turnCredentials.password = 'fake-password';
    joinAckFrame.turnCredentials.ttl = 300;
    joinAckFrame.turnCredentials.uris = ['fake-turn', 'fake-turns'];
    joinAckFrame.defaultServerSideNetworkAdaption = defaultServerSideNetworkAdaption;
    const joinAckSignal = SdkSignalFrame.create();
    joinAckSignal.type = SdkSignalFrame.Type.JOIN_ACK;
    if (withJoinAckFrame) {
      joinAckSignal.joinack = joinAckFrame;
    }
    const buffer = SdkSignalFrame.encode(joinAckSignal).finish();
    const joinAckSignalBuffer = new Uint8Array(buffer.length + 1);
    joinAckSignalBuffer[0] = 0x5;
    joinAckSignalBuffer.set(buffer, 1);
    return joinAckSignalBuffer;
  }

  function makeIndexFrame(sources?: SdkStreamDescriptor[]): Uint8Array {
    const indexFrame = SdkIndexFrame.create();
    if (sources) {
      indexFrame.sources = sources;
    }
    const indexSignal = SdkSignalFrame.create();
    indexSignal.type = SdkSignalFrame.Type.INDEX;
    indexSignal.index = indexFrame;
    const buffer = SdkSignalFrame.encode(indexSignal).finish();
    const indexSignalBuffer = new Uint8Array(buffer.length + 1);
    indexSignalBuffer[0] = 0x5;
    indexSignalBuffer.set(buffer, 1);
    return indexSignalBuffer;
  }

  const makeIndexFrameWithAttendees = (attendees: Attendee[]): Uint8Array => {
    const sources = attendees.map(({ attendeeId, externalUserId }) => {
      const streamDescriptor = SdkStreamDescriptor.create();
      streamDescriptor.attendeeId = attendeeId;
      streamDescriptor.externalUserId = externalUserId;
      streamDescriptor.mediaType = SdkStreamMediaType.VIDEO;
      return streamDescriptor;
    });
    return makeIndexFrame(sources);
  };

  // For SubscribeAndReceiveSubscribeAckTask
  function makeSubscribeAckFrame(): Uint8Array {
    const frame = SdkSubscribeAckFrame.create();
    frame.sdpAnswer = 'sdp-answer';
    const signal = SdkSignalFrame.create();
    signal.type = SdkSignalFrame.Type.SUBSCRIBE_ACK;
    signal.suback = frame;
    const buffer = SdkSignalFrame.encode(signal).finish();
    const subscribeAckBuffer = new Uint8Array(buffer.length + 1);
    subscribeAckBuffer[0] = 0x5;
    subscribeAckBuffer.set(buffer, 1);
    return subscribeAckBuffer;
  }

  // For LeaveAndReceiveLeaveAckTask
  function makeLeaveAckFrame(): Uint8Array {
    const frame = SdkLeaveAckFrame.create();
    const signal = SdkSignalFrame.create();
    signal.type = SdkSignalFrame.Type.LEAVE_ACK;
    signal.leaveAck = frame;
    const buffer = SdkSignalFrame.encode(signal).finish();
    const leaveAckBuffer = new Uint8Array(buffer.length + 1);
    leaveAckBuffer[0] = 0x5;
    leaveAckBuffer.set(buffer, 1);
    return leaveAckBuffer;
  }

  // For ListenForVolumeIndicatorsTask
  function makeAudioStreamIdInfoFrame(attendeeId: string = defaultAttendeeId): Uint8Array {
    const streamInfo = SdkAudioStreamIdInfo.create();
    streamInfo.audioStreamId = 1;
    streamInfo.attendeeId = attendeeId;
    streamInfo.externalUserId = attendeeId;
    const frame = SdkAudioStreamIdInfoFrame.create();
    frame.streams = [streamInfo];
    const signal = SdkSignalFrame.create();
    signal.type = SdkSignalFrame.Type.AUDIO_STREAM_ID_INFO;
    signal.audioStreamIdInfo = frame;
    const buffer = SdkSignalFrame.encode(signal).finish();
    const audioStreamIdInfoBuffer = new Uint8Array(buffer.length + 1);
    audioStreamIdInfoBuffer[0] = 0x5;
    audioStreamIdInfoBuffer.set(buffer, 1);
    return audioStreamIdInfoBuffer;
  }

  // For ListenForVolumeIndicatorsTask
  function makeAudioMetadataFrame(): Uint8Array {
    const frame = SdkAudioMetadataFrame.create();
    const signal = SdkSignalFrame.create();
    signal.type = SdkSignalFrame.Type.AUDIO_METADATA;
    signal.audioMetadata = frame;
    const buffer = SdkSignalFrame.encode(signal).finish();
    const audioMetadataBuffer = new Uint8Array(buffer.length + 1);
    audioMetadataBuffer[0] = 0x5;
    audioMetadataBuffer.set(buffer, 1);
    return audioMetadataBuffer;
  }

  function makePrimaryMeetingJoinAckFrame(): Uint8Array {
    const joinAckFrame = SdkPrimaryMeetingJoinAckFrame.create();
    const joinAckSignal = SdkSignalFrame.create();
    joinAckSignal.type = SdkSignalFrame.Type.PRIMARY_MEETING_JOIN_ACK;
    joinAckSignal.primaryMeetingJoinAck = joinAckFrame;
    const buffer = SdkSignalFrame.encode(joinAckSignal).finish();
    const joinAckSignalBuffer = new Uint8Array(buffer.length + 1);
    joinAckSignalBuffer[0] = 0x5;
    joinAckSignalBuffer.set(buffer, 1);
    return joinAckSignalBuffer;
  }

  function makePrimaryMeetingLeaveFrame(): Uint8Array {
    const leaveFrame = SdkPrimaryMeetingLeaveFrame.create();
    const leaveSignal = SdkSignalFrame.create();
    leaveSignal.type = SdkSignalFrame.Type.PRIMARY_MEETING_LEAVE;
    leaveSignal.primaryMeetingLeave = leaveFrame;
    const buffer = SdkSignalFrame.encode(leaveSignal).finish();
    const leaveSignalBuffer = new Uint8Array(buffer.length + 1);
    leaveSignalBuffer[0] = 0x5;
    leaveSignalBuffer.set(buffer, 1);
    return leaveSignalBuffer;
  }

  // For FinishGatheringICECandidatesTask
  function makeICEEvent(candidateStr: string | null): RTCPeerConnectionIceEvent {
    if (candidateStr === null) {
      return new RTCPeerConnectionIceEvent('icecandidate', {});
    }

    let iceCandidate: RTCIceCandidate = null;
    if (candidateStr) {
      // @ts-ignore
      iceCandidate = { candidate: candidateStr };
    }
    const iceEventInit: RTCPeerConnectionIceEventInit = {
      candidate: iceCandidate,
      url: 'test-foo-url',
    };
    return new RTCPeerConnectionIceEvent('icecandidate', iceEventInit);
  }

  async function sendICEEventAndSubscribeAckFrame(): Promise<void> {
    await delay(defaultDelay);
    // @ts-ignore
    audioVideoController.rtcPeerConnection.dispatchEvent(makeICEEvent(rtpCandidateMock));
    await delay(defaultDelay);
    webSocketAdapter.send(makeSubscribeAckFrame());
    await delay(defaultDelay);
  }

  async function sendAudioStreamIdInfoFrame(): Promise<void> {
    await delay(defaultDelay);
    webSocketAdapter.send(makeAudioStreamIdInfoFrame());
    await delay(defaultDelay);
  }

  async function start(
    defaultServerSideNetworkAdaption: SdkServerSideNetworkAdaption = SdkServerSideNetworkAdaption.NONE
  ): Promise<void> {
    await delay(defaultDelay);
    audioVideoController.start();
    await delay(defaultDelay);
    webSocketAdapter.send(makeJoinAckFrame(true, defaultServerSideNetworkAdaption));
    await delay(defaultDelay);
    webSocketAdapter.send(makeIndexFrame());
    await delay(300);
    await sendICEEventAndSubscribeAckFrame();
    await delay(defaultDelay);
    await sendAudioStreamIdInfoFrame();
    await delay(defaultDelay);
  }

  async function stop(): Promise<void> {
    await delay(defaultDelay);
    audioVideoController.stop();
    await delay(defaultDelay);
    webSocketAdapter.send(makeLeaveAckFrame());
    await delay(defaultDelay);
  }

  async function reconnect(): Promise<void> {
    await delay(defaultDelay);
    audioVideoController.reconnect(new MeetingSessionStatus(MeetingSessionStatusCode.OK), null);
    await delay(defaultDelay);
    webSocketAdapter.send(makeJoinAckFrame());
    await delay(defaultDelay);
    await delay(defaultDelay);
    webSocketAdapter.send(makeJoinAckFrame());
    webSocketAdapter.send(makeIndexFrame());
    await delay(300);
    await sendICEEventAndSubscribeAckFrame();
  }

  beforeEach(async () => {
    domMockBehavior = new DOMMockBehavior();
    // This will let FinishGatheringICECandidatesTask wait until receiving the ICE event.
    domMockBehavior.rtcPeerConnectionCreateOfferIncludesLocalHost = true;
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    webSocketAdapter = new DefaultWebSocketAdapter(new NoOpDebugLogger());
    configuration = makeSessionConfiguration();
    reconnectController = new DefaultReconnectController(120 * 1000, new TestBackoff());
    eventController = new DefaultEventController(configuration, new NoOpLogger());
  });

  afterEach(() => {
    webSocketAdapter.close();
    webSocketAdapter.destroy();
    domMockBuilder.cleanup();
  });

  describe('start', () => {
    it('can be started without policies in configuration', async () => {
      configuration.videoUplinkBandwidthPolicy = null;
      configuration.videoDownlinkBandwidthPolicy = null;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          // use this opportunity to verify that start is idempotent
          audioVideoController.start();
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const obsever = new TestObserver();
      audioVideoController.addObserver(obsever);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      new TimeoutScheduler(10).start(() => {
        // use this opportunity to verify that start cannot happen while connecting
        audioVideoController.start();
      });

      await delay(defaultDelay);
      // use this opportunity to test signaling mute state to the server
      audioVideoController.realtimeController.realtimeMuteLocalAudio();
      audioVideoController.realtimeController.realtimeUnmuteLocalAudio();

      await delay(defaultDelay);
      // use this opportunity to test volume indicators
      webSocketAdapter.send(makeJoinAckFrame());
      await delay(defaultDelay);
      webSocketAdapter.send(makeIndexFrame());
      webSocketAdapter.send(makeAudioStreamIdInfoFrame());
      webSocketAdapter.send(makeAudioMetadataFrame());

      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;

      await stop();
      audioVideoController.removeObserver(obsever);
    });

    it('can be started with a pre-start', async () => {
      configuration.videoUplinkBandwidthPolicy = null;
      configuration.videoDownlinkBandwidthPolicy = null;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          // use this opportunity to verify that start is idempotent
          audioVideoController.start();
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);

      await audioVideoController.startReturningPromise({ signalingOnly: true });

      // Give it a moment.
      await delay(100);

      // Now proceed with the start. Everything should still work.
      await start();

      await delay(defaultDelay);
      webSocketAdapter.send(makeJoinAckFrame());
      await delay(defaultDelay);
      webSocketAdapter.send(makeIndexFrame());
      webSocketAdapter.send(makeAudioStreamIdInfoFrame());
      webSocketAdapter.send(makeAudioMetadataFrame());

      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;

      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('can stop after only pre-start', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      // This is a no-op.
      await audioVideoController.stopReturningPromise();

      // @ts-ignore
      expect(audioVideoController.meetingSessionContext.signalingClient).to.be.null;

      await audioVideoController.startReturningPromise({ signalingOnly: true });

      // Only the signaling connection is opened.
      expect(audioVideoController.rtcPeerConnection).to.be.null;

      // It's ready.
      // @ts-ignore
      expect(audioVideoController.meetingSessionContext.signalingClient.ready()).to.be.true;

      await audioVideoController.stopReturningPromise();

      // The socket connection doesn't return a promise when it stops.
      await delay(0);

      // Now it's been closed.
      // @ts-ignore
      expect(audioVideoController.meetingSessionContext.signalingClient.ready()).to.be.false;
    });

    it('is resilient against pre-start errors', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      const fake = sinon.fake.rejects('oh no');
      sinon.replace(OpenSignalingConnectionTask.prototype, 'run', fake);

      // No worries.
      await audioVideoController.startReturningPromise({ signalingOnly: true });

      sinon.restore();

      await stop();
    });

    it('can be started with null audio host url', async () => {
      configuration.videoUplinkBandwidthPolicy = null;
      configuration.videoDownlinkBandwidthPolicy = null;
      configuration.urls.audioHostURL = null;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      await delay(defaultDelay);
      webSocketAdapter.send(makeJoinAckFrame());
      await delay(defaultDelay);
      webSocketAdapter.send(makeIndexFrame());
      webSocketAdapter.send(makeAudioStreamIdInfoFrame());
      webSocketAdapter.send(makeAudioMetadataFrame());

      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;

      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('can be started with customized audio and video policies', async () => {
      const myUplinkPolicy = new NScaleVideoUplinkBandwidthPolicy('test');
      const myDownlinkPolicy = new AllHighestVideoBandwidthPolicy('test');
      configuration.videoUplinkBandwidthPolicy = myUplinkPolicy;
      configuration.videoDownlinkBandwidthPolicy = myDownlinkPolicy;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      const audioProfile = AudioProfile.fullbandSpeechMono();
      audioVideoController.setAudioProfile(audioProfile);

      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          // use this opportunity to verify that start is idempotent
          audioVideoController.start();
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      new TimeoutScheduler(10).start(() => {
        // use this opportunity to verify that start cannot happen while connecting
        audioVideoController.start();
      });

      await delay(defaultDelay);
      // use this opportunity to test signaling mute state to the server
      audioVideoController.realtimeController.realtimeMuteLocalAudio();
      audioVideoController.realtimeController.realtimeUnmuteLocalAudio();

      await delay(defaultDelay);
      // use this opportunity to test volume indicators
      webSocketAdapter.send(makeJoinAckFrame());
      await delay(defaultDelay);
      webSocketAdapter.send(makeIndexFrame());
      webSocketAdapter.send(makeAudioStreamIdInfoFrame());
      webSocketAdapter.send(makeAudioMetadataFrame());

      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;
      // @ts-ignore
      expect(audioVideoController.meetingSessionContext.audioProfile).to.equal(audioProfile);
      // @ts-ignore
      expect(audioVideoController.meetingSessionContext.videoDownlinkBandwidthPolicy).to.equal(
        myDownlinkPolicy
      );
      // @ts-ignore
      expect(audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy).to.equal(
        myUplinkPolicy
      );

      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('can be started with customized video simulcast downlink policy', async () => {
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      const logger = new NoOpDebugLogger();
      const myDownlinkPolicy = new VideoAdaptiveProbePolicy(logger);
      configuration.videoDownlinkBandwidthPolicy = myDownlinkPolicy;
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      const bindTileControllerSpy = sinon.spy(
        configuration.videoDownlinkBandwidthPolicy,
        'bindToTileController'
      );

      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      await delay(defaultDelay);
      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;

      // @ts-ignore
      expect(audioVideoController.meetingSessionContext.videoDownlinkBandwidthPolicy).to.equal(
        myDownlinkPolicy
      );

      expect(bindTileControllerSpy.calledOnce).to.be.true;

      await sendICEEventAndSubscribeAckFrame();
      await delay(defaultDelay);
      await stop();
      audioVideoController.removeObserver(observer);
      expect(bindTileControllerSpy.calledTwice).to.be.true;
      bindTileControllerSpy.restore();
    });

    it('can be started with default simulcast uplink and downlink policy', async () => {
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      const logger = new NoOpDebugLogger();

      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      await delay(defaultDelay);
      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;

      // @ts-ignore
      const uplink = audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy;
      expect(uplink instanceof DefaultSimulcastUplinkPolicy).to.be.true;
      // @ts-ignore
      const downlink = audioVideoController.meetingSessionContext.videoDownlinkBandwidthPolicy;
      expect(downlink instanceof VideoAdaptiveProbePolicy).to.be.true;

      await sendICEEventAndSubscribeAckFrame();
      await delay(defaultDelay);
      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('can be started with customized video simulcast uplink policy', async () => {
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      const logger = new NoOpDebugLogger();
      const myUplinkPolicy = new DefaultSimulcastUplinkPolicy('test', logger);
      configuration.videoUplinkBandwidthPolicy = myUplinkPolicy;
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      await delay(defaultDelay);
      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;

      // @ts-ignore
      expect(audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy).to.equal(
        myUplinkPolicy
      );

      await sendICEEventAndSubscribeAckFrame();
      await delay(defaultDelay);
      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('can be started and take a bandwidth update', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      // use this opportunity to verify that these can be called before start
      const MAX_BANDWIDTH_KBPS = 100;
      audioVideoController.setVideoMaxBandwidthKbps(MAX_BANDWIDTH_KBPS);
      audioVideoController.handleHasBandwidthPriority(false);

      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      await delay(defaultDelay);
      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;
      audioVideoController.handleHasBandwidthPriority(false);
      audioVideoController.handleHasBandwidthPriority(true);
      audioVideoController.handleHasBandwidthPriority(true);
      // @ts-ignore mutate the policy state to trigger bandwidth reduction
      audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy.numParticipants = 4;
      expect(
        // @ts-ignore to ensure that calling setVideoMaxBandwidthKbps works.
        audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy.maxBandwidthKbps()
      ).to.equal(MAX_BANDWIDTH_KBPS);
      audioVideoController.handleHasBandwidthPriority(false);
      await sendICEEventAndSubscribeAckFrame();
      await delay(defaultDelay);
      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('can be started and take a bandwidth update without update transceiver controller method', async () => {
      class TestVideoUplinkBandwidth extends NoVideoUplinkBandwidthPolicy {
        hasBandwidthPriority: boolean = false;

        setHasBandwidthPriority(hasBandwidthPriority: boolean): void {
          this.hasBandwidthPriority = hasBandwidthPriority;
        }

        maxBandwidthKbps(): number {
          if (this.hasBandwidthPriority) {
            return 100;
          }
          return 0;
        }
      }
      const policy = new TestVideoUplinkBandwidth();
      const spy1 = sinon.spy(policy, 'setHasBandwidthPriority');
      const spy2 = sinon.spy(policy, 'maxBandwidthKbps');
      const logger = new NoOpDebugLogger();
      const spy3 = sinon.spy(logger, 'info');
      configuration.videoUplinkBandwidthPolicy = policy;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      await start();
      await delay(defaultDelay);
      spy3.resetHistory();
      await audioVideoController.handleHasBandwidthPriority(true);
      expect(spy1.calledOnceWith(true)).to.be.true;
      expect(spy2.calledTwice).to.be.true;
      expect(spy3.calledOnce).to.be.true;
      await audioVideoController.handleHasBandwidthPriority(true);
      expect(spy1.calledWith(true)).to.be.true;
      expect(spy2.callCount).to.be.equal(4);
      expect(spy3.calledOnce).to.be.true;
      spy1.restore();
      spy2.restore();
      spy3.restore();
    });

    it('can be started and take a bandwidth update with update transceiver controller method', async () => {
      const policy = new NScaleVideoUplinkBandwidthPolicy('test');
      const spy = sinon.spy(policy, 'updateTransceiverController');
      configuration.videoUplinkBandwidthPolicy = policy;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      await start();
      await delay(defaultDelay);
      expect(spy.calledOnce).to.be.true;
      audioVideoController.setVideoMaxBandwidthKbps(100);
      audioVideoController.handleHasBandwidthPriority(true);
      expect(spy.calledTwice).to.be.true;
      await stop();
      spy.restore();
    });

    it('can be started and stopped multiple times with transceiver controller set correctly', async function () {
      this.timeout(5000); // Need to increase the default mocha timeout of 2000ms
      const policy = new NScaleVideoUplinkBandwidthPolicy('test');
      const spy = sinon.spy(policy, 'setTransceiverController');
      configuration.videoUplinkBandwidthPolicy = policy;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      await start();
      await delay(defaultDelay);
      expect(spy.callCount).to.be.equal(1);
      const transceiverControllerArg = spy.getCall(0).args[0];
      expect(spy.getCall(0).args[0]).not.be.undefined;
      await stop();
      await delay(defaultDelay);
      expect(spy.callCount).to.be.equal(2);
      expect(spy.getCall(1).args[0]).to.be.undefined;
      await start();
      await delay(defaultDelay);
      expect(spy.callCount).to.be.equal(3);
      expect(spy.getCall(2).args[0]).not.equal(transceiverControllerArg);
      await stop();
      await delay(defaultDelay);
      expect(spy.callCount).to.be.equal(4);
      expect(spy.getCall(3).args[0]).to.be.undefined;
      spy.restore();
    });

    it(
      'can be started and stopped multiple times and subscribe and unsubscribe from media stream broker observer' +
        ' correctly',
      async function () {
        this.timeout(5000); // Need to increase the default mocha timeout of 2000ms
        const mediaStreamBroker = new NoOpMediaStreamBroker();
        audioVideoController = new DefaultAudioVideoController(
          configuration,
          new NoOpDebugLogger(),
          webSocketAdapter,
          mediaStreamBroker,
          reconnectController
        );
        const spyAdd = sinon.spy(mediaStreamBroker, 'addMediaStreamBrokerObserver');
        const spyRemove = sinon.spy(mediaStreamBroker, 'removeMediaStreamBrokerObserver');
        await start();
        await delay(defaultDelay);
        expect(spyAdd.callCount).to.be.equal(1);
        await stop();
        await delay(defaultDelay);
        expect(spyRemove.callCount).to.be.equal(1);
        await start();
        await delay(defaultDelay);
        expect(spyAdd.callCount).to.be.equal(2);
        await stop();
        await delay(defaultDelay);
        expect(spyRemove.callCount).to.be.equal(2);
        spyAdd.restore();
        spyRemove.restore();
      }
    );

    it('can be started even when the stats collector has an issue starting due to an unsupported browser', async () => {
      setUserAgent(SAFARI_13_USER_AGENT);
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      let sessionStarted = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      await start();
      expect(sessionStarted).to.be.true;
      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('handles an error', async () => {
      configuration.connectionTimeoutMs = 100;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      const spy = sinon.spy(audioVideoController, 'handleMeetingSessionStatus');

      audioVideoController.start();
      await delay(defaultDelay);
      configuration.connectionTimeoutMs = 15000;
      audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.Left),
        null
      );
      await stop();
      expect(spy.called).to.be.true;
    });

    it('does not call the observer if it has been removed', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      let event = 0;
      let observed = 0;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          if (event !== 1 && event !== 3 && event !== 5) {
            assert.fail();
          }
          observed += 1;
        }
      }
      const observer = new TestObserver();
      await delay(defaultDelay);
      audioVideoController.addObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.audioVideoDidStart();
      });
      await delay(defaultDelay);
      audioVideoController.removeObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.audioVideoDidStart();
      });
      await delay(defaultDelay);
      audioVideoController.addObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.audioVideoDidStart();
      });
      await delay(defaultDelay);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.audioVideoDidStart();
      });
      audioVideoController.removeObserver(observer);
      await delay(defaultDelay);
      audioVideoController.addObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.audioVideoDidStart();
      });
      await delay(defaultDelay);
      expect(event).to.equal(5);
      expect(observed).to.equal(3);
      audioVideoController.removeObserver(observer);
    });

    it('can fail but does not reconnect', async () => {
      configuration.connectionTimeoutMs = 100;
      const logger = new NoOpDebugLogger();
      const spy = sinon.spy(logger, 'error');
      const events: { name: EventName; attributes: EventAttributes }[] = [];

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController,
        eventController
      );

      const result = new Promise((resolve, _reject) => {
        class TestObserver implements AudioVideoObserver {
          async audioVideoDidStop(sessionStatus: MeetingSessionStatus): Promise<void> {
            await delay(defaultDelay);
            expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.TaskFailed);
            expect(spy.calledWith(sinon.match('failed with status code TaskFailed'))).to.be.true;
            expect(events.map(({ name }) => name)).to.eql([
              'meetingStartRequested',
              'meetingStartFailed',
            ]);
            spy.restore();
            audioVideoController.removeObserver(observer);
            eventController.removeObserver(eventObserver);
            resolve(undefined);
          }
        }
        const eventObserver = {
          eventDidReceive(name: EventName, attributes: EventAttributes): void {
            events.push({
              name,
              attributes,
            });
          },
        };
        const observer = new TestObserver();
        audioVideoController.addObserver(observer);
        eventController.addObserver(eventObserver);
      });

      // Start and wait for the Join frame in JoinAndReceiveIndexTask.
      audioVideoController.start();
      reconnectController.disableReconnect();

      delay(configuration.connectionTimeoutMs + 50).then(() => {
        // Finish LeaveAndReceiveLeaveAckTask executed by the failed "start."
        webSocketAdapter.send(makeLeaveAckFrame());
        // Let the next round of the start operation not fail with the timeout.
        configuration.connectionTimeoutMs = 15000;
      });

      delay(configuration.connectionTimeoutMs + 100).then(async () => {
        // Finish the start operation and stop this test.
        await stop();
      });

      await result;
    });

    it('can be started with SVC config', async () => {
      setUserAgent(CHROME_116_USER_AGENT);
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      const logger = new NoOpDebugLogger();

      configuration.enableSVC = true;
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = false;

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      await delay(defaultDelay);
      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;

      // @ts-ignore
      const uplink = audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy;
      expect(uplink instanceof NScaleVideoUplinkBandwidthPolicy).to.be.true;

      await sendICEEventAndSubscribeAckFrame();
      await delay(defaultDelay);
      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('enable simulcast if both simulcast and SVC are selected', async () => {
      setUserAgent(CHROME_116_USER_AGENT);
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      const logger = new NoOpDebugLogger();

      configuration.enableSVC = true;
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      await delay(defaultDelay);
      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;

      // @ts-ignore
      const uplink = audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy;
      expect(uplink instanceof DefaultSimulcastUplinkPolicy).to.be.true;

      await sendICEEventAndSubscribeAckFrame();
      await delay(defaultDelay);
      await stop();
      audioVideoController.removeObserver(observer);
    });
  });

  describe('stop', () => {
    it('can be started and stopped', async () => {
      let called = false;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(): void {
          called = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      await start();
      await stop();
      expect(called).to.be.true;
      audioVideoController.removeObserver(observer);
    });

    it('can be stopped without having been started', () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      audioVideoController.stop();
    });

    it('can be stopped before stop and then stopped again', () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      audioVideoController.stop();
      audioVideoController.start();
      audioVideoController.stop();
    });

    it('disables reconnecting once stop is called', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.Left);
          expect(
            loggerSpy.calledWith(
              sinon.match('attendee left meeting, session will not be reconnected')
            )
          ).true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      await start();
      expect(
        reconnectController.retryWithBackoff(
          () => {},
          () => {}
        )
      ).to.be.true;
      await stop();
      expect(
        reconnectController.retryWithBackoff(
          () => {},
          () => {}
        )
      ).to.be.false;
      audioVideoController.removeObserver(observer);
    });
  });

  describe('update', () => {
    it('can be started and then start and stop a local video tile', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      let sessionStarted = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      await start();
      const tileId = audioVideoController.videoTileController.startLocalVideoTile();
      expect(tileId).to.equal(1);
      await sendICEEventAndSubscribeAckFrame();
      audioVideoController.videoTileController.stopLocalVideoTile();
      await sendICEEventAndSubscribeAckFrame();
      await stop();
      expect(sessionStarted).to.be.true;
      audioVideoController.removeObserver(observer);
    });

    it(
      'can be started and then start and stop a local video tile if video uplink does not implement set transceiver' +
        ' controller',
      async () => {
        class TestVideoUplinkBandwidth extends NoVideoUplinkBandwidthPolicy {
          hasBandwidthPriority: boolean = false;

          setHasBandwidthPriority(hasBandwidthPriority: boolean): void {
            this.hasBandwidthPriority = hasBandwidthPriority;
          }

          maxBandwidthKbps(): number {
            if (this.hasBandwidthPriority) {
              return 100;
            }
            return 0;
          }
        }
        const policy = new TestVideoUplinkBandwidth();
        configuration.videoUplinkBandwidthPolicy = policy;
        audioVideoController = new DefaultAudioVideoController(
          configuration,
          new NoOpDebugLogger(),
          webSocketAdapter,
          new NoOpMediaStreamBroker(),
          reconnectController
        );

        // @ts-ignore
        audioVideoController.meetingSessionContext.localVideoSender = new RTCRtpSender();
        let sessionStarted = false;
        class TestObserver implements AudioVideoObserver {
          audioVideoDidStart(): void {
            sessionStarted = true;
          }
        }
        const observer = new TestObserver();
        audioVideoController.addObserver(observer);
        expect(audioVideoController.configuration).to.equal(configuration);
        await start();
        const tileId = audioVideoController.videoTileController.startLocalVideoTile();
        expect(tileId).to.equal(1);
        await sendICEEventAndSubscribeAckFrame();
        audioVideoController.videoTileController.stopLocalVideoTile();
        await sendICEEventAndSubscribeAckFrame();
        await stop();
        expect(sessionStarted).to.be.true;
        audioVideoController.removeObserver(observer);
      }
    );

    it('restart local video if CreateSDP fails with IncompatibleSDP error', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      let sessionStarted = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      await start();
      domMockBehavior.rtcPeerConnectionUseCustomOffer = true;
      domMockBehavior.rtcPeerConnectionCustomOffer =
        ChromeSDPMock.PLAN_B_AUDIO_SENDRECV_VIDEO_SENDRECV;
      const tileId = audioVideoController.videoTileController.startLocalVideoTile();
      expect(tileId).to.equal(1);
      await sendICEEventAndSubscribeAckFrame();

      await delay(200);
      domMockBehavior.rtcPeerConnectionCustomOffer =
        ChromeSDPMock.PLAN_B_AUDIO_SENDRECV_VIDEO_SENDRECV_2;
      audioVideoController.update();
      await sendICEEventAndSubscribeAckFrame();
      await sendICEEventAndSubscribeAckFrame();
      await sendICEEventAndSubscribeAckFrame();
      await sendICEEventAndSubscribeAckFrame();
      await delay(500);
      await stop();
      expect(sessionStarted).to.be.true;
      await delay(500);
      audioVideoController.removeObserver(observer);
    }).timeout(5000);

    it('reconnects if the update fails with a task failed meeting status', async () => {
      let called = 0;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStartConnecting(reconnecting: boolean): void {
          if (called === 0) {
            expect(reconnecting).to.be.false;
          } else {
            expect(reconnecting).to.be.true;
          }
          called += 1;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);

      await start();
      configuration.connectionTimeoutMs = 100;
      audioVideoController.update();
      configuration.connectionTimeoutMs = 15000;
      // At this point, the update operation failed, performing the Reconnect action.
      // Finish the reconnect operation by sending required frames and events.
      await delay(200);
      webSocketAdapter.send(makeJoinAckFrame());
      await delay(100);
      webSocketAdapter.send(makeIndexFrame());
      await delay(200);
      await sendICEEventAndSubscribeAckFrame();
      await stop();
      expect(called).to.equal(2);
      audioVideoController.removeObserver(observer);
    }).timeout(4000);

    it('will skip renegotiation if video streams are not initialized', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .true;
    });

    it('will not skip renegotiation if we explicitly request it', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = undefined;

      audioVideoController.update({ needsRenegotiation: true });

      await stop();

      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .false;
    });

    it("will not skip renegotiation if we don't have a transceiver", async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([2]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = undefined;

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .false;
    });

    it("will not skip renegotiation if transceiver controller doesn't have a mapping", async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();
      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(_streamId: number): string {
          return undefined;
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([2]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .false;
    });

    it('will not skip renegotiation if we are switching simulcast streams', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(_streamId1: number, _streamId2: number): boolean {
          return false;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }

        hasVideoInput(): boolean {
          return true;
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([1]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();

      // @ts-ignore
      audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy.chooseEncodingParameters();

      await delay(defaultDelay);
      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .false;
    });

    it('will not skip renegotiation if current video ids are somehow null', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(_streamId1: number, _streamId2: number): boolean {
          return false;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = null;
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();

      // @ts-ignore
      audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy.chooseEncodingParameters();

      await delay(defaultDelay);
      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .false;
    });

    it('will skip renegotiation if simulcast streams do not change', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(_streamId1: number, _streamId2: number): boolean {
          return false;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([1]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();

      // One that requires subscribe
      audioVideoController.update({ needsRenegotiation: false });
      // One that doesn't
      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .true;
    });

    it('will skip renegotiation if we are updating simulcast layer change with header extension', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      // @ts-ignore
      class MockRTCRtpSender implements RTCRtpSender {
        getParameters(): RTCRtpSendParameters {
          // @ts-ignore
          return {
            headerExtensions: [
              {
                id: 12,
                uri: 'http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00',
              },
            ],
          };
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }

        hasVideoInput(): boolean {
          return true;
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController.localVideoTransceiver().sender = new MockRTCRtpSender();
      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([1]);

      // @ts-ignore
      audioVideoController.mayNeedRenegotiationForSimulcastLayerChange = true;
      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .true;
    });

    it('will not skip renegotiation if we are updating simulcast layer change without header extension', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }

        hasVideoInput(): boolean {
          return true;
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([1]);

      // @ts-ignore
      audioVideoController.mayNeedRenegotiationForSimulcastLayerChange = true;
      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .false;
    });

    it('will skip renegotiation if we are updating simulcast layer but not sending', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }

        hasVideoInput(): boolean {
          return false;
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([1]);

      await start();

      // @ts-ignore
      audioVideoController.mayNeedRenegotiationForSimulcastLayerChange = true;
      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .true;
    });

    it('will skip renegotiation if we are only completing simulcast stream switches', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
          return (streamId1 === 1 && streamId2 === 2) || (streamId1 === 3 && streamId2 === 4);
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
          expect(addedOrUpdated[0].mid).to.equal('1'); // MID won't change
          expect(addedOrUpdated[0].streamId).to.equal(2);
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          return new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([
        2,
        4,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.true;
      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .true;
    });

    it("will not skip renegotiation if we don't have setStreamId", async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(_streamId1: number, _streamId2: number): boolean {
          return true;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
          expect(addedOrUpdated[0].mid).to.equal('1'); // MID won't change
          expect(addedOrUpdated[0].streamId).to.equal(2);
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          const tile = new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
          tile.setStreamId = undefined;
          return tile;
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([2]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.false;
      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .false;
    });

    it("will skip renegotiation even if we don't have tile", async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(_streamId1: number, _streamId2: number): boolean {
          return true;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
          expect(addedOrUpdated[0].mid).to.equal('1'); // MID won't change
          expect(addedOrUpdated[0].streamId).to.equal(2);
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return false;
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([2]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.true;
      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .true;
    });

    it('will skip renegotiation if there are no changes', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(_streamId1: number, _streamId2: number): boolean {
          return false;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([1]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.false;
      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .true;
    });

    it('will not skip renegotiation if we are not only completing simulcast stream switches', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(_streamId1: number, _streamId2: number): boolean {
          return false;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([2]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.false;
      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .false;
    });

    it('will not send remoteVideoUpdate if streams are unchanged', async () => {
      const logger = new NoOpDebugLogger();
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(_streamId1: number, _streamId2: number): boolean {
          return true;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
          expect(addedOrUpdated[0].mid).to.equal('1'); // MID won't change
          expect(addedOrUpdated[0].streamId).to.equal(2);
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          const tile = new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
          return tile;
        }
      }

      const policy = new VideoPriorityBasedPolicy(logger);
      policy.setServerSideNetworkAdaption(ServerSideNetworkAdaption.BandwidthProbing);
      const preferenceBuilder = VideoPreferences.prepare();
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId, 1));
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId, 3));
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId, 4));
      const preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoDownlinkBandwidthPolicy = policy;

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([1]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        logger
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.false;
    });

    it('will send removeVideoUpdate due to video preference', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');

      const policyConfig = new VideoPriorityBasedPolicyConfig();
      policyConfig.serverSideNetworkAdaption =
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption;
      const policy = new VideoPriorityBasedPolicy(logger, policyConfig);
      configuration.videoDownlinkBandwidthPolicy = policy;

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start(SdkServerSideNetworkAdaption.BANDWIDTH_PROBING_AND_VIDEO_QUALITY_ADAPTION);

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
          return (streamId1 === 1 && streamId2 === 2) || (streamId1 === 3 && streamId2 === 4);
        }

        attendeeIdForStreamId(streamId: number): string {
          return this.attendeeIdForGroupId(this.groupIdForStreamId(streamId));
        }

        groupIdForStreamId(streamId: number): number {
          if (streamId === 1 || streamId === 2) {
            return 1;
          }
          if (streamId === 3 || streamId === 4) {
            return 2;
          }
          return 0;
        }

        attendeeIdForGroupId(groupId: number): string {
          return defaultAttendeeId + '-' + groupId;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }

        getMidForGroupId(groupId: number): string {
          return groupId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          return new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      const preferenceBuilder = VideoPreferences.prepare();
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-1', 1));
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-2', 3));
      const preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);

      await stop();

      expect(remoteVideoUpdateCalled).to.be.true;
      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .true;
    });

    it('will send removeVideoUpdate due to video preference change', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');

      const policyConfig = new VideoPriorityBasedPolicyConfig();
      policyConfig.serverSideNetworkAdaption =
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption;
      const policy = new VideoPriorityBasedPolicy(logger, policyConfig);
      configuration.videoDownlinkBandwidthPolicy = policy;

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start(SdkServerSideNetworkAdaption.BANDWIDTH_PROBING_AND_VIDEO_QUALITY_ADAPTION);

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
          return (streamId1 === 1 && streamId2 === 2) || (streamId1 === 3 && streamId2 === 4);
        }

        attendeeIdForStreamId(streamId: number): string {
          return this.attendeeIdForGroupId(this.groupIdForStreamId(streamId));
        }

        groupIdForStreamId(streamId: number): number {
          if (streamId === 1 || streamId === 2) {
            return 1;
          }
          if (streamId === 3 || streamId === 4) {
            return 2;
          }
          return 0;
        }

        attendeeIdForGroupId(groupId: number): string {
          return defaultAttendeeId + '-' + groupId;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }

        getMidForGroupId(groupId: number): string {
          return groupId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          return new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      let preferenceBuilder = VideoPreferences.prepare();
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-1', 1));
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-2', 3));
      let preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);

      expect(remoteVideoUpdateCalled).to.be.true;
      remoteVideoUpdateCalled = false;

      preferenceBuilder = VideoPreferences.prepare();
      preferenceBuilder.add(
        new VideoPreference(defaultAttendeeId + '-1', 1, TargetDisplaySize.Low)
      );
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-2', 3));
      preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);

      await stop();
      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .true;
    });

    it('will send removeVideoUpdate due to video preference removal', async () => {
      const logger = new NoOpDebugLogger();

      const policyConfig = new VideoPriorityBasedPolicyConfig();
      policyConfig.serverSideNetworkAdaption =
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption;
      const policy = new VideoPriorityBasedPolicy(logger, policyConfig);
      configuration.videoDownlinkBandwidthPolicy = policy;

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start(SdkServerSideNetworkAdaption.BANDWIDTH_PROBING_AND_VIDEO_QUALITY_ADAPTION);

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
          return (streamId1 === 1 && streamId2 === 2) || (streamId1 === 3 && streamId2 === 4);
        }

        attendeeIdForStreamId(streamId: number): string {
          return this.attendeeIdForGroupId(this.groupIdForStreamId(streamId));
        }

        groupIdForStreamId(streamId: number): number {
          if (streamId === 1 || streamId === 2) {
            return 1;
          }
          if (streamId === 3 || streamId === 4) {
            return 2;
          }
          return 0;
        }

        attendeeIdForGroupId(groupId: number): string {
          return defaultAttendeeId + '-' + groupId;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }

        getMidForGroupId(groupId: number): string | undefined {
          return groupId === 1 ? groupId.toString() : undefined;
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          return new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
        }
      }

      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      let preferenceBuilder = VideoPreferences.prepare();
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-1', 1));
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-2', 3));
      let preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);

      expect(remoteVideoUpdateCalled).to.be.true;
      remoteVideoUpdateCalled = false;

      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([]);

      preferenceBuilder = VideoPreferences.prepare();
      preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);

      expect(remoteVideoUpdateCalled).to.be.true;

      await stop();
    });

    it('will not skip renegotiation if video streams are not initialized with server side network adaptation', async () => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'info');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      await start();

      const policy = new VideoPriorityBasedPolicy(logger);
      policy.setServerSideNetworkAdaption(
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoDownlinkBandwidthPolicy = policy;
      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      // Slightly awkward logger check since subscribe steps are asynchronous and hard to capture
      expect(loggerSpy.calledWith(sinon.match('Update request does not require resubscribe'))).to.be
        .true;
    });

    it('will not send remoteVideoUpdate to video preference if missing preference', async () => {
      const logger = new NoOpDebugLogger();
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
          return (streamId1 === 1 && streamId2 === 2) || (streamId1 === 3 && streamId2 === 4);
        }

        attendeeIdForStreamId(streamId: number): string {
          return defaultAttendeeId + '-' + streamId;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          return new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
        }
      }

      const policy = new VideoPriorityBasedPolicy(logger);
      policy.setServerSideNetworkAdaption(ServerSideNetworkAdaption.BandwidthProbing);
      let preference;
      policy.chooseRemoteVideoSources(preference);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoDownlinkBandwidthPolicy = policy;

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.false;
    });

    it('will not send remoteVideoUpdate if videosToReceive changed but mid not found', async () => {
      const logger = new NoOpDebugLogger();
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
          return (streamId1 === 1 && streamId2 === 2) || (streamId1 === 3 && streamId2 === 4);
        }

        attendeeIdForStreamId(streamId: number): string {
          return defaultAttendeeId + '-' + streamId;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          if (streamId === 3 || streamId === 6) {
            return undefined;
          }
          return streamId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          return new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
        }
      }

      const policy = new VideoPriorityBasedPolicy(logger);
      policy.setServerSideNetworkAdaption(ServerSideNetworkAdaption.BandwidthProbing);
      const preferenceBuilder = VideoPreferences.prepare();
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-1', 1));
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-3', 3));
      const preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoDownlinkBandwidthPolicy = policy;

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
        5,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([
        4,
        6,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.false;
    });

    it('will send remoteVideoUpdate if videosToReceive changed', async () => {
      const logger = new NoOpDebugLogger();

      const policy = new VideoPriorityBasedPolicy(logger);
      policy.setServerSideNetworkAdaption(ServerSideNetworkAdaption.BandwidthProbing);

      configuration.videoDownlinkBandwidthPolicy = policy;

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      await start(SdkServerSideNetworkAdaption.BANDWIDTH_PROBING);
      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
          return (streamId1 === 1 && streamId2 === 2) || (streamId1 === 3 && streamId2 === 4);
        }

        attendeeIdForStreamId(streamId: number): string {
          return this.attendeeIdForGroupId(this.groupIdForStreamId(streamId));
        }

        groupIdForStreamId(streamId: number): number {
          if (streamId === 1 || streamId === 2) {
            return 1;
          }
          if (streamId === 3 || streamId === 4) {
            return 2;
          }
          return 0;
        }

        attendeeIdForGroupId(groupId: number): string {
          return defaultAttendeeId + '-' + groupId;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }

        getMidForGroupId(groupId: number): string {
          return groupId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          return new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
        }
      }

      const preferenceBuilder = VideoPreferences.prepare();
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-1', 1));
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-2', 3));
      const preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
        5,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([
        4,
        6,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.true;
    });

    it('will send remoteVideoUpdate if videosToReceive changed with streamID 0', async () => {
      const logger = new NoOpDebugLogger();
      const policyConfig = new VideoPriorityBasedPolicyConfig();
      policyConfig.serverSideNetworkAdaption =
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption;
      const policy = new VideoPriorityBasedPolicy(logger, policyConfig);
      configuration.videoDownlinkBandwidthPolicy = policy;

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start(SdkServerSideNetworkAdaption.BANDWIDTH_PROBING_AND_VIDEO_QUALITY_ADAPTION);

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
          return (streamId1 === 1 && streamId2 === 2) || (streamId1 === 3 && streamId2 === 4);
        }

        attendeeIdForStreamId(streamId: number): string {
          return this.attendeeIdForGroupId(this.groupIdForStreamId(streamId));
        }

        groupIdForStreamId(streamId: number): number {
          if (streamId === 1 || streamId === 2) {
            return 1;
          }
          if (streamId === 3 || streamId === 4) {
            return 2;
          }
          return 0;
        }

        attendeeIdForGroupId(groupId: number): string {
          return defaultAttendeeId + '-' + groupId;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }

        getMidForGroupId(groupId: number): string {
          return groupId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          return new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
        }
      }

      const preferenceBuilder = VideoPreferences.prepare();
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-1', 1));
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-2', 3));
      const preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoDownlinkBandwidthPolicy = policy;

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
        5,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([
        0,
        1,
        4,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.true;
    });

    it('will not send update if current videos ids are empty', async () => {
      const logger = new NoOpDebugLogger();
      const policyConfig = new VideoPriorityBasedPolicyConfig();
      policyConfig.serverSideNetworkAdaption =
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption;
      const policy = new VideoPriorityBasedPolicy(logger, policyConfig);
      configuration.videoDownlinkBandwidthPolicy = policy;

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
          return (streamId1 === 1 && streamId2 === 2) || (streamId1 === 3 && streamId2 === 4);
        }

        attendeeIdForStreamId(streamId: number): string {
          return this.attendeeIdForGroupId(this.groupIdForStreamId(streamId));
        }

        groupIdForStreamId(streamId: number): number {
          if (streamId === 1 || streamId === 2) {
            return 1;
          }
          if (streamId === 3 || streamId === 4) {
            return 2;
          }
          return 0;
        }

        attendeeIdForGroupId(groupId: number): string {
          return defaultAttendeeId + '-' + groupId;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }

        getMidForGroupId(groupId: number): string {
          return groupId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          return new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
        }
      }

      const preferenceBuilder = VideoPreferences.prepare();
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-1', 1));
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-2', 3));
      const preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoDownlinkBandwidthPolicy = policy;

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        0,
        1,
        4,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.false;
    });

    it('will not send remoteVideoUpdate if videosToReceive is empty', async () => {
      const logger = new NoOpDebugLogger();
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start(SdkServerSideNetworkAdaption.BANDWIDTH_PROBING_AND_VIDEO_QUALITY_ADAPTION);

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
          return (streamId1 === 1 && streamId2 === 2) || (streamId1 === 3 && streamId2 === 4);
        }

        attendeeIdForStreamId(streamId: number): string {
          return defaultAttendeeId + '-' + streamId;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          return new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
        }
      }

      const policy = new VideoPriorityBasedPolicy(logger);
      policy.setServerSideNetworkAdaption(
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption
      );
      const preferenceBuilder = VideoPreferences.prepare();
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-1', 1));
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-3', 3));
      const preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoDownlinkBandwidthPolicy = policy;

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet();
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet();
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.false;
    });

    it('will skip renegotiation but not due to video preferences if videosToReceive remains same', async () => {
      const logger = new NoOpDebugLogger();
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();

      class TestVideoStreamIndex extends DefaultVideoStreamIndex {
        StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
          return (streamId1 === 1 && streamId2 === 2) || (streamId1 === 3 && streamId2 === 4);
        }

        attendeeIdForStreamId(streamId: number): string {
          return defaultAttendeeId + '-' + streamId;
        }
      }

      class TestTransceiverController extends DefaultTransceiverController {
        getMidForStreamId(streamId: number): string | undefined {
          return streamId.toString();
        }
      }

      let remoteVideoUpdateCalled = false;
      class TestSignalingClient extends DefaultSignalingClient {
        remoteVideoUpdate(
          _addedOrUpdated: SignalingClientVideoSubscriptionConfiguration[],
          _removedMids: string[]
        ): void {
          remoteVideoUpdateCalled = true;
        }
      }

      class TestVideoTileController extends DefaultVideoTileController {
        haveVideoTileForAttendeeId(_attendeeId: string): boolean {
          return true;
        }

        getVideoTileForAttendeeId(_attendeeId: string): VideoTile {
          return new DefaultVideoTile(
            1,
            false,
            this,
            new DefaultDevicePixelRatioMonitor(new DevicePixelRatioWindowSource(), null)
          );
        }
      }

      const policy = new VideoPriorityBasedPolicy(logger);
      policy.setServerSideNetworkAdaption(ServerSideNetworkAdaption.None);
      const preferenceBuilder = VideoPreferences.prepare();
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-1', 1));
      preferenceBuilder.add(new VideoPreference(defaultAttendeeId + '-3', 3));
      const preference = preferenceBuilder.build();
      policy.chooseRemoteVideoSources(preference);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoDownlinkBandwidthPolicy = policy;

      // @ts-ignore
      audioVideoController.meetingSessionContext.lastVideosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet([
        1,
        3,
      ]);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoStreamIndex = new TestVideoStreamIndex();
      // @ts-ignore
      audioVideoController.meetingSessionContext.transceiverController = new TestTransceiverController();
      // @ts-ignore
      audioVideoController.meetingSessionContext.signalingClient = new TestSignalingClient(
        webSocketAdapter,
        new NoOpDebugLogger()
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoTileController = new TestVideoTileController(
        new DefaultVideoTileFactory(),
        audioVideoController,
        null
      );

      audioVideoController.update({ needsRenegotiation: false });

      await stop();

      expect(remoteVideoUpdateCalled).to.be.false;
    });
  });

  describe('restartLocalVideo', () => {
    it('restarts local video', async () => {
      class TestDeviceController extends NoOpDeviceController {
        async acquireVideoInputStream(): Promise<MediaStream> {
          const mediaStream = new MediaStream();
          // @ts-ignore
          mediaStream.id = '1';
          const track = new MediaStreamTrack();
          // @ts-ignore
          track.kind = 'video';
          mediaStream.addTrack(track);
          return mediaStream;
        }
      }
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new TestDeviceController(),
        reconnectController
      );
      let called = false;
      const stopLocalVideoTileSpy = sinon.spy(
        audioVideoController.videoTileController,
        'stopLocalVideoTile'
      );
      const startLocalVideoTileSpy = sinon.spy(
        audioVideoController.videoTileController,
        'startLocalVideoTile'
      );
      await start();
      audioVideoController.videoTileController.startLocalVideoTile();
      await sendICEEventAndSubscribeAckFrame();
      audioVideoController.restartLocalVideo(() => {
        called = true;
      });
      // restartLocalVideo() triggers 3 updates.
      await sendICEEventAndSubscribeAckFrame();
      await sendICEEventAndSubscribeAckFrame();
      await sendICEEventAndSubscribeAckFrame();
      await stop();
      expect(stopLocalVideoTileSpy.called).to.be.true;
      expect(startLocalVideoTileSpy.called).to.be.true;
      expect(called).to.be.true;
    }).timeout(5000);

    it('can defer restartLocalVideo and performs a single update operation when the local video is turned off', async () => {
      let called = false;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
      const stopLocalVideoTileSpy = sinon.spy(
        audioVideoController.videoTileController,
        'stopLocalVideoTile'
      );
      const startLocalVideoTileSpy = sinon.spy(
        audioVideoController.videoTileController,
        'startLocalVideoTile'
      );
      audioVideoController.start();
      await delay(defaultDelay);
      audioVideoController.restartLocalVideo(() => {
        called = true;
      });
      await start();
      await sendICEEventAndSubscribeAckFrame();
      await stop();
      expect(stopLocalVideoTileSpy.called).to.be.false;
      expect(startLocalVideoTileSpy.called).to.be.false;
      expect(called).to.be.true;
    });
  });

  describe('replaceLocalVideo', () => {
    beforeEach(() => {
      class TestDeviceController extends NoOpDeviceController {
        async acquireVideoInputStream(): Promise<MediaStream> {
          const mediaStream = new MediaStream();
          // @ts-ignore
          mediaStream.id = '1';
          const track = new MediaStreamTrack();
          // @ts-ignore
          track.kind = 'video';
          mediaStream.addTrack(track);
          return mediaStream;
        }
      }
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new TestDeviceController(),
        reconnectController
      );
    });

    it('throw error video stream has no track', () => {
      return expect(audioVideoController.replaceLocalVideo(new MediaStream())).to.be.rejectedWith(
        'could not acquire video track'
      );
    });

    it('Throw error if no peer connection is established', async () => {
      const stream = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      stream.addTrack(track);
      await expect(audioVideoController.replaceLocalVideo(stream)).to.be.rejectedWith(
        '' + 'no active meeting and peer connection'
      );
    });

    it('replaces video track', async () => {
      const stream = new MediaStream();
      // @ts-ignore
      stream.id = '2';
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      stream.addTrack(track);

      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;

      audioVideoController.videoTileController.startLocalVideoTile();
      const localTile = audioVideoController.videoTileController.getLocalVideoTile();
      const spy = sinon.spy(localTile, 'bindVideoStream');
      await delay(defaultDelay); // add some delay so audioVideo.update finish
      expect(audioVideoController.rtcPeerConnection).to.not.be.null;

      await audioVideoController.replaceLocalVideo(stream);
      expect(spy.calledTwice).to.be.true;
      expect(spy.args[0][0]).to.equal(defaultAttendeeId);
      expect(spy.args[0][1]).to.be.true; //local tile param
      expect(spy.args[0][2].id).to.equal('1');
      expect(spy.args[1][0]).to.equal(defaultAttendeeId);
      expect(spy.args[1][1]).to.be.true; //local tile param
      expect(spy.args[1][2].id).to.equal('2');
      await stop();
      await audioVideoController.removeObserver(observer);
    });

    it('Do not replace local video if local tile is null', async () => {
      const stream = new MediaStream();
      // @ts-ignore
      stream.id = '2';
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      stream.addTrack(track);
      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;
      expect(audioVideoController.rtcPeerConnection).to.not.be.null;

      await audioVideoController.replaceLocalVideo(stream);
      await stop();
      await audioVideoController.removeObserver(observer);
    });
  });

  describe('replaceLocalAudio', () => {
    beforeEach(() => {
      class TestDeviceController extends NoOpDeviceController {
        async acquireAudioInputStream(): Promise<MediaStream> {
          const mediaStream = new MediaStream();
          const track = new MediaStreamTrack();
          // @ts-ignore
          track.kind = 'audio';
          mediaStream.addTrack(track);
          return mediaStream;
        }
      }
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new TestDeviceController(),
        reconnectController
      );
    });
    it('fails if has no active audio stream', () => {
      return expect(
        audioVideoController.replaceLocalAudio(new MediaStream())
      ).to.eventually.be.rejectedWith('could not acquire audio track');
    });

    it('Throw error if no peer connection is established', async () => {
      const stream = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'audio';
      stream.addTrack(track);
      await expect(audioVideoController.replaceLocalAudio(stream)).to.be.rejectedWith(
        '' + 'no active meeting and peer connection'
      );
    });

    it('replaces audio track', async () => {
      const stream = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'audio';
      stream.addTrack(track);
      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();

      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;
      expect(audioVideoController.rtcPeerConnection).to.not.be.null;

      await audioVideoController.replaceLocalAudio(stream);
      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('reject if transceiver fails to replaces audio track', async () => {
      const stream = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'audio';
      stream.addTrack(track);
      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();

      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;
      expect(audioVideoController.rtcPeerConnection).to.not.be.null;

      // @ts-ignore mutate the context state to trigger rejection
      audioVideoController.meetingSessionContext.transceiverController._localAudioTransceiver = null;
      await expect(audioVideoController.replaceLocalAudio(stream)).to.be.rejectedWith(
        'Failed to replace audio track'
      );
      await stop();
      audioVideoController.removeObserver(observer);
    });
  });

  describe('reconnect', () => {
    it('reconnects, calling audioVideoDidStartConnecting and audioVideoDidStart but not audioVideoDidStop', async () => {
      const sequence: string[] = [];
      let startConnectingCalled = 0;
      let startCalled = 0;
      let stopCalled = 0;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStartConnecting(reconnecting: boolean): void {
          sequence.push('audioVideoDidStartConnecting');
          if (startConnectingCalled > 0) {
            expect(reconnecting).to.be.true;
          }
          startConnectingCalled += 1;
        }
        audioVideoDidStart(): void {
          sequence.push('audioVideoDidStart');
          startCalled += 1;
        }
        audioVideoDidStop(_sessionStatus: MeetingSessionStatus): void {
          sequence.push('audioVideoDidStop');
          stopCalled += 1;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      await start();
      await reconnect();
      await reconnect();
      await stop();

      // 2 (reconnect) + 1 (start/stop)
      const expected = 3;
      expect(startConnectingCalled).to.equal(expected);
      expect(startCalled).to.equal(expected);
      // 0 (reconnect) + 1 (stop)
      expect(stopCalled).to.equal(1);
      expect(sequence).to.deep.equal([
        'audioVideoDidStartConnecting',
        'audioVideoDidStart',
        'audioVideoDidStartConnecting',
        'audioVideoDidStart',
        'audioVideoDidStartConnecting',
        'audioVideoDidStart',
        'audioVideoDidStop',
      ]);
      audioVideoController.removeObserver(observer);
    }).timeout(5000);

    it('publish meeting reconnected', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController,
        eventController
      );

      const events: { name: EventName; attributes: EventAttributes }[] = [];
      const observer = {
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          events.push({
            name,
            attributes,
          });
        },
      };
      eventController.addObserver(observer);
      await start();
      await reconnect();
      await stop();

      const eventNames = events.map(({ name }) => name);
      expect(eventNames).to.eql([
        'meetingStartRequested',
        'attendeePresenceReceived',
        'meetingStartSucceeded',
        'meetingReconnected',
        'meetingEnded',
      ]);
      eventController.removeObserver(observer);
    }).timeout(5000);

    it('does not reconnect if canceled', async () => {
      let called = 0;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(_sessionStatus: MeetingSessionStatus): void {
          called += 1;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      await start();
      audioVideoController.reconnect(new MeetingSessionStatus(MeetingSessionStatusCode.OK), null);
      reconnectController.cancel();
      await stop();
      expect(called).to.equal(1);
      audioVideoController.removeObserver(observer);
    });

    // FinishGatheringICECandidatesTask does not throw the ICEGatheringTimeoutWorkaround error if
    // the session connection timeout is less than 5000ms.
    it('reconnects when the start operation fails with a non-Terminal meeting status such as ICEGatheringTimeoutWorkaround', function (done) {
      this.timeout(20000);

      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      // We need the attendee presence check to not fail before the ICE gathering times out, so bump it to 10 seconds.
      configuration.connectionTimeoutMs = 6_000;
      configuration.attendeePresenceTimeoutMs = 10_000;
      const logger = new NoOpDebugLogger();
      const spy = sinon.spy(logger, 'warn');

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.Left);
          expect(
            spy.calledWith(
              sinon.match('will retry due to status code ICEGatheringTimeoutWorkaround')
            )
          ).to.be.true;
          done();
        }
      }

      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      audioVideoController.start();

      delay(200).then(() => {
        // Finish JoinAndReceiveIndexTask and then wait for the ICE event in FinishGatheringICECandidatesTask.
        webSocketAdapter.send(makeJoinAckFrame());
        webSocketAdapter.send(makeIndexFrame());
      });

      delay(configuration.connectionTimeoutMs + 100).then(() => {
        // Finish LeaveAndReceiveLeaveAckTask executed by the failed "start."
        webSocketAdapter.send(makeLeaveAckFrame());
      });

      delay(configuration.connectionTimeoutMs + 200).then(async () => {
        // At this point, the start operation failed so attempted to connect the session again.
        // Finish the start operation by sending required frames and events.
        webSocketAdapter.send(makeJoinAckFrame());
        await delay(defaultDelay);
        webSocketAdapter.send(makeIndexFrame());
        await delay(100);
        await sendICEEventAndSubscribeAckFrame();
        await delay(100);
        await sendAudioStreamIdInfoFrame();
        await delay(300);
        // Finally, stop this test.
        await stop();
        audioVideoController.removeObserver(observer);
      });
    });

    it('reconnects when the start operation fails with a task failed meeting status', function (done) {
      configuration.connectionTimeoutMs = 100;
      const logger = new NoOpDebugLogger();
      const spy = sinon.spy(logger, 'warn');

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.Left);
          expect(spy.calledWith(sinon.match('will retry due to status code TaskFailed'))).to.be
            .true;
          done();
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      // Start and wait for the Join frame in JoinAndReceiveIndexTask.
      audioVideoController.start();

      delay(configuration.connectionTimeoutMs + 50).then(() => {
        // Finish LeaveAndReceiveLeaveAckTask executed by the failed "start."
        webSocketAdapter.send(makeLeaveAckFrame());
        // Let the next round of the start operation not fail with the timeout.
        configuration.connectionTimeoutMs = 15000;
      });

      delay(configuration.connectionTimeoutMs + 100).then(async () => {
        // Finish the start operation and stop this test.
        await delay(300);
        webSocketAdapter.send(makeJoinAckFrame());
        await delay(100);
        webSocketAdapter.send(makeIndexFrame());
        await delay(300);
        await sendICEEventAndSubscribeAckFrame();
        await delay(defaultDelay);
        await sendAudioStreamIdInfoFrame();
        await delay(300);
        await stop();
        audioVideoController.removeObserver(observer);
      });
    });

    it('reconnects when the reconnect operation itself fails', done => {
      const logger = new NoOpDebugLogger();
      const loggerSpy = sinon.spy(logger, 'warn');

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.Left);
          expect(loggerSpy.calledWith(sinon.match('will retry due to status code TaskFailed'))).to
            .be.true;
          loggerSpy.restore();
          done();
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      const spy = sinon.spy(reconnectController, 'retryWithBackoff');

      start().then(() => {
        configuration.connectionTimeoutMs = 100;
        audioVideoController.reconnect(
          new MeetingSessionStatus(MeetingSessionStatusCode.Left),
          null
        );

        delay(configuration.connectionTimeoutMs * 2.5).then(async () => {
          expect(spy.callCount).to.equal(3);
          await stop();
          audioVideoController.removeObserver(observer);
        });
      });
    });

    it('uses the custom connection health policy configuration if passed', done => {
      // Set the missed pongs upper threshold to zero to force restarting the session.
      const connectionHealthPolicyConfiguration = new ConnectionHealthPolicyConfiguration();
      connectionHealthPolicyConfiguration.connectionWaitTimeMs = 0;
      connectionHealthPolicyConfiguration.missedPongsUpperThreshold = 0;
      configuration.connectionHealthPolicyConfiguration = connectionHealthPolicyConfiguration;

      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      const reconnectSpy = sinon.spy(audioVideoController, 'reconnect');

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.Left);
          done();
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      start();

      // connectionHealthDidChange in MonitorTask is called for the first time
      // after the stats collector receives metrics after 1000ms.
      delay(1500).then(async () => {
        expect(reconnectSpy.called).to.be.true;

        // Finish the reconnect operation and stop this test.
        webSocketAdapter.send(makeJoinAckFrame());
        await delay(defaultDelay);
        webSocketAdapter.send(makeIndexFrame());
        await delay(200);
        await sendICEEventAndSubscribeAckFrame();
        await stop();
        audioVideoController.removeObserver(observer);
      });
    }).timeout(5000);
  });

  describe('reconnect for no attendee presence', () => {
    it('reconnects when the start operation fails due to no attendee presence event', function (done) {
      this.timeout(15000);

      const logger = new NoOpDebugLogger();
      const spy = sinon.spy(logger, 'warn');
      const noAttendeeTimeout = configuration.attendeePresenceTimeoutMs;

      class TestMediaStreamBroker extends NoOpMediaStreamBroker {
        requestAudioInputStream(): Promise<void> {
          return Promise.resolve();
        }
      }

      configuration.connectionTimeoutMs = 15000;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new TestMediaStreamBroker(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.Left);
          expect(spy.calledWith(sinon.match('will retry due to status code NoAttendeePresent'))).to
            .be.true;
          spy.restore();
          done();
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);

      // Start and wait for the audio stream ID info frame.
      // SDK uses this info frame to send the attendee presence event.
      audioVideoController.start();
      delay(defaultDelay).then(async () => {
        await delay(300);
        webSocketAdapter.send(makeJoinAckFrame());
        await delay(defaultDelay);
        webSocketAdapter.send(makeIndexFrame());
        await delay(300);
        await sendICEEventAndSubscribeAckFrame();
        await delay(defaultDelay);
      });

      delay(noAttendeeTimeout + 2000).then(async () => {
        // Finish LeaveAndReceiveLeaveAckTask executed by the failed "start."
        webSocketAdapter.send(makeLeaveAckFrame());
        await delay(300);

        // Finish the start operation and stop this test.
        webSocketAdapter.send(makeJoinAckFrame());
        await delay(defaultDelay);
        webSocketAdapter.send(makeIndexFrame());
        await delay(300);
        await sendICEEventAndSubscribeAckFrame();
        await delay(defaultDelay);
        await sendAudioStreamIdInfoFrame();
        await delay(300);
        await stop();
        audioVideoController.removeObserver(observer);
      });
    });

    it('does not reconnect for no attendee presence event if the attendee presence timeout is set to zero', function (done) {
      this.timeout(15000);

      const logger = new NoOpDebugLogger();
      const spy = sinon.spy(logger, 'warn');

      class TestMediaStreamBroker extends NoOpMediaStreamBroker {
        requestAudioInputStream(): Promise<void> {
          return Promise.resolve();
        }
      }

      configuration.connectionTimeoutMs = 2000;
      configuration.attendeePresenceTimeoutMs = 0;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        new TestMediaStreamBroker(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.Left);
          expect(spy.calledWith(sinon.match('will retry due to status code NoAttendeePresent'))).to
            .be.false;
          spy.restore();
          done();
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);

      // Start and wait for the audio stream ID info frame.
      // SDK uses this info frame to send the attendee presence event.
      audioVideoController.start();
      delay(defaultDelay).then(async () => {
        await delay(300);
        webSocketAdapter.send(makeJoinAckFrame());
        await delay(defaultDelay);
        webSocketAdapter.send(makeIndexFrame());
        await delay(300);
        await sendICEEventAndSubscribeAckFrame();
        await delay(defaultDelay);
      });

      delay(configuration.connectionTimeoutMs + 100).then(async () => {
        // Finish LeaveAndReceiveLeaveAckTask executed by the failed "start."
        webSocketAdapter.send(makeLeaveAckFrame());
        await delay(300);

        // Finish the start operation and stop this test.
        webSocketAdapter.send(makeJoinAckFrame());
        await delay(defaultDelay);
        webSocketAdapter.send(makeIndexFrame());
        await delay(300);
        await sendICEEventAndSubscribeAckFrame();
        await delay(defaultDelay);
        await sendAudioStreamIdInfoFrame();
        await delay(300);
        await stop();
        audioVideoController.removeObserver(observer);
      });
    });
  });

  describe('getters', () => {
    it('returns a device controller for the mediaStreamBroker and deviceController getter', () => {
      const mediaStreamBroker = new NoOpMediaStreamBroker();
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        mediaStreamBroker,
        reconnectController
      );

      expect(mediaStreamBroker).to.equal(audioVideoController.mediaStreamBroker);
    });
  });

  describe('handleMeetingSessionStatus', () => {
    beforeEach(() => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );
    });

    it('handles VideoCallSwitchToViewOnly', async () => {
      let called = false;
      const spy = sinon.spy(audioVideoController.videoTileController, 'removeLocalVideoTile');
      class TestObserver implements AudioVideoObserver {
        videoSendDidBecomeUnavailable(): void {
          called = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      await start();
      audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.VideoCallSwitchToViewOnly),
        null
      );
      await delay(defaultDelay);
      expect(spy.called).to.be.true;
      expect(called).to.be.true;
      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('handles IncompatibleSDP', async () => {
      let called = 0;
      const spy = sinon.spy(audioVideoController, 'restartLocalVideo');
      class TestObserver implements AudioVideoObserver {
        videoSendDidBecomeUnavailable(): void {
          throw Error();
        }
        audioVideoDidStop(): void {
          called = called + 1;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      await start();
      audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.IncompatibleSDP),
        null
      );
      await delay(defaultDelay);
      await sendICEEventAndSubscribeAckFrame();
      await sendICEEventAndSubscribeAckFrame();
      await sendICEEventAndSubscribeAckFrame();
      await sendICEEventAndSubscribeAckFrame();
      expect(spy.called).to.be.true;
      expect(called).to.equal(0);
      await stop();
      expect(called).to.equal(1);
      audioVideoController.removeObserver(observer);
    });

    it('does not reconnect for the terminal status or the unknown status', async () => {
      let called = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(_sessionStatus: MeetingSessionStatus): void {
          called = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      await start();
      audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.Left),
        null
      );
      await delay(defaultDelay);
      audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.OK),
        null
      );
      expect(called).to.be.false;
      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('does not reconnect if the reconnectController is not set in the context', async () => {
      const spy = sinon.spy(reconnectController, 'disableReconnect');
      audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.Left),
        null
      );
      await delay(defaultDelay);
      expect(spy.called).to.be.false;
    });
  });

  describe('pauseReceivingStream', () => {
    it('is no-op if meeting is not started', () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      audioVideoController.pauseReceivingStream(0);
    });

    it('sends pause frame through signaling client', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      await start();

      // @ts-ignore
      const spy = sinon.spy(audioVideoController.meetingSessionContext.signalingClient, 'pause');
      audioVideoController.pauseReceivingStream(1);

      await stop();
      expect(spy.callCount).to.equal(1);
    });
  });

  describe('resumeReceivingStream', () => {
    it('is no-op if meeting is not started', () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      audioVideoController.resumeReceivingStream(0);
    });

    it('sends resume frame through signaling client', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      await start();
      // @ts-ignore
      const spy = sinon.spy(audioVideoController.meetingSessionContext.signalingClient, 'resume');

      audioVideoController.resumeReceivingStream(0);

      await stop();

      expect(spy.callCount).to.equal(1);
    });
  });

  describe('setVideoCodecSendPreferences', () => {
    it('calls update', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      await start();
      // @ts-ignore
      const spy = sinon.spy(audioVideoController, 'update');

      audioVideoController.setVideoCodecSendPreferences([VideoCodecCapability.vp8()]);

      await stop();

      expect(spy.callCount).to.equal(1);
    });

    it('does not trigger an update if invoked before the session starts.', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      // @ts-ignore
      const spy = sinon.spy(audioVideoController, 'update');
      audioVideoController.setVideoCodecSendPreferences([VideoCodecCapability.vp8()]);
      expect(spy.callCount).to.equal(0);
    });
  });

  describe('getRTCPeerConnectionStats', () => {
    it('calls getStats', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      await start();

      const spy = sinon.spy(audioVideoController.rtcPeerConnection, 'getStats');
      await audioVideoController.getRTCPeerConnectionStats();

      await stop();

      expect(spy.calledOnceWith()).to.be.true;
    });

    it('calls getStats with media stream strack', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      const track = new MediaStreamTrack();
      await start();

      const spy = sinon.spy(audioVideoController.rtcPeerConnection, 'getStats');
      await audioVideoController.getRTCPeerConnectionStats(track);

      await stop();

      expect(spy.calledOnceWith(track)).to.be.true;
    });

    it('return null if no peer connection is established', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      const result = await audioVideoController.getRTCPeerConnectionStats();
      expect(result).to.be.null;
    });
  });

  describe('when simulcast is enabled', () => {
    it('will be automatically switched off if platform is not Chrome', async () => {
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      await start();
      // @ts-ignore
      expect(audioVideoController.enableSimulcast).to.equal(false);
      await stop();
    });

    it('can be started', async () => {
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      domMockBehavior.browserName = 'chrome116';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          // use this opportunity to verify that start is idempotent
          audioVideoController.start();
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      new TimeoutScheduler(10).start(() => {
        // use this opportunity to verify that start cannot happen while connecting
        audioVideoController.start();
      });

      await delay(defaultDelay);
      // use this opportunity to test signaling mute state to the server
      audioVideoController.realtimeController.realtimeMuteLocalAudio();
      audioVideoController.realtimeController.realtimeUnmuteLocalAudio();

      await delay(defaultDelay);
      // use this opportunity to test volume indicators
      webSocketAdapter.send(makeJoinAckFrame());
      await delay(defaultDelay);
      webSocketAdapter.send(makeIndexFrame());
      webSocketAdapter.send(makeAudioStreamIdInfoFrame());
      webSocketAdapter.send(makeAudioMetadataFrame());

      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;
      // @ts-ignore
      expect(audioVideoController.enableSimulcast).to.equal(true);

      const tileId = audioVideoController.videoTileController.startLocalVideoTile();
      expect(tileId).to.equal(1);
      await sendICEEventAndSubscribeAckFrame();
      audioVideoController.videoTileController.stopLocalVideoTile();
      await sendICEEventAndSubscribeAckFrame();

      await stop();
      audioVideoController.removeObserver(observer);
    });

    it('can be started for content share attendee', async () => {
      const attendeeId = defaultAttendeeId + ContentShareConstants.Modality;
      configuration.credentials.attendeeId = attendeeId;
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      let sessionStarted = false;
      let sessionConnecting = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
        audioVideoDidStartConnecting(): void {
          sessionConnecting = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      webSocketAdapter.send(makeJoinAckFrame());
      await delay(defaultDelay);
      webSocketAdapter.send(makeIndexFrame());
      webSocketAdapter.send(makeAudioStreamIdInfoFrame(attendeeId));
      webSocketAdapter.send(makeAudioMetadataFrame());
      await delay(defaultDelay);
      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;
      // @ts-ignore
      expect(audioVideoController.enableSimulcast).to.equal(true);
      await stop();
      audioVideoController.removeObserver(observer);
    });
  });

  it('can be started for content share attendee with UHD feature', async () => {
    const attendeeId = defaultAttendeeId + ContentShareConstants.Modality;
    configuration.meetingFeatures.contentMaxResolution = VideoQualitySettings.VideoResolutionUHD;
    configuration.credentials.attendeeId = attendeeId;
    configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
    domMockBehavior.browserName = 'chrome';
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    audioVideoController = new DefaultAudioVideoController(
      configuration,
      new NoOpDebugLogger(),
      webSocketAdapter,
      new NoOpDeviceController(),
      reconnectController
    );

    let sessionStarted = false;
    let sessionConnecting = false;
    class TestObserver implements AudioVideoObserver {
      audioVideoDidStart(): void {
        sessionStarted = true;
      }
      audioVideoDidStartConnecting(): void {
        sessionConnecting = true;
      }
    }
    const observer = new TestObserver();
    audioVideoController.addObserver(observer);
    expect(audioVideoController.configuration).to.equal(configuration);
    expect(audioVideoController.rtcPeerConnection).to.be.null;
    await start();
    webSocketAdapter.send(makeJoinAckFrame());
    await delay(defaultDelay);
    webSocketAdapter.send(makeIndexFrame());
    webSocketAdapter.send(makeAudioStreamIdInfoFrame(attendeeId));
    webSocketAdapter.send(makeAudioMetadataFrame());
    await delay(defaultDelay);
    expect(sessionStarted).to.be.true;
    expect(sessionConnecting).to.be.true;
    // @ts-ignore
    expect(audioVideoController.enableSimulcast).to.equal(true);
    // @ts-ignore
    expect(audioVideoController.maxUplinkBandwidthKbps).to.equal(2500);
    expect(
      configuration.meetingFeatures.contentMaxResolution.equals(
        VideoQualitySettings.VideoResolutionUHD
      )
    ).to.equal(true);
    await stop();
    audioVideoController.removeObserver(observer);
  });

  it('can be started for camera video attendee with FHD feature', async () => {
    const attendeeId = defaultAttendeeId;
    configuration.meetingFeatures.videoMaxResolution = VideoQualitySettings.VideoResolutionFHD;
    configuration.credentials.attendeeId = attendeeId;
    configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
    domMockBehavior.browserName = 'chrome';
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    audioVideoController = new DefaultAudioVideoController(
      configuration,
      new NoOpDebugLogger(),
      webSocketAdapter,
      new NoOpDeviceController(),
      reconnectController
    );

    let sessionStarted = false;
    let sessionConnecting = false;
    class TestObserver implements AudioVideoObserver {
      audioVideoDidStart(): void {
        sessionStarted = true;
      }
      audioVideoDidStartConnecting(): void {
        sessionConnecting = true;
      }
    }
    const observer = new TestObserver();
    audioVideoController.addObserver(observer);
    expect(audioVideoController.configuration).to.equal(configuration);
    expect(audioVideoController.rtcPeerConnection).to.be.null;
    await start();
    webSocketAdapter.send(makeJoinAckFrame());
    await delay(defaultDelay);
    webSocketAdapter.send(makeIndexFrame());
    webSocketAdapter.send(makeAudioStreamIdInfoFrame(attendeeId));
    webSocketAdapter.send(makeAudioMetadataFrame());
    await delay(defaultDelay);
    expect(sessionStarted).to.be.true;
    expect(sessionConnecting).to.be.true;
    // @ts-ignore
    expect(audioVideoController.enableSimulcast).to.equal(true);
    expect(
      configuration.meetingFeatures.contentMaxResolution.equals(
        VideoQualitySettings.VideoResolutionFHD
      )
    ).to.equal(true);
    await stop();
    audioVideoController.removeObserver(observer);
  });

  describe('meeting events', () => {
    it('sends meeting events', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController,
        eventController
      );

      const events: { name: EventName; attributes: EventAttributes }[] = [];
      const observer = {
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          events.push({
            name,
            attributes,
          });
        },
      };
      eventController.addObserver(observer);
      await start();
      await stop();

      const eventNames = events.map(({ name }) => name);
      expect(eventNames).to.eql([
        'meetingStartRequested',
        'attendeePresenceReceived',
        'meetingStartSucceeded',
        'meetingEnded',
      ]);
      eventController.removeObserver(observer);
    });

    it('sends failure events', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController,
        eventController
      );

      const errorMessage = 'Something went wrong';
      const events: { name: EventName; attributes: EventAttributes }[] = [];
      const observer = {
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          events.push({
            name,
            attributes,
          });
        },
      };
      eventController.addObserver(observer);
      await start();
      reconnectController.disableReconnect();
      audioVideoController.reconnect(
        new MeetingSessionStatus(MeetingSessionStatusCode.SignalingBadRequest),
        new Error(errorMessage)
      );
      await stop();

      const eventNames = events.map(({ name }) => name);
      expect(eventNames).to.eql([
        'meetingStartRequested',
        'attendeePresenceReceived',
        'meetingStartSucceeded',
        'meetingFailed',
      ]);
      expect(events[3].attributes.meetingErrorMessage).includes(errorMessage);
      eventController.removeObserver(observer);
    });

    it('sends failure events with a non-empty error message', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController,
        eventController
      );

      const events: { name: EventName; attributes: EventAttributes }[] = [];
      const observer = {
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          events.push({
            name,
            attributes,
          });
        },
      };
      eventController.addObserver(observer);
      await start();
      reconnectController.disableReconnect();
      audioVideoController.reconnect(
        new MeetingSessionStatus(MeetingSessionStatusCode.SignalingBadRequest),
        null
      );
      await stop();

      const eventNames = events.map(({ name }) => name);
      expect(eventNames).to.eql([
        'meetingStartRequested',
        'attendeePresenceReceived',
        'meetingStartSucceeded',
        'meetingFailed',
      ]);
      expect(events[3].attributes.meetingErrorMessage).not.to.be.empty;
      eventController.removeObserver(observer);
    });
  });

  describe('getRemoteVideoSources', () => {
    it('should match index frame sources excluding self', async () => {
      const compare = (a: VideoSource, b: VideoSource): number =>
        a.attendee.attendeeId.localeCompare(b.attendee.attendeeId);

      const expectedVideoSources = [{ attendee: { attendeeId: 'a', externalUserId: 'a' } }];
      const attendeesToMakeIndexFrame = [...expectedVideoSources].map(
        VideoSource => VideoSource.attendee
      );
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      await start();

      reconnectController.disableReconnect();

      await delay(300);
      webSocketAdapter.send(makeIndexFrameWithAttendees(attendeesToMakeIndexFrame));

      await delay(300);
      const receivedVideoSources = audioVideoController.getRemoteVideoSources();
      expect(receivedVideoSources.sort(compare)).to.eql(expectedVideoSources.sort(compare));

      await stop();

      // Forcibly clean up the stats collector so it doesn't spam after the test runs.
      // This will _eventually_ get cleaned by the main CleanStoppedSessionTask, but that takes a while.
      let success = true;
      try {
        // @ts-ignore
        await new CleanStoppedSessionTask(audioVideoController.meetingSessionContext).run();
      } catch (error) {
        success = false;
      }
      expect(success).to.be.false;
    });

    it('should return an array of length 0, when videoStreamIndex is not initialized', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      const videoSources = audioVideoController.getRemoteVideoSources();
      expect(videoSources).to.have.lengthOf(0);
    });

    it('should return [] when called after meeting session is stopped', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();
      await stop();
      await delay(500);
      expect(audioVideoController.getRemoteVideoSources()).to.deep.equal([]);
    });
  });

  describe('encodingSimulcastLayersDidChange', () => {
    it('observer should get called only when added', async () => {
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      let event = 0;
      let observed = 0;
      class TestObserver implements AudioVideoObserver {
        encodingSimulcastLayersDidChange(_simulcastLayers: SimulcastLayers): void {
          if (event !== 1 && event !== 3 && event !== 5) {
            assert.fail();
          }
          observed += 1;
        }
      }
      const observer = new TestObserver();
      await delay(defaultDelay);
      audioVideoController.addObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.encodingSimulcastLayersDidChange(SimulcastLayers.High);
      });
      await delay(defaultDelay);
      audioVideoController.removeObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.encodingSimulcastLayersDidChange(SimulcastLayers.High);
      });
      await delay(defaultDelay);
      audioVideoController.addObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.encodingSimulcastLayersDidChange(SimulcastLayers.High);
      });
      await delay(defaultDelay);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.encodingSimulcastLayersDidChange(SimulcastLayers.High);
      });
      audioVideoController.removeObserver(observer);
      await delay(defaultDelay);
      audioVideoController.addObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.encodingSimulcastLayersDidChange(SimulcastLayers.High);
      });
      await delay(defaultDelay);
      expect(event).to.equal(5);
      expect(observed).to.equal(3);
      audioVideoController.removeObserver(observer);
    });

    it('observer should get called', async () => {
      configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      domMockBehavior.browserName = 'chrome';
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        encodingSimulcastLayersDidChange(_simulcastLayers: SimulcastLayers): void {}
      }
      const observer = new TestObserver();
      const spy = sinon.spy(observer, 'encodingSimulcastLayersDidChange');
      audioVideoController.addObserver(observer);
      await start();
      await delay(defaultDelay);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy.chooseEncodingParameters();
      await delay(defaultDelay);
      await stop();
      expect(spy.calledOnce).to.be.true;
    });

    it('observer should not get called with non-simulcast policy', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      class TestObserver implements AudioVideoObserver {
        encodingSimulcastLayersDidChange(_simulcastLayers: SimulcastLayers): void {}
      }
      const observer = new TestObserver();
      const spy = sinon.spy(observer, 'encodingSimulcastLayersDidChange');
      audioVideoController.addObserver(observer);
      await start();
      await delay(defaultDelay);
      // @ts-ignore
      audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy.chooseEncodingParameters();
      await delay(defaultDelay);
      await stop();
      audioVideoController.removeObserver(observer);
      expect(spy.notCalled).to.be.true;
    });
  });

  describe('promoteToPrimaryMeeting & demoteFromPrimaryMeeting', () => {
    it('sends promotion through signaling client and waits for ack, demotes sends through signaling client', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      let demotionCalled = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoWasDemotedFromPrimaryMeeting(_: MeetingSessionStatus): void {
          demotionCalled = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      await start();

      const promoteSpy = sinon.spy(
        // @ts-ignore
        audioVideoController.meetingSessionContext.signalingClient,
        'promoteToPrimaryMeeting'
      );
      const demoteSpy = sinon.spy(
        // @ts-ignore
        audioVideoController.meetingSessionContext.signalingClient,
        'demoteFromPrimaryMeeting'
      );
      const credentials = new MeetingSessionCredentials();
      const promotionPromise = audioVideoController.promoteToPrimaryMeeting(credentials);

      await delay(200);
      webSocketAdapter.send(makePrimaryMeetingJoinAckFrame());
      expect((await promotionPromise).statusCode()).to.equal(MeetingSessionStatusCode.OK);

      await delay(200);
      audioVideoController.demoteFromPrimaryMeeting();
      await delay(200);

      await stop();
      expect(promoteSpy.callCount).to.equal(1);
      expect(demoteSpy.callCount).to.equal(1);
      expect(demotionCalled).to.be.true;
      audioVideoController.removeObserver(observer);
    });

    it('fails promotion if timeout', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      let demotionCalled = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoWasDemotedFromPrimaryMeeting(_: MeetingSessionStatus): void {
          demotionCalled = true;
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      await start();
      configuration.connectionTimeoutMs = 100;

      const promoteSpy = sinon.spy(
        // @ts-ignore
        audioVideoController.meetingSessionContext.signalingClient,
        'promoteToPrimaryMeeting'
      );
      const demoteSpy = sinon.spy(
        // @ts-ignore
        audioVideoController.meetingSessionContext.signalingClient,
        'demoteFromPrimaryMeeting'
      );
      const credentials = new MeetingSessionCredentials();
      const promotionPromise = audioVideoController.promoteToPrimaryMeeting(credentials);

      await delay(200);
      webSocketAdapter.send(makePrimaryMeetingJoinAckFrame());
      expect((await promotionPromise).statusCode()).to.equal(
        MeetingSessionStatusCode.SignalingRequestFailed
      );

      await stop();
      expect(promoteSpy.callCount).to.equal(1);
      expect(demoteSpy.callCount).to.equal(0);
      expect(demotionCalled).to.be.false;
      configuration.connectionTimeoutMs = 15000;
      audioVideoController.removeObserver(observer);
    });

    it('calls demotion observer when leave is received', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      let demotionCalled = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoWasDemotedFromPrimaryMeeting(status: MeetingSessionStatus): void {
          demotionCalled = true;
          expect(status.statusCode()).to.equal(
            MeetingSessionStatusCode.AudioVideoWasRemovedFromPrimaryMeeting
          );
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      await start();

      // @ts-ignore
      const credentials = new MeetingSessionCredentials();
      const promotionPromise = audioVideoController.promoteToPrimaryMeeting(credentials);

      await delay(200);
      webSocketAdapter.send(makePrimaryMeetingJoinAckFrame());
      await promotionPromise;

      webSocketAdapter.send(makePrimaryMeetingLeaveFrame());

      await stop();
      expect(demotionCalled).to.be.true;
      audioVideoController.removeObserver(observer);
    });

    it('calls demotion observer when disconnection occurs', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      let demotionCalled = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoWasDemotedFromPrimaryMeeting(status: MeetingSessionStatus): void {
          demotionCalled = true;
          expect(status.statusCode()).to.equal(
            MeetingSessionStatusCode.SignalingInternalServerError
          );
        }
      }
      const observer = new TestObserver();
      audioVideoController.addObserver(observer);
      await start();

      // @ts-ignore
      const credentials = new MeetingSessionCredentials();
      const promotionPromise = audioVideoController.promoteToPrimaryMeeting(credentials);

      await delay(200);
      webSocketAdapter.send(makePrimaryMeetingJoinAckFrame());
      await promotionPromise;

      reconnectController.disableReconnect();
      audioVideoController.reconnect(
        new MeetingSessionStatus(MeetingSessionStatusCode.SignalingBadRequest),
        new Error('uh oh')
      );
      await delay(200);

      await stop();
      expect(demotionCalled).to.be.true;
      audioVideoController.removeObserver(observer);
    });
  });

  describe('setVideoMaxBandwidthKbps', () => {
    it('can set video max bandwidth', async () => {
      const policy = new NScaleVideoUplinkBandwidthPolicy('test');
      const spy = sinon.spy(policy, 'setIdealMaxBandwidthKbps');
      configuration.videoUplinkBandwidthPolicy = policy;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      await start();
      audioVideoController.setVideoMaxBandwidthKbps(100);
      await stop();
      expect(spy.calledOnce).to.be.true;
    });

    it('can set video max bandwidth before meeting start', async () => {
      const policy = new NScaleVideoUplinkBandwidthPolicy('test');
      const spy = sinon.spy(policy, 'setIdealMaxBandwidthKbps');
      configuration.videoUplinkBandwidthPolicy = policy;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      audioVideoController.setVideoMaxBandwidthKbps(100);
      await start();
      await stop();
      expect(spy.calledOnce).to.be.true;
    });

    it('bandwidth has to be positive', () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpMediaStreamBroker(),
        reconnectController
      );

      expect(() => {
        audioVideoController.setVideoMaxBandwidthKbps(0);
      }).to.throw('Max bandwidth kbps has to be greater than 0');
    });
  });

  describe('audioInputDidChange', () => {
    let mediaStreamBroker: ObserverMediaStreamBroker = undefined;
    class ObserverMediaStreamBroker extends NoOpMediaStreamBroker {
      private mediaStreamBrokerObservers: Set<MediaStreamBrokerObserver> = new Set<
        MediaStreamBrokerObserver
      >();
      addMediaStreamBrokerObserver(observer: MediaStreamBrokerObserver): void {
        this.mediaStreamBrokerObservers.add(observer);
      }
      removeMediaStreamBrokerObserver(observer: MediaStreamBrokerObserver): void {
        this.mediaStreamBrokerObservers.delete(observer);
      }
      triggerAudioInputChangeEvent(audioStream: MediaStream | undefined): void {
        for (const observer of this.mediaStreamBrokerObservers) {
          if (observer.audioInputDidChange) {
            observer.audioInputDidChange(audioStream);
          }
        }
      }
      async acquireAudioInputStream(): Promise<MediaStream> {
        const mediaStream = new MediaStream();
        const track = new MediaStreamTrack();
        // @ts-ignore
        track.kind = 'audio';
        mediaStream.addTrack(track);
        return mediaStream;
      }
    }
    beforeEach(() => {
      mediaStreamBroker = new ObserverMediaStreamBroker();
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        mediaStreamBroker,
        reconnectController
      );
    });

    it('Does nothing if meeting has not started yet', () => {
      const replaceAudioSpy = sinon.spy(audioVideoController, 'replaceLocalAudio');
      mediaStreamBroker.addMediaStreamBrokerObserver(audioVideoController);
      mediaStreamBroker.triggerAudioInputChangeEvent(new MediaStream());
      expect(replaceAudioSpy.notCalled).to.be.true;
      mediaStreamBroker.removeMediaStreamBrokerObserver(audioVideoController);
      replaceAudioSpy.restore();
    });

    it('replace local audio', async () => {
      const mediaStream = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'audio';
      mediaStream.addTrack(track);

      await start();
      const replaceAudioSpy = sinon.spy(audioVideoController, 'replaceLocalAudio');
      mediaStreamBroker.triggerAudioInputChangeEvent(mediaStream);
      await delay(defaultDelay); //Wait for the replaceLocalAudio finish as it is an async function in an event
      expect(replaceAudioSpy.calledOnceWith(mediaStream)).to.be.true;
      await stop();
      replaceAudioSpy.restore();
    });

    it('Try to acquire audio stream if receive undefined audio stream', async () => {
      await start();
      const replaceAudioSpy = sinon.spy(audioVideoController, 'replaceLocalAudio');
      const acquireAudioSpy = sinon.spy(mediaStreamBroker, 'acquireAudioInputStream');
      mediaStreamBroker.triggerAudioInputChangeEvent(undefined);
      await delay(defaultDelay); //Wait for the replaceLocalAudio finish as it is an async function in an event
      expect(replaceAudioSpy.calledOnce).to.be.true;
      expect(acquireAudioSpy.calledOnce).to.be.true;
      await stop();
      replaceAudioSpy.restore();
      acquireAudioSpy.restore();
    });

    it('throw error if failed to acquire audio input stream', async () => {
      class FailedObserverMediaStreamBroker extends ObserverMediaStreamBroker {
        async acquireAudioInputStream(): Promise<MediaStream> {
          throw Error('Failed');
        }
      }
      mediaStreamBroker = new FailedObserverMediaStreamBroker();
      const logger = new NoOpDebugLogger();
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        logger,
        webSocketAdapter,
        mediaStreamBroker,
        reconnectController
      );

      await start();
      const replaceAudioSpy = sinon.spy(audioVideoController, 'replaceLocalAudio');
      const errorLogSpy = sinon.spy(logger, 'error');
      mediaStreamBroker.triggerAudioInputChangeEvent(undefined);
      await delay(defaultDelay); //Wait for the replaceLocalAudio finish as it is an async function in an event
      expect(replaceAudioSpy.notCalled).to.be.true;
      expect(errorLogSpy.calledOnceWith('Could not acquire audio track from mediaStreamBroker')).to
        .be.true;
      await stop();
      replaceAudioSpy.restore();
    });

    afterEach(() => {
      mediaStreamBroker = undefined;
    });
  });

  describe('videoInputDidChange', () => {
    let mediaStreamBroker: ObserverMediaStreamBroker = undefined;
    class ObserverMediaStreamBroker extends NoOpMediaStreamBroker {
      private mediaStreamBrokerObservers: Set<MediaStreamBrokerObserver> = new Set<
        MediaStreamBrokerObserver
      >();
      addMediaStreamBrokerObserver(observer: MediaStreamBrokerObserver): void {
        this.mediaStreamBrokerObservers.add(observer);
      }
      removeMediaStreamBrokerObserver(observer: MediaStreamBrokerObserver): void {
        this.mediaStreamBrokerObservers.delete(observer);
      }
      triggerVideoInputChangeEvent(videoStream: MediaStream | undefined): void {
        for (const observer of this.mediaStreamBrokerObservers) {
          if (observer.videoInputDidChange) {
            observer.videoInputDidChange(videoStream);
          }
        }
      }
      async acquireVideoInputStream(): Promise<MediaStream> {
        const mediaStream = new MediaStream();
        // @ts-ignore
        mediaStream.id = '1';
        const track = new MediaStreamTrack();
        // @ts-ignore
        track.kind = 'video';
        mediaStream.addTrack(track);
        return mediaStream;
      }
    }
    beforeEach(() => {
      mediaStreamBroker = new ObserverMediaStreamBroker();
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        mediaStreamBroker,
        reconnectController
      );
    });

    it('Does nothing if meeting has not started yet', () => {
      const replaceVideoSpy = sinon.spy(audioVideoController, 'replaceLocalVideo');
      mediaStreamBroker.addMediaStreamBrokerObserver(audioVideoController);
      mediaStreamBroker.triggerVideoInputChangeEvent(new MediaStream());
      expect(replaceVideoSpy.notCalled).to.be.true;
      mediaStreamBroker.removeMediaStreamBrokerObserver(audioVideoController);
      replaceVideoSpy.restore();
    });

    it('Does nothing if local tile is not started yet', async () => {
      const mediaStream = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      mediaStream.addTrack(track);

      await start();
      const replaceVideoSpy = sinon.spy(audioVideoController, 'replaceLocalVideo');
      mediaStreamBroker.triggerVideoInputChangeEvent(mediaStream);
      expect(replaceVideoSpy.notCalled).to.be.true;
      await stop();
      replaceVideoSpy.restore();
    });

    it('replace local video if local tile started and video stream changes', async () => {
      const mediaStream = new MediaStream();
      const track = new MediaStreamTrack();
      // @ts-ignore
      track.kind = 'video';
      mediaStream.addTrack(track);

      await start();
      audioVideoController.videoTileController.startLocalVideoTile();
      await sendICEEventAndSubscribeAckFrame();
      const replaceVideoSpy = sinon.spy(audioVideoController, 'replaceLocalVideo');
      mediaStreamBroker.triggerVideoInputChangeEvent(mediaStream);
      await delay(defaultDelay); // Wait for the replaceLocalVideo finish as it is an async function in an event
      expect(replaceVideoSpy.calledOnceWith(mediaStream)).to.be.true;
      await stop();
      replaceVideoSpy.restore();
    });

    it('stop local video if local tile started and video stream is undefined', async () => {
      await start();
      audioVideoController.videoTileController.startLocalVideoTile();
      await sendICEEventAndSubscribeAckFrame();
      const replaceVideoSpy = sinon.spy(audioVideoController, 'replaceLocalVideo');
      const stopLocalVideoSpy = sinon.spy(
        audioVideoController.videoTileController,
        'stopLocalVideoTile'
      );
      mediaStreamBroker.triggerVideoInputChangeEvent(undefined);
      await sendICEEventAndSubscribeAckFrame();
      await delay(defaultDelay); //Wait for the replaceLocalVideo finish as it is an async function in an event
      expect(replaceVideoSpy.notCalled).to.be.true;
      expect(stopLocalVideoSpy.calledOnce).to.be.true;
      await stop();
      replaceVideoSpy.restore();
    });

    afterEach(() => {
      mediaStreamBroker = undefined;
    });
  });
});
