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
import SignalingClientEvent from '../../src/signalingclient/SignalingClientEvent';
import SignalingClientEventType from '../../src/signalingclient/SignalingClientEventType';
import {
  SdkDataMessageFrame,
  SdkDataMessagePayload,
  SdkSignalFrame,
} from '../../src/signalingprotocol/SignalingProtocol';
import SendAndReceiveDataMessagesTask from '../../src/task/SendAndReceiveDataMessagesTask';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('SendAndReceiveDataMessagesTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const behavior = new DOMMockBehavior();
  const logger = new NoOpDebugLogger();

  let domMockBuilder: DOMMockBuilder;
  let context: AudioVideoControllerState;
  let webSocketAdapter: DefaultWebSocketAdapter;
  let task: SendAndReceiveDataMessagesTask;

  function makeReceiveDataMassageFrame(data: string, throttled?: boolean): SignalingClientEvent {
    const dataMessageFrame = SdkDataMessageFrame.create();
    const signalFrame = SdkSignalFrame.create();
    signalFrame.type = SdkSignalFrame.Type.DATA_MESSAGE;
    signalFrame.dataMessage = dataMessageFrame;

    const dataMessage = SdkDataMessagePayload.create();
    if (!throttled) {
      dataMessage.ingestTimeNs = Date.now() * 1000000;
    } else {
      dataMessage.ingestTimeNs = 0;
    }

    dataMessage.topic = 'topic';
    dataMessage.senderAttendeeId = 'senderId';
    dataMessage.senderExternalUserId = 'senderExtId';
    dataMessage.data = new TextEncoder().encode(data);
    dataMessageFrame.messages = [dataMessage];

    const event = new SignalingClientEvent(
      context.signalingClient,
      SignalingClientEventType.ReceivedSignalFrame,
      signalFrame
    );

    return event;
  }

  function makeSendDataMessageFrame(topic: string, data: Uint8Array): SdkDataMessageFrame {
    const dataMessageFrame = SdkDataMessageFrame.create();
    const dataMessage = SdkDataMessagePayload.create();
    dataMessageFrame.messages = [dataMessage];

    dataMessage.topic = topic;
    dataMessage.data = data;
    dataMessage.lifetimeMs = 100;
    return dataMessageFrame;
  }

  beforeEach(async () => {
    domMockBuilder = new DOMMockBuilder(behavior);
    webSocketAdapter = new DefaultWebSocketAdapter(logger);

    context = new AudioVideoControllerState();
    context.signalingClient = new DefaultSignalingClient(webSocketAdapter, logger);
    context.audioVideoController = new NoOpAudioVideoController();
    context.realtimeController = new DefaultRealtimeController();
    context.logger = logger;

    task = new SendAndReceiveDataMessagesTask(context);

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

  it('handles data message received', async () => {
    const spy = sinon.spy(context.realtimeController, 'realtimeReceiveDataMessage');
    await task.run();
    const text1 = 'Test message 1';
    const text2 = 'Test message 2';
    const text3 = 'Test message 3';
    task.handleSignalingClientEvent(makeReceiveDataMassageFrame(text1));
    task.handleSignalingClientEvent(makeReceiveDataMassageFrame(text2));
    task.handleSignalingClientEvent(makeReceiveDataMassageFrame(text3));
    await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
    expect(spy.callCount).to.equal(3);
    expect(spy.getCall(0).args[0].text()).to.eql(text1);
    expect(spy.getCall(1).args[0].text()).to.eql(text2);
    expect(spy.getCall(2).args[0].text()).to.eql(text3);
  });

  it('handles throttled data message', async () => {
    const spy = sinon.spy(context.realtimeController, 'realtimeReceiveDataMessage');
    await task.run();
    const text1 = 'Test message 1';
    const text2 = 'Test message 2';
    task.handleSignalingClientEvent(makeReceiveDataMassageFrame(text1));
    task.handleSignalingClientEvent(makeReceiveDataMassageFrame(text2, true));
    await new Promise(resolve => new TimeoutScheduler(behavior.asyncWaitMs + 10).start(resolve));
    expect(spy.callCount).to.equal(2);
    expect(spy.getCall(0).args[0].text()).to.eql(text1);
    expect(spy.getCall(0).args[0].throttled).to.be.false;
    expect(spy.getCall(1).args[0].text()).to.eql(text2);
    expect(spy.getCall(1).args[0].throttled).to.be.true;
  });

  it('handles sending string data message', async () => {
    const spy = sinon.spy(context.signalingClient, 'sendDataMessage');
    await task.run();

    const topic = 'topic';
    const data = 'Test message';
    context.realtimeController.realtimeSendDataMessage(topic, data, 100);

    const dataMessageFrame = makeSendDataMessageFrame(topic, new TextEncoder().encode(data));

    expect(spy.calledOnceWithExactly(sinon.match(dataMessageFrame))).to.be.true;
  });

  it('handles sending JSON data message', async () => {
    const spy = sinon.spy(context.signalingClient, 'sendDataMessage');
    await task.run();

    const topic = 'topic';
    const data = { subject: 'test', message: 'test message' };
    context.realtimeController.realtimeSendDataMessage(topic, data, 100);

    const dataMessageFrame = makeSendDataMessageFrame(
      topic,
      new TextEncoder().encode(JSON.stringify(data))
    );

    expect(spy.calledOnceWithExactly(sinon.match(dataMessageFrame))).to.be.true;
  });

  it('handles sending uint8array data message', async () => {
    const spy = sinon.spy(context.signalingClient, 'sendDataMessage');
    await task.run();

    const topic = 'topic';
    const data = new TextEncoder().encode('Test message');
    context.realtimeController.realtimeSendDataMessage(topic, data, 100);

    const dataMessageFrame = makeSendDataMessageFrame(topic, data);

    expect(spy.calledOnceWithExactly(sinon.match(dataMessageFrame))).to.be.true;
  });

  it('throw error if signaling client is not ready', () => {
    context.signalingClient.closeConnection();
    expect(() => {
      task.sendDataMessageHandler('topic', 'Test message');
    }).to.throw('Signaling client is not ready');
  });

  it('thow error if invalid topic', async () => {
    await task.run();
    expect(() => {
      task.sendDataMessageHandler('@@@', 'Test message');
    }).to.throw('Invalid topic');
  });

  it('thow error if data is too big', async () => {
    await task.run();
    expect(() => {
      task.sendDataMessageHandler('topic', new Uint8Array(2050));
    }).to.throw('Data size has to be less than 2048 bytes');
  });

  it('thow error if negative lifetime', async () => {
    await task.run();
    expect(() => {
      task.sendDataMessageHandler('topic', 'Test message', -1);
    }).to.throw('The life time of the message has to be non negative');
  });

  it('can remove observer', async () => {
    const spy = sinon.spy(task, 'sendDataMessageHandler');
    task.removeObserver();
    context.realtimeController.realtimeSendDataMessage('topic', 'Test message');
    expect(spy.called).to.be.false;
  });
});
