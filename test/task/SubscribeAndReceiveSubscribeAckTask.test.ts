// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import {
  AllHighestVideoBandwidthPolicy,
  DefaultTransceiverController,
  SDP,
  SignalingClientVideoSubscriptionConfiguration,
  TargetDisplaySize,
  VideoPreference,
  VideoPreferences,
  ZLIBTextCompressor,
} from '../../src';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import NoOpMediaStreamBroker from '../../src/mediastreambroker/NoOpMediaStreamBroker';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import ServerSideNetworkAdaption from '../../src/signalingclient/ServerSideNetworkAdaption';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import SignalingClientSubscribe from '../../src/signalingclient/SignalingClientSubscribe';
import {
  SdkIndexFrame,
  SdkSignalFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
  SdkSubscribeAckFrame,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import SubscribeAndReceiveSubscribeAckTask from '../../src/task/SubscribeAndReceiveSubscribeAckTask';
import { wait as delay } from '../../src/utils/Utils';
import DefaultVideoAndCaptureParameter from '../../src/videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import FirefoxSDPMock from '../sdp/FirefoxSDPMock';
import SDPMock from '../sdp/SDPMock';

describe('SubscribeAndReceiveSubscribeAckTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const waitTimeMs = 50;
  const behavior = new DOMMockBehavior();

  const attendeeId = 'foo-attendee';
  const sdpOffer = '';
  const audioHost = 'https://audiohost.test.example.com';

  const sdpAnswer = 'sdp-answer';

  let domMockBuilder: DOMMockBuilder;
  let textCompressor: ZLIBTextCompressor;
  let context: AudioVideoControllerState;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let subscribeAckBuffer: Uint8Array;

  class TestSignalingClient extends DefaultSignalingClient {
    settings: SignalingClientSubscribe;

    subscribe(settings: SignalingClientSubscribe): void {
      super.subscribe(settings);
      this.settings = settings;
    }
  }

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(behavior);

    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    context.realtimeController = new DefaultRealtimeController(new NoOpMediaStreamBroker());

    textCompressor = new ZLIBTextCompressor(context.logger);
    webSocketAdapter = new DefaultWebSocketAdapter(context.logger);

    context.signalingClient = new TestSignalingClient(webSocketAdapter, context.logger);

    const configuration = new MeetingSessionConfiguration();
    configuration.meetingId = 'foo-meeting';
    configuration.urls = new MeetingSessionURLs();
    configuration.urls.audioHostURL = audioHost;
    configuration.urls.turnControlURL = 'https://turncontrol.test.example.com';
    configuration.urls.signalingURL = 'ws://localhost:9999/control';
    configuration.credentials = new MeetingSessionCredentials();
    configuration.credentials.attendeeId = attendeeId;
    configuration.credentials.joinToken = 'foo-join-token';
    context.meetingSessionConfiguration = configuration;
    context.videoDownlinkBandwidthPolicy = new AllHighestVideoBandwidthPolicy('self');

    context.signalingClient.openConnection(
      new SignalingClientConnectionRequest('ws://localhost:9999/control', 'test-auth')
    );
    context.browserBehavior = new DefaultBrowserBehavior();
    const captureAndEncodeParameters = new DefaultVideoAndCaptureParameter(0, 0, 0, 0, false);
    context.videoCaptureAndEncodeParameter = captureAndEncodeParameters;
    const videoStreamIndex = new DefaultVideoStreamIndex(context.logger);
    context.videoStreamIndex = videoStreamIndex;
    context.videoSubscriptions = [1, 2, 3];
    class TestTransceiverController extends DefaultTransceiverController {
      getMidForStreamId(streamId: number): string {
        return streamId === -1 || streamId === 0 ? undefined : streamId.toString();
      }
    }
    // @ts-ignore
    context.transceiverController = new TestTransceiverController();
    const frame = SdkSubscribeAckFrame.create();
    frame.sdpAnswer = sdpAnswer;
    frame.compressedSdpAnswer = new Uint8Array();

    const signal = SdkSignalFrame.create();
    signal.type = SdkSignalFrame.Type.SUBSCRIBE_ACK;
    signal.suback = frame;

    const buffer = SdkSignalFrame.encode(signal).finish();
    subscribeAckBuffer = new Uint8Array(buffer.length + 1);
    subscribeAckBuffer[0] = 0x5;
    subscribeAckBuffer.set(buffer, 1);
  });

  afterEach(async () => {
    context.signalingClient.closeConnection();
    await delay(behavior.asyncWaitMs);
    domMockBuilder.cleanup();
  });

  describe('run', () => {
    it('can subscribe SdkSubscribeAckFrame', async () => {
      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.equal(true);

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();

      const settings: SignalingClientSubscribe = (context.signalingClient as TestSignalingClient)
        .settings;
      expect(settings.attendeeId).to.equal(attendeeId);
      expect(settings.sdpOffer).to.equal(sdpOffer);
      expect(settings.compressedSdpOffer).to.equal(undefined);
      expect(settings.audioHost).to.equal(audioHost);
      expect(settings.audioMuted).to.equal(false);
      expect(settings.audioCheckin).to.equal(false);
    });

    it('can subscribe with a compressed SDP offer for the first request', async () => {
      context.serverSupportsCompression = true;
      context.previousSdpOffer = null;

      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.equal(true);

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();

      const settings: SignalingClientSubscribe = (context.signalingClient as TestSignalingClient)
        .settings;

      expect(settings.sdpOffer).to.equal('');
      expect(settings.compressedSdpOffer.length).is.greaterThan(0);
    });

    it('can subscribe with a compressed SDP offer for subsequent requests', async () => {
      context.serverSupportsCompression = true;

      const description: RTCSessionDescriptionInit = {
        type: 'offer',
        sdp: FirefoxSDPMock.AUDIO_SENDRECV_VIDEO_MULTIPLE,
      };

      context.previousSdpOffer = new SDP(description.sdp);

      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.equal(true);

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();

      const settings: SignalingClientSubscribe = (context.signalingClient as TestSignalingClient)
        .settings;

      expect(settings.sdpOffer).to.equal('');
      expect(settings.compressedSdpOffer.length).is.greaterThan(0);
    });

    it('can subscribe SdkSubscribeAckFrame with SDP', async () => {
      await delay(behavior.asyncWaitMs + 10);

      const description: RTCSessionDescriptionInit = {
        type: 'offer',
        sdp: FirefoxSDPMock.AUDIO_SENDRECV_VIDEO_MULTIPLE,
      };
      context.peer = new RTCPeerConnection();
      context.peer.setLocalDescription(description);
      context.videoSubscriptions = [1, 2, 3, -1];

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();

      const settings: SignalingClientSubscribe = (context.signalingClient as TestSignalingClient)
        .settings;
      expect(settings.attendeeId).to.equal(attendeeId);
      expect(settings.sdpOffer).to.equal(description.sdp);
      expect(settings.audioHost).to.equal(audioHost);
      expect(settings.audioMuted).to.equal(false);
      expect(settings.audioCheckin).to.equal(false);
      expect(settings.receiveStreamIds).to.deep.equal([0, 0, 3, 0, 0]);
    });

    it('can subscribe SdkSubscribeAckFrame with SDP with no subscriptions', async () => {
      await delay(behavior.asyncWaitMs + 10);

      const description: RTCSessionDescriptionInit = {
        type: 'offer',
        sdp: FirefoxSDPMock.AUDIO_SENDRECV_VIDEO_MULTIPLE,
      };
      context.peer = new RTCPeerConnection();
      context.peer.setLocalDescription(description);
      context.videoSubscriptions = [0, 0, 0];

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();

      const settings: SignalingClientSubscribe = (context.signalingClient as TestSignalingClient)
        .settings;
      expect(settings.attendeeId).to.equal(attendeeId);
      expect(settings.sdpOffer).to.equal(description.sdp);
      expect(settings.audioHost).to.equal(audioHost);
      expect(settings.audioMuted).to.equal(false);
      expect(settings.audioCheckin).to.equal(false);
      expect(settings.receiveStreamIds).to.deep.equal([0, 0, 0, 0]);
    });

    it('can subscribe SdkSubscribeAckFrame with SDP without getMidForStreamId', async () => {
      await delay(behavior.asyncWaitMs + 10);

      const description: RTCSessionDescriptionInit = {
        type: 'offer',
        sdp: FirefoxSDPMock.AUDIO_SENDRECV_VIDEO_MULTIPLE,
      };
      context.peer = new RTCPeerConnection();
      context.peer.setLocalDescription(description);
      context.videoSubscriptions = [0, 0, 0];
      context.transceiverController.getMidForStreamId = undefined;

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();

      const settings: SignalingClientSubscribe = (context.signalingClient as TestSignalingClient)
        .settings;
      expect(settings.attendeeId).to.equal(attendeeId);
      expect(settings.sdpOffer).to.equal(description.sdp);
      expect(settings.audioHost).to.equal(audioHost);
      expect(settings.audioMuted).to.equal(false);
      expect(settings.audioCheckin).to.equal(false);
      expect(settings.receiveStreamIds).to.deep.equal([0, 0, 0]);
    });

    it('can subscribe SdkSubscribeAckFrame with remote video subscriptions', async () => {
      await delay(behavior.asyncWaitMs + 10);
      class TestDownlinkPolicy extends AllHighestVideoBandwidthPolicy {
        getServerSideNetworkAdaption(): ServerSideNetworkAdaption {
          return ServerSideNetworkAdaption.BandwidthProbing;
        }

        getVideoPreferences(): VideoPreferences {
          const dummyPreferences = VideoPreferences.prepare();
          dummyPreferences.add(new VideoPreference('attendee-1', 1, TargetDisplaySize.High));
          dummyPreferences.add(new VideoPreference('attendee-2', 2, TargetDisplaySize.Low));
          dummyPreferences.add(new VideoPreference('attendee-3', 3, TargetDisplaySize.Low));
          return dummyPreferences.build();
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

      const sources: SdkStreamDescriptor[] = [];
      sources.push(
        new SdkStreamDescriptor({
          streamId: 1,
          groupId: 2,
          maxBitrateKbps: 100,
          attendeeId: 'attendee-1',
          mediaType: SdkStreamMediaType.VIDEO,
        })
      );
      sources.push(
        new SdkStreamDescriptor({
          streamId: 2,
          groupId: 3,
          maxBitrateKbps: 100,
          attendeeId: 'attendee-2',
          mediaType: SdkStreamMediaType.VIDEO,
        })
      );
      const index = new DefaultVideoStreamIndex(context.logger);
      index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
      context.videoStreamIndex = index;
      context.transceiverController = new TestTransceiverController(
        context.logger,
        new DefaultBrowserBehavior()
      );

      const description: RTCSessionDescriptionInit = {
        type: 'offer',
        sdp: SDPMock.CHROME_UNIFIED_PLAN_AUDIO_VIDEO_TWO_RECEIVE,
      };
      context.peer = new RTCPeerConnection();
      context.peer.setLocalDescription(description);
      context.videoSubscriptions = [0, 100, 1, 2, 3];
      context.videoDownlinkBandwidthPolicy = new TestDownlinkPolicy('self');

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();

      const settings: SignalingClientSubscribe = (context.signalingClient as TestSignalingClient)
        .settings;

      const expected: SignalingClientVideoSubscriptionConfiguration[] = [];
      const first = new SignalingClientVideoSubscriptionConfiguration();
      first.attendeeId = 'attendee-1';
      first.groupId = 2;
      first.mid = '2';
      first.priority = Number.MAX_SAFE_INTEGER - 1;
      first.targetBitrateKbps = 1400;
      expected.push(first);
      const second = new SignalingClientVideoSubscriptionConfiguration();
      second.attendeeId = 'attendee-2';
      second.groupId = 3;
      second.mid = '3';
      second.priority = Number.MAX_SAFE_INTEGER - 2;
      second.targetBitrateKbps = 300;
      expected.push(second);
      expect(settings.videoSubscriptionConfiguration).to.deep.equal(expected);
    });

    it('can subscribe SdkSubscribeAckFrame with remote video subscriptions except no getMidForStreamId', async () => {
      await delay(behavior.asyncWaitMs + 10);
      class TestDownlinkPolicy extends AllHighestVideoBandwidthPolicy {
        getServerSideNetworkAdaption(): ServerSideNetworkAdaption {
          return ServerSideNetworkAdaption.BandwidthProbing;
        }

        getVideoPreferences(): VideoPreferences {
          const dummyPreferences = VideoPreferences.prepare();
          dummyPreferences.add(new VideoPreference('attendee-1', 1, TargetDisplaySize.High));
          dummyPreferences.add(new VideoPreference('attendee-2', 2, TargetDisplaySize.Low));
          return dummyPreferences.build();
        }
      }

      const sources: SdkStreamDescriptor[] = [];
      sources.push(
        new SdkStreamDescriptor({
          streamId: 1,
          groupId: 2,
          maxBitrateKbps: 100,
          attendeeId: 'attendee-1',
          mediaType: SdkStreamMediaType.VIDEO,
        })
      );
      sources.push(
        new SdkStreamDescriptor({
          streamId: 2,
          groupId: 3,
          maxBitrateKbps: 100,
          attendeeId: 'attendee-2',
          mediaType: SdkStreamMediaType.VIDEO,
        })
      );
      const index = new DefaultVideoStreamIndex(context.logger);
      index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
      context.videoStreamIndex = index;
      context.transceiverController.getMidForStreamId = undefined;

      const description: RTCSessionDescriptionInit = {
        type: 'offer',
        sdp: SDPMock.CHROME_UNIFIED_PLAN_AUDIO_VIDEO_TWO_RECEIVE,
      };
      context.peer = new RTCPeerConnection();
      context.peer.setLocalDescription(description);
      context.videoSubscriptions = [0, 1, 2, -1];
      context.videoDownlinkBandwidthPolicy = new TestDownlinkPolicy('self');

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();

      const settings: SignalingClientSubscribe = (context.signalingClient as TestSignalingClient)
        .settings;
      expect(settings.videoSubscriptionConfiguration.length).to.equal(0);
    });

    it('can receive SdkSubscribeAckFrame', async () => {
      await delay(behavior.asyncWaitMs + 10);

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();
      expect(context.sdpAnswer).to.equal(sdpAnswer);
    });

    it('can receive compressed sdp answer', async () => {
      const prevSdpAnwer = 'sdp-answer';
      context.serverSupportsCompression = true;
      context.previousSdpAnswerAsString = prevSdpAnwer;

      const frame = SdkSubscribeAckFrame.create();
      frame.compressedSdpAnswer = textCompressor.compress(sdpAnswer, prevSdpAnwer);

      const signal = SdkSignalFrame.create();
      signal.type = SdkSignalFrame.Type.SUBSCRIBE_ACK;
      signal.suback = frame;

      const buffer = SdkSignalFrame.encode(signal).finish();
      subscribeAckBuffer = new Uint8Array(buffer.length + 1);
      subscribeAckBuffer[0] = 0x5;
      subscribeAckBuffer.set(buffer, 1);

      await delay(behavior.asyncWaitMs + 10);

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();

      const settings: SignalingClientSubscribe = (context.signalingClient as TestSignalingClient)
        .settings;

      expect(settings.compressedSdpOffer.length).is.greaterThan(0);
      expect(context.sdpAnswer).to.equal(sdpAnswer);
    });

    it('throws error when there sdp decompression fails', async () => {
      const prevSdpAnwer = 'sdp-answer';
      context.serverSupportsCompression = true;
      context.previousSdpAnswerAsString = 'random';

      const frame = SdkSubscribeAckFrame.create();
      frame.compressedSdpAnswer = textCompressor.compress(sdpAnswer, prevSdpAnwer);

      const signal = SdkSignalFrame.create();
      signal.type = SdkSignalFrame.Type.SUBSCRIBE_ACK;
      signal.suback = frame;

      const buffer = SdkSignalFrame.encode(signal).finish();
      subscribeAckBuffer = new Uint8Array(buffer.length + 1);
      subscribeAckBuffer[0] = 0x5;
      subscribeAckBuffer.set(buffer, 1);

      await delay(behavior.asyncWaitMs + 10);

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      try {
        await task.run();
      } catch {
        expect(context.previousSdpAnswerAsString).to.be.equal('');
      }
    });

    it('can subscribe without videoCaptureAndEncodeParameter', async () => {
      context.videoCaptureAndEncodeParameter = null;

      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.equal(true);

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();

      const settings: SignalingClientSubscribe = (context.signalingClient as TestSignalingClient)
        .settings;
      expect(settings.attendeeId).to.equal(attendeeId);
      expect(settings.sdpOffer).to.equal(sdpOffer);
      expect(settings.audioHost).to.equal(audioHost);
      expect(settings.audioMuted).to.equal(false);
      expect(settings.audioCheckin).to.equal(false);
    });

    it('can subscribe with munged sdp for safari', async () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.2 Safari/605.1.15';
      context.browserBehavior = new DefaultBrowserBehavior();
      await delay(behavior.asyncWaitMs + 10);

      const description: RTCSessionDescriptionInit = { type: 'offer', sdp: 'sdp-offer' };
      context.peer = new RTCPeerConnection();
      context.peer.setLocalDescription(description);

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();

      const settings: SignalingClientSubscribe = (context.signalingClient as TestSignalingClient)
        .settings;
      expect(settings.attendeeId).to.equal(attendeeId);
      expect(settings.sdpOffer).to.equal(description.sdp);
      expect(settings.audioHost).to.equal(audioHost);
      expect(settings.audioMuted).to.equal(false);
      expect(settings.audioCheckin).to.equal(false);
    });

    it('should throw reject when the connection is closed while waiting for ack', async () => {
      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.equal(true);

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() =>
        webSocketAdapter.close(4500, 'service unavailable')
      );
      try {
        await task.run();
        expect(false).to.equal(true);
      } catch {
        // Task failed
      }
    });

    it('should throw reject when receiving closing event while waiting for ack', async () => {
      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.equal(true);

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => context.signalingClient.closeConnection());
      try {
        await task.run();
        expect(false).to.equal(true);
      } catch {
        // Task failed (expected)
      }
    });

    describe('cancel', () => {
      it('should cancel the task and throw the reject', async () => {
        await delay(behavior.asyncWaitMs + 10);

        const task = new SubscribeAndReceiveSubscribeAckTask(context);
        new TimeoutScheduler(waitTimeMs).start(() => task.cancel());
        try {
          await task.run();
          assert.fail();
        } catch (_err) {}
      });

      it('will cancel idempotently', async () => {
        await delay(behavior.asyncWaitMs + 10);

        const task = new SubscribeAndReceiveSubscribeAckTask(context);
        task.cancel();
        task.cancel();
        try {
          await task.run();
          assert.fail();
        } catch (_err) {}
      });
    });
  });
});
