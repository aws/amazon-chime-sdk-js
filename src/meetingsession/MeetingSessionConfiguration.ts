// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ApplicationMetadata from '../applicationmetadata/ApplicationMetadata';
import ConnectionHealthPolicyConfiguration from '../connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import { toLowerCasePropertyNames } from '../utils/Utils';
import VideoDownlinkBandwidthPolicy from '../videodownlinkbandwidthpolicy/VideoDownlinkBandwidthPolicy';
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
   * Maximum amount of time in milliseconds to allow for reconnecting.
   */
  reconnectTimeoutMs = 120 * 1000;

  /**
   * Fixed wait amount in milliseconds between reconnecting attempts.
   */
  reconnectFixedWaitMs = 0;

  /**
   * The short back-off time in milliseconds between reconnecting attempts.
   */
  reconnectShortBackOffMs = 1 * 1000;

  /**
   * The long back-off time in milliseconds between reconnecting attempts.
   */
  reconnectLongBackOffMs = 5 * 1000;

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
   * Builder's application metadata such as application name or version.
   * This is an optional parameter. Please check [[ApplicationMetadata]] for more information.
   */
  applicationMetadata: ApplicationMetadata;

  /**
   * Keep the last frame of the video when a remote video is paused via the pauseVideoTile API.
   * This is done by not clearing the srcObject property of the videoElement.
   */
  keepLastFrameWhenPaused: boolean = false;

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
      createMeetingResponse = toLowerCasePropertyNames(createMeetingResponse);
      if (createMeetingResponse.meeting) {
        createMeetingResponse = createMeetingResponse.meeting;
      }
      this.meetingId = createMeetingResponse.meetingid;
      this.externalMeetingId = createMeetingResponse.externalmeetingid;
      this.urls = new MeetingSessionURLs();
      this.urls.audioHostURL = createMeetingResponse.mediaplacement.audiohosturl;
      this.urls.signalingURL = createMeetingResponse.mediaplacement.signalingurl;
      this.urls.turnControlURL = createMeetingResponse.mediaplacement.turncontrolurl;
      if (createMeetingResponse.mediaplacement.eventingestionurl) {
        this.urls.eventIngestionURL = createMeetingResponse.mediaplacement.eventingestionurl;
      }
    }
    if (createAttendeeResponse) {
      createAttendeeResponse = toLowerCasePropertyNames(createAttendeeResponse);
      if (createAttendeeResponse.attendee) {
        createAttendeeResponse = createAttendeeResponse.attendee;
      }
      this.credentials = new MeetingSessionCredentials();
      this.credentials.attendeeId = createAttendeeResponse.attendeeid;
      this.credentials.externalUserId = createAttendeeResponse.externaluserid;
      this.credentials.joinToken = createAttendeeResponse.jointoken;
    }
  }
}
