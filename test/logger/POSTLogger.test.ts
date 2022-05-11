// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import LogLevel from '../../src/logger/LogLevel';
import POSTLogger from '../../src/logger/POSTLogger';
import { wait } from '../../src/utils/Utils';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('POSTLogger', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder | null = null;
  let domMockBehavior: DOMMockBehavior | null = null;
  const url = 'base_url';
  const intervalMs = 50;
  const batchSize = 2;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
  });

  after(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  describe('construction', () => {
    it('can be constructed with just url as required parameter', async () => {
      const logger = new POSTLogger({ url });
      expect(logger).to.not.equal(null);
      expect(logger.getLogLevel()).to.equal(LogLevel.WARN);
      await logger.destroy();
    });

    it('can be with different level', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs, logLevel: LogLevel.DEBUG });
      expect(logger).to.not.equal(null);
      expect(logger.getLogLevel()).to.equal(LogLevel.DEBUG);
      await logger.destroy();
    });

    it('can be constructed with optional metadata', async () => {
      const metadata = { MeetingId: '12345' };
      const logger = new POSTLogger({
        url,
        batchSize,
        intervalMs,
        logLevel: LogLevel.INFO,
        metadata,
      });
      expect(logger).to.not.equal(null);
      expect(logger.getLogLevel()).to.equal(LogLevel.INFO);
      expect(logger.metadata['MeetingId']).to.exist;
      expect(logger.metadata['MeetingId']).to.equal('12345');
      await logger.destroy();
    });
  });

  describe('HTTP POST metadata', () => {
    it('can get and set metadata', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs, logLevel: LogLevel.INFO });
      expect(logger).to.not.equal(null);
      expect(logger.getLogLevel()).to.equal(LogLevel.INFO);
      expect(logger.metadata).to.be.undefined;
      logger.metadata = { MeetingId: '12345' };
      expect(logger.metadata['MeetingId']).to.equal('12345');
      logger.metadata = { MeetingId: '45678', AttendeeId: '12345' };
      expect(logger.metadata['MeetingId']).to.equal('45678');
      expect(logger.metadata['AttendeeId']).to.equal('12345');
      await logger.destroy();
    });
  });

  describe('disposal', () => {
    it('can be disposed', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs, logLevel: LogLevel.WARN });
      await logger.destroy();
      // This is safe to call twice.
      await logger.destroy();
    });
  });

  describe('logging level', () => {
    it('should log info with LogLevel.INFO and ignore the debug', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs, logLevel: LogLevel.INFO });
      logger.info('info');
      logger.error('error');
      logger.debug('error');
      expect(logger.getLogCaptureSize()).is.equal(2);
      await logger.destroy();
    });

    it('should log when header is set', async () => {
      const metadata = { appName: 'SDK' };
      const headers = { 'Content-Type': 'application/json' };
      const logger = new POSTLogger({
        url,
        batchSize,
        intervalMs,
        logLevel: LogLevel.INFO,
        metadata,
        headers,
      });
      logger.info('info');
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(2);
      await logger.destroy();
    });

    it('should log nothing with LogLevel.OFF', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs, logLevel: LogLevel.OFF });
      logger.info('info');
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(0);
      await logger.destroy();
    });

    it('should skip info and debug logs by default', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs });
      logger.debug(() => {
        return 'debug';
      });
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(2);
      await logger.destroy();
    });

    it('should have debug and info logs after setting DEBUG log level', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs });
      logger.debug(() => {
        return 'debug';
      });
      expect(logger.getLogCaptureSize()).is.equal(0);
      expect(logger.getLogLevel()).to.equal(LogLevel.WARN);
      logger.setLogLevel(LogLevel.DEBUG);
      expect(logger.getLogLevel()).to.equal(LogLevel.DEBUG);
      logger.debug(() => {
        return 'debug';
      });
      logger.info('info');
      expect(logger.getLogCaptureSize()).is.equal(2);
      await logger.destroy();
    });
  });

  describe('logging', () => {
    // The batch sending interval is 50ms, hence wait for 100-200ms in this test suite.
    it('should start publishing logs', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs });
      await wait(100);
      await logger.destroy();
    });

    it('should start publishing logs with metadata', async () => {
      const metadata = {
        appName: 'SDK',
        meetingId: '12345',
        attendeeId: '12345',
      };
      const logger = new POSTLogger({
        url,
        batchSize,
        intervalMs,
        logLevel: LogLevel.INFO,
        metadata,
      });
      logger.info('first log');
      logger.info('second log');
      logger.info('third log');
      await wait(200);
      await logger.destroy();
    });

    it('handles when the fetch call fails', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs });
      domMockBehavior.fetchSucceeds = false;
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(1);
      await wait(200);
      await logger.destroy();
    });

    it('handles when the fetch call fails and logCapture array is empty', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs });
      domMockBehavior.fetchSucceeds = false;
      expect(logger.getLogCaptureSize()).is.equal(0);
      await wait(200);
      await logger.destroy();
    });

    it('handles when the fetch call succeeds and response returns 200', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs });
      domMockBehavior.fetchSucceeds = true;
      domMockBehavior.responseSuccess = true;
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(1);
      await wait(200);
      await logger.destroy();
    });

    it('handles when the fetch call succeeds with header and response returns 200', async () => {
      const headers = { 'Content-Type': 'application/json' };
      const logger = new POSTLogger({
        url,
        batchSize,
        intervalMs,
        logLevel: LogLevel.INFO,
        headers,
      });
      domMockBehavior.fetchSucceeds = true;
      domMockBehavior.responseSuccess = true;
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(1);
      await wait(200);
      await logger.destroy();
    });

    it('handles when the fetch call succeeds and response returns 500', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs });
      domMockBehavior.fetchSucceeds = true;
      domMockBehavior.responseSuccess = false;
      domMockBehavior.responseStatusCode = 500;
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(1);
      await wait(200);
      await logger.destroy();
    });

    it('does not die if you pass undefined', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs });
      logger.setLogLevel(LogLevel.DEBUG);
      logger.debug(undefined);
      expect(logger.getLogCaptureSize()).to.equal(1);
      await wait(100);
      await logger.destroy();
    });

    it('does not die if you pass a string', async () => {
      const logger = new POSTLogger({ url, batchSize, intervalMs });
      logger.setLogLevel(LogLevel.DEBUG);
      logger.debug('foo');
      expect(logger.getLogCaptureSize()).to.equal(1);
      await logger.destroy();
    });

    it('will call stop when unloading the page', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobalAny = global as any;
      let added = false;
      let callbackToCall = (): void => {};
      GlobalAny['window']['addEventListener'] = (type: string, callback: () => void) => {
        expect(type).to.equal('unload');
        added = true;
        callbackToCall = callback;
      };
      GlobalAny['window']['removeEventListener'] = (type: string) => {
        expect(type).to.equal('unload');
      };
      await wait(200);
      const logger = new POSTLogger({ url, batchSize, intervalMs });
      await logger.destroy();
      await wait(600);
      callbackToCall();
      await wait(800);
      expect(added).to.be.true;
      delete GlobalAny['window']['addEventListener'];
      delete GlobalAny['window']['removeEventListener'];
    });

    it('will flush the logs when unloading the page', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobalAny = global as any;
      let added = false;
      let callbackToCall = (_e: Event): void => {};
      GlobalAny['window']['addEventListener'] = (type: string, callback: (e: Event) => void) => {
        expect(type).to.equal('unload');
        added = true;
        callbackToCall = callback;
      };
      const logger = new POSTLogger({ url, batchSize, intervalMs });
      await wait(60);
      callbackToCall(new Event('unload'));
      await wait(80);
      expect(added).to.be.true;
      delete GlobalAny['window']['addEventListener'];
      await logger.destroy();
    });
  });
});
