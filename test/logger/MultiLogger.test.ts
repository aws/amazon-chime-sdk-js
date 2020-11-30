// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import Logger from '../../src/logger/Logger';
import LogLevel from '../../src/logger/LogLevel';
import MultiLogger from '../../src/logger/MultiLogger';
import NoOpLogger from '../../src/logger/NoOpLogger';

describe('MultiLogger', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const message = 'message';

  describe('construction', () => {
    it('can be constructed with no loggers', () => {
      const logger: MultiLogger = new MultiLogger();
      expect(logger).to.not.equal(null);
    });
    it('can be constructed with one logger', () => {
      const logger: MultiLogger = new MultiLogger(new NoOpLogger(LogLevel.INFO));
      expect(logger).to.not.equal(null);
    });
    it('can be constructed with two loggers', () => {
      const logger: MultiLogger = new MultiLogger(
        new NoOpLogger(LogLevel.INFO),
        new NoOpLogger(LogLevel.INFO)
      );
      expect(logger).to.not.equal(null);
    });
  });

  describe('getLogLevel', () => {
    it('gets the OFF level with no loggers', () => {
      const logger: MultiLogger = new MultiLogger();
      expect(logger.getLogLevel()).to.equal(LogLevel.OFF);
    });
    it('it gets the log level of the logger', () => {
      const logger: MultiLogger = new MultiLogger(new NoOpLogger(LogLevel.INFO));
      expect(logger.getLogLevel()).to.equal(LogLevel.INFO);
    });
    it('it gets the log level of the first logger', () => {
      const logger: MultiLogger = new MultiLogger(
        new NoOpLogger(LogLevel.INFO),
        new NoOpLogger(LogLevel.DEBUG)
      );
      expect(logger.getLogLevel()).to.equal(LogLevel.INFO);
    });
  });

  describe('setLogLevel', () => {
    it('it set the log level of each logger', () => {
      const logger: MultiLogger = new MultiLogger(new NoOpLogger(LogLevel.OFF));
      expect(logger.setLogLevel(LogLevel.INFO));
      expect(logger.getLogLevel()).to.equal(LogLevel.INFO);
    });
  });

  describe('error', () => {
    it('can write an error log', () => {
      const internalLogger1: Logger = new NoOpLogger(LogLevel.ERROR);
      const internalLogger2: Logger = new NoOpLogger(LogLevel.ERROR);
      const spy1 = sinon.spy(internalLogger1, 'error');
      const spy2 = sinon.spy(internalLogger2, 'error');
      new MultiLogger(internalLogger1, internalLogger2).error(message);
      expect(spy1.withArgs(message).calledOnce).to.be.true;
      expect(spy2.withArgs(message).calledOnce).to.be.true;
    });
  });

  describe('warn', () => {
    it('can write a warn log', () => {
      const internalLogger1: Logger = new NoOpLogger(LogLevel.WARN);
      const internalLogger2: Logger = new NoOpLogger(LogLevel.WARN);
      const spy1 = sinon.spy(internalLogger1, 'warn');
      const spy2 = sinon.spy(internalLogger2, 'warn');
      new MultiLogger(internalLogger1, internalLogger2).warn(message);
      expect(spy1.withArgs(message).calledOnce).to.be.true;
      expect(spy2.withArgs(message).calledOnce).to.be.true;
    });
  });

  describe('info', () => {
    it('can write an info log', () => {
      const internalLogger1: Logger = new NoOpLogger(LogLevel.INFO);
      const internalLogger2: Logger = new NoOpLogger(LogLevel.INFO);
      const spy1 = sinon.spy(internalLogger1, 'info');
      const spy2 = sinon.spy(internalLogger2, 'info');
      new MultiLogger(internalLogger1, internalLogger2).info(message);
      expect(spy1.withArgs(message).calledOnce).to.be.true;
      expect(spy2.withArgs(message).calledOnce).to.be.true;
    });
  });

  describe('debug', () => {
    it('can write a debug log', () => {
      const internalLogger1: Logger = new NoOpLogger(LogLevel.DEBUG);
      const internalLogger2: Logger = new NoOpLogger(LogLevel.DEBUG);
      const spy1 = sinon.spy(internalLogger1, 'debug');
      const spy2 = sinon.spy(internalLogger2, 'debug');
      const messageFn = (): string => {
        return message;
      };
      new MultiLogger(internalLogger1, internalLogger2).debug(messageFn);
      expect(spy1.calledOnce).to.be.true;
      expect(spy2.calledOnce).to.be.true;

      const firstArg = spy1.firstCall.args[0];
      const secondArg = spy2.firstCall.args[0];

      expect(typeof firstArg === 'function').to.be.true;
      expect(typeof secondArg === 'function').to.be.true;
      expect((firstArg as () => string)()).to.equal(message);
      expect((secondArg as () => string)()).to.equal(message);
      expect(firstArg).to.eq(secondArg);
    });

    it('memoizes debug functions', () => {
      const internalLogger1: Logger = new NoOpLogger(LogLevel.DEBUG);
      const internalLogger2: Logger = new NoOpLogger(LogLevel.DEBUG);
      let called = 0;
      const messageFn = (): string => {
        called += 1;
        return message;
      };
      new MultiLogger(internalLogger1, internalLogger2).debug(messageFn);
      expect(called).to.eq(1);
    });

    it('accepts debug strings', () => {
      const internalLogger1: Logger = new NoOpLogger(LogLevel.DEBUG);
      const internalLogger2: Logger = new NoOpLogger(LogLevel.DEBUG);
      const spy1 = sinon.spy(internalLogger1, 'debug');
      const spy2 = sinon.spy(internalLogger2, 'debug');
      const message = 'hello, world';
      new MultiLogger(internalLogger1, internalLogger2).debug(message);
      expect(spy1.withArgs(message).calledOnce).to.be.true;
      expect(spy2.withArgs(message).calledOnce).to.be.true;
    });
  });
});
