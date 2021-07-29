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
import { delay } from '../utils';

describe('InMemoryJSONEventBuffer', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let logger: Logger;
  let eventBufferConfiguration: EventBufferConfiguration;
  let meetingEventsClientConfiguration: EventsClientConfiguration;
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
    it('succefully adds item', () => {
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
        await delay(100);
        buffer.addItem(item2);
        await delay(100);
        buffer.addItem(item3);
        await delay(100);
        buffer.addItem(item4);
        await delay(100);
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
        await delay(100);
        buffer.addItem(item2);
        await delay(100);
        buffer.addItem(item3);
        await delay(100);
        buffer.addItem(item4);
        await delay(100);
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
        await delay(100);
        buffer.addItem(item2);
        await delay(100);
        buffer.addItem(item3);
        await delay(100);
        buffer.addItem(item4);
        await delay(100);
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
        await delay(100);
        buffer.addItem(item2);
        await delay(100);
        buffer.addItem(item3);
        await delay(100);
        buffer.addItem(item4);
        await delay(100);
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
        await delay(100);
        buffer.addItem(item2);
        await delay(100);
        buffer.addItem(item3);
        await delay(100);
        buffer.addItem(item4);
        await delay(100);
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
        buffer.start();
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
        buffer.addItem(argument);
        await delay(100);
        expect(spy.calledOnce).to.be.true;
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
        await delay(100);
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
        await delay(100);
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
        await delay(100);
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
        buffer.start();
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
        buffer.addItem(argument);
        await delay(100);
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
        await delay(1000);
      });

      it('retries with backoff when an important event POST fetch fails and response received is retryable but eventually succeeds', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0, 1, 64, 100, 10),
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
        await delay(5000);
        domMockBehavior.responseStatusCode = 200;
        await delay(2000);
      }).timeout(10000);

      it('handles retry count limit reaching when an important event POST fetch fails and response received is retryable', async () => {
        buffer = new InMemoryJSONEventBuffer(
          new EventBufferConfiguration(0, 1, 64, 100, 3),
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
        await delay(5000);
      }).timeout(7000);
    });
  });

  describe('beacon', () => {
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
