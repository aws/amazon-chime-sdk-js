// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionStatusCode from '../../src/meetingsession/MeetingSessionStatusCode';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';
import WaitForAttendeePresenceTask from '../../src/task/WaitForAttendeePresenceTask';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import CreateMeetingResponseMock from '../meetingsession/CreateMeetingResponseMock';

chai.use(chaiAsPromised);

describe('WaitForAttendeePresenceTask', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const attendeeId = 'attendee-id';

  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let context: AudioVideoControllerState;
  let task: WaitForAttendeePresenceTask;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context = new AudioVideoControllerState();
    context.logger = new NoOpDebugLogger();
    context.realtimeController = new DefaultRealtimeController();
    context.meetingSessionConfiguration = new MeetingSessionConfiguration(
      CreateMeetingResponseMock.MeetingResponseMock,
      CreateMeetingResponseMock.AttendeeResponseMock
    );
    context.meetingSessionConfiguration.credentials = new MeetingSessionCredentials();
    context.meetingSessionConfiguration.credentials.attendeeId = 'attendee-id';
    context.meetingSessionConfiguration.attendeePresenceTimeoutMs = 5000;
    task = new WaitForAttendeePresenceTask(context);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('run', async () => {
    it('succeeds if the attendee becomes present', async () => {
      const p = task.run();
      context.realtimeController.realtimeSetAttendeeIdPresence(
        'attendee-id-1',
        true,
        'attendee-id-1',
        false,
        null
      );
      context.realtimeController.realtimeSetAttendeeIdPresence(
        'attendee-id-2',
        true,
        'attendee-id-2',
        false,
        null
      );
      context.realtimeController.realtimeSetAttendeeIdPresence(
        attendeeId,
        true,
        attendeeId,
        false,
        null
      );
      await p;
    });
  });

  describe('cancel', () => {
    it('can be safely canceled twice', async () => {
      const p = task.run();
      // @ts-ignore
      expect(task.cancelPromise).to.not.be.undefined;
      expect(p).to.eventually.be.rejectedWith(
        'canceling WaitForAttendeePresenceTask due to the meeting status code: 23'
      );
      task.cancel();
      // @ts-ignore
      expect(task.cancelPromise).to.be.undefined;

      // This will hit the baseCancel protection.
      task.cancel();
    });

    it('allows a no-op cancel after completion', async () => {
      const p = task.run();
      context.realtimeController.realtimeSetAttendeeIdPresence(
        attendeeId,
        true,
        attendeeId,
        false,
        null
      );
      await p;
      // @ts-ignore
      expect(task.cancelPromise).to.be.undefined;
      task.cancel();
    });

    it('cancels a task while waiting for the attendee presence event', async () => {
      const p = task.run();
      task.cancel();
      context.realtimeController.realtimeSetAttendeeIdPresence(
        attendeeId,
        true,
        attendeeId,
        false,
        null
      );

      try {
        await p;
      } catch (error) {
        expect(error.message).includes(
          `the meeting status code: ${MeetingSessionStatusCode.NoAttendeePresent}`
        );
      }
    });
  });
});
