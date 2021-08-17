// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import DefaultResourceMonitor from '../../src/resourcemonitor/DefaultResourceMonitor';
import { wait } from '../../src/utils/Utils';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultResourceMonitor', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let resourceMonitor: DefaultResourceMonitor;
  let logger: NoOpLogger;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    logger = new NoOpLogger(LogLevel.DEBUG);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('start', () => {
    it('warns when the execution time exceeds the threshold', async () => {
      const dataPoints = 3;
      const debugSpy = sinon.spy(logger, 'debug');
      const warnSpy = sinon.spy(logger, 'warn');
      resourceMonitor = new DefaultResourceMonitor(logger, dataPoints, 10, 0);
      resourceMonitor.start();
      await wait(50);
      resourceMonitor.stop();
      expect(debugSpy.callCount).to.greaterThan(dataPoints);
      expect(warnSpy.calledWith('insufficient resources'));
      debugSpy.restore();
      warnSpy.restore();
    });

    it('does not warn if the execution time does not exceed the threshold', async () => {
      const spy = sinon.spy(logger, 'warn');
      resourceMonitor = new DefaultResourceMonitor(logger, 1, 10, Infinity);
      resourceMonitor.start();
      await wait(50);
      resourceMonitor.stop();
      expect(spy.called).to.be.false;
      spy.restore();
    });

    it('does not calculate the execution time if the document is not visible', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any)['document'].visibilityState = 'hidden';
      const spy = sinon.spy(logger, 'debug');
      resourceMonitor = new DefaultResourceMonitor(logger, 1, 10, 0);
      resourceMonitor.start();
      await wait(50);
      resourceMonitor.stop();
      expect(spy.called).to.be.false;
      spy.restore();
    });
  });

  describe('stop', () => {
    it('stops before calcluating the execution time', async () => {
      const spy = sinon.spy(logger, 'debug');
      resourceMonitor = new DefaultResourceMonitor(logger);
      resourceMonitor.start();
      resourceMonitor.stop();
      expect(spy.called).to.be.false;
    });
  });
});
