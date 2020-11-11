// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MeetingSessionCredentials]] includes the credentials used to authenticate
 * the attendee on the meeting
 */
export default class MeetingSessionCredentials {
  /**
   * The attendee id for these credentials.
   */
  attendeeId: string | null = null;

  /**
   * The external user id associated with the attendee.
   */
  externalUserId: string | null = null;

  /**
   * If set, the session will be authenticated with a join token.
   */
  joinToken: string | null = null;

  /**
   * Overrides JSON serialization so that join token is redacted.
   */
  toJSON(): { [id: string]: string } {
    return {
      attendeeId: this.attendeeId,
      joinToken: this.joinToken === null ? null : '<redacted>',
    };
  }
}
