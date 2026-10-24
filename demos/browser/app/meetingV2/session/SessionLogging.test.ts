// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { EventAttributes, EventName, MeetingSessionConfiguration } from 'amazon-chime-sdk-js';
import { ConsoleLogger, LogLevel, MultiLogger } from 'amazon-chime-sdk-js';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type ApiClient from './ApiClient';
import SessionLogging from './SessionLogging';

const { postLoggers } = vi.hoisted(() => ({
  postLoggers: [] as { appName: string; url: string; level: number; info: Mock; destroy: Mock }[],
}));

vi.mock('amazon-chime-sdk-js', async () => ({
  LogLevel: (await import('../../../../../src/logger/LogLevel')).LogLevel,
  isDestroyable: (await import('../../../../../src/destroyable/Destroyable')).isDestroyable,
  ConsoleLogger: class {
    constructor(
      public readonly name: string,
      public readonly level: number
    ) {}
  },
  MultiLogger: class {
    readonly loggers: unknown[];
    constructor(...loggers: unknown[]) {
      this.loggers = loggers;
    }
  },
  MeetingEventsClientConfiguration: class {},
  EventIngestionConfiguration: class {},
  DefaultMeetingEventReporter: class {
    destroy = vi.fn();
    constructor(
      _configuration: unknown,
      public readonly logger: unknown
    ) {}
  },
}));

vi.mock('./MeetingLogger', () => ({
  getPOSTLogger: (_configuration: unknown, appName: string, url: string, level: number) => {
    const logger = { appName, url, level, info: vi.fn(), destroy: vi.fn() };
    postLoggers.push(logger);
    return logger;
  },
}));

const configuration = {
  meetingId: 'meeting',
  credentials: { attendeeId: 'attendee', joinToken: 'token' },
  urls: { eventIngestionURL: 'https://ingest' },
} as unknown as MeetingSessionConfiguration;

function setUp(accepted: Record<string, boolean>): {
  logging: SessionLogging;
  createLogStream: Mock;
} {
  const createLogStream = vi.fn(async (pathname: string) => accepted[pathname] ?? false);
  const api = { createLogStream, url: (pathname: string) => `https://api/${pathname}` };
  return {
    logging: new SessionLogging(api as unknown as ApiClient, () => LogLevel.INFO),
    createLogStream,
  };
}

const ALL_STREAMS = {
  create_log_stream: true,
  create_browser_event_log_stream: true,
  create_browser_event_ingestion_log_stream: true,
};

describe('SessionLogging', () => {
  beforeEach(() => {
    postLoggers.length = 0;
    vi.stubGlobal('location', { hostname: 'demo.example.com' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('POSTs SDK logs and routed meeting events when both log streams are accepted', async () => {
    const { logging, createLogStream } = setUp(ALL_STREAMS);
    const logger = await logging.createLogger(configuration);

    expect(createLogStream.mock.calls).toEqual([
      ['create_log_stream', 'meeting', 'attendee'],
      ['create_browser_event_log_stream', 'meeting', 'attendee'],
    ]);
    expect(postLoggers.map(({ appName, url, level }) => [appName, url, level])).toEqual([
      ['SDK', 'https://api/logs', LogLevel.INFO],
      ['SDKEvent', 'https://api/log_meeting_event', LogLevel.INFO],
    ]);
    expect(logger).toBeInstanceOf(MultiLogger);
    expect((logger as unknown as { loggers: unknown[] }).loggers).toEqual([
      new ConsoleLogger('SDK', LogLevel.INFO),
      postLoggers[0],
    ]);

    vi.useFakeTimers({ now: 1_000_000 });
    const meetingHistory: EventAttributes['meetingHistory'] = [
      { name: 'meetingStartRequested', timestampMs: 1_000_000 - 299_000 },
      { name: 'meetingStartRequested', timestampMs: 1_000_000 - 301_000 },
    ];
    const events = postLoggers[1].info;
    logging.logEvent('meetingStartSucceeded', {
      maxVideoTileCount: 2,
      meetingHistory,
    } as EventAttributes);
    logging.logEvent('meetingFailed', {
      meetingErrorMessage: 'x',
      meetingHistory,
    } as EventAttributes);
    logging.logEvent('videoInputSelected' as EventName, {});
    logging.logEvent('unrouted' as EventName, { meetingHistory });

    expect(events.mock.calls).toEqual([
      ['{"name":"meetingStartSucceeded","attributes":{"maxVideoTileCount":2}}'],
      [
        '{"name":"meetingFailed","attributes":{"meetingErrorMessage":"x","meetingHistory":[{"name":"meetingStartRequested","timestampMs":701000}]}}',
      ],
      ['{"name":"videoInputSelected","attributes":{}}'],
    ]);
  });

  it('keeps logs in the console when a log stream is refused', async () => {
    const { logging } = setUp({ create_log_stream: true });
    const logger = await logging.createLogger(configuration);

    expect(logger).toEqual(new ConsoleLogger('SDK', LogLevel.INFO));
    expect(logger).not.toBeInstanceOf(MultiLogger);
    expect(postLoggers).toEqual([]);
  });

  it('does not ask a local api-server for log streams', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' });
    const { logging, createLogStream } = setUp(ALL_STREAMS);
    const logger = await logging.createLogger(configuration);

    expect(createLogStream).not.toHaveBeenCalled();
    expect(logger).not.toBeInstanceOf(MultiLogger);
  });

  it('flushes for 500 ms after teardown and makes the next session wait for it', async () => {
    vi.useFakeTimers();
    const { logging, createLogStream } = setUp(ALL_STREAMS);
    await logging.createLogger(configuration);
    const [sdk, events] = postLoggers;
    logging.teardown();

    const next = logging.createLogger(configuration);
    await vi.advanceTimersByTimeAsync(499);
    expect(sdk.destroy).not.toHaveBeenCalled();
    expect(createLogStream).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(sdk.destroy).toHaveBeenCalledTimes(1);
    expect(events.destroy).toHaveBeenCalledTimes(1);
    await next;
    expect(createLogStream).toHaveBeenCalledTimes(4);
    expect(postLoggers).toHaveLength(4);
  });

  it('logs event ingestion to the console and a DEBUG POST logger when remote logging is on', async () => {
    const { logging, createLogStream } = setUp(ALL_STREAMS);
    await logging.createLogger(configuration);
    const reporter = (await logging.createEventReporter(configuration)) as unknown as {
      logger: { loggers: unknown[] };
      destroy: () => void;
    };

    expect(createLogStream).toHaveBeenLastCalledWith(
      'create_browser_event_ingestion_log_stream',
      'meeting',
      'attendee'
    );
    expect(reporter.logger.loggers).toEqual([
      new ConsoleLogger('SDKEventIngestion', LogLevel.INFO),
      postLoggers[2],
    ]);
    expect(postLoggers[2]).toMatchObject({
      appName: 'SDKEventIngestion',
      url: 'https://api/log_event_ingestion',
      level: LogLevel.DEBUG,
    });

    logging.teardown();
    expect(reporter.destroy).toHaveBeenCalledTimes(1);
  });

  it('logs event ingestion to the console only when remote logging is off', async () => {
    const { logging, createLogStream } = setUp({});
    await logging.createLogger(configuration);
    const reporter = await logging.createEventReporter(configuration);

    expect(createLogStream).not.toHaveBeenCalledWith(
      'create_browser_event_ingestion_log_stream',
      'meeting',
      'attendee'
    );
    expect((reporter as unknown as { logger: unknown }).logger).toEqual(
      new ConsoleLogger('SDKEventIngestion', LogLevel.INFO)
    );
    expect(
      await logging.createEventReporter({
        ...configuration,
        urls: {},
      } as MeetingSessionConfiguration)
    ).toBeUndefined();
  });
});
