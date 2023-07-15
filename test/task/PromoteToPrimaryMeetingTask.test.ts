// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import { MeetingSessionStatusCode } from '../../src';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import BrowserBehavior from '../../src/browserbehavior/BrowserBehavior';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClient from '../../src/signalingclient/SignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import SignalingClientEvent from '../../src/signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../../src/signalingclient/SignalingClientEventType';
import {
  SdkErrorFrame,
  SdkPrimaryMeetingJoinAckFrame,
  SdkSignalFrame,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import PromoteToPrimaryMeetingTask from '../../src/task/PromoteToPrimaryMeetingTask';
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import { wait as delay } from '../../src/utils/Utils';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('PromoteToPrimaryMeetingTask', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder;
  const behavior = new DOMMockBehavior();

  let webSocketAdapter: DefaultWebSocketAdapter;
  let signalingClient: SignalingClient;
  let primaryMeetingJoinAck: Uint8Array;
  let request: SignalingClientConnectionRequest;
  let browser: BrowserBehavior;

  function makePrimaryMeetingJoinAckFrame(errorStatus: number = undefined): Uint8Array {
    const frame = SdkPrimaryMeetingJoinAckFrame.create();
    const signal = SdkSignalFrame.create();
    signal.type = SdkSignalFrame.Type.PRIMARY_MEETING_JOIN_ACK;
    signal.primaryMeetingJoinAck = frame;
    if (errorStatus !== undefined) {
      const error = SdkErrorFrame.create();
      error.status = errorStatus;
      signal.error = error;
    }

    const buffer = SdkSignalFrame.encode(signal).finish();
    const primaryMeetingJoinAck = new Uint8Array(buffer.length + 1);
    primaryMeetingJoinAck[0] = 0x5;
    primaryMeetingJoinAck.set(buffer, 1);
    return primaryMeetingJoinAck;
  }

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(behavior);
    browser = new DefaultBrowserBehavior();
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.transceiverController = new DefaultTransceiverController(context.logger, browser);
    context.logger = context.audioVideoController.logger;
    webSocketAdapter = new DefaultWebSocketAdapter(context.logger);
    signalingClient = new DefaultSignalingClient(webSocketAdapter, context.logger);
    // configuration.urls.signalingURL = 'ws://localhost:9999/control';
    context.signalingClient = signalingClient;
    context.peer = new RTCPeerConnection();
    request = new SignalingClientConnectionRequest('ws://localhost:9999/control', 'test-auth');
    context.signalingClient.openConnection(request);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('run', () => {
    it('runs successfully in normal case', async () => {
      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.be.true;

      let completionCallbackCalled = false;
      const task = new PromoteToPrimaryMeetingTask(
        context,
        new MeetingSessionCredentials(),
        (status: MeetingSessionStatus) => {
          completionCallbackCalled = true;
          expect(status.statusCode()).to.equal(MeetingSessionStatusCode.OK);
        }
      );
      primaryMeetingJoinAck = makePrimaryMeetingJoinAckFrame();
      new TimeoutScheduler(100).start(() => webSocketAdapter.send(primaryMeetingJoinAck));
      await task.run().then(() => {});

      expect(completionCallbackCalled).to.be.true;
    });

    it('runs and propagates error returned in normal case', async () => {
      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.be.true;

      let completionCallbackCalled = false;
      const task = new PromoteToPrimaryMeetingTask(
        context,
        new MeetingSessionCredentials(),
        (status: MeetingSessionStatus) => {
          completionCallbackCalled = true;
          expect(status.statusCode()).to.equal(
            MeetingSessionStatusCode.AudioAuthenticationRejected
          );
        }
      );
      primaryMeetingJoinAck = makePrimaryMeetingJoinAckFrame(403);
      new TimeoutScheduler(100).start(() => webSocketAdapter.send(primaryMeetingJoinAck));
      await task.run().then(() => {});

      expect(completionCallbackCalled).to.be.true;
    });

    it('completes when the connection is closed while waiting for ack', async () => {
      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.be.true;

      let completionCallbackCalled = false;
      const task = new PromoteToPrimaryMeetingTask(
        context,
        new MeetingSessionCredentials(),
        (status: MeetingSessionStatus) => {
          completionCallbackCalled = true;
          expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingRequestFailed);
        }
      );
      new TimeoutScheduler(50).start(() => webSocketAdapter.close());
      await task.run().then(() => {});

      expect(completionCallbackCalled).to.be.true;
    });

    it('completes when receiving closing event while waiting for ack', async () => {
      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.be.true;

      let completionCallbackCalled = false;
      const task = new PromoteToPrimaryMeetingTask(
        context,
        new MeetingSessionCredentials(),
        (status: MeetingSessionStatus) => {
          completionCallbackCalled = true;
          expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingRequestFailed);
        }
      );
      new TimeoutScheduler(50).start(() => context.signalingClient.closeConnection());
      await task.run().then(() => {});

      expect(completionCallbackCalled).to.be.true;
    });

    it('completes when receiving error event while waiting for ack', async () => {
      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.be.true;

      let completionCallbackCalled = false;
      const task = new PromoteToPrimaryMeetingTask(
        context,
        new MeetingSessionCredentials(),
        (status: MeetingSessionStatus) => {
          completionCallbackCalled = true;
          expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingRequestFailed);
        }
      );
      new TimeoutScheduler(50).start(() => {
        behavior.webSocketSendSucceeds = false;
        webSocketAdapter.send(new Uint8Array([0]));
      });
      await task.run().then(() => {});

      expect(completionCallbackCalled).to.be.true;
    });

    it('completes when receiving failed event while waiting for ack', async () => {
      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.be.true;

      let completionCallbackCalled = false;
      const task = new PromoteToPrimaryMeetingTask(
        context,
        new MeetingSessionCredentials(),
        (status: MeetingSessionStatus) => {
          completionCallbackCalled = true;
          expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingRequestFailed);
        }
      );
      new TimeoutScheduler(50).start(() => {
        // @ts-ignore
        context.signalingClient.sendEvent(
          new SignalingClientEvent(
            context.signalingClient,
            SignalingClientEventType.WebSocketFailed,
            null
          )
        );
      });
      await task.run().then(() => {});

      expect(completionCallbackCalled).to.be.true;
    });

    it('completes when the connection is already closed', async () => {
      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.be.true;

      context.signalingClient.closeConnection();

      let completionCallbackCalled = false;
      const task = new PromoteToPrimaryMeetingTask(
        context,
        new MeetingSessionCredentials(),
        (status: MeetingSessionStatus) => {
          completionCallbackCalled = true;
          expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingRequestFailed);
        }
      );
      await task.run().then(() => {});
      expect(completionCallbackCalled).to.be.true;
    });
  });

  describe('cancel', () => {
    it('should cancel the task and throw the reject', async () => {
      await delay(behavior.asyncWaitMs + 10);
      expect(context.signalingClient.ready()).to.be.true;

      let completionCallbackCalled = false;
      const task = new PromoteToPrimaryMeetingTask(
        context,
        new MeetingSessionCredentials(),
        (status: MeetingSessionStatus) => {
          completionCallbackCalled = true;
          expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingRequestFailed);
        }
      );
      new TimeoutScheduler(100).start(() => task.cancel());
      try {
        await task.run();
        assert.fail();
      } catch (_err) {}

      expect(completionCallbackCalled).to.be.true;
    });

    it('will cancel idempotently', async () => {
      await delay(50);
      let completionCallbackCalled = false;
      const task = new PromoteToPrimaryMeetingTask(
        context,
        new MeetingSessionCredentials(),
        (status: MeetingSessionStatus) => {
          completionCallbackCalled = true;
          expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingRequestFailed);
        }
      );
      task.cancel();
      task.cancel();
      try {
        await task.run();
        assert.fail();
      } catch (_err) {}
      expect(completionCallbackCalled).to.be.false;
    });
  });
});
