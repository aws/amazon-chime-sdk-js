// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import RealtimeAttendeePositionInFrame from './RealtimeAttendeePositionInFrame';

/**
 * Realtime attendee presence callback that listens to changes in attendee presence.
 */
type RealtimeSubscribeToAttendeeIdPresenceCallback =
  /**
   * @param attendeeId Internal Amazon Chime `AttendeeId` created by [`CreateAttendee`](https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateAttendee.html) API.
   *
   * @param present Indicates the attendee's presence in a meeting.
   *
   * @param externalUserId Indicates the attendee's `externalUserId` provided while joining a meeting.
   *
   * @param dropped Indicates whether the attendee dropped from the meeting.
   *
   * The Amazon Chime SDK for JavaScript reconnects a meeting session in below scenarios:
   *
   * - No audio packets (WebRTC)
   * - Bad audio delay (WebRTC)
   * - No pong reply (WebSocket)
   *
   * This value is provided by the Amazon Chime backend when an attendee is dropped and could not join the same meeting again due to re-connection issues.
   * It is also provided to differentiate the scenarios between normal attendee leave and the attendee dropping due to re-connection issues.
   *
   * In re-connection scenarios, if an attendee drops and could never join back successfully, the JS SDK will call this callback setting
   * the `dropped` value to a boolean value received from Amazon Chime backend, and it will set the `present` parameter to `false`.
   *
   * @param posInFrame This object indicates which attendee out of how many total attendees the update is for.
   * For example, if you were to join on a call with 3 total attendees, you would get presence callbacks for attendeeIndex 0, attendeeIndex 1, attendeeIndex 2 out of the total attendeesInFrame of 3.
   * You will receive callback for each attendee present in the meeting after you join the meeting. Later, you will receive callback as attendees leave or join the meeting.
   */
  (
    attendeeId: string,
    present: boolean,
    externalUserId?: string,
    dropped?: boolean,
    posInFrame?: RealtimeAttendeePositionInFrame | null
  ) => void;

export default RealtimeSubscribeToAttendeeIdPresenceCallback;
