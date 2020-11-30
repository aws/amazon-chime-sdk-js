// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionStatus from '../../src/meetingsession/MeetingSessionStatus';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import {
  SdkIndexFrame,
  SdkJoinAckFrame,
  SdkSignalFrame,
  SdkTurnCredentials,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import JoinAndReceiveIndexTask from '../../src/task/JoinAndReceiveIndexTask';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('JoinAndReceiveIndexTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const behavior = new DOMMockBehavior();
  const logger = new NoOpDebugLogger();
  let task: JoinAndReceiveIndexTask;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let signalingClient: DefaultSignalingClient;
  let context: AudioVideoControllerState;
  let request: SignalingClientConnectionRequest;
  let domMockBuilder: DOMMockBuilder | null = null;
  let joinAckSignalBuffer: Uint8Array;
  let indexSignalBuffer: Uint8Array;

  beforeEach(async () => {
    // use the default 10 ms async wait
    domMockBuilder = new DOMMockBuilder(behavior);
    webSocketAdapter = new DefaultWebSocketAdapter(logger);
    signalingClient = new DefaultSignalingClient(webSocketAdapter, logger);
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = logger;
    context.signalingClient = signalingClient;
    context.browserBehavior = new DefaultBrowserBehavior();
    context.meetingSessionConfiguration = new MeetingSessionConfiguration();
    context.meetingSessionConfiguration.urls = new MeetingSessionURLs();
    task = new JoinAndReceiveIndexTask(context);

    request = new SignalingClientConnectionRequest(`ws://localhost:9999/control`, 'test-auth');

    const joinAckFrame = SdkJoinAckFrame.create();
    joinAckFrame.turnCredentials = SdkTurnCredentials.create();
    joinAckFrame.turnCredentials.username = 'fake-username';
    joinAckFrame.turnCredentials.password = 'fake-password';
    joinAckFrame.turnCredentials.ttl = 300;
    joinAckFrame.turnCredentials.uris = ['fake-turn', 'fake-turns'];

    const joinAckSignal = SdkSignalFrame.create();
    joinAckSignal.type = SdkSignalFrame.Type.JOIN_ACK;
    joinAckSignal.joinack = joinAckFrame;

    const joinAckBuffer = SdkSignalFrame.encode(joinAckSignal).finish();
    joinAckSignalBuffer = new Uint8Array(joinAckBuffer.length + 1);
    joinAckSignalBuffer[0] = 0x5;
    joinAckSignalBuffer.set(joinAckBuffer, 1);

    const indexFrame = SdkIndexFrame.create();
    const indexSignal = SdkSignalFrame.create();
    indexSignal.type = SdkSignalFrame.Type.INDEX;
    indexSignal.index = indexFrame;

    const indexBuffer = SdkSignalFrame.encode(indexSignal).finish();
    indexSignalBuffer = new Uint8Array(indexBuffer.length + 1);
    indexSignalBuffer[0] = 0x5;
    indexSignalBuffer.set(indexBuffer, 1);
    signalingClient.openConnection(request);
  });

  afterEach(() => {
    signalingClient.closeConnection();
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('run', () => {
    it('can process a websocket close indicating the meeting has ended', async () => {
      // @ts-ignore
      let receivedStatus = false;
      context.audioVideoController.handleMeetingSessionStatus = (
        status: MeetingSessionStatus,
        _error: Error
      ): boolean => {
        expect(status.statusCode()).to.equal(MeetingSessionStatusCode.MeetingEnded);
        receivedStatus = true;
        return true;
      };
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(signalingClient.ready()).to.equal(true);
      new TimeoutScheduler(100).start(() => {
        webSocketAdapter.close(4410, 'meeting unavailable');
      });
      new TimeoutScheduler(200).start(() => {
        // Simulate task cancellation due to close message being received
        task.cancel();
      });
      try {
        await task.run();
        expect(false).to.equal(true);
      } catch {
        expect(context.indexFrame).to.equal(null);
        expect(context.turnCredentials).to.equal(null);
        expect(receivedStatus).to.equal(true);
      }
    });

    it('can process a websocket close indicating there was an internal server error', async () => {
      // @ts-ignore
      let receivedStatus = false;
      context.audioVideoController.handleMeetingSessionStatus = (
        status: MeetingSessionStatus,
        _error: Error
      ): boolean => {
        expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingInternalServerError);
        receivedStatus = true;
        return true;
      };
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(signalingClient.ready()).to.equal(true);
      new TimeoutScheduler(100).start(() => {
        webSocketAdapter.close(4500, 'service unavailable');
      });
      new TimeoutScheduler(200).start(() => {
        // Simulate task cancellation due to close message being received
        task.cancel();
      });
      try {
        await task.run();
        expect(false).to.equal(true);
      } catch {
        expect(context.indexFrame).to.equal(null);
        expect(context.turnCredentials).to.equal(null);
        expect(receivedStatus).to.equal(true);
      }
    });

    it('can process a websocket close indicating there was a generic bad request', async () => {
      // @ts-ignore
      let receivedStatus = false;
      context.audioVideoController.handleMeetingSessionStatus = (
        status: MeetingSessionStatus,
        _error: Error
      ): boolean => {
        expect(status.statusCode()).to.equal(MeetingSessionStatusCode.SignalingBadRequest);
        receivedStatus = true;
        return true;
      };
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(signalingClient.ready()).to.equal(true);
      new TimeoutScheduler(100).start(() => {
        webSocketAdapter.close(4400, 'bad request');
      });
      new TimeoutScheduler(200).start(() => {
        // Simulate task cancellation due to close message being received
        task.cancel();
      });
      try {
        await task.run();
        expect(false).to.equal(true);
      } catch {
        expect(context.indexFrame).to.equal(null);
        expect(context.turnCredentials).to.equal(null);
        expect(receivedStatus).to.equal(true);
      }
    });

    it('can run and receive join ack and index frame', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(signalingClient.ready()).to.equal(true);
      new TimeoutScheduler(100).start(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      });
      new TimeoutScheduler(200).start(() => {
        webSocketAdapter.send(indexSignalBuffer);
      });
      await task.run();
      expect(context.indexFrame).to.not.equal(null);
      expect(context.turnCredentials.username).to.equal('fake-username');
      expect(context.turnCredentials.password).to.equal('fake-password');
      expect(context.turnCredentials.ttl).to.equal(300);
      expect(context.turnCredentials.uris).to.deep.equal(['fake-turn', 'fake-turns']);
    });

    it('can run and only handle SdkIndexFrame', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(signalingClient.ready()).to.equal(true);
      const leaveSignalTimer = new TimeoutScheduler(100);
      leaveSignalTimer.start(() => {
        signalingClient.leave();
      });
      new TimeoutScheduler(200).start(() => {
        webSocketAdapter.send(joinAckSignalBuffer);
      });
      new TimeoutScheduler(300).start(() => {
        expect(context.indexFrame).to.equal(null);
        webSocketAdapter.send(indexSignalBuffer);
      });
      await task.run();
      expect(context.indexFrame).to.not.equal(null);
    });
  });

  describe('cancel', () => {
    it('should cancel the task and throw the reject', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(signalingClient.ready()).to.equal(true);
      const timer = new TimeoutScheduler(100);
      timer.start(() => {
        task.cancel();
      });
      try {
        await task.run();
      } catch (err) {
        expect(err.toString()).to.equal(
          `Error: JoinAndReceiveIndexTask got canceled while waiting for SdkIndexFrame`
        );
      }
    });

    it('should immediately throw the reject if task was canceled before running', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(signalingClient.ready()).to.equal(true);

      task.cancel();
      task.cancel();
      try {
        await task.run();
      } catch (err) {
        expect(err.toString()).to.equal(`Error: ${task.name()} was canceled before running`);
      }
    });
  });
});
