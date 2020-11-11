// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[RealtimeAttendeePositionInFrame]] information about the attendee's place in the frame.
 */
export default class RealtimeAttendeePositionInFrame {
  /**
   * Index of attendee update in the frame starting at zero
   */
  attendeeIndex: number | null = null;

  /**
   * Number of total attendee updates in the frame
   */
  attendeesInFrame: number | null = null;
}
