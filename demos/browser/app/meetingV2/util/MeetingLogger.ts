// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LogLevel, MeetingSessionConfiguration, POSTLogger } from 'amazon-chime-sdk-js';

const LOGGER_BATCH_SIZE = 85;
const LOGGER_INTERVAL_MS = 2_000;

export function getPOSTLogger(
  meetingSessionConfiguration: MeetingSessionConfiguration,
  appName: string,
  url: string,
  logLevel: LogLevel
) {
  const POSTLoggerOptions = {
    metadata: {
      appName,
      meetingId: meetingSessionConfiguration.meetingId,
      attendeeId: meetingSessionConfiguration.credentials.attendeeId,
    },
  };
  return new POSTLogger(LOGGER_BATCH_SIZE, LOGGER_INTERVAL_MS, url, logLevel, POSTLoggerOptions);
}
