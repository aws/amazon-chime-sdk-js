// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import EventBufferConfiguration from '../../src/eventbufferconfiguration/EventBufferConfiguration';

describe('EventBufferConfiguration', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('constructor', () => {
    it('can be constructed with no arguments', () => {
      const eventBufferConfiguration = new EventBufferConfiguration();
      expect(eventBufferConfiguration.flushIntervalMs).to.eq(5000);
      expect(eventBufferConfiguration.flushSize).to.eq(2);
      expect(eventBufferConfiguration.maxBufferCapacityKb).to.eq(64);
      expect(eventBufferConfiguration.totalBufferItems).to.eq(100);
      expect(eventBufferConfiguration.retryCountLimit).to.eq(15);
    });

    it('can be constructed with custom arguments', () => {
      const eventBufferConfiguration = new EventBufferConfiguration(2000, 3);
      expect(eventBufferConfiguration.flushIntervalMs).to.eq(2000);
      expect(eventBufferConfiguration.flushSize).to.eq(3);
      expect(eventBufferConfiguration.maxBufferCapacityKb).to.eq(64);
      expect(eventBufferConfiguration.totalBufferItems).to.eq(100);
      expect(eventBufferConfiguration.retryCountLimit).to.eq(15);
    });
  });
});
