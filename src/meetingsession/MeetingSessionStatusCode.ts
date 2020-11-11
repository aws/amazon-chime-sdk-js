// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export enum MeetingSessionStatusCode {
  /**
   * Everything is OK so far.
   */
  OK = 0,

  /**
   * The attendee left the meeting normally.
   */
  Left = 1,

  /**
   * The attendee joined from another device.
   */
  AudioJoinedFromAnotherDevice = 2,

  /**
   * The attendee should explicitly switch itself from joined with audio to
   * checked-in.
   */
  AudioDisconnectAudio = 3,

  /**
   * Authentication was rejected. The client is not allowed on this meeting.
   */
  AudioAuthenticationRejected = 4,

  /**
   * The client can not join because the meeting is at capacity.
   */
  AudioCallAtCapacity = 5,

  /**
   * Deprecated. The meeting has ended. This is a legacy alias for MeetingEnded and will
   * be removed in v2.0.0.
   */
  AudioCallEnded = 6,

  /**
   * Deprecated. The meeting has ended. This is a legacy alias for MeetingEnded and will
   * be removed in v2.0.0.
   */
  TURNMeetingEnded = 6,

  /**
   * The meeting has ended.
   */
  MeetingEnded = 6,

  /**
   * There was an internal server error with the audio leg.
   */
  AudioInternalServerError = 7,

  /**
   * Could not connect the audio leg due to the service being unavailable.
   */
  AudioServiceUnavailable = 8,

  /**
   * The audio leg failed.
   */
  AudioDisconnected = 9,

  /**
   * The client has asked to send and receive video, but it is only possible to
   * continue in view-only mode (receiving video). This should be handled by
   * explicitly switching to view-only mode.
   */
  VideoCallSwitchToViewOnly = 10,

  /** This can happen when you attempt to join a video meeting in "send only" mode
  (transmitting your camera, but not receiving anything -- this isn't something
  we ever do in practice, but it is supported on the server). It should be
  treated as "fatal" and probably should not be retried (despite the 5xx nature). */
  VideoCallAtSourceCapacity = 11,

  /**
   * Bad request on JOIN or SUBSCRIBE
   */
  SignalingBadRequest = 12,

  /**
   * Internal server error on JOIN or SUBSCRIBE
   */
  SignalingInternalServerError = 13,

  /**
   * Received unknown signaling error frame
   */
  SignalingRequestFailed = 14,

  /**
   * Failed to transition between two states for some reason
   */
  StateMachineTransitionFailed = 15,

  /**
   * Timed out gathering ICE candidates. If in Chrome, this could be an
   * indication that the browser is in a bad state due to a VPN reconnect and
   * the user should try quitting and relaunching the app. See:
   * https://bugs.chromium.org/p/webrtc/issues/detail?id=9097
   */
  ICEGatheringTimeoutWorkaround = 16,

  /**
   * Due to connection health, a reconnect has been triggered.
   */
  ConnectionHealthReconnect = 17,

  /**
   * The realtime API failed in some way. This indicates a fatal problem.
   */
  RealtimeApiFailed = 18,

  /**
   * A task failed for an unknown reason.
   */
  TaskFailed = 19,

  /**
   * Audio device has switched.
   */
  AudioDeviceSwitched = 20,

  /**
   * Session update produces incompatible SDP.
   */
  IncompatibleSDP = 21,

  /**
   * This can happen when you attempt to join a meeting which has ended or attendee got removed
   */
  TURNCredentialsForbidden = 22,

  /**
   * The attendee is not present.
   */
  NoAttendeePresent = 23,
}

export default MeetingSessionStatusCode;
