// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MeetingSessionCredentials]] includes the credentials used to authenticate
 * the attendee on the meeting
 */
export default class MeetingSessionCredentials {
  /**
   * The attendee id for these credentials.
   */
  attendeeId: string | null;

  /**
   * If set, the session will be authenticated with a join token.
   */
  joinToken: string | null;
}
