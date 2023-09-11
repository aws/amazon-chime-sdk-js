// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MeetingSessionStatusCode]] gives the underlying reason for a given [[MeetingSessionStatus]]. Though some codes are used for
 * [[MeetingSessionStatus]] internally, the primary use of these is in `AudioVideoObserver.audioVideoDidStop`, and their docstrings
 * will be specific to that usage. Other functions that use [[MeetingSessionStatus]] (mainly
 * `AudioVideoControllerFacade.promoteToPrimaryMeeting` and `AudioVideoObserver.audioVideoWasDemotedFromPrimaryMeeting` will document
 * their usage separately).
 *
 * These status codes can be used for logging, debugging, and notification to end users, but in most cases should not
 * be used for any retry behavior, as the audio video controller will already be retrying non-terminal errors (i.e. regardless
 * of `MeetingSessionStatus.isTerminal`, your application should not try to immediately restart or recreate the
 * audio video controller). For error codes that indicate issues with the Chime service, please create a github issue
 * with browser logs if they occur frequently.
 *
 * If `MeetingSessionStatus.isTerminal` returns `true`, you should remove any meeting UX in addition to notifying the user,
 * as the audio video controller will not be retrying the connection. When notifying users, more general failure messages are
 * recommended unless otherwise noted.
 */
export enum MeetingSessionStatusCode {
  /**
   * There is no error. This code is used internally but will never be returned by `audioVideoDidStop`
   */
  OK,

  /**
   * The attendee left the meeting normally via `AudioVideoConftrollerFacade.stop`
   */
  Left,

  /**
   * The attendee joined from another device (e.g. another browser window/tab or on mobile) using the
   * same credentials. `Audio` prefix is irrelevant. The end-user may want to be notified of this
   * type of error.
   *
   * This also can occur if your application unintentionally creates two meeting sessions.
   */
  AudioJoinedFromAnotherDevice,

  /**
   * Authentication was rejected as the attendee information in `MeetingSessionCredentials` did
   * not match that of an attendee created via `chime::CreateAttendee`.
   *
   * This error may imply an issue with your credential providing service. The `Audio` prefix is irrelevant.
   */
  AudioAuthenticationRejected,

  /**
   * The client can not join because the meeting is at capacity. The service supports up to 250 attendees. The
   * end user may want to be notified of this type of error. The `Audio` prefix is irrelevant.
   */
  AudioCallAtCapacity,

  /**
   * The attendee attempted to join a meeting that has already ended. See
   * [this FAQ](https://aws.github.io/amazon-chime-sdk-js/modules/faqs.html#when-does-an-amazon-chime-sdk-meeting-end)
   * for more information. The end user may want to be notified of this type of error.
   */
  MeetingEnded,

  /**
   * There was an internal server error related to audio. This may indicate some issue with the audio device, or an issue with
   * the Amazon Chime SDK service itself.
   */
  AudioInternalServerError,

  /**
   * There was an internal server error related to audio. This may indicate some issue with the audio device, or an issue with
   * the Amazon Chime SDK service itself.
   */
  AudioServiceUnavailable,

  /**
   * There was an internal server error related to audio. This may indicate some issue with the audio device, or an issue with
   * the Amazon Chime SDK service itself.
   */
  AudioDisconnected,

  /**
   * This is only used internally and will not be provided in any `audioVideoDidStop` calls.
   *
   * The client has asked to send and receive video, but it is only possible to
   * continue in view-only mode (receiving video). This should be handled by
   * explicitly switching to view-only mode.
   */
  VideoCallSwitchToViewOnly,

  /**
   * This is only used internally and will not be provided in any `audioVideoDidStop` calls.
   *
   * This can happen when you attempt to join a video meeting in "send only" mode
   * (transmitting your camera, but not receiving anything -- this isn't something
   * we ever do in practice, but it is supported on the server). It should be
   * treated as "fatal" and probably should not be retried (despite the 5xx nature).
   */
  VideoCallAtSourceCapacity,

  /**
   * The Amazon Chime SDK for JavaScript failed to establish a signaling connection because
   * you or someone else deleted the attendee using the
   * [DeleteAttendee](https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_DeleteAttendee.html)
   * API action in your server application. You also should not use the attendee response from
   * the ended meeting that you created with the same ClientRequestToken parameter
   * before.
   */
  SignalingBadRequest,

  /**
   * The Chime SDK for JavaScript either failed to establish a signaling connection to the Chime
   * backend due to an internal server error or the connection was lost mid-call.
   *
   * This may indicate an issue with the Chime service, but also often indicates a network issue impacting the end user,
   * who may want to be notified of their unstable network during the reconnection.
   */
  SignalingInternalServerError,

  /**
   * Received unknown signaling error frame without a status. This code is nearly impossible to occur
   * and indicates an issue with the Chime service.
   */
  SignalingRequestFailed,

  /**
   * Timed out gathering ICE candidates. If in Chrome, this could be an
   * indication that the browser is in a bad state due to a VPN reconnect and
   * the user should try quitting and relaunching the app. See:
   * https://bugs.chromium.org/p/webrtc/issues/detail?id=9097
   */
  ICEGatheringTimeoutWorkaround,

  /**
   * Due to connection health as determined by [[ConnectionHealthPolicyConfiguration]], a reconnect has been triggered.
   */
  ConnectionHealthReconnect,

  /**
   * The [[RealtimeController]] failed in some way. This indicates an issue with the callback function provided to RealtimeController APIs (e.g. a callback is throwing an error).
   */
  RealtimeApiFailed,

  /**
   * A step in the connection to the Amazon Chime SDK backends failed without a more specific reason. This may indicate end-user connection issues
   * and should be retried.
   */
  TaskFailed,

  /**
   * There was an issue with media negotiation. This may indicate an issue with Amazon Chime SDK, or that the end user is using an unsupported
   * browser. Please use `new DefaultBrowserBehavior().isSupported()` pre-call to check the support of end-user browsers
   * and warn them of possible issues.
   */
  IncompatibleSDP,

  /**
   * This can happen when you attempt to join a meeting which has ended or attendee got removed. This is analogous to `MeetingEnded` except
   * determined through the media channel rather then the signaling channel.
   */
  TURNCredentialsForbidden,

  /**
   * The attendee did not show up on the roster. This may indicate an issue with the end user audio device or and issue with Amazon Chime SDK.
   */
  NoAttendeePresent,

  /**
   * The session was ended because the attendee has been removed via `chime::DeleteAttendee`. The end user may want to be notified
   * of this error.
   */
  AudioAttendeeRemoved,

  /**
   * This is only used in promotion functions and will not be provided in any `audioVideoDidStop` calls.
   *
   * The attendees Primary meeting credentials have been revoked or deleted.
   */
  AudioVideoWasRemovedFromPrimaryMeeting,

  /**
   * This is only used internally and will not be provided in any `audioVideoDidStop` calls.
   *
   * Reserved.
   */
  AudioDisconnectAudio,

  /**
   * The websocket signalling channel was closed unexpectedly mid-meeting. This may be due to:
   * * A client side network change, e.g. switching WiFi networks (most typical).
   * * A backend detecting client side issues (e.g. decryption issues), and snapping
   *   the connection to force a reconnection.
   * * Unexpected backend issues, e.g. AWS networking issues.
   * The latter two are less common.
   */
  SignalChannelClosedUnexpectedly,
}

export default MeetingSessionStatusCode;
