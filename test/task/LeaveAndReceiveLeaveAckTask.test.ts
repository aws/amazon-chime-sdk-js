// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import BrowserBehavior from '../../src/browserbehavior/BrowserBehavior';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClient from '../../src/signalingclient/SignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import SignalingClientEvent from '../../src/signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../../src/signalingclient/SignalingClientEventType';
import { SdkLeaveAckFrame, SdkSignalFrame } from '../../src/signalingprotocol/SignalingProtocol.js';
import LeaveAndReceiveLeaveAckTask from '../../src/task/LeaveAndReceiveLeaveAckTask';
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('LeaveAndReceiveLeaveAckTask', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const waitTimeMs = 50;
  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder;
  const behavior = new DOMMockBehavior();

  let webSocketAdapter: DefaultWebSocketAdapter;
  let signalingClient: SignalingClient;
  let leaveAckBuffer: Uint8Array;
  let request: SignalingClientConnectionRequest;
  const browser: BrowserBehavior = new DefaultBrowserBehavior();

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

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder(behavior);
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
    it('can be run', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(context.signalingClient.ready()).to.be.true;

      const task = new LeaveAndReceiveLeaveAckTask(context);
      leaveAckBuffer = makeLeaveAckFrame();
      new TimeoutScheduler(100).start(() => webSocketAdapter.send(leaveAckBuffer));
      await task.run().then(() => {});
    });

    it('completes when the connection is closed while waiting for ack', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(context.signalingClient.ready()).to.be.true;

      const task = new LeaveAndReceiveLeaveAckTask(context);
      new TimeoutScheduler(50).start(() => webSocketAdapter.close());
      await task.run().then(() => {});
    });

    it('completes when receiving closing event while waiting for ack', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(context.signalingClient.ready()).to.be.true;

      const task = new LeaveAndReceiveLeaveAckTask(context);
      new TimeoutScheduler(50).start(() => context.signalingClient.closeConnection());
      await task.run().then(() => {});
    });

    it('completes when receiving error event while waiting for ack', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(context.signalingClient.ready()).to.be.true;

      const task = new LeaveAndReceiveLeaveAckTask(context);
      new TimeoutScheduler(50).start(() => {
        behavior.webSocketSendSucceeds = false;
        webSocketAdapter.send(new Uint8Array([0]));
      });
      await task.run().then(() => {});
    });

    it('completes when receiving failed event while waiting for ack', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(context.signalingClient.ready()).to.be.true;

      const task = new LeaveAndReceiveLeaveAckTask(context);
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
    });

    it('completes when the connection is already closed', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(context.signalingClient.ready()).to.be.true;

      context.signalingClient.closeConnection();
      const task = new LeaveAndReceiveLeaveAckTask(context);
      await task.run().then(() => {});
    });
  });

  describe('cancel', () => {
    it('should cancel the task and throw the reject', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(context.signalingClient.ready()).to.be.true;
      const task = new LeaveAndReceiveLeaveAckTask(context);
      new TimeoutScheduler(100).start(() => task.cancel());
      try {
        await task.run();
        assert.fail();
      } catch (_err) {}
    });

    it('will cancel idempotently', async () => {
      await new Promise(resolve => new TimeoutScheduler(waitTimeMs).start(resolve));
      const task = new LeaveAndReceiveLeaveAckTask(context);
      task.cancel();
      task.cancel();
      try {
        await task.run();
        assert.fail();
      } catch (_err) {}
    });
  });
});
