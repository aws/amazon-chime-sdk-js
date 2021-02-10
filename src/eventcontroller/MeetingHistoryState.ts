// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import EventName from './EventName';

/**
 * [[MeetingHistoryState]] describes user actions and events, including all event names
 * in [[EventName]].
 */
type MeetingHistoryState =
  | EventName

  // Meeting lifecycle
  | 'meetingReconnected'

  // Connectivity
  | 'signalingDropped'
  | 'receivingAudioDropped';

export default MeetingHistoryState;
