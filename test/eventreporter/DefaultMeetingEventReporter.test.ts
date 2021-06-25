// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import { isDestroyable } from '../../src/destroyable/Destroyable';
import EventIngestionConfiguration from '../../src/eventingestionconfiguration/EventIngestionConfiguration';
import DefaultMeetingEventReporter from '../../src/eventreporter/DefaultMeetingEventReporter';
import EventReporter from '../../src/eventreporter/EventReporter';
import MeetingEventsClientConfiguration from '../../src/eventsclientconfiguration/MeetingEventsClientConfiguration';
import Logger from '../../src/logger/Logger';
import NoOpLogger from '../../src/logger/NoOpLogger';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultMeetingEventReporter', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let eventReporter: EventReporter;
  let logger: Logger;

  const getIngestionConfiguration = (): EventIngestionConfiguration => {
    const meetingId = 'meetingId';
    const attendeeId = 'attendeeId';
    const joinToken = 'joinToken';
    const ingestionURL = 'ingestion-url';
    const meetingEventsClientConfiguration = new MeetingEventsClientConfiguration(
      meetingId,
      attendeeId,
      joinToken,
      ['meetingStartRequested']
    );
    return new EventIngestionConfiguration(meetingEventsClientConfiguration, ingestionURL);
  };

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    logger = new NoOpLogger();
    eventReporter = new DefaultMeetingEventReporter(getIngestionConfiguration(), logger);
  });

  afterEach(() => {
    eventReporter.stop();
    domMockBuilder.cleanup();
  });

  describe('constructor', () => {
    it('constructs', () => {
      expect(eventReporter).to.exist;
    });
  });

  describe('start', () => {
    it('can call start twice', () => {
      eventReporter.start();
      eventReporter.start();
    });
  });

  describe('stop', () => {
    it('can call stop twice', () => {
      eventReporter.stop();
      eventReporter.stop();
    });
  });

  describe('reportEvent', () => {
    it('can report an event - not important and not to be sent immediately ', () => {
      eventReporter.reportEvent(Date.now(), 'audioInputSelected');
    });

    it('will not report an event if it is to be ignored', () => {
      eventReporter.reportEvent(Date.now(), 'meetingStartRequested');
    });

    it('catches an error when item size is greater than max allowed size', async () => {
      const attributes = {
        maxVideoTileCount: 0,
        meetingDurationMs: 150209,
        meetingStatus: 'TaskFailed',
        signalingOpenDurationMs: 108,
        iceGatheringDurationMs: 113,
        attendeePresenceDurationMs: 731,
        poorConnectionCount: 1,
        meetingStartDurationMs: 564,
        retryCount: 25,
        meetingErrorMessage1:
          'serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865 was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling/OpenSignalingConnectionTask error: WebSocket connection failed',
        meetingErrorMessage2:
          'serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865 was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling/OpenSignalingConnectionTask error: WebSocket connection failed',
      };
      await eventReporter.reportEvent(Date.now(), 'meetingFailed', attributes);
    });

    it('can be destoryed', async () => {
      // @ts-ignore
      expect(eventReporter.destroyed).to.be.false;
      if (isDestroyable(eventReporter)) {
        await eventReporter.destroy();
        // @ts-ignore
        expect(eventReporter.destroyed).to.be.true;
      }
    });
  });
});
