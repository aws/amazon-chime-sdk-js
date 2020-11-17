// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import SignalingClientSubscribe from '../../src/signalingclient/SignalingClientSubscribe';
import {
  SdkSignalFrame,
  SdkSubscribeAckFrame,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import SubscribeAndReceiveSubscribeAckTask from '../../src/task/SubscribeAndReceiveSubscribeAckTask';
import DefaultVideoAndCaptureParameter from '../../src/videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

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
    context.realtimeController = new DefaultRealtimeController();

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

    context.signalingClient.openConnection(
      new SignalingClientConnectionRequest('ws://localhost:9999/control', 'test-auth')
    );
    context.browserBehavior = new DefaultBrowserBehavior();
    const captureAndEncodeParameters = new DefaultVideoAndCaptureParameter(0, 0, 0, 0, false);
    context.videoCaptureAndEncodeParameter = captureAndEncodeParameters;
    const videoStreamIndex = new DefaultVideoStreamIndex(context.logger);
    context.videoStreamIndex = videoStreamIndex;
    const frame = SdkSubscribeAckFrame.create();
    frame.sdpAnswer = sdpAnswer;

    const signal = SdkSignalFrame.create();
    signal.type = SdkSignalFrame.Type.SUBSCRIBE_ACK;
    signal.suback = frame;

    const buffer = SdkSignalFrame.encode(signal).finish();
    subscribeAckBuffer = new Uint8Array(buffer.length + 1);
    subscribeAckBuffer[0] = 0x5;
    subscribeAckBuffer.set(buffer, 1);
  });

  afterEach(() => {
    context.signalingClient.closeConnection();
    domMockBuilder.cleanup();
  });

  describe('run', () => {
    it('can subscribe SdkSubscribeAckFrame', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
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

    it('can subscribe SdkSubscribeAckFrame with SDP', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));

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

    it('can receive SdkSubscribeAckFrame', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => webSocketAdapter.send(subscribeAckBuffer));
      await task.run();
      expect(context.sdpAnswer).to.equal(sdpAnswer);
    });

    it('can subscribe without videoCaptureAndEncodeParameter', async () => {
      context.videoCaptureAndEncodeParameter = null;

      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
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
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));

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
  });

  describe('cancel', () => {
    it('should cancel the task and throw the reject', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));

      const task = new SubscribeAndReceiveSubscribeAckTask(context);
      new TimeoutScheduler(waitTimeMs).start(() => task.cancel());
      try {
        await task.run();
        assert.fail();
      } catch (_err) {}
    });

    it('will cancel idempotently', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));

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
