// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MeetingHistoryState from '../eventcontroller/MeetingHistoryState';

/**
 * [[EventData]] describes an event information.
 */
export default interface EventData {
  /**
   * Name of an event with the [[MeetingHistoryState]] type.
   * For example, "signalingDropped", "meetingReconnected", "meetingStartRequested".
   */
  name: MeetingHistoryState;
  /**
   * Event generated timestamp in milliseconds.
   */
  ts: number;
  /**
   * Event attributes to provide extra information with an event.
   */
  attributes?: { [key: string]: string | number };
}
