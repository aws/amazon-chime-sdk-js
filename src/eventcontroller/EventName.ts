// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

type EventName =
  | 'meetingStartRequested'
  | 'meetingStartSucceeded'
  | 'meetingStartFailed'
  | 'meetingEnded'
  | 'meetingFailed'
  | 'attendeePresenceReceived'
  | 'audioInputSelected'
  | 'audioInputUnselected'
  | 'audioInputFailed'
  | 'videoInputSelected'
  | 'videoInputUnselected'
  | 'videoInputFailed';

export default EventName;
