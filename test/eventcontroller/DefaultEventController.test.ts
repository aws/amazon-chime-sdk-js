// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import DefaultEventController from '../../src/eventcontroller/DefaultEventController';
import EventAttributes from '../../src/eventcontroller/EventAttributes';
import EventName from '../../src/eventcontroller/EventName';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultEventController', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let audioVideoController: NoOpAudioVideoController;
  let eventController: DefaultEventController;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    audioVideoController = new NoOpAudioVideoController();
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can create with the user agent', () => {
      eventController = new DefaultEventController(audioVideoController);
      expect(eventController).to.exist;
    });

    it('can create without the user agent', () => {
      // @ts-ignore
      delete navigator.userAgent;
      eventController = new DefaultEventController(audioVideoController);
      expect(eventController).to.exist;
    });

    it('can create with an empty string', () => {
      // @ts-ignore
      navigator.userAgent = '';
      eventController = new DefaultEventController(audioVideoController);
      expect(eventController).to.exist;
    });

    it('can create with an invalid version', () => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/invalid Safari/537.36';
      eventController = new DefaultEventController(audioVideoController);
      expect(eventController).to.exist;
    });
  });

  describe('publishEvent', () => {
    it('can receive the event', done => {
      const eventName = 'audioInputFailed';
      const audioInputErrorMessage = 'Something went wrong';

      eventController = new DefaultEventController(audioVideoController);
      audioVideoController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal(eventName);
          expect(attributes.audioInputErrorMessage).to.equal(audioInputErrorMessage);
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

      eventController = new DefaultEventController(audioVideoController);
      audioVideoController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal(eventName);
          expect(attributes.videoInputErrorMessage).to.equal(videoInputErrorMessage);
          done();
        },
      });
      eventController.publishEvent(eventName, {
        videoInputErrorMessage,
      });
    });
  });

  describe('device names', () => {
    it('can get the full device name', done => {
      // @ts-ignore
      navigator.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      const eventName = 'meetingStartRequested';

      eventController = new DefaultEventController(audioVideoController);
      audioVideoController.addObserver({
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

      eventController = new DefaultEventController(audioVideoController);
      audioVideoController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal(eventName);
          expect(attributes.deviceName).to.equal('DELL');
          done();
        },
      });
      eventController.publishEvent(eventName);
    });
  });

  describe('pushMeetingState', () => {
    it('can receive meeting history in which the last item is the same as the event', done => {
      const eventName = 'meetingStartRequested';
      const historyState = 'audioInputUnselected';

      eventController = new DefaultEventController(audioVideoController);
      audioVideoController.addObserver({
        eventDidReceive(name: EventName, attributes: EventAttributes): void {
          expect(name).to.equal(eventName);
          expect(attributes.meetingHistory.length).to.equal(2);
          expect(attributes.meetingHistory[0].name).to.equal(historyState);
          expect(attributes.meetingHistory[1].name).to.equal(eventName);
          done();
        },
      });
      eventController.pushMeetingState('audioInputUnselected');
      eventController.publishEvent(eventName);
    });
  });
});
