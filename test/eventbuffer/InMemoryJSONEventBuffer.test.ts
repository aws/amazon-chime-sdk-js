// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import EventBuffer from '../../src/eventbuffer/EventBuffer';
import InMemoryJSONEventBuffer from '../../src/eventbuffer/InMemoryJSONEventBuffer';
import EventBufferConfiguration from '../../src/eventbufferconfiguration/EventBufferConfiguration';
import MeetingHistoryState from '../../src/eventcontroller/MeetingHistoryState';
import EventData from '../../src/eventreporter/EventData';
import EventsClientConfiguration from '../../src/eventsclientconfiguration/EventsClientConfiguration';
import MeetingEventsClientConfiguration from '../../src/eventsclientconfiguration/MeetingEventsClientConfiguration';
import Logger from '../../src/logger/Logger';
import NoOpLogger from '../../src/logger/NoOpLogger';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { createFakeTimers } from '../utils/fakeTimerHelper';

describe('InMemoryJSONEventBuffer', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let logger: Logger;
  let eventBufferConfiguration: EventBufferConfiguration;
  let meetingEventsClientConfiguration: EventsClientConfiguration;
  let clock: sinon.SinonFakeTimers;
  const meetingId = 'meetingId';
  const attendeeId = 'attendeeId';
  const joinToken = 'joinToken';
  const ingestionURL = 'ingestion-url';
  const importantEvents: MeetingHistoryState[] = [
    'meetingEnded',
    'meetingFailed',
    'meetingStartFailed',
    'audioInputFailed',
    'videoInputFailed',
    'deviceLabelTriggerFailed',
  ];
  let buffer: EventBuffer<EventData>;

  function getItemEvent(
    name: MeetingHistoryState,
    attributes?: { [key: string]: string | number }
  ): EventData {
    return {
      name,
      ts: Date.now(),
      attributes,
    };
  }

  beforeEach(() => {
    clock = createFakeTimers();
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    meetingEventsClientConfiguration = new MeetingEventsClientConfiguration(
      meetingId,
      attendeeId,
      joinToken,
      ['meetingStartRequested']
    );
    eventBufferConfiguration = new EventBufferConfiguration();
    logger = new NoOpLogger();
    buffer = new InMemoryJSONEventBuffer(
      eventBufferConfiguration,
      meetingEventsClientConfiguration,
      ingestionURL,
      importantEvents,
      logger
    );
  });

  afterEach(() => {
    buffer.stop();
    domMockBuilder.cleanup();
    clock.restore();
  });

  describe('constructor', () => {
    it('can be constructed', () => {
      expect(buffer).to.exist;
    });
  });

  describe('start', () => {
    it('can start twice', () => {
      buffer.start();
      buffer.start();
    });
  });

  describe('stop', () => {
    it('can stop twice', () => {
      buffer.stop();
      buffer.stop();
    });
  });

  describe('addItem', () => {
    it('successfully adds item', () => {
      expect(() => buffer.addItem(getItemEvent('audioInputSelected'))).to.not.throw();
    });

    it('filters out PII and redundant attributes if any', () => {
      const ts = Date.now();
      const argument = getItemEvent('meetingStartRequested', {
        timeStampMs: ts,
        externalUserId: 'external-id',
        externalMeetingId: 'external-meeting-id',
        meetingId: 'meetingId',
      });
      buffer.addItem(argument);
    });

    it('throws an error when item size is greater than max allowed size', async () => {
      const argument = getItemEvent('meetingFailed', {
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
      });
      let err = false;
      try {
        await buffer.addItem(argument);
      } catch (error) {
        expect(error.message).to.eq(
          'Event Reporting - Item to be added has size 4176 bytes. Item cannot exceed max item size allowed of 3000 bytes.'
        );
        err = true;
      }
      expect(err).to.true;
    });

    describe('normal event flow', () => {
      it('throws error when buffer is full', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(5000, 2, 0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        let err = false;
        try {
          await buffer.addItem(getItemEvent('audioInputSelected'));
        } catch (error) {
          expect(error.message).to.eq('Buffer full');
          err = true;
        }
        expect(err).to.true;
      });

      it('buffer is updated once current buffer item threshold is reached based on payload items', () => {
        const item1 = getItemEvent('audioInputSelected');
        const item2 = getItemEvent('videoInputSelected');
        const item3 = getItemEvent('audioInputUnselected');
        buffer.addItem(item1);
        buffer.addItem(item2);
        buffer.addItem(item3);
      });

      it('buffer is updated once current buffer item threshold is reached based on max buffer item size', () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(5000, 2, (56 * 3) / 1000, 3),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        const item1 = getItemEvent('audioInputSelected');
        const item2 = getItemEvent('videoInputSelected');
        const item3 = getItemEvent('audioInputUnselected');

        buffer.addItem(item1);
        buffer.addItem(item2);
        buffer.addItem(item3);
      });

      it('events are sent once scheduled interval is reached', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );

        buffer.start();
        const item1 = getItemEvent('audioInputSelected');
        const item2 = getItemEvent('videoInputSelected');
        const item3 = getItemEvent('audioInputUnselected');
        const item4 = getItemEvent('meetingStartRequested');
        buffer.addItem(item1);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item2);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item3);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item4);
        await clock.nextAsync();
        await clock.nextAsync();
      });

      it('events are sent once scheduled interval is reached and not added to cancellable events if not firefox', async () => {
        // @ts-ignore
        navigator.userAgent =
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.75 Safari/537.36';
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );

        buffer.start();
        const item1 = getItemEvent('audioInputSelected');
        const item2 = getItemEvent('videoInputSelected');
        const item3 = getItemEvent('audioInputUnselected');
        const item4 = getItemEvent('meetingStartRequested');
        buffer.addItem(item1);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item2);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item3);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item4);
        await clock.nextAsync();
        await clock.nextAsync();
      });

      it('catches fetch failure', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        buffer.start();
        domMockBehavior.fetchSucceeds = false;
        const item1 = getItemEvent('audioInputSelected');
        const item2 = getItemEvent('videoInputSelected');
        const item3 = getItemEvent('audioInputUnselected');
        const item4 = getItemEvent('meetingStartRequested');
        buffer.addItem(item1);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item2);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item3);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item4);
        await clock.nextAsync();
        await clock.nextAsync();
      });

      it('handles failed events with a status code which we do not want to retry', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        buffer.start();
        domMockBehavior.fetchSucceeds = true;
        domMockBehavior.responseStatusCode = 404;
        const item1 = getItemEvent('audioInputSelected');
        const item2 = getItemEvent('videoInputSelected');
        const item3 = getItemEvent('audioInputUnselected');
        const item4 = getItemEvent('meetingStartRequested');
        buffer.addItem(item1);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item2);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item3);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item4);
        await clock.nextAsync();
        await clock.nextAsync();
      });

      it('handles event sending retries for retryable response status codes', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        buffer.start();
        domMockBehavior.fetchSucceeds = true;
        domMockBehavior.responseStatusCode = 429;
        const item1 = getItemEvent('audioInputSelected');
        const item2 = getItemEvent('videoInputSelected');
        const item3 = getItemEvent('audioInputUnselected');
        const item4 = getItemEvent('meetingStartRequested');

        buffer.addItem(item1);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item2);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item3);
        await clock.nextAsync();
        await clock.nextAsync();
        buffer.addItem(item4);
        await clock.nextAsync();
        await clock.nextAsync();
      });
    });

    describe('important event sending', () => {
      it('important event is sent immediately', () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        const argument = getItemEvent('meetingFailed', {
          maxVideoTileCount: 0,
          meetingDurationMs: 150209,
          meetingStatus: 'TaskFailed',
          signalingOpenDurationMs: 108,
          iceGatheringDurationMs: 113,
          attendeePresenceDurationMs: 731,
          poorConnectionCount: 1,
          meetingStartDurationMs: 564,
          retryCount: 25,
          meetingErrorMessage:
            'serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865 was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling/OpenSignalingConnectionTask error: WebSocket connection failed',
        });
        buffer.addItem(argument);
      });

      it('handles important event sending failure if fetch fails in firefox', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        // Don't start the buffer to avoid IntervalScheduler interference
        domMockBehavior.fetchSucceeds = false;
        const argument = getItemEvent('meetingFailed', {
          maxVideoTileCount: 0,
          meetingDurationMs: 150209,
          meetingStatus: 'TaskFailed',
          signalingOpenDurationMs: 108,
          iceGatheringDurationMs: 113,
          attendeePresenceDurationMs: 731,
          poorConnectionCount: 1,
          meetingStartDurationMs: 564,
          retryCount: 25,
          meetingErrorMessage:
            'serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865 was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling/OpenSignalingConnectionTask error: WebSocket connection failed',
        });
        const spy = sinon.spy(navigator, 'sendBeacon');
        // Start addItem (don't await yet)
        const addItemPromise = buffer.addItem(argument);
        // Advance time to allow fetch to fail
        await clock.nextAsync();
        // Wait for addItem to complete
        await addItemPromise;
        expect(spy.calledOnce).to.be.true;
      });

      it('handles important event sending failure when sendBeacon returns false in firefox', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        domMockBehavior.fetchSucceeds = false;
        domMockBehavior.beaconQueuedSuccess = false;
        const argument = getItemEvent('meetingFailed', {
          meetingDurationMs: 100,
          meetingStatus: 'TaskFailed',
        });
        const addItemPromise = buffer.addItem(argument);
        await clock.nextAsync();
        await addItemPromise;
      });

      it('handles important event sending failure when sendBeacon throws in firefox', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        domMockBehavior.fetchSucceeds = false;
        const argument = getItemEvent('meetingFailed', {
          meetingDurationMs: 100,
          meetingStatus: 'TaskFailed',
        });
        // Stub sendBeacon to throw an error
        const originalSendBeacon = navigator.sendBeacon;
        navigator.sendBeacon = () => {
          throw new Error('sendBeacon error');
        };
        const addItemPromise = buffer.addItem(argument);
        await clock.nextAsync();
        await addItemPromise;
        navigator.sendBeacon = originalSendBeacon;
      });

      it('important event sending is marked failed if beaconing fails after fetch failure', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        buffer.start();
        domMockBehavior.fetchSucceeds = false;
        domMockBehavior.beaconQueuedSuccess = false;
        const argument = getItemEvent('meetingFailed', {
          maxVideoTileCount: 0,
          meetingDurationMs: 150209,
          meetingStatus: 'TaskFailed',
          signalingOpenDurationMs: 108,
          iceGatheringDurationMs: 113,
          attendeePresenceDurationMs: 731,
          poorConnectionCount: 1,
          meetingStartDurationMs: 564,
          retryCount: 25,
          meetingErrorMessage:
            'serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865 was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling/OpenSignalingConnectionTask error: WebSocket connection failed',
        });
        navigator = null;
        buffer.addItem(argument);
        await clock.nextAsync();
        await clock.nextAsync();
      });

      it('catches error when important event beaconing fails after fetch failure', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        buffer.start();
        domMockBehavior.fetchSucceeds = false;
        domMockBehavior.beaconQueuedSuccess = false;
        const argument = getItemEvent('meetingFailed', {
          maxVideoTileCount: 0,
          meetingDurationMs: 150209,
          meetingStatus: 'TaskFailed',
          signalingOpenDurationMs: 108,
          iceGatheringDurationMs: 113,
          attendeePresenceDurationMs: 731,
          poorConnectionCount: 1,
          meetingStartDurationMs: 564,
          retryCount: 25,
          meetingErrorMessage:
            'serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865 was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling/OpenSignalingConnectionTask error: WebSocket connection failed',
        });
        buffer.addItem(argument);
        await clock.nextAsync();
        await clock.nextAsync();
      });

      it('important event is not beaconed when fetch fails if the browser is not firefox', async () => {
        // @ts-ignore
        navigator.userAgent =
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.75 Safari/537.36';
        domMockBehavior.fetchSucceeds = false;
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        const argument = getItemEvent('meetingFailed', {
          maxVideoTileCount: 0,
          meetingDurationMs: 150209,
          meetingStatus: 'TaskFailed',
          signalingOpenDurationMs: 108,
          iceGatheringDurationMs: 113,
          attendeePresenceDurationMs: 731,
          poorConnectionCount: 1,
          meetingStartDurationMs: 564,
          retryCount: 25,
          meetingErrorMessage:
            'serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865 was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling/OpenSignalingConnectionTask error: WebSocket connection failed',
        });
        const spy = sinon.spy(navigator, 'sendBeacon');
        buffer.addItem(argument);
        await clock.nextAsync();
        await clock.nextAsync();
        expect(spy.calledOnce).to.be.false;
      });

      it('handles important event sending failure if response received is not retryable', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        domMockBehavior.fetchSucceeds = true;
        domMockBehavior.responseStatusCode = 404;
        const argument = getItemEvent('meetingFailed', {
          maxVideoTileCount: 0,
          meetingDurationMs: 150209,
          meetingStatus: 'TaskFailed',
          signalingOpenDurationMs: 108,
          iceGatheringDurationMs: 113,
          attendeePresenceDurationMs: 731,
          poorConnectionCount: 1,
          meetingStartDurationMs: 564,
          retryCount: 25,
          meetingErrorMessage:
            'serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865 was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling/OpenSignalingConnectionTask error: WebSocket connection failed',
        });
        // Don't start the buffer to avoid IntervalScheduler interference
        // Properly await the addItem to ensure the sendEventImmediately completes
        const addItemPromise = buffer.addItem(argument);
        await clock.tickAsync(20);
        await addItemPromise;
      });

      it('handles important event sending failure if response received is retryable', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        buffer.start();
        domMockBehavior.fetchSucceeds = true;
        domMockBehavior.responseStatusCode = 429;
        const argument = getItemEvent('meetingFailed', {
          maxVideoTileCount: 0,
          meetingDurationMs: 150209,
          meetingStatus: 'TaskFailed',
          signalingOpenDurationMs: 108,
          iceGatheringDurationMs: 113,
          attendeePresenceDurationMs: 731,
          poorConnectionCount: 1,
          meetingStartDurationMs: 564,
          retryCount: 25,
          meetingErrorMessage:
            'serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865 was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling/OpenSignalingConnectionTask error: WebSocket connection failed',
        });
        await buffer.addItem(argument);
        await clock.nextAsync();
        await clock.nextAsync();
      });

      it('retries with backoff when an important event POST fetch fails and response received is retryable but eventually succeeds', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0, 1, 64, 100, 10),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        // Don't start the buffer to avoid IntervalScheduler interference
        domMockBehavior.fetchSucceeds = true;
        domMockBehavior.responseStatusCode = 429;
        const argument = getItemEvent('meetingFailed', {
          maxVideoTileCount: 0,
          meetingDurationMs: 150209,
          meetingStatus: 'TaskFailed',
          signalingOpenDurationMs: 108,
          iceGatheringDurationMs: 113,
          attendeePresenceDurationMs: 731,
          poorConnectionCount: 1,
          meetingStartDurationMs: 564,
          retryCount: 25,
          meetingErrorMessage:
            'serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865 was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling/OpenSignalingConnectionTask error: WebSocket connection failed',
        });
        // Start the addItem call (don't await yet)
        const addItemPromise = buffer.addItem(argument);
        // Advance through several retry attempts with backoff (max backoff is 15000ms)
        // Need to advance enough time for multiple retries - use runAllAsync to process all pending timers
        for (let i = 0; i < 5; i++) {
          await clock.tickAsync(16000);
        }
        domMockBehavior.responseStatusCode = 200;
        // Allow the successful retry to complete
        for (let i = 0; i < 5; i++) {
          await clock.tickAsync(16000);
        }
        await addItemPromise;
      });

      it('handles retry count limit reaching when an important event POST fetch fails and response received is retryable', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0, 1, 64, 100, 3),
          meetingEventsClientConfiguration,
          ingestionURL,
          importantEvents,
          logger
        );
        // Don't start the buffer to avoid IntervalScheduler interference
        domMockBehavior.fetchSucceeds = true;
        domMockBehavior.responseStatusCode = 429;
        const argument = getItemEvent('meetingFailed', {
          maxVideoTileCount: 0,
          meetingDurationMs: 150209,
          meetingStatus: 'TaskFailed',
          signalingOpenDurationMs: 108,
          iceGatheringDurationMs: 113,
          attendeePresenceDurationMs: 731,
          poorConnectionCount: 1,
          meetingStartDurationMs: 564,
          retryCount: 25,
          meetingErrorMessage:
            'serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865 was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling error: serial group task AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling was canceled due to subtask AudioVideoReconnect/79f1e0a4-f0da-4f1c-9e11-550a359e2ec1/3985e611-fdf1-ac35-a9f2-f8358bf9b865/Timeout15000ms/Media/Signaling/OpenSignalingConnectionTask error: WebSocket connection failed',
        });
        // Start the addItem call and advance clock through all retry attempts
        const addItemPromise = buffer.addItem(argument);
        // Advance through retry attempts until limit is reached (3 retries * max 15000ms backoff)
        // Use multiple tickAsync calls to ensure all timers are processed
        for (let i = 0; i < 5; i++) {
          await clock.tickAsync(16000);
        }
        await addItemPromise;
      });
    });
  });

  describe('destroy', () => {
    it('calls reset and cleans up resources', async () => {
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      buffer.start();
      const item1 = getItemEvent('audioInputSelected');
      buffer.addItem(item1);
      // @ts-ignore - access private method for testing
      await buffer.destroy();
    });
  });

  describe('updateMetadataWithHighEntropyValues', () => {
    it('returns early if already updated', async () => {
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(0),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      // First call to sendEventImmediately will call updateMetadataWithHighEntropyValues
      const argument1 = getItemEvent('meetingFailed', { meetingDurationMs: 100 });
      await buffer.addItem(argument1);
      // Second call should hit the early return
      const argument2 = getItemEvent('meetingEnded', { meetingDurationMs: 200 });
      await buffer.addItem(argument2);
    });
  });

  describe('sendEvents success path', () => {
    it('handles successful event sending with ok response via IntervalScheduler', async () => {
      // Use a configuration that will trigger buffer flush
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(5000, 100, 64, 100, 15),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      domMockBehavior.fetchSucceeds = true;
      domMockBehavior.responseStatusCode = 200;
      // Add enough items to trigger buffer threshold (MAX_PAYLOAD_ITEMS = 2)
      const item1 = getItemEvent('audioInputSelected');
      const item2 = getItemEvent('videoInputSelected');
      const item3 = getItemEvent('audioInputUnselected');
      buffer.addItem(item1);
      buffer.addItem(item2);
      buffer.addItem(item3);
      // Directly call sendEvents to test the success path
      // @ts-ignore - access private method for testing
      const sendEventsPromise = buffer.sendEvents();
      // Advance time to allow fetch to complete (asyncWaitMs = 10)
      await clock.tickAsync(20);
      await sendEventsPromise;
    });

    it('handles sendEvents with Firefox browser for cancellable events success path', async () => {
      // Set Firefox user agent before creating buffer
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0';
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(5000, 100, 64, 100, 15),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      domMockBehavior.fetchSucceeds = true;
      domMockBehavior.responseStatusCode = 200;
      const item1 = getItemEvent('audioInputSelected');
      const item2 = getItemEvent('videoInputSelected');
      const item3 = getItemEvent('audioInputUnselected');
      buffer.addItem(item1);
      buffer.addItem(item2);
      buffer.addItem(item3);
      // Directly call sendEvents to test the success path
      // @ts-ignore - access private method for testing
      const sendEventsPromise = buffer.sendEvents();
      await clock.tickAsync(20);
      await sendEventsPromise;
    });

    it('handles sendEvents with non-ok response', async () => {
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(5000, 100, 64, 100, 1),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      domMockBehavior.fetchSucceeds = true;
      domMockBehavior.responseStatusCode = 404;
      const item1 = getItemEvent('audioInputSelected');
      const item2 = getItemEvent('videoInputSelected');
      buffer.addItem(item1);
      buffer.addItem(item2);
      // @ts-ignore - access private method for testing
      const sendEventsPromise = buffer.sendEvents();
      await clock.tickAsync(20);
      await sendEventsPromise;
    });

    it('handles sendEvents when send throws error', async () => {
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(5000, 100, 64, 100, 1),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      domMockBehavior.fetchSucceeds = false;
      const item1 = getItemEvent('audioInputSelected');
      const item2 = getItemEvent('videoInputSelected');
      buffer.addItem(item1);
      buffer.addItem(item2);
      // @ts-ignore - access private method for testing
      const sendEventsPromise = buffer.sendEvents();
      await clock.tickAsync(20);
      await sendEventsPromise;
    });
  });

  describe('sendEventImmediately success path', () => {
    it('handles successful important event sending with ok response', async () => {
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(0),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      domMockBehavior.fetchSucceeds = true;
      domMockBehavior.responseStatusCode = 200;
      const argument = getItemEvent('meetingFailed', {
        meetingDurationMs: 100,
        meetingStatus: 'TaskFailed',
      });
      await buffer.addItem(argument);
      // Advance time to allow fetch to complete
      await clock.tickAsync(20);
    });
  });

  describe('beacon', () => {
    it('handles addEventListeners when beaconEventListener is undefined', () => {
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      // @ts-ignore - access private property for testing
      buffer.beaconEventListener = undefined;
      // @ts-ignore - access private method for testing
      buffer.addEventListeners();
    });

    it('handles addEventListeners when window.addEventListener is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobalAny = global as any;
      const originalAddEventListener = GlobalAny['window']['addEventListener'];
      delete GlobalAny['window']['addEventListener'];
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      // @ts-ignore - access private method for testing
      buffer.addEventListeners();
      GlobalAny['window']['addEventListener'] = originalAddEventListener;
    });

    it('handles removeEventListeners when beaconEventListener is undefined', () => {
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      // @ts-ignore - access private property for testing
      buffer.beaconEventListener = undefined;
      // @ts-ignore - access private method for testing
      buffer.removeEventListeners();
    });

    it('handles removeEventListeners when window.removeEventListener is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobalAny = global as any;
      const originalRemoveEventListener = GlobalAny['window']['removeEventListener'];
      delete GlobalAny['window']['removeEventListener'];
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      // @ts-ignore - access private method for testing
      buffer.removeEventListeners();
      GlobalAny['window']['removeEventListener'] = originalRemoveEventListener;
    });

    it('handles sendBeacon error when navigator.sendBeacon throws', async () => {
      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );
      const item1 = getItemEvent('audioInputSelected');
      buffer.addItem(item1);
      // Stub sendBeacon to throw an error
      const originalSendBeacon = navigator.sendBeacon;
      navigator.sendBeacon = () => {
        throw new Error('sendBeacon error');
      };
      // @ts-ignore - access private method for testing
      await buffer.sendBeacon();
      navigator.sendBeacon = originalSendBeacon;
    });

    it('adds and removes event listeners correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobalAny = global as any;
      let addedPageHide = false;
      let pageHideCallbackToCall = (_e: Event): void => {};
      GlobalAny['window']['addEventListener'] = (type: string, callback: (e: Event) => void) => {
        expect(type).to.eq('pagehide');
        addedPageHide = true;
        pageHideCallbackToCall = callback;
      };
      let removedPageHide = false;
      GlobalAny['window']['removeEventListener'] = (
        type: string,
        _callback: (e: Event) => void
      ) => {
        expect(type).to.eq('pagehide');
        removedPageHide = true;
      };

      let addedVisibilityChange = false;
      let visibilityChangeCallbackToCall = (_e: Event): void => {};
      let documentState = 'visible';
      GlobalAny['document']['addEventListener'] = (type: string, callback: (e: Event) => void) => {
        expect(type).to.eq('visibilitychange');
        expect(GlobalAny['document'].visibilityState).to.eq(documentState);
        addedVisibilityChange = true;
        visibilityChangeCallbackToCall = callback;
      };
      let removedVisibilityChange = false;
      GlobalAny['document']['removeEventListener'] = (
        type: string,
        _callback: (e: Event) => void
      ) => {
        expect(type).to.eq('visibilitychange');
        removedVisibilityChange = true;
      };

      buffer = new InMemoryJSONEventBuffer(
        new EventBufferConfiguration(),
        meetingEventsClientConfiguration,
        ingestionURL,
        importantEvents,
        logger
      );

      expect(addedPageHide).to.be.true;
      pageHideCallbackToCall(new Event('pagehide'));

      expect(addedVisibilityChange).to.be.true;
      documentState = 'hidden';
      GlobalAny['document'].visibilityState = 'hidden';
      visibilityChangeCallbackToCall(new Event('visibilitychange'));
      buffer.stop();
      expect(removedPageHide).to.be.true;
      expect(removedVisibilityChange).to.be.true;
      delete GlobalAny['window']['addEventListener'];
      delete GlobalAny['window']['removeEventListener'];
      delete GlobalAny['document']['removeEventListener'];
      delete GlobalAny['document']['addEventListener'];
    });

    it('handles beacon queuing failure', () => {
      domMockBehavior.beaconQueuedSuccess = false;
      const item1 = getItemEvent('audioInputSelected');
      const item2 = getItemEvent('videoInputSelected');
      const item3 = getItemEvent('audioInputUnselected');
      buffer.addItem(item1);
      buffer.addItem(item2);
      buffer.addItem(item3);
      buffer.stop();
    });
  });
});
