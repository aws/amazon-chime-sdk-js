// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';

describe('NoOpLogger', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('construction', () => {
    it('can be constructed', () => {
      const logger: NoOpLogger = new NoOpLogger();
      expect(logger).to.not.equal(null);
      expect(logger.getLogLevel()).to.equal(LogLevel.OFF);
    });
    it('can be constructed with different level', () => {
      const logger: NoOpLogger = new NoOpLogger(LogLevel.DEBUG);
      expect(logger).to.not.equal(null);
      expect(logger.getLogLevel()).to.equal(LogLevel.DEBUG);
    });
  });

  describe('debug', () => {
    it('should call a callback for the debug level', () => {
      const spy: sinon.SinonSpy = sinon.spy();
      const logger: NoOpLogger = new NoOpLogger(LogLevel.DEBUG);
      logger.debug(spy);
      expect(spy.called).to.be.true;
    });

    it('should accept a string for debug, not just a function', () => {
      const logger: NoOpLogger = new NoOpLogger(LogLevel.DEBUG);
      logger.debug('foo');
    });

    it('should call not a callback for non-debug levels', () => {
      const spy: sinon.SinonSpy = sinon.spy();
      const logger: NoOpLogger = new NoOpLogger(LogLevel.INFO);
      [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.OFF].forEach((level: LogLevel) => {
        logger.setLogLevel(level);
        logger.debug(spy);
        expect(spy.called).to.be.false;
      });
    });
  });
});
