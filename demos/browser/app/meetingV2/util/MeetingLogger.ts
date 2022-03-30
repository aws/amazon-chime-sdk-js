// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  LogLevel,
  MeetingSessionConfiguration,
  POSTLogger,
  POSTLoggerOptions,
} from 'amazon-chime-sdk-js';

export function getPOSTLogger(
  meetingSessionConfiguration: MeetingSessionConfiguration,
  appName: string,
  url: string,
  logLevel: LogLevel
) {
  const options: POSTLoggerOptions = {
    url,
    logLevel,
    metadata: {
      appName,
      meetingId: meetingSessionConfiguration.meetingId,
      attendeeId: meetingSessionConfiguration.credentials.attendeeId,
    },
  };
  return new POSTLogger(options);
}
