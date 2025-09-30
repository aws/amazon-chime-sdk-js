// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

type EventName =
  | 'meetingStartRequested'
  | 'meetingStartSucceeded'
  | 'meetingReconnected'
  | 'meetingStartFailed'
  | 'meetingEnded'
  | 'meetingFailed'
  | 'attendeePresenceReceived'
  | 'audioInputSelected'
  | 'audioInputUnselected'
  | 'audioInputFailed'
  | 'videoInputSelected'
  | 'videoInputUnselected'
  | 'videoInputFailed'
  | 'signalingDropped'
  | 'signalingCloseCode'
  | 'signalingCloseReason'
  | 'signalingCloseWasClean'
  | 'receivingAudioDropped'
  | 'sendingAudioFailed'
  | 'sendingAudioRecovered'
  | 'backgroundFilterConfigSelected'
  | 'deviceLabelTriggerFailed';

export default EventName;
