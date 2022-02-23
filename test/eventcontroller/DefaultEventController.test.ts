// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import DefaultEventController from '../../src/eventcontroller/DefaultEventController';
import EventAttributes from '../../src/eventcontroller/EventAttributes';
import EventName from '../../src/eventcontroller/EventName';
import NoOpEventReporter from '../../src/eventreporter/NoOpEventReporter';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import MeetingSessionCredentials from '../../src/meetingsession/MeetingSessionCredentials';
import MeetingSessionURLs from '../../src/meetingsession/MeetingSessionURLs';
import { wait as delay } from '../../src/utils/Utils';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultEventController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;

  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let logger: NoOpDebugLogger;
  let eventController: DefaultEventController;
  let emptyConfiguration: MeetingSessionConfiguration;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    logger = new NoOpDebugLogger();
    emptyConfiguration = new MeetingSessionConfiguration();
    emptyConfiguration.meetingId = '';
    emptyConfiguration.externalMeetingId = '';
    emptyConfiguration.credentials = new MeetingSessionCredentials();
    emptyConfiguration.credentials.attendeeId = '';
    emptyConfiguration.credentials.joinToken = '';
    emptyConfiguration.urls = new MeetingSessionURLs();
    emptyConfiguration.urls.turnControlURL = '';
    emptyConfiguration.urls.audioHostURL = '';
    emptyConfiguration.urls.signalingURL = 'wss://localhost/';
  });

  afterEach(() => {
    eventController.destroy();
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can create with the user agent', () => {
      eventController = new DefaultEventController(emptyConfiguration, logger);
      expect(eventController).to.exist;
    });

    it('can create without the user agent', () => {
      // @ts-ignore
      delete navigator.userAgent;
      eventController = new DefaultEventController(emptyConfiguration, logger);
      expect(eventController).to.exist;
    });

    it('can create with an empty string', () => {
      // @ts-ignore
      navigator.userAgent = '';
      eventController = new DefaultEventController(emptyConfiguration, logger);
      expect(eventController).to.exist;
    });

    it('can create with an invalid version', () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/invalid Safari/537.36';
      eventController = new DefaultEventController(emptyConfiguration, logger);
      expect(eventController).to.exist;
    });

    it('can create with an event reporter', () => {
      const eventReporter = new NoOpEventReporter();
      eventController = new DefaultEventController(emptyConfiguration, logger, eventReporter);
      expect(eventReporter).to.exist;
      expect(eventController).to.exist;
    });

    it('can be destroyed', () => {
      const eventReporter = new NoOpEventReporter();
      eventController = new DefaultEventController(emptyConfiguration, logger, eventReporter);
      expect(eventController.destroyed).to.be.false;
      expect(eventController.eventReporter).to.exist;
      eventController.destroy();
      expect(eventController.eventReporter).to.not.exist;
      expect(eventController.destroyed).to.be.true;
    });
  });

  describe('publishEvent', () => {
    it('can receive the event', done => {
      const eventName = 'audioInputFailed';
      const audioInputErrorMessage = 'Something went wrong';

      eventController = new DefaultEventController(emptyConfiguration, logger);
      eventController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal(eventName);
          expect(attributes.audioInputErrorMessage).to.equal(audioInputErrorMessage);
          eventController.destroy();
          done();
        },
      });
      eventController.publishEvent(eventName, {
        audioInputErrorMessage,
      });
    });

    it('can receive the event even without the user agent', done => {
      // @ts-ignore
      delete navigator.userAgent;

      const eventName = 'videoInputFailed';
      const videoInputErrorMessage = 'Camera does not work';

      eventController = new DefaultEventController(emptyConfiguration, logger);
      eventController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal(eventName);
          expect(attributes.videoInputErrorMessage).to.equal(videoInputErrorMessage);
          eventController.destroy();
          done();
        },
      });
      eventController.publishEvent(eventName, {
        videoInputErrorMessage,
      });
    });

    it('only gets events when observing', async () => {
      // @ts-ignore
      delete navigator.userAgent;
      const mockBuilder = new DOMMockBuilder();
      const eventName = 'videoInputFailed';

      const eventObserver = {
        events: 0,
        eventDidReceive(): void {
          this.events += 1;
        },
      };

      eventController = new DefaultEventController(emptyConfiguration, logger);
      eventController.addObserver(eventObserver);
      eventController.publishEvent(eventName);
      await delay(100);
      expect(eventObserver.events).to.equal(1);
      eventController.removeObserver(eventObserver);
      eventController.publishEvent(eventName);
      await delay(100);
      expect(eventObserver.events).to.equal(1);
      mockBuilder.cleanup();
    });

    it('can report event', () => {
      const eventReporter = new NoOpEventReporter();
      eventController = new DefaultEventController(emptyConfiguration, logger, eventReporter);
      const eventName = 'audioInputFailed';
      const audioInputErrorMessage = 'Something went wrong';
      const attributes = { audioInputErrorMessage };
      const spy = sinon.spy(eventReporter, 'reportEvent');
      eventController.publishEvent(eventName, attributes);
      assert(spy.calledOnce);
    });
  });

  describe('device names', () => {
    it('can get the full device name', done => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      const eventName = 'meetingStartRequested';

      eventController = new DefaultEventController(emptyConfiguration, logger);
      eventController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal(eventName);
          expect(attributes.deviceName).to.equal('Apple iPhone');
          done();
        },
      });
      eventController.publishEvent(eventName);
    });

    it('can get the vendor name only', done => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; DELL; Venue Pro)';
      const eventName = 'meetingStartRequested';

      eventController = new DefaultEventController(emptyConfiguration, logger);
      eventController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal(eventName);
          expect(attributes.deviceName).to.equal('DELL');
          done();
        },
      });
      eventController.publishEvent(eventName);
    });
  });

  it('will not construct event reporter if event ingestion URL is not present', async () => {
    const mockBuilder = new DOMMockBuilder();
    eventController = new DefaultEventController(emptyConfiguration, logger);
    expect(eventController).to.exist;
    expect(eventController.eventReporter).to.be.undefined;
    mockBuilder.cleanup();
    await eventController.destroy();

    // This is safe to call twice.
    await eventController.destroy();
  });

  it('constructs event reporter if event ingestion URL is valid', async () => {
    const mockBuilder = new DOMMockBuilder();
    const configuration = emptyConfiguration;
    configuration.urls.eventIngestionURL = 'https://localhost:8080/client-events';
    eventController = new DefaultEventController(emptyConfiguration, logger);
    expect(eventController).to.exist;
    expect(eventController.eventReporter).to.exist;
    const eventReporter = eventController.eventReporter;
    await eventController.destroy();
    expect(eventController.eventReporter).to.be.undefined;
    // @ts-ignore
    expect(eventReporter.destroyed).to.be.true;
    // This is safe to call twice.
    mockBuilder.cleanup();
    await eventController.destroy();
  });
});
