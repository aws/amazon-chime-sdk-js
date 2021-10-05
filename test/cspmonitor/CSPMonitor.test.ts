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
  let document: any;

  before(() => {
    domMockBuilder = new DOMMockBuilder();
    expect = chai.expect;
  });

  beforeEach(() => {
    document = {
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
      const addEventListenerSpy = sinon.spy(document, 'addEventListener');
      document.addEventListener();
      CSPMonitor.register();
      expect(addEventListenerSpy.called).to.be.true;
    });

    it('not registed if already added', async () => {
      const cspmonitor = sinon.createStubInstance(CSPMonitor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cspmonitor as any).added = true;
      const addEventListenerSpy = sinon.spy(document, 'addEventListener');
      CSPMonitor.register();
      expect(addEventListenerSpy.called).to.be.false;
    });
  });

  describe('Disable CSPMonitor', () => {
    it('can be disabled', async () => {
      const cspmonitor = sinon.createStubInstance(CSPMonitor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cspmonitor as any).shouldRegisterCSPMonitor = false;
      CSPMonitor.disable();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((cspmonitor as any).shouldRegisterCSPMonitor).to.be.false;
    });
  });

  describe('unregister CSPMonitor', () => {
    it('can be unregistered', async () => {
      const removeEventListenerSpy = sinon.spy(document, 'removeEventListener');
      document.removeEventListener();
      CSPMonitor.unregister();
      expect(removeEventListenerSpy.called).to.be.true;
    });
  });

  describe('add logger', () => {
    it('can add a logger', async () => {
      const cspmonitor = sinon.createStubInstance(CSPMonitor);
      const logger = new NoOpLogger();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cspmonitor as any).loggers = new Set<NoOpLogger>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cspmonitor as any).loggers.add(logger);
      CSPMonitor.addLogger(logger);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((cspmonitor as any).loggers.size).to.equal(1);
    });

    it('not to add a logger if logger is undefined', async () => {
      const cspmonitor = sinon.createStubInstance(CSPMonitor);
      const logger: Logger = undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cspmonitor as any).loggers = new Set<NoOpLogger>();
      CSPMonitor.addLogger(logger);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((cspmonitor as any).loggers.size).to.equal(0);
    });
  });

  describe('remove logger', () => {
    it('can remove a logger', async () => {
      const cspmonitor = sinon.createStubInstance(CSPMonitor);
      const logger = new NoOpLogger();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cspmonitor as any).loggers = new Set<NoOpLogger>();
      CSPMonitor.removeLogger(logger);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((cspmonitor as any).loggers.size).to.equal(0);
    });

    it('not remove a logger if logger is undefined', async () => {
      const cspmonitor = sinon.createStubInstance(CSPMonitor);
      let logger = new NoOpLogger();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cspmonitor as any).loggers = new Set<NoOpLogger>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cspmonitor as any).loggers.add(logger);
      CSPMonitor.addLogger(logger);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((cspmonitor as any).loggers.size).to.equal(1);
      logger = undefined;
      CSPMonitor.removeLogger(logger);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((cspmonitor as any).loggers.size).to.equal(1);
    });
  });

  describe('Register CSPMonitor in multi sessions', () => {
    it('only have one event listener when there is two sessions', async () => {
      const addEventListenerSpy = sinon.spy(document, 'addEventListener');
      document.addEventListener();
      CSPMonitor.register();
      CSPMonitor.register();
      expect(addEventListenerSpy.calledOnce).to.be.true;
    });
  });
});
