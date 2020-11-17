// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import MeetingSessionConfiguration from '../../src/meetingsession/MeetingSessionConfiguration';

describe('MeetingSessionConfiguration', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('constructor', () => {
    it('can take no arguments', () => {
      const configuration = new MeetingSessionConfiguration();
      expect(configuration.credentials).to.be.null;
      expect(configuration.meetingId).to.be.null;
      expect(configuration.urls).to.be.null;
    });

    it('any attribute except mediaplacement can be null', () => {
      const configuration = new MeetingSessionConfiguration(
        {
          MeetingId: 'meeting-id',
          ExternalMeetingId: null,
          MediaPlacement: {
            AudioHostUrl: 'audio-host-url',
            ScreenDataUrl: null,
            ScreenSharingUrl: 'screen-sharing-url',
            ScreenViewingUrl: 'screen-viewing-url',
            SignalingUrl: 'signaling-url',
            TurnControlUrl: 'turn-control-url',
          },
        },
        {
          AttendeeId: 'attendee-id',
          JoinToken: 'join-token',
          ExternalUserId: null,
        }
      );
      expect(configuration.meetingId).to.eq('meeting-id');
      expect(configuration.urls.audioHostURL).to.eq('audio-host-url');
      expect(configuration.credentials.externalUserId).to.eq(null);
    });

    it('any attribute can be empty string', () => {
      const configuration = new MeetingSessionConfiguration(
        {
          MeetingId: '',
          ExternalMeetingId: '',
          MediaPlacement: '',
        },
        {
          AttendeeId: '',
          JoinToken: '',
        }
      );
      expect(configuration.meetingId).to.eq('');
      expect(configuration.urls.audioHostURL).to.eq(undefined);
      expect(configuration.credentials.attendeeId).to.eq('');
      expect(configuration.credentials.externalUserId).to.eq(undefined);
    });

    it('attributes can be undefined', () => {
      const configuration = new MeetingSessionConfiguration(
        {
          MeetingId: 'meeting-id',
          ExternalMeetingId: null,
          MediaPlacement: {
            AudioHostUrl: 'audio-host-url',
            ScreenDataUrl: null,
            ScreenSharingUrl: 'screen-sharing-url',
            ScreenViewingUrl: 'screen-viewing-url',
            SignalingUrl: 'signaling-url',
            TurnControlUrl: 'turn-control-url',
          },
          Region: { RegionPrimary: '', RegionSecondary: [null, undefined] },
        },
        {
          AttendeeId: 'attendee-id',
          JoinToken: 'join-token',
        }
      );
      expect(configuration.meetingId).to.eq('meeting-id');
      expect(configuration.urls.audioHostURL).to.eq('audio-host-url');
      expect(configuration.urls.screenDataURL).to.eq(null);
      expect(configuration.credentials.externalUserId).to.eq(undefined);
    });

    it('can let MediaPlacement have null attributes', () => {
      const configuration = new MeetingSessionConfiguration(
        {
          MeetingId: 'meeting-id',
          MediaPlacement: {
            AudioHostUrl: 'audio-host-url',
            ScreenDataUrl: null,
            ScreenSharingUrl: 'screen-sharing-url',
            ScreenViewingUrl: 'screen-viewing-url',
            SignalingUrl: 'signaling-url',
            TurnControlUrl: 'turn-control-url',
          },
        },
        {
          AttendeeId: 'attendee-id',
          JoinToken: 'join-token',
        }
      );
      expect(configuration.meetingId).to.eq('meeting-id');
      expect(configuration.urls.audioHostURL).to.eq('audio-host-url');
      expect(configuration.urls.screenDataURL).to.eq(null);
      expect(configuration.urls.screenSharingURL).to.eq('screen-sharing-url');
      expect(configuration.urls.screenViewingURL).to.eq('screen-viewing-url');
      expect(configuration.urls.signalingURL).to.eq('signaling-url');
      expect(configuration.urls.turnControlURL).to.eq('turn-control-url');
      expect(configuration.credentials.attendeeId).to.eq('attendee-id');
      expect(configuration.credentials.joinToken).to.eq('join-token');
    });

    it('can take a CreateMeeting and CreateAttendee response object', () => {
      const configuration = new MeetingSessionConfiguration(
        {
          MeetingId: 'meeting-id',
          MediaPlacement: {
            AudioHostUrl: 'audio-host-url',
            ScreenDataUrl: 'screen-data-url',
            ScreenSharingUrl: 'screen-sharing-url',
            ScreenViewingUrl: 'screen-viewing-url',
            SignalingUrl: 'signaling-url',
            TurnControlUrl: 'turn-control-url',
          },
        },
        {
          AttendeeId: 'attendee-id',
          JoinToken: 'join-token',
        }
      );
      expect(configuration.meetingId).to.eq('meeting-id');
      expect(configuration.urls.audioHostURL).to.eq('audio-host-url');
      expect(configuration.urls.screenDataURL).to.eq('screen-data-url');
      expect(configuration.urls.screenSharingURL).to.eq('screen-sharing-url');
      expect(configuration.urls.screenViewingURL).to.eq('screen-viewing-url');
      expect(configuration.urls.signalingURL).to.eq('signaling-url');
      expect(configuration.urls.turnControlURL).to.eq('turn-control-url');
      expect(configuration.credentials.attendeeId).to.eq('attendee-id');
      expect(configuration.credentials.joinToken).to.eq('join-token');
    });

    it('can take a CreateMeeting and CreateAttendee response object root-level values', () => {
      const configuration = new MeetingSessionConfiguration(
        {
          Meeting: {
            MeetingId: 'meeting-id',
            MediaPlacement: {
              AudioHostUrl: 'audio-host-url',
              ScreenDataUrl: 'screen-data-url',
              ScreenSharingUrl: 'screen-sharing-url',
              ScreenViewingUrl: 'screen-viewing-url',
              SignalingUrl: 'signaling-url',
              TurnControlUrl: 'turn-control-url',
            },
          },
        },
        {
          Attendee: {
            AttendeeId: 'attendee-id',
            JoinToken: 'join-token',
          },
        }
      );
      expect(configuration.meetingId).to.eq('meeting-id');
      expect(configuration.urls.audioHostURL).to.eq('audio-host-url');
      expect(configuration.urls.screenDataURL).to.eq('screen-data-url');
      expect(configuration.urls.screenSharingURL).to.eq('screen-sharing-url');
      expect(configuration.urls.screenViewingURL).to.eq('screen-viewing-url');
      expect(configuration.urls.signalingURL).to.eq('signaling-url');
      expect(configuration.urls.turnControlURL).to.eq('turn-control-url');
      expect(configuration.credentials.attendeeId).to.eq('attendee-id');
      expect(configuration.credentials.joinToken).to.eq('join-token');
    });

    it('can take a CreateMeeting and CreateAttendee response object using JAVA SDK', () => {
      const configuration = new MeetingSessionConfiguration(
        {
          meetingId: 'meeting-id',
          mediaPlacement: {
            audioHostUrl: 'audio-host-url',
            screenDataUrl: 'screen-data-url',
            screenSharingUrl: 'screen-sharing-url',
            screenViewingUrl: 'screen-viewing-url',
            signalingUrl: 'signaling-url',
            turnControlUrl: 'turn-control-url',
          },
        },
        {
          attendeeId: 'attendee-id',
          joinToken: 'join-token',
        }
      );
      expect(configuration.meetingId).to.eq('meeting-id');
      expect(configuration.urls.audioHostURL).to.eq('audio-host-url');
      expect(configuration.urls.screenDataURL).to.eq('screen-data-url');
      expect(configuration.urls.screenSharingURL).to.eq('screen-sharing-url');
      expect(configuration.urls.screenViewingURL).to.eq('screen-viewing-url');
      expect(configuration.urls.signalingURL).to.eq('signaling-url');
      expect(configuration.urls.turnControlURL).to.eq('turn-control-url');
      expect(configuration.credentials.attendeeId).to.eq('attendee-id');
      expect(configuration.credentials.joinToken).to.eq('join-token');
    });

    it('can take a CreateMeeting and CreateAttendee response object root-level values using JAVA SDK', () => {
      const configuration = new MeetingSessionConfiguration(
        {
          meeting: {
            meetingId: 'meeting-id',
            mediaPlacement: {
              audioHostUrl: 'audio-host-url',
              screenDataUrl: 'screen-data-url',
              screenSharingUrl: 'screen-sharing-url',
              screenViewingUrl: 'screen-viewing-url',
              signalingUrl: 'signaling-url',
              turnControlUrl: 'turn-control-url',
            },
          },
        },
        {
          attendee: {
            attendeeId: 'attendee-id',
            joinToken: 'join-token',
          },
        }
      );
      expect(configuration.meetingId).to.eq('meeting-id');
      expect(configuration.urls.audioHostURL).to.eq('audio-host-url');
      expect(configuration.urls.screenDataURL).to.eq('screen-data-url');
      expect(configuration.urls.screenSharingURL).to.eq('screen-sharing-url');
      expect(configuration.urls.screenViewingURL).to.eq('screen-viewing-url');
      expect(configuration.urls.signalingURL).to.eq('signaling-url');
      expect(configuration.urls.turnControlURL).to.eq('turn-control-url');
      expect(configuration.credentials.attendeeId).to.eq('attendee-id');
      expect(configuration.credentials.joinToken).to.eq('join-token');
    });

    it('can take an object or array response object root-level values', () => {
      const configuration = new MeetingSessionConfiguration(
        {
          MeetingId: 'meeting-id',
          MediaPlacement: {
            AudioHostUrl: 'audio-host-url',
            ScreenDataUrl: 'screen-data-url',
            ScreenSharingUrl: 'screen-sharing-url',
            ScreenViewingUrl: 'screen-viewing-url',
            SignalingUrl: 'signaling-url',
            TurnControlUrl: 'turn-control-url',
            // adding for defensive coding where an object can take a string or an array
            Region: { RegionPrimary: 'region-1', RegionSecondary: ['region-2', 'region-3'] },
          },
        },
        {
          AttendeeId: 'attendee-id',
          JoinToken: 'join-token',
        }
      );
      expect(configuration.meetingId).to.eq('meeting-id');
      expect(configuration.urls.audioHostURL).to.eq('audio-host-url');
      expect(configuration.urls.screenDataURL).to.eq('screen-data-url');
      expect(configuration.urls.screenSharingURL).to.eq('screen-sharing-url');
      expect(configuration.urls.screenViewingURL).to.eq('screen-viewing-url');
      expect(configuration.urls.signalingURL).to.eq('signaling-url');
      expect(configuration.urls.turnControlURL).to.eq('turn-control-url');
      expect(configuration.credentials.attendeeId).to.eq('attendee-id');
      expect(configuration.credentials.joinToken).to.eq('join-token');
    });

    it('can take an object or array response object root-level values using JAVA SDK', () => {
      const configuration = new MeetingSessionConfiguration(
        {
          meetingId: 'meeting-id',
          mediaPlacement: {
            audioHostUrl: 'audio-host-url',
            screenDataUrl: 'screen-data-url',
            screenSharingUrl: 'screen-sharing-url',
            screenViewingUrl: 'screen-viewing-url',
            signalingUrl: 'signaling-url',
            turnControlUrl: 'turn-control-url',
            // adding for defensive coding where an object can take a string or an array
            region: { regionPrimary: 'region-1', regionSecondary: ['region-2', 'region-3'] },
          },
        },
        {
          attendeeId: 'attendee-id',
          joinToken: 'join-token',
        }
      );
      expect(configuration.meetingId).to.eq('meeting-id');
      expect(configuration.urls.audioHostURL).to.eq('audio-host-url');
      expect(configuration.urls.screenDataURL).to.eq('screen-data-url');
      expect(configuration.urls.screenSharingURL).to.eq('screen-sharing-url');
      expect(configuration.urls.screenViewingURL).to.eq('screen-viewing-url');
      expect(configuration.urls.signalingURL).to.eq('signaling-url');
      expect(configuration.urls.turnControlURL).to.eq('turn-control-url');
      expect(configuration.credentials.attendeeId).to.eq('attendee-id');
      expect(configuration.credentials.joinToken).to.eq('join-token');
    });
  });
});
