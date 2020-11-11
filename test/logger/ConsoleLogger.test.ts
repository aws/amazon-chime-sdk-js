// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import ConsoleLogger from '../../src/logger/ConsoleLogger';
import LogLevel from '../../src/logger/LogLevel';

describe('ConsoleLogger', () => {
  let expect: Chai.ExpectStatic;
  let debugSpy: sinon.SinonSpy;
  let infoSpy: sinon.SinonSpy;
  let warnSpy: sinon.SinonSpy;
  let errorSpy: sinon.SinonSpy;
  before(() => {
    expect = chai.expect;
  });

  after(() => {});

  describe('construction', () => {
    it('can be constructed', () => {
      const logger: ConsoleLogger = new ConsoleLogger('testLogger');
      expect(logger).to.not.equal(null);
      expect(logger.getLogLevel()).to.equal(LogLevel.WARN);
    });
    it('can be with different level', () => {
      const logger: ConsoleLogger = new ConsoleLogger('testLogger', LogLevel.DEBUG);
      expect(logger).to.not.equal(null);
      expect(logger.getLogLevel()).to.equal(LogLevel.DEBUG);
    });
  });

  describe('logging level', () => {
    const originalConsole = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };

    before(() => {
      // eslint-disable-next-line
      const noOpFunc = (_message?: any, ..._optionalParams: any[]) => {};
      console.debug = noOpFunc;
      console.info = noOpFunc;
      console.warn = noOpFunc;
      console.error = noOpFunc;

      debugSpy = sinon.spy(console, 'debug');
      infoSpy = sinon.spy(console, 'info');
      warnSpy = sinon.spy(console, 'warn');
      errorSpy = sinon.spy(console, 'error');
    });
    after(() => {
      debugSpy.restore();
      infoSpy.restore();
      warnSpy.restore();
      errorSpy.restore();

      console.debug = originalConsole.debug;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    });

    it('should log nothing with LogLevel.OFF', () => {
      const logger: ConsoleLogger = new ConsoleLogger('testLogger', LogLevel.OFF);
      logger.info('info');
      logger.error('error');
      expect(infoSpy.calledOnce).to.not.be.true;
      expect(errorSpy.calledOnce).to.not.be.true;
    });

    it('should skip info and debug logs by default', () => {
      const logger: ConsoleLogger = new ConsoleLogger('testLogger');
      logger.debug(() => {
        return 'debug';
      });
      logger.debug('debug with string');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      expect(infoSpy.calledOnce).to.not.be.true;
      expect(debugSpy.calledOnce).to.not.be.true;
      expect(warnSpy.calledOnce).to.be.true;
      expect(errorSpy.calledOnce).to.be.true;
    });

    it('should have debug and info logs after setting DEBUG log level', () => {
      const logger: ConsoleLogger = new ConsoleLogger('testLogger');
      logger.debug(() => {
        return 'debug';
      });
      expect(debugSpy.calledOnce).to.not.be.true;
      expect(logger.getLogLevel()).to.equal(LogLevel.WARN);
      logger.setLogLevel(LogLevel.DEBUG);
      expect(logger.getLogLevel()).to.equal(LogLevel.DEBUG);
      logger.debug(() => {
        return 'debug';
      });
      logger.info('info');
      expect(debugSpy.calledOnce).to.be.true;
      expect(infoSpy.calledOnce).to.be.true;
      logger.debug('debug with string');
      expect(debugSpy.calledTwice).to.be.true;
    });
  });
});
