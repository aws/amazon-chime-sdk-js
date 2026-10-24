// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  ConsoleLogger,
  DefaultMeetingEventReporter,
  EventAttributes,
  EventIngestionConfiguration,
  EventName,
  EventReporter,
  isDestroyable,
  Logger,
  LogLevel,
  MeetingEventsClientConfiguration,
  MeetingSessionConfiguration,
  MultiLogger,
  POSTLogger,
} from 'amazon-chime-sdk-js';

import ApiClient from './ApiClient';
import { getPOSTLogger } from './MeetingLogger';

const MAX_MEETING_HISTORY_MS = 5 * 60 * 1000;

/** Decides where a session's SDK logs, meeting events and event-ingestion logs go. */
export default class SessionLogging {
  /** True when the server accepted log streams, so SDK logs and events are POSTed to it. */
  private remoteLogging = false;
  private eventReporter: EventReporter | undefined;
  private meetingSessionPOSTLogger: POSTLogger | undefined;
  private meetingEventPOSTLogger: POSTLogger | undefined;
  private loggerTeardown: Promise<void> = Promise.resolve();

  constructor(
    private readonly api: ApiClient,
    private readonly logLevel: () => LogLevel
  ) {}

  /** A local api-server has no log-stream routes, so the browser logs stay in the console. */
  private get skipRemoteLogging(): boolean {
    return ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
  }

  async createLogger(configuration: MeetingSessionConfiguration): Promise<Logger> {
    const consoleLogger = new ConsoleLogger('SDK', this.logLevel());
    // Only the serverless deployment stores browser logs; its log-stream routes answer 200.
    // `api-server.js` (and any other host) answers 404, so logs stay in the console there.
    const meetingId = configuration.meetingId!;
    const attendeeId = configuration.credentials!.attendeeId!;
    // A previous session's loggers flush for a moment after it ends; let them finish first.
    await this.loggerTeardown;
    const [logStream, eventStream] = this.skipRemoteLogging
      ? [false, false]
      : await Promise.all([
          this.api.createLogStream('create_log_stream', meetingId, attendeeId),
          this.api.createLogStream('create_browser_event_log_stream', meetingId, attendeeId),
        ]);
    this.remoteLogging = logStream && eventStream;
    if (!this.remoteLogging) {
      return consoleLogger;
    }
    this.meetingSessionPOSTLogger = getPOSTLogger(
      configuration,
      'SDK',
      this.api.url('logs'),
      this.logLevel()
    );
    const logger = new MultiLogger(consoleLogger, this.meetingSessionPOSTLogger);
    this.meetingEventPOSTLogger = getPOSTLogger(
      configuration,
      'SDKEvent',
      this.api.url('log_meeting_event'),
      this.logLevel()
    );
    return logger;
  }

  async createEventReporter(
    configuration: MeetingSessionConfiguration
  ): Promise<EventReporter | undefined> {
    this.eventReporter = await this.setupEventReporter(configuration);
    return this.eventReporter;
  }

  private async setupEventReporter(
    configuration: MeetingSessionConfiguration
  ): Promise<EventReporter | undefined> {
    const ingestionURL = configuration.urls!.eventIngestionURL;
    if (!ingestionURL) {
      return undefined;
    }
    const eventReportingLogger = new ConsoleLogger('SDKEventIngestion', this.logLevel());
    const clientConfig = new MeetingEventsClientConfiguration(
      configuration.meetingId!,
      configuration.credentials!.attendeeId!,
      configuration.credentials!.joinToken!
    );
    const ingestionConfiguration = new EventIngestionConfiguration(clientConfig, ingestionURL);
    const streamCreated =
      this.remoteLogging &&
      (await this.api.createLogStream(
        'create_browser_event_ingestion_log_stream',
        configuration.meetingId!,
        configuration.credentials!.attendeeId!
      ));
    if (!streamCreated) {
      return new DefaultMeetingEventReporter(ingestionConfiguration, eventReportingLogger);
    }
    const postLogger = getPOSTLogger(
      configuration,
      'SDKEventIngestion',
      this.api.url('log_event_ingestion'),
      LogLevel.DEBUG
    );
    return new DefaultMeetingEventReporter(
      ingestionConfiguration,
      new MultiLogger(eventReportingLogger, postLogger)
    );
  }

  logEvent(name: EventName, attributes: EventAttributes): void {
    const { meetingHistory, ...otherAttributes } = attributes;
    switch (name) {
      case 'meetingStartRequested':
      case 'meetingStartSucceeded':
      case 'meetingEnded':
      case 'audioInputSelected':
      case 'videoInputSelected':
      case 'audioInputUnselected':
      case 'videoInputUnselected':
      case 'meetingReconnected':
      case 'receivingAudioDropped':
      case 'signalingDropped':
      case 'sendingAudioFailed':
      case 'sendingAudioRecovered':
      case 'attendeePresenceReceived':
        this.meetingEventPOSTLogger?.info(JSON.stringify({ name, attributes: otherAttributes }));
        break;
      case 'audioInputFailed':
      case 'videoInputFailed':
      case 'deviceLabelTriggerFailed':
      case 'meetingStartFailed':
      case 'meetingFailed':
        // Include the last five minutes of history with failures.
        this.meetingEventPOSTLogger?.info(
          JSON.stringify({
            name,
            attributes: {
              ...otherAttributes,
              meetingHistory: (meetingHistory ?? []).filter(
                ({ timestampMs }) => Date.now() - timestampMs < MAX_MEETING_HISTORY_MS
              ),
            },
          })
        );
        break;
    }
  }

  teardown(): void {
    const loggers = [this.meetingEventPOSTLogger, this.meetingSessionPOSTLogger];
    this.meetingEventPOSTLogger = undefined;
    this.meetingSessionPOSTLogger = undefined;
    // Give the loggers a moment to send what the leave just logged.
    this.loggerTeardown = new Promise(resolve => setTimeout(resolve, 500))
      .then(() => Promise.allSettled(loggers.map(logger => logger?.destroy())))
      .then(() => undefined);
    if (isDestroyable(this.eventReporter)) {
      this.eventReporter.destroy();
    }
    this.eventReporter = undefined;
  }
}
