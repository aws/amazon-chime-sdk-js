// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ApplicationMetadata from '../applicationmetadata/ApplicationMetadata';
import ConnectionHealthPolicyConfiguration from '../connectionhealthpolicy/ConnectionHealthPolicyConfiguration';
import VideoQualitySettings from '../devicecontroller/VideoQualitySettings';
import { toLowerCasePropertyNames } from '../utils/Utils';
import VideoDownlinkBandwidthPolicy from '../videodownlinkbandwidthpolicy/VideoDownlinkBandwidthPolicy';
import VideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';
import MeetingFeatures from './MeetingFeatures';
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
   * Feature flag to enable scalable video coding (SVC) on supported browsers, which is determined by `BrowserBehavior.supportsScalableVideoCoding`
   */
  enableSVC: boolean = false;

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
   * The Amazon Chime SDK media backends currently send a keyframe request to content share senders every 10 seconds to help mitigate
   * decoder issues on receivers. This flag requests the backed to disable that feature.
   *
   * Setting this flag to true may or may not lead to issues with content received for your application, as it depends on browsers used
   * and whether they have fixed previous issues leading to the introduction of this periodic keyframe request. It will however
   * reduce CPU consumption on content senders which no longer have to generate as many expensive keyframes.
   */
  disablePeriodicKeyframeRequestOnContentSender: boolean = false;

  /**
   * Additional features in the meeting
   */
  meetingFeatures: MeetingFeatures = new MeetingFeatures();

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
   *      },
   *      "MeetingFeatures":{
   *        "Audio":"...",
   *        "Video":"....",
   *        "Content":"...",
   *        "Attendee":"..."
   *      },
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

      const parseVideoResolution = (
        resolution: string,
        defaultValue: VideoQualitySettings
      ): VideoQualitySettings => {
        switch (resolution) {
          case 'None':
            return VideoQualitySettings.VideoDisabled;
          case 'HD':
            return VideoQualitySettings.VideoResolutionHD;
          case 'FHD':
            return VideoQualitySettings.VideoResolutionFHD;
          case 'UHD':
            return VideoQualitySettings.VideoResolutionUHD;
          default:
            return defaultValue;
        }
      };
      if (
        createMeetingResponse.meetingfeatures?.video !== undefined ||
        createMeetingResponse.meetingfeatures?.content !== undefined
      ) {
        const videoMaxResolution =
          createMeetingResponse.meetingfeatures.video === undefined
            ? 'HD'
            : createMeetingResponse.meetingfeatures.video.maxresolution;
        const contentMaxResolution =
          createMeetingResponse.meetingfeatures.content === undefined
            ? 'FHD'
            : createMeetingResponse.meetingfeatures.content.maxresolution;
        this.meetingFeatures = new MeetingFeatures(
          parseVideoResolution(videoMaxResolution, VideoQualitySettings.VideoResolutionHD),
          parseVideoResolution(contentMaxResolution, VideoQualitySettings.VideoResolutionFHD)
        );
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
