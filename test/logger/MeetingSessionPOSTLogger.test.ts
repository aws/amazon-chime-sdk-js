// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import LogLevel from '../../src/logger/LogLevel';
import MeetingSessionPOSTLogger from '../../src/logger/MeetingSessionPOSTLogger';
import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('MeetingSessionPOSTLogger', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let domMockBuilder: DOMMockBuilder | null = null;
  let domMockBehavior: DOMMockBehavior | null = null;
  const BASE_URL = 'base_url';
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

  const configuration = new MeetingSessionConfiguration(
    {
      MeetingId: 'meeting-id',
      MediaPlacement: {
        AudioHostUrl: 'audio-host-url',
        ScreenDataUrl: 'screen-data-url',
        ScreenSharingUrl: 'screen-sharing-url',
        ScreenViewingUrl: 'screen-viewing-url',
        SignalingUrl: 'signaling-url',
        TurnControlUrl: 'turn-control-url',
      },
    },
    {
      AttendeeId: 'attendee-id',
      JoinToken: 'join-token',
    }
  );

  describe('construction', () => {
    it('can be constructed', done => {
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL,
        LogLevel.WARN
      );
      expect(logger).to.not.equal(null);
      expect(logger.getLogLevel()).to.equal(LogLevel.WARN);
      logger.stop();
      done();
    });
    it('can be with different level', done => {
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL,
        LogLevel.WARN
      );
      expect(logger).to.not.equal(null);
      expect(logger.getLogLevel()).to.equal(LogLevel.WARN);
      logger.stop();
      done();
    });
  });

  describe('logging level', () => {
    it('should log info with LogLevel.INFO and ignore the debug', done => {
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL,
        LogLevel.INFO
      );
      logger.info('info');
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(2);
      logger.stop();
      done();
    });

    it('should log nothing with LogLevel.OFF', done => {
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL,
        LogLevel.OFF
      );
      logger.info('info');
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(0);
      logger.stop();
      done();
    });

    it('should skip info and debug logs by default', done => {
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL
      );
      logger.debug(() => {
        return 'debug';
      });
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(2);
      logger.stop();
      done();
    });

    it('should have debug and info logs after setting DEBUG log level', done => {
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL
      );
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
      logger.stop();
      done();
    });

    it('should start publishing logs', done => {
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL
      );
      logger.startLogPublishScheduler(batchSize);
      logger.stop();
      done();
    });
  });

  describe('startLogPublishSchedulerSpy', () => {
    it('can call startLogPublishSchedulerSpy', done => {
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL
      );
      const startLogPublishSchedulerSpy = sinon.spy(logger, 'startLogPublishScheduler');
      logger.startLogPublishScheduler(batchSize);
      expect(startLogPublishSchedulerSpy.calledOnce).to.be.true;
      logger.stop();
      done();
    });

    it('handles when the fetch call fails', done => {
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL
      );
      domMockBehavior.fetchSucceeds = false;
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(1);
      logger.startLogPublishScheduler(batchSize);
      new TimeoutScheduler(100).start(() => {
        logger.stop();
        done();
      });
    });

    it('handles when the fetch call fails and logCapture array is empty', done => {
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL
      );
      domMockBehavior.fetchSucceeds = false;
      expect(logger.getLogCaptureSize()).is.equal(0);
      logger.startLogPublishScheduler(batchSize);
      new TimeoutScheduler(100).start(() => {
        logger.stop();
        done();
      });
    });

    it('handles when the fetch call succeeds and response returns 200', done => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL
      );
      domMockBehavior.fetchSucceeds = true;
      domMockBehavior.responseSuccess = true;
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(1);
      logger.startLogPublishScheduler(batchSize);
      new TimeoutScheduler(100).start(() => {
        logger.stop();
        done();
      });
    });

    it('handles when the fetch call succeeds and response returns 500', done => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
        'testLogger',
        configuration,
        batchSize,
        intervalMs,
        BASE_URL
      );
      domMockBehavior.fetchSucceeds = true;
      domMockBehavior.responseSuccess = false;
      domMockBehavior.responseStatusCode = 500;
      logger.error('error');
      expect(logger.getLogCaptureSize()).is.equal(1);
      logger.startLogPublishScheduler(batchSize);
      new TimeoutScheduler(100).start(() => {
        logger.stop();
        done();
      });
    });

    it('will call stop when unloading the page', done => {
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
      new TimeoutScheduler(200).start(() => {
        const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
          'testLogger',
          configuration,
          batchSize,
          intervalMs,
          BASE_URL
        );
        logger.stop();
      });
      new TimeoutScheduler(600).start(() => {
        callbackToCall();
      });
      new TimeoutScheduler(800).start(() => {
        expect(added).to.be.true;
        delete GlobalAny['window']['addEventListener'];
        delete GlobalAny['window']['removeEventListener'];
        done();
      });
    });

    it('will flush the logs when unloading the page', done => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobalAny = global as any;
      let added = false;
      let callbackToCall = (): void => {};
      GlobalAny['window']['addEventListener'] = (type: string, callback: () => void) => {
        expect(type).to.equal('unload');
        added = true;
        callbackToCall = callback;
      };
      new TimeoutScheduler(60).start(() => {
        callbackToCall();
      });
      new TimeoutScheduler(80).start(() => {
        const logger: MeetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
          'testLogger',
          configuration,
          batchSize,
          intervalMs,
          BASE_URL
        );
        expect(added).to.be.true;
        delete GlobalAny['window']['addEventListener'];
        logger.stop();
        done();
      });
    });
  });
});
