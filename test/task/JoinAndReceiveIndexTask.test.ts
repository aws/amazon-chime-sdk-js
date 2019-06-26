// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import { SdkIndexFrame, SdkSignalFrame } from '../../src/signalingprotocol/SignalingProtocol.js';
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
    task = new JoinAndReceiveIndexTask(context);

    request = new SignalingClientConnectionRequest(`ws://localhost:9999/control`, 'test-auth');
    const indexFrame = SdkIndexFrame.create();
    const indexSignal = SdkSignalFrame.create();
    indexSignal.type = SdkSignalFrame.Type.INDEX;
    indexSignal.index = indexFrame;

    const buffer = SdkSignalFrame.encode(indexSignal).finish();
    indexSignalBuffer = new Uint8Array(buffer.length + 1);
    indexSignalBuffer[0] = 0x5;
    indexSignalBuffer.set(buffer, 1);
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
    it('can run and receive index frame', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(signalingClient.ready()).to.equal(true);
      const timer = new TimeoutScheduler(100);
      timer.start(() => {
        webSocketAdapter.send(indexSignalBuffer);
      });
      await task.run();
      expect(context.indexFrame).to.not.equal(null);
    });

    it('can run and only handle SdkIndexFrame', async () => {
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(signalingClient.ready()).to.equal(true);
      const leaveSignalTimer = new TimeoutScheduler(100);
      leaveSignalTimer.start(() => {
        signalingClient.leave();
      });

      const timer = new TimeoutScheduler(200);
      timer.start(() => {
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
