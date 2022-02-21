// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export enum MeetingSessionStatusCode {
  /**
   * Everything is OK so far.
   */
  OK,

  /**
   * The attendee left the meeting normally.
   */
  Left,

  /**
   * The attendee joined from another device.
   */
  AudioJoinedFromAnotherDevice,

  /**
   * Authentication was rejected. The client is not allowed on this meeting.
   */
  AudioAuthenticationRejected,

  /**
   * The client can not join because the meeting is at capacity.
   */
  AudioCallAtCapacity,

  /**
   * The attendee attempted to join a meeting that has already ended.
   */
  MeetingEnded,

  /**
   * There was an internal server error with the audio leg.
   */
  AudioInternalServerError,

  /**
   * Could not connect the audio leg due to the service being unavailable.
   */
  AudioServiceUnavailable,

  /**
   * The audio leg failed.
   */
  AudioDisconnected,

  /**
   * The client has asked to send and receive video, but it is only possible to
   * continue in view-only mode (receiving video). This should be handled by
   * explicitly switching to view-only mode.
   */
  VideoCallSwitchToViewOnly,

  /**
   * This can happen when you attempt to join a video meeting in "send only" mode
   * (transmitting your camera, but not receiving anything -- this isn't something
   * we ever do in practice, but it is supported on the server). It should be
   * treated as "fatal" and probably should not be retried (despite the 5xx nature).
   */
  VideoCallAtSourceCapacity,

  /**
   * The Chime SDK for JavaScript failed to establish a signaling connection because
   * you or someone else deleted the attendee using the DeleteAttendee API action
   * in your server application. You also should not use the attendee response from
   * the ended meeting that you created with the same ClientRequestToken parameter
   * before.
   * https://docs.aws.amazon.com/chime/latest/APIReference/API_DeleteAttendee.html
   */
  SignalingBadRequest,

  /**
   * The Chime SDK for JavaScript failed to establish a signaling connection to the Chime
   * backend due to an internal server error.
   */
  SignalingInternalServerError,

  /**
   * Received unknown signaling error frame
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
   * Due to connection health, a reconnect has been triggered.
   */
  ConnectionHealthReconnect,

  /**
   * The realtime API failed in some way. This indicates a fatal problem.
   */
  RealtimeApiFailed,

  /**
   * A task failed for an unknown reason.
   */
  TaskFailed,

  /**
   * Session update produces incompatible SDP.
   */
  IncompatibleSDP,

  /**
   * This can happen when you attempt to join a meeting which has ended or attendee got removed
   */
  TURNCredentialsForbidden,

  /**
   * The attendee is not present.
   */
  NoAttendeePresent,

  /**
   * The meeting was ended because the attendee has been removed.
   */
  AudioAttendeeRemoved,
}

export default MeetingSessionStatusCode;
