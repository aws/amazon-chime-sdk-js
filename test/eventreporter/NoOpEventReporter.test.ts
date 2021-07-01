// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import EventReporter from '../../src/eventreporter/EventReporter';
import NoOpEventReporter from '../../src/eventreporter/NoOpEventReporter';

describe('NoOpEventReporter', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let eventReporter: EventReporter;

  beforeEach(() => {
    eventReporter = new NoOpEventReporter();
  });

  describe('no-op operations', () => {
    it('can construct', () => {
      expect(eventReporter).to.exist;
    });

    it('can report event', () => {
      eventReporter.reportEvent(Date.now(), 'meetingStartSucceeded');
    });

    it('can start', () => {
      eventReporter.start();
    });

    it('can stop', () => {
      eventReporter.stop();
    });
  });
});
