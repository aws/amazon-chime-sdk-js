// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import Logger from '../../src/logger/Logger';
import NoOpLogger from '../../src/logger/NoOpLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DefaultSignalingClient from '../../src/signalingclient/DefaultSignalingClient';
import SignalingClientConnectionRequest from '../../src/signalingclient/SignalingClientConnectionRequest';
import OpenSignalingConnectionTask from '../../src/task/OpenSignalingConnectionTask';
import Task from '../../src/task/Task';
import DefaultWebSocketAdapter from '../../src/websocketadapter/DefaultWebSocketAdapter';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('OpenSignalingConnectionTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  let logger: Logger;
  let configuration: MeetingSessionConfiguration;
  let context: AudioVideoControllerState;
  let domMockBuilder: DOMMockBuilder | null = null;
  let task: Task;
  let webSocket: DefaultWebSocketAdapter;

  function makeSessionConfiguration(): MeetingSessionConfiguration {
    const configuration = new MeetingSessionConfiguration();
    configuration.meetingId = 'foo-meeting';
    configuration.urls = new MeetingSessionURLs();
    configuration.urls.audioHostURL = 'https://audiohost.test.example.com';
    configuration.urls.turnControlURL = 'https://turncontrol.test.example.com';
    configuration.urls.signalingURL = 'ws://localhost:9999/control';
    configuration.credentials = new MeetingSessionCredentials();
    configuration.credentials.attendeeId = 'foo-attendee';
    configuration.credentials.joinToken = 'foo-join-token';
    return configuration;
  }

  beforeEach(() => {
    logger = new NoOpLogger();
    domMockBuilder = new DOMMockBuilder();
    webSocket = new DefaultWebSocketAdapter(logger);
    configuration = makeSessionConfiguration();
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    context.signalingClient = new DefaultSignalingClient(webSocket, logger);
    context.meetingSessionConfiguration = configuration;
    task = new OpenSignalingConnectionTask(context);
  });

  afterEach(async () => {
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      expect(task).to.not.equal(null);
    });
  });

  describe('run', () => {
    it('can be run and received parameters are correct', done => {
      let called = false;
      class TestSignalingClient extends DefaultSignalingClient {
        openConnection(request: SignalingClientConnectionRequest): void {
          super.openConnection(request);
          expect(request.signalingURL).to.be.equal(configuration.urls.signalingURL);
          expect(request.joinToken).to.be.equal(configuration.credentials.joinToken);
          called = true;
        }
      }
      const signalingClient = new TestSignalingClient(webSocket, logger);
      context.signalingClient = signalingClient;
      task.run().then(() => {
        expect(called).to.be.true;
        expect(context.signalingOpenDurationMs).to.not.be.null;
        done();
      });
    });

    it('fails if the websocket throws an error', done => {
      const behavior = new DOMMockBehavior();
      behavior.webSocketOpenSucceeds = false;
      domMockBuilder = new DOMMockBuilder(behavior);
      const signalingClient = new DefaultSignalingClient(webSocket, logger);
      context.signalingClient = signalingClient;
      task
        .run()
        .then()
        .catch(() => {
          done();
        });
    });
  });

  describe('cancel', () => {
    beforeEach(() => {
      class TestSignalingClient extends DefaultSignalingClient {
        openConnection(_request: SignalingClientConnectionRequest): void {}
      }
      const signalingClient = new TestSignalingClient(webSocket, logger);
      context.signalingClient = signalingClient;
    });

    it('should cancel the task and throw the reject', async () => {
      new TimeoutScheduler(50).start(() => task.cancel());
      try {
        await task.run();
        assert.fail();
      } catch (_err) {}
    });

    it('will cancel idempotently if task is not running', async () => {
      task.cancel();
      task.cancel();
      try {
        await task.run();
        assert.fail();
      } catch (_err) {}
    });
  });
});
