// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class CreateMeetingResponseMock {
  static readonly MeetingResponseMock: unknown = {
    Meeting: {
      MeetingId: '123456',
      MediaPlacement: {
        AudioHostUrl: 'wss://audiohost/control/123456',
        ScreenDataUrl: 'wss://hostscreendatausl/123456',
        ScreenSharingUrl: 'wss://hostscreensharingurl/123456',
        ScreenViewUrl: '',
        SignalingUrl: 'wss://signalurl/control/123456',
        TurnControlUrl: '',
      },
    },
  };

  static readonly AttendeeResponseMock: unknown = {
    Attendee: {
      ExternalUserId: 'leave',
      AttendeeId: 'join',
      JoinToken: 'can',
    },
  };
}
