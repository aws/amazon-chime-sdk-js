// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

type EventName =
  | 'audioInputFailed'
  | 'videoInputFailed'
  | 'meetingStartRequested'
  | 'meetingStartSucceeded'
  | 'meetingStartFailed'
  | 'meetingEnded'
  | 'meetingFailed';

export default EventName;
