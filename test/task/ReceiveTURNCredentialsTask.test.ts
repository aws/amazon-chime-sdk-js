// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import MeetingSessionTURNCredentials from '../../src/meetingsession/MeetingSessionTURNCredentials';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import ReceiveTURNCredentialsTask from '../../src/task/ReceiveTURNCredentialsTask';
import Task from '../../src/task/Task';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('ReceiveTURNCredentialsTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let context: AudioVideoControllerState;
  let task: Task;
  let testCredentials: MeetingSessionTURNCredentials;

  before(() => {
    testCredentials = new MeetingSessionTURNCredentials();
    testCredentials.username = 'fakeUsername';
    testCredentials.password = 'fakeTURNCredentials';
    testCredentials.ttl = Infinity;
    testCredentials.uris = ['fakeUDPURI', 'fakeTCPURI'];
  });

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context = new AudioVideoControllerState();
    context.audioVideoController = new NoOpAudioVideoController();
    context.logger = context.audioVideoController.logger;
    context.meetingSessionConfiguration = new MeetingSessionConfiguration();
    context.meetingSessionConfiguration.urls = new MeetingSessionURLs();
    context.meetingSessionConfiguration.urls.turnControlURL = 'http://example.com';
    context.meetingSessionConfiguration.meetingId = 'testId';
    context.meetingSessionConfiguration.credentials = new MeetingSessionCredentials();
    context.meetingSessionConfiguration.credentials.joinToken = 'testToken';
    task = new ReceiveTURNCredentialsTask(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('run', () => {
    it('can get TURN credentials', async () => {
      await task.run();
      expect(context.turnCredentials).to.deep.equal(testCredentials);
    });

    it('handles when the fetch call fails', done => {
      domMockBehavior.fetchSucceeds = false;
      task
        .run()
        .then(() => {
          done(new Error('This line should not be reached.'));
        })
        .catch(() => {
          expect(context.turnCredentials).to.equal(null);
          done();
        });
    });

    it('handles a 403 error to fetch TURN Credentials', async () => {
      domMockBehavior.fetchSucceeds = true;
      domMockBehavior.responseStatusCode = 403;
      domMockBehavior.responseSuccess = false;
      try {
        await task.run();
        throw new Error('This line should not be reached.');
      } catch (error) {
        expect(error.message).includes(
          `the meeting status code: ${MeetingSessionStatusCode.TURNCredentialsForbidden}`
        );
      }
    });

    it('handles a 404 error to fetch TURN Credentials', async () => {
      domMockBehavior.fetchSucceeds = true;
      domMockBehavior.responseStatusCode = 404;
      domMockBehavior.responseSuccess = false;
      try {
        await task.run();
        throw new Error('This line should not be reached.');
      } catch (error) {
        expect(error.message).includes(
          `the meeting status code: ${MeetingSessionStatusCode.MeetingEnded}`
        );
      }
    });

    it('will bypass the task when a url is not specified', async () => {
      context.meetingSessionConfiguration.urls.turnControlURL = null;
      task = new ReceiveTURNCredentialsTask(context);
      await task.run();
      expect(context.turnCredentials).to.equal(null);
    });
  });

  describe('cancel', () => {
    it('cancels a task when the session is timed out', done => {
      let called = false;

      domMockBehavior.asyncWaitMs = 500;
      new TimeoutScheduler(50).start(() => {
        task.cancel();
      });

      task
        .run()
        .then(() => {
          done(new Error('This line should not be reached.'));
        })
        .catch(() => {
          called = true;
        });

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 50).start(() => {
        expect(called).to.be.true;
        expect(context.turnCredentials).to.equal(null);
        done();
      });
    });
  });
});
