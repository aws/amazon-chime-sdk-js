// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import EventName from './EventName';

/**
 * [[MeetingHistoryState]] describes user actions and events, including all event names
 * in [[EventName]].
 */
type MeetingHistoryState =
  | EventName

  // Device
  | 'audioInputSelected'
  | 'audioInputUnselected'
  | Extract<EventName, 'audioInputFailed'>
  | 'videoInputSelected'
  | 'videoInputUnselected'
  | Extract<EventName, 'videoInputFailed'>

  // Meeting lifecycle
  | Extract<EventName, 'meetingStartRequested'>
  | Extract<EventName, 'meetingStartSucceeded'>
  | Extract<EventName, 'meetingStartFailed'>
  | Extract<EventName, 'meetingEnded'>
  | Extract<EventName, 'meetingFailed'>
  | 'meetingReconnected'

  // Connectivity
  | 'signalingDropped'
  | 'receivingAudioDropped';

export default MeetingHistoryState;
