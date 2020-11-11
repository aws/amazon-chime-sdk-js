// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import {
  SdkAudioMetadataFrame,
  SdkAudioStreamIdInfoFrame,
  SdkIndexFrame,
  SdkSignalFrame,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import ListenForVolumeIndicatorsTask from '../../src/task/ListenForVolumeIndicatorsTask';
import DefaultVolumeIndicatorAdapter from '../../src/volumeindicatoradapter/DefaultVolumeIndicatorAdapter';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('ListenForVolumeIndicatorsTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const behavior = new DOMMockBehavior();
  const logger = new NoOpDebugLogger();

  let domMockBuilder: DOMMockBuilder;
  let context: AudioVideoControllerState;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let task: ListenForVolumeIndicatorsTask;

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

  beforeEach(async () => {
    domMockBuilder = new DOMMockBuilder(behavior);
    webSocketAdapter = new DefaultWebSocketAdapter(logger);

    context = new AudioVideoControllerState();
    context.signalingClient = new DefaultSignalingClient(webSocketAdapter, logger);
    context.audioVideoController = new NoOpAudioVideoController();
    context.realtimeController = new DefaultRealtimeController();
    context.logger = logger;
    context.volumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
      logger,
      context.realtimeController,
      -42,
      -14
    );

    task = new ListenForVolumeIndicatorsTask(context);

    context.signalingClient.openConnection(
      new SignalingClientConnectionRequest('ws://localhost:9999/control', 'test-auth')
    );

    await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
    expect(context.signalingClient.ready()).to.equal(true);
  });

  afterEach(() => {
    context.signalingClient.closeConnection();
    domMockBuilder.cleanup();
  });

  describe('run', () => {
    it('handles the audio stream ID info', async () => {
      const count = 3;
      const spy = sinon.spy(
        context.volumeIndicatorAdapter,
        'sendRealtimeUpdatesForAudioStreamIdInfo'
      );
      await task.run();
      for (let i = 0; i < count; i++) {
        webSocketAdapter.send(makeAudioStreamIdInfoFrame());
      }
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(spy.callCount).to.equal(3);
    });

    it('handles the audio metadata', async () => {
      const count = 3;
      const spy = sinon.spy(context.volumeIndicatorAdapter, 'sendRealtimeUpdatesForAudioMetadata');
      await task.run();
      for (let i = 0; i < count; i++) {
        webSocketAdapter.send(makeAudioMetadataFrame());
      }
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(spy.callCount).to.equal(3);
    });

    it('does not handle if the message type is neither audio metadata nor info', async () => {
      const spy1 = sinon.spy(
        context.volumeIndicatorAdapter,
        'sendRealtimeUpdatesForAudioStreamIdInfo'
      );
      const spy2 = sinon.spy(context.volumeIndicatorAdapter, 'sendRealtimeUpdatesForAudioMetadata');
      await task.run();
      webSocketAdapter.send(makeIndexFrame());
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
      expect(spy1.called).to.be.false;
      expect(spy2.called).to.be.false;
    });

    it('send the muted value to the signaling client from the real time controller', async () => {
      const spy = sinon.spy(context.signalingClient, 'mute');
      await task.run();
      context.realtimeController.realtimeMuteLocalAudio();

      expect(spy.calledWith(true)).to.be.true;
      context.realtimeController.realtimeUnmuteLocalAudio();
      expect(spy.calledWith(false)).to.be.true;
      expect(spy.callCount).to.equal(2);
      await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
    });

    it('can remove observer', async () => {
      const spy = sinon.spy(context.signalingClient, 'mute');
      task.removeObserver();
      context.realtimeController.realtimeMuteLocalAudio();
      expect(spy.called).to.be.false;
    });
  });

  describe('cancel', () => {
    it('should cancel the task and throw the reject', async () => {
      new TimeoutScheduler(behavior.asyncWaitMs).start(() => task.cancel());
      try {
        await task.run();
        assert.fail();
      } catch (_err) {}
    });

    it('will cancel idempotently', async () => {
      task.cancel();
      task.cancel();
      try {
        await task.run();
        assert.fail();
      } catch (_err) {}
    });
  });
});
