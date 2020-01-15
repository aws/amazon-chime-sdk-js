// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import DefaultAudioVideoController from '../../src/audiovideocontroller/DefaultAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import Backoff from '../../src/backoff/Backoff';
import ConnectionHealthPolicyConfiguration from '../../src/connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import NoOpDeviceController from '../../src/devicecontroller/NoOpDeviceController';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import DefaultReconnectController from '../../src/reconnectcontroller/DefaultReconnectController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import {
  SdkAudioMetadataFrame,
  SdkAudioStreamIdInfoFrame,
  SdkIndexFrame,
  SdkLeaveAckFrame,
  SdkSignalFrame,
  SdkSubscribeAckFrame,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultAudioVideoController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const rtpCandidateMock =
    'candidate:MOCK9004 1 udp 2122260223 10.88.178.121 52788 typ host generation 0 ufrag PWwO network-id 2 network-cost 50';

  let audioVideoController: DefaultAudioVideoController;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let configuration: MeetingSessionConfiguration;
  let reconnectController: DefaultReconnectController;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;

  class TestBackoff implements Backoff {
    reset(): void {}

    nextBackoffAmountMs(): number {
      return 1;
    }
  }

  async function delay(timeoutMs: number = domMockBehavior.asyncWaitMs * 5): Promise<void> {
    await new Promise(resolve => new TimeoutScheduler(timeoutMs).start(resolve));
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
    configuration.credentials.attendeeId = 'foo-attendee';
    configuration.credentials.joinToken = 'foo-join-token';
    return configuration;
  }

  // For JoinAndReceiveIndexTask
  function makeIndexFrame(): Uint8Array {
    const indexFrame = SdkIndexFrame.create();
    const indexSignal = SdkSignalFrame.create();
    indexSignal.type = SdkSignalFrame.Type.INDEX;
    indexSignal.index = indexFrame;
    const buffer = SdkSignalFrame.encode(indexSignal).finish();
    const indexSignalBuffer = new Uint8Array(buffer.length + 1);
    indexSignalBuffer[0] = 0x5;
    indexSignalBuffer.set(buffer, 1);
    return indexSignalBuffer;
  }

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
  function makeAudioStreamIdInfoFrame(): Uint8Array {
    const frame = SdkAudioStreamIdInfoFrame.create();
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

  // For FinishGatheringICECandidatesTask
  function makeICEEvent(candidateStr: string | null): RTCPeerConnectionIceEvent {
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

  async function finishUpdating(): Promise<void> {
    await delay();
    // @ts-ignore
    audioVideoController.rtcPeerConnection.dispatchEvent(makeICEEvent(rtpCandidateMock));
    await delay();
    webSocketAdapter.send(makeSubscribeAckFrame());
    await delay();
  }

  async function start(): Promise<void> {
    await delay();
    audioVideoController.start();
    await delay();
    webSocketAdapter.send(makeIndexFrame());
    await finishUpdating();
  }

  async function stop(): Promise<void> {
    await delay();
    audioVideoController.stop();
    await delay();
    webSocketAdapter.send(makeLeaveAckFrame());
    await delay();
  }

  async function reconnect(): Promise<void> {
    await delay();
    audioVideoController.reconnect(new MeetingSessionStatus(MeetingSessionStatusCode.OK));
    await delay();
    webSocketAdapter.send(makeIndexFrame());
    await finishUpdating();
  }

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    // This will let FinishGatheringICECandidatesTask wait until receiving the ICE event.
    domMockBehavior.rtcPeerConnectionCreateOfferIncludesLocalHost = true;
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    webSocketAdapter = new DefaultWebSocketAdapter(new NoOpDebugLogger());
    configuration = makeSessionConfiguration();
    reconnectController = new DefaultReconnectController(120 * 1000, new TestBackoff());
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('start', () => {
    it('can be started', async () => {
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
      audioVideoController.addObserver(new TestObserver());
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      new TimeoutScheduler(10).start(() => {
        // use this opportunity to verify that start cannot happen while connecting
        audioVideoController.start();
      });

      await delay();
      // use this opportunity to test signaling mute state to the server
      audioVideoController.realtimeController.realtimeMuteLocalAudio();
      audioVideoController.realtimeController.realtimeUnmuteLocalAudio();

      await delay();
      // use this opportunity to test volume indicators
      webSocketAdapter.send(makeIndexFrame());
      webSocketAdapter.send(makeAudioStreamIdInfoFrame());
      webSocketAdapter.send(makeAudioMetadataFrame());

      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;

      await stop();
    });

    it('can be started and take a bandwidth update', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      // use this opportunity to verify that these can be called before start
      audioVideoController.setVideoMaxBandwidthKbps(100);
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
      audioVideoController.addObserver(new TestObserver());
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();
      await delay();
      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;
      audioVideoController.setVideoMaxBandwidthKbps(100);
      audioVideoController.handleHasBandwidthPriority(false);
      audioVideoController.handleHasBandwidthPriority(true);
      audioVideoController.handleHasBandwidthPriority(true);
      // @ts-ignore mutate the policy state to trigger bandwidth reduction
      audioVideoController.meetingSessionContext.videoUplinkBandwidthPolicy.numParticipants = 4;
      audioVideoController.handleHasBandwidthPriority(false);
      await finishUpdating();
      await delay();
      await stop();
    });

    it('can be started even when the stats collector has an issue starting due to an unsupported browser', async () => {
      setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.2 Safari/605.1.15'
      );
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      let sessionStarted = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          sessionStarted = true;
        }
      }
      audioVideoController.addObserver(new TestObserver());
      await start();
      expect(sessionStarted).to.be.true;
      await stop();
    });

    it('handles an error', async () => {
      configuration.connectionTimeoutMs = 100;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      const spy = sinon.spy(audioVideoController, 'handleMeetingSessionStatus');

      audioVideoController.start();
      await delay();
      configuration.connectionTimeoutMs = 15000;
      audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.Left)
      );
      await stop();
      expect(spy.called).to.be.true;
    });

    it('does not call the observer if it has been removed', async () => {
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
        audioVideoDidStart(): void {
          if (event !== 1 && event !== 3 && event !== 5) {
            assert.fail();
          }
          observed += 1;
        }
      }
      const observer = new TestObserver();
      await delay();
      audioVideoController.addObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.audioVideoDidStart();
      });
      await delay();
      audioVideoController.removeObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.audioVideoDidStart();
      });
      await delay();
      audioVideoController.addObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.audioVideoDidStart();
      });
      await delay();
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.audioVideoDidStart();
      });
      audioVideoController.removeObserver(observer);
      await delay();
      audioVideoController.addObserver(observer);
      event += 1;
      audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
        observer.audioVideoDidStart();
      });
      await delay();
      expect(event).to.equal(5);
      expect(observed).to.equal(3);
    });

    it('can fail but does not reconnect', done => {
      configuration.connectionTimeoutMs = 100;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.TaskFailed);
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());

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
    });
  });

  describe('stop', () => {
    it('can be started and stopped', async () => {
      let called = false;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(): void {
          called = true;
        }
      }
      audioVideoController.addObserver(new TestObserver());
      expect(audioVideoController.configuration).to.equal(configuration);
      await start();
      await stop();
      expect(called).to.be.true;
    });

    it('can be stopped without having been started', () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      audioVideoController.stop();
    });

    it('performs the FinishDisconnecting action even when stopping and cleaning fail', async () => {
      class MockDeviceController extends NoOpDeviceController {
        releaseMediaStream(_mediaStreamToRelease: MediaStream): void {
          throw new Error('Force CleanStoppedSessionTask to fail');
        }
      }

      let called = false;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new MockDeviceController(),
        reconnectController
      );
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(): void {
          called = true;
        }
      }
      audioVideoController.addObserver(new TestObserver());
      expect(audioVideoController.configuration).to.equal(configuration);
      await start();

      configuration.connectionTimeoutMs = 100;

      // Stop and wait for the Leave frame in LeaveAndReceiveLeaveAckTask for 100ms.
      audioVideoController.stop();

      await delay(configuration.connectionTimeoutMs * 2);
      expect(called).to.be.true;
    });
  });

  describe('update', () => {
    it('can be started and then start and stop a local video tile for plan-b', async () => {
      setUserAgent('Chrome/77.0.3865.75');
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      // @ts-ignore
      audioVideoController.meetingSessionContext.localVideoSender = new RTCRtpSender();
      let sessionStarted = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          // use this opportunity to verify that start is idempotent
          audioVideoController.start();
          sessionStarted = true;
        }
      }
      audioVideoController.addObserver(new TestObserver());
      expect(audioVideoController.configuration).to.equal(configuration);
      await start();
      const tileId = audioVideoController.videoTileController.startLocalVideoTile();
      expect(tileId).to.equal(1);
      await finishUpdating();
      audioVideoController.videoTileController.stopLocalVideoTile();
      await finishUpdating();
      await stop();
      expect(sessionStarted).to.be.true;
    });

    it('can be started and then start and stop a local video tile', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      let sessionStarted = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStart(): void {
          // use this opportunity to verify that start is idempotent
          audioVideoController.start();
          sessionStarted = true;
        }
      }
      audioVideoController.addObserver(new TestObserver());
      expect(audioVideoController.configuration).to.equal(configuration);
      await start();
      const tileId = audioVideoController.videoTileController.startLocalVideoTile();
      expect(tileId).to.equal(1);
      await finishUpdating();
      audioVideoController.videoTileController.stopLocalVideoTile();
      await finishUpdating();
      await stop();
      expect(sessionStarted).to.be.true;
    });

    it('reconnects if the update fails with a task failed meeting status', async () => {
      let called = 0;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
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
      audioVideoController.addObserver(new TestObserver());

      await start();
      configuration.connectionTimeoutMs = 100;
      audioVideoController.update(null);
      configuration.connectionTimeoutMs = 15000;
      // At this point, the update operation failed, performing the Reconnect action.
      // Finish the reconnect operation by sending required frames and events.
      await delay(500);
      webSocketAdapter.send(makeIndexFrame());
      await finishUpdating();
      await stop();
      expect(called).to.equal(2);
    });
  });

  describe('restartLocalVideo', () => {
    it('restarts local video', async () => {
      let called = false;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
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
      await start();
      audioVideoController.videoTileController.startLocalVideoTile();
      await finishUpdating();
      audioVideoController.restartLocalVideo(() => {
        called = true;
      });
      // restartLocalVideo() triggers 4 updates.
      await finishUpdating();
      await finishUpdating();
      await finishUpdating();
      await finishUpdating();
      await stop();
      expect(stopLocalVideoTileSpy.called).to.be.true;
      expect(startLocalVideoTileSpy.called).to.be.true;
      expect(called).to.be.true;
    });

    it('can defer restartLocalVideo and performs a single update operation when the local video is turned off', async () => {
      let called = false;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
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
      await delay();
      audioVideoController.restartLocalVideo(() => {
        called = true;
      });
      await start();
      await finishUpdating();
      await stop();
      expect(stopLocalVideoTileSpy.called).to.be.false;
      expect(startLocalVideoTileSpy.called).to.be.false;
      expect(called).to.be.true;
    });
  });

  describe('restartLocalAudio', () => {
    it('fails if device controller has no active audio stream', async () => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );

      let success = true;
      try {
        await audioVideoController.restartLocalAudio(() => {});
      } catch (error) {
        success = false;
      }

      expect(success).to.be.false;

      class TestDeviceController extends NoOpDeviceController {
        async acquireAudioInputStream(): Promise<MediaStream> {
          const mediaStream = new MediaStream();
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
      success = true;
      try {
        await audioVideoController.restartLocalAudio(() => {});
      } catch (error) {
        success = false;
      }
      expect(success).to.be.false;
    });

    it('fails if no peer connection is established', async () => {
      class TestDeviceController extends NoOpDeviceController {
        async acquireAudioInputStream(): Promise<MediaStream> {
          const mediaStream = new MediaStream();
          const track = new MediaStreamTrack();
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
      let success = true;
      try {
        await audioVideoController.restartLocalAudio(() => {});
      } catch (error) {
        success = false;
      }
      expect(success).to.be.false;
    });

    it('replaces audio track for unified plan', async () => {
      class TestDeviceController extends NoOpDeviceController {
        async acquireAudioInputStream(): Promise<MediaStream> {
          const mediaStream = new MediaStream();
          const track = new MediaStreamTrack();
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

      audioVideoController.deviceController.enableWebAudio(false);
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
      audioVideoController.addObserver(new TestObserver());
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();

      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;

      let callbackExecuted = false;
      await audioVideoController.restartLocalAudio(() => {
        callbackExecuted = true;
      });
      expect(callbackExecuted).to.be.true;
      await stop();
    });

    it('replaces audio track for Plan-B', async () => {
      setUserAgent('Chrome/77.0.3865.75');
      class TestDeviceController extends NoOpDeviceController {
        async acquireAudioInputStream(): Promise<MediaStream> {
          const mediaStream = new MediaStream();
          const track = new MediaStreamTrack();
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
      audioVideoController.deviceController.enableWebAudio(false);
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
      audioVideoController.addObserver(new TestObserver());
      expect(audioVideoController.configuration).to.equal(configuration);
      expect(audioVideoController.rtcPeerConnection).to.be.null;
      await start();

      expect(sessionStarted).to.be.true;
      expect(sessionConnecting).to.be.true;
      let callbackExecuted = false;
      await audioVideoController.restartLocalAudio(() => {
        callbackExecuted = true;
      });
      expect(callbackExecuted).to.be.true;

      // @ts-ignore mutate the context state to trigger rejection
      audioVideoController.meetingSessionContext.localAudioSender = null;
      try {
        await audioVideoController.restartLocalAudio(() => {});
        throw Error();
      } catch (error) {}
      await stop();
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
        new NoOpDeviceController(),
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
      audioVideoController.addObserver(new TestObserver());
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
    });

    it('does not reconnect if canceled', async () => {
      let called = 0;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(_sessionStatus: MeetingSessionStatus): void {
          called += 1;
        }
      }
      audioVideoController.addObserver(new TestObserver());
      await start();
      audioVideoController.reconnect(new MeetingSessionStatus(MeetingSessionStatusCode.OK));
      reconnectController.cancel();
      await stop();
      expect(called).to.equal(1);
    });

    it('can reconnect in Plan B', async () => {
      setUserAgent('Chrome/77.0.3865.75');

      let startConnectingCalled = 0;
      let startCalled = 0;
      let stopCalled = 0;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStartConnecting(reconnecting: boolean): void {
          if (startConnectingCalled > 0) {
            expect(reconnecting).to.be.true;
          }
          startConnectingCalled += 1;
        }
        audioVideoDidStart(): void {
          startCalled += 1;
        }
        audioVideoDidStop(_sessionStatus: MeetingSessionStatus): void {
          stopCalled += 1;
        }
      }
      audioVideoController.addObserver(new TestObserver());
      await start();
      await reconnect();
      await stop();

      // 1 (reconnect) + 1 (start/stop)
      const expected = 2;
      expect(startConnectingCalled).to.equal(expected);
      expect(startCalled).to.equal(expected);
      // 0 (reconnect) + 1 (stop)
      expect(stopCalled).to.equal(1);
    });

    // FinishGatheringICECandidatesTask does not throw the ICEGatheringTimeoutWorkaround error if
    // the session connection timeout is less than 5000ms.
    it('reconnects when the start operation fails with a non-Terminal meeting status such as ICEGatheringTimeoutWorkaround', function(done) {
      this.timeout(10000);

      setUserAgent('Chrome/77.0.3865.75');

      configuration.connectionTimeoutMs = 6000;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.OK);
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());
      audioVideoController.start();
      delay().then(() => {
        // Finish JoinAndReceiveIndexTask and then wait for the ICE event in FinishGatheringICECandidatesTask.
        webSocketAdapter.send(makeIndexFrame());
      });

      delay(configuration.connectionTimeoutMs + 100).then(() => {
        // Finish LeaveAndReceiveLeaveAckTask executed by the failed "start."
        webSocketAdapter.send(makeLeaveAckFrame());
      });

      delay(configuration.connectionTimeoutMs + 200).then(async () => {
        // At this point, the start operation failed so attempted to connect the session again.
        // Finish the start operation by sending required frames and events.
        webSocketAdapter.send(makeIndexFrame());
        await finishUpdating();
        // Finally, stop this test.
        await stop();
      });
    });

    it('reconnects when the start operation fails with a task failed meeting status', function(done) {
      configuration.connectionTimeoutMs = 100;
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.OK);
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());
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
        webSocketAdapter.send(makeIndexFrame());
        await finishUpdating();
        await stop();
      });
    });

    it('reconnects when the reconnect operation itself fails', done => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
        reconnectController
      );
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.OK);
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());
      const spy = sinon.spy(reconnectController, 'retryWithBackoff');

      start().then(() => {
        configuration.connectionTimeoutMs = 100;
        audioVideoController.reconnect(new MeetingSessionStatus(MeetingSessionStatusCode.Left));

        delay(configuration.connectionTimeoutMs * 2.5).then(async () => {
          expect(spy.callCount).to.equal(3);
          await stop();
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
        new NoOpDeviceController(),
        reconnectController
      );
      const reconnectSpy = sinon.spy(audioVideoController, 'reconnect');

      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {
          expect(sessionStatus.statusCode()).to.equal(MeetingSessionStatusCode.OK);
          done();
        }
      }
      audioVideoController.addObserver(new TestObserver());
      start();

      // connectionHealthDidChange in MonitorTask is called for the first time
      // after the stats collector receives metrics after 1000ms.
      delay(1500).then(async () => {
        expect(reconnectSpy.called).to.be.true;

        // Finish the reconnect operation and stop this test.
        webSocketAdapter.send(makeIndexFrame());
        await finishUpdating();
        await stop();
      });
    });
  });

  describe('getters', () => {
    it('returns a device controller for the mediaStreamBroker and deviceController getter', () => {
      const deviceController = new NoOpDeviceController();
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        deviceController,
        reconnectController
      );
      expect(deviceController).to.equal(audioVideoController.mediaStreamBroker);
      expect(deviceController).to.equal(audioVideoController.deviceController);
    });
  });

  describe('handleMeetingSessionStatus', () => {
    beforeEach(() => {
      audioVideoController = new DefaultAudioVideoController(
        configuration,
        new NoOpDebugLogger(),
        webSocketAdapter,
        new NoOpDeviceController(),
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
      audioVideoController.addObserver(new TestObserver());
      await start();
      audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.VideoCallSwitchToViewOnly)
      );
      await delay();
      expect(spy.called).to.be.true;
      expect(called).to.be.true;
      await stop();
    });

    it('does not reconnect for the terminal status or the unknown status', async () => {
      let called = false;
      class TestObserver implements AudioVideoObserver {
        audioVideoDidStop(_sessionStatus: MeetingSessionStatus): void {
          called = true;
        }
      }
      audioVideoController.addObserver(new TestObserver());
      await start();
      audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.Left)
      );
      await delay();
      audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.AudioDisconnectAudio)
      );
      expect(called).to.be.false;
      await stop();
    });

    it('does not reconnect if the reconnectController is not set in the context', async () => {
      const spy = sinon.spy(reconnectController, 'disableReconnect');
      audioVideoController.handleMeetingSessionStatus(
        new MeetingSessionStatus(MeetingSessionStatusCode.Left)
      );
      await delay();
      expect(spy.called).to.be.false;
    });
  });
});
