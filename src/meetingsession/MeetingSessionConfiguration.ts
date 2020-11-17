// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ConnectionHealthPolicyConfiguration from '../connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import AllHighestVideoBandwidthPolicy from '../videodownlinkbandwidthpolicy/AllHighestVideoBandwidthPolicy';
import VideoDownlinkBandwidthPolicy from '../videodownlinkbandwidthpolicy/VideoDownlinkBandwidthPolicy';
import NScaleVideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy';
import VideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';
import MeetingSessionCredentials from './MeetingSessionCredentials';
import MeetingSessionURLs from './MeetingSessionURLs';

/**
 * [[MeetingSessionConfiguration]] contains the information necessary to start
 * a session.
 */
export default class MeetingSessionConfiguration {
  /**
   * The id of the meeting the session is joining.
   */
  meetingId: string | null = null;

  /**
   * The external meeting id of the meeting the session is joining.
   */
  externalMeetingId: string | null = null;

  /**
   * The credentials used to authenticate the session.
   */
  credentials: MeetingSessionCredentials | null = null;

  /**
   * The URLs the session uses to reach the meeting service.
   */
  urls: MeetingSessionURLs | null = null;

  /**
   * Maximum amount of time in milliseconds to allow for connecting.
   */
  connectionTimeoutMs: number = 15000;

  /**
   * Maximum amount of time in milliseconds to allow for a screen sharing connection.
   */
  screenSharingTimeoutMs: number = 5000;

  /**
   * Maximum amount of time in milliseconds to allow for a screen viewing connection.
   */
  screenViewingTimeoutMs: number = 5000;

  /**
   * Maximum amount of time in milliseconds to wait for the current attendee to be present
   * after initial connection.
   */
  attendeePresenceTimeoutMs: number = 0;

  /**
   * Configuration for connection health policies: reconnection, unusable audio warning connection,
   * and signal strength bars connection.
   */
  connectionHealthPolicyConfiguration: ConnectionHealthPolicyConfiguration = new ConnectionHealthPolicyConfiguration();

  /**
   * Feature flag to enable Chromium-based browsers
   */
  enableUnifiedPlanForChromiumBasedBrowsers: boolean = true;

  /**
   * Feature flag to enable Simulcast
   */
  enableSimulcastForUnifiedPlanChromiumBasedBrowsers: boolean = false;

  /**
   * Video downlink bandwidth policy to determine which remote videos
   * are subscribed to.
   */
  videoDownlinkBandwidthPolicy: VideoDownlinkBandwidthPolicy = null;

  /**
   * Video uplink bandwidth policy to determine the bandwidth constraints
   * of the local video.
   */
  videoUplinkBandwidthPolicy: VideoUplinkBandwidthPolicy = null;

  /**
   * Constructs a MeetingSessionConfiguration optionally with a chime:CreateMeeting and
   * chime:CreateAttendee response. You can pass in either a JSON object containing the
   * responses, or a JSON object containing the information in the Meeting and Attendee
   * root-level fields. Examples:
   *
   * ```
   * const configuration = new MeetingSessionConfiguration({
   *   "Meeting": {
   *      "MeetingId": "...",
   *      "MediaPlacement": {
   *        "AudioHostUrl": "...",
   *        "ScreenDataUrl": "...",
   *        "ScreenSharingUrl": "...",
   *        "ScreenViewingUrl": "...",
   *        "SignalingUrl": "...",
   *        "TurnControlUrl": "..."
   *      }
   *    }
   *   }
   * }, {
   *   "Attendee": {
   *     "ExternalUserId": "...",
   *     "AttendeeId": "...",
   *     "JoinToken": "..."
   *   }
   * });
   * ```
   *
   * ```
   * const configuration = new MeetingSessionConfiguration({
   *   "MeetingId": "...",
   *   "MediaPlacement": {
   *     "AudioHostUrl": "...",
   *     "ScreenDataUrl": "...",
   *     "ScreenSharingUrl": "...",
   *     "ScreenViewingUrl": "...",
   *     "SignalingUrl": "...",
   *     "TurnControlUrl": "..."
   *   }
   * }, {
   *   "ExternalUserId": "...",
   *   "AttendeeId": "...",
   *   "JoinToken": "..."
   * });
   * ```
   */
  constructor(createMeetingResponse?: any, createAttendeeResponse?: any) { // eslint-disable-line
    if (createMeetingResponse) {
      createMeetingResponse = this.toLowerCasePropertyNames(createMeetingResponse);
      if (createMeetingResponse.meeting) {
        createMeetingResponse = createMeetingResponse.meeting;
      }
      this.meetingId = createMeetingResponse.meetingid;
      this.externalMeetingId = createMeetingResponse.externalmeetingid;
      this.urls = new MeetingSessionURLs();
      this.urls.audioHostURL = createMeetingResponse.mediaplacement.audiohosturl;
      this.urls.screenDataURL = createMeetingResponse.mediaplacement.screendataurl;
      this.urls.screenSharingURL = createMeetingResponse.mediaplacement.screensharingurl;
      this.urls.screenViewingURL = createMeetingResponse.mediaplacement.screenviewingurl;
      this.urls.signalingURL = createMeetingResponse.mediaplacement.signalingurl;
      this.urls.turnControlURL = createMeetingResponse.mediaplacement.turncontrolurl;
    }
    if (createAttendeeResponse) {
      createAttendeeResponse = this.toLowerCasePropertyNames(createAttendeeResponse);
      if (createAttendeeResponse.attendee) {
        createAttendeeResponse = createAttendeeResponse.attendee;
      }
      this.credentials = new MeetingSessionCredentials();
      this.credentials.attendeeId = createAttendeeResponse.attendeeid;
      this.credentials.externalUserId = createAttendeeResponse.externaluserid;
      this.credentials.joinToken = createAttendeeResponse.jointoken;
    }

    // simulcast feature flag will override the following policies when DefaultAudioVideoController is created
    this.videoDownlinkBandwidthPolicy = new AllHighestVideoBandwidthPolicy(
      this.credentials ? this.credentials.attendeeId : null
    );
    this.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy(
      this.credentials ? this.credentials.attendeeId : null
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toLowerCasePropertyNames(input: any): any {
    if (input === null) {
      return null;
    } else if (typeof input !== 'object') {
      return input;
    } else if (Array.isArray(input)) {
      return input.map(this.toLowerCasePropertyNames);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.keys(input).reduce((result: any, key: string) => {
      const value = input[key];
      const newValue = typeof value === 'object' ? this.toLowerCasePropertyNames(value) : value;
      result[key.toLowerCase()] = newValue;
      return result;
    }, {});
  }
}
