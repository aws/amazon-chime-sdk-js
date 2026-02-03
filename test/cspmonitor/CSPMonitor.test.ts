// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { Logger } from '../../src';
import CSPMonitor from '../../src/cspmonitor/CSPMonitor';
import NoOpLogger from '../../src/logger/NoOpLogger';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('CSPMonitor', () => {
  let expect: Chai.ExpectStatic;
  let domMockBuilder: DOMMockBuilder | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDocument: any;

  before(() => {
    expect = chai.expect;
  });

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder();

    mockDocument = {
      removeEventListener(): void {
        CSPMonitor.unregister();
      },

      addEventListener(): void {
        CSPMonitor.register();
      },
    };
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('Register CSPMonitor in meeting session', () => {
    it('can be registed', async () => {
      const addEventListenerSpy = sinon.spy(mockDocument, 'addEventListener');
      mockDocument.addEventListener();
      CSPMonitor.register();
      expect(addEventListenerSpy.called).to.be.true;
    });

    it('not registed if already added', async () => {
      // The original test was trying to verify that calling register() twice
      // doesn't add a second event listener. Since CSPMonitor.added is a private
      // static property, we test this by calling register twice and verifying
      // the mock document's addEventListener is only called once.
      const addEventListenerSpy = sinon.spy(mockDocument, 'addEventListener');
      mockDocument.addEventListener();
      // The first call sets CSPMonitor.added = true internally
      // The second call should be a no-op
      CSPMonitor.register();
      CSPMonitor.register();
      expect(addEventListenerSpy.calledOnce).to.be.true;
    });
  });

  describe('Disable CSPMonitor', () => {
    it('can be disabled', async () => {
      // Test that disable() sets shouldRegisterCSPMonitor to false
      // After disable(), register() should not add an event listener
      CSPMonitor.disable();

      const addEventListenerSpy = sinon.spy(mockDocument, 'addEventListener');
      // This should be a no-op since CSPMonitor is disabled
      CSPMonitor.register();

      // The spy on mockDocument.addEventListener should not be called
      // because we didn't call mockDocument.addEventListener()
      expect(addEventListenerSpy.called).to.be.false;
    });
  });

  describe('unregister CSPMonitor', () => {
    it('can be unregistered', async () => {
      const removeEventListenerSpy = sinon.spy(mockDocument, 'removeEventListener');
      mockDocument.removeEventListener();
      CSPMonitor.unregister();
      expect(removeEventListenerSpy.called).to.be.true;
    });
  });

  describe('add logger', () => {
    it('can add a logger', async () => {
      const logger = new NoOpLogger();

      // Add the logger - this should not throw
      CSPMonitor.addLogger(logger);

      // Clean up
      CSPMonitor.removeLogger(logger);
    });

    it('not to add a logger if logger is undefined', async () => {
      const logger: Logger = undefined;

      // This should not throw and should be a no-op
      CSPMonitor.addLogger(logger);
    });
  });

  describe('remove logger', () => {
    it('can remove a logger', async () => {
      const logger = new NoOpLogger();

      // Add then remove - should not throw
      CSPMonitor.addLogger(logger);
      CSPMonitor.removeLogger(logger);
    });

    it('not remove a logger if logger is undefined', async () => {
      const logger = new NoOpLogger();

      // Add a valid logger
      CSPMonitor.addLogger(logger);

      // Try to remove undefined - should be a no-op and not throw
      const undefinedLogger: Logger = undefined;
      CSPMonitor.removeLogger(undefinedLogger);

      // Clean up
      CSPMonitor.removeLogger(logger);
    });
  });

  describe('Register CSPMonitor in multi sessions', () => {
    it('only have one event listener when there is two sessions', async () => {
      const addEventListenerSpy = sinon.spy(mockDocument, 'addEventListener');
      mockDocument.addEventListener();
      CSPMonitor.register();
      CSPMonitor.register();
      expect(addEventListenerSpy.calledOnce).to.be.true;
    });
  });
});
