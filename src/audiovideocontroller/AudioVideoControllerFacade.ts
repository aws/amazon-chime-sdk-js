// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioProfile from '../audioprofile/AudioProfile';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import MeetingSessionCredentials from '../meetingsession/MeetingSessionCredentials';
import MeetingSessionStatus from '../meetingsession/MeetingSessionStatus';
import VideoSource from '../videosource/VideoSource';

export default interface AudioVideoControllerFacade {
  addObserver(observer: AudioVideoObserver): void;
  removeObserver(observer: AudioVideoObserver): void;

  /**
   * Start the meeting session. By default this will connect and begin sending
   * and receiving audio, depending on the implementation.
   *
   * This method also allows you to provide options for how connection occurs.
   *
   * The only supported option is `signalingOnly`. Specifying this option will
   * cause the controller to only connect the meeting signaling channel. This
   * can be performed relatively early in the join lifecycle (_e.g._, prior to
   * choosing audio devices), which can improve join latency.
   *
   * Your code is responsible for calling `start` again without `signalingOnly`
   * to complete connection.
   *
   * @param options Passing `signalingOnly: true` will cause only the initial signaling connection to occur.
   */
  start(options?: { signalingOnly?: boolean }): void;
  stop(): void;
  /**
   * This API will be deprecated in favor of `ClientMetricReport.getRTCStatsReport()`.
   *
   * It makes an additional call to the `getStats` API and therefore may cause slight performance degradation.
   *
   * Please subscribe to `metricsDidReceive(clientMetricReport: ClientMetricReport)` callback,
   * and get the raw `RTCStatsReport` via `clientMetricReport.getRTCStatsReport()`.
   */
  getRTCPeerConnectionStats(selector?: MediaStreamTrack): Promise<RTCStatsReport>;
  /**
   * Get all the remote video sending sources.
   */
  getRemoteVideoSources(): VideoSource[];

  /**
   * Sets the audio profile to use for audio. The new audio profile takes effect
   * on the next call to `start` or if already started, upon the next reconnect.
   */
  setAudioProfile(audioProfile: AudioProfile): void;

  /**
   * Allows an attendee in a Replica meeting to immediately transition to a Primary meeting attendee
   * without need for reconnection. The promise should always return a session status
   * even upon failure (i.e. it should never reject). See the guide for more information.
   *
   * The resolved `MeetingSessionStatus` will contain a `MeetingSessionStatusCode` of the following:
   *
   * * `MeetingSessionStatusCode.OK`: The promotion was successful (i.e. session token was valid,
   *   there was room in the Primary meeting, etc.), audio will begin flowing
   *   and the attendee can begin to send data messages, and content/video if the call is not already at limit.
   * * `MeetingSessionStatusCode.AudioAuthenticationRejected`: Credentials provided
   *   were invalid when connection attempted to Primary meeting. There may be an issue
   *   with your mechanism which allocates the Primary meeting attendee for the Replica
   *   meeting proxied promotion.  This also may indicate that this API was called in a
   *   non-Replica meeting.
   * * `MeetingSessionStatusCode.AudioCallAtCapacity`: Credentials provided were correct
   *   but there was no room in the Primary meeting.  Promotions to Primary meeting attendee take up a slot, just like
   *   regular Primary meeting attendee connections and are limited by the same mechanisms.
   * * `MeetingSessionStatusCode.SignalingBadRequest` or `MeetingSessionStatusCode.SignalingInternalServerError`:
   *   Other failure, possibly due to disconnect or timeout. These failures are likely retryable.
   *
   * Application code may also receive a callback on `AudioVideoObserver.videoAvailabilityDidChange` to indicate they
   * can begin to share video.
   *
   * `chime::DeleteAttendee` on the Primary meeting attendee will result in `AudioVideoObserver.audioVideoWasDemotedFromPrimaryMeeting`
   * to indicate the attendee is no longer able to share.
   *
   * Any disconnection will trigger an automatic demotion to avoid unexpected or unwanted promotion state on reconnection.
   * If the attendee still needs to be an interactive participant in the Primary meeting, `promoteToPrimaryMeeting`
   * should be called again with the same credentials.
   *
   * This function should not be called until the first one resolves.
   *
   * @param credentials The credentials for the Primary meeting.  This needs to be obtained out of band.
   * @returns Promise which resolves to a session status for the request. See possible options above.
   */
  promoteToPrimaryMeeting(credentials: MeetingSessionCredentials): Promise<MeetingSessionStatus>;

  /**
   * Remove the promoted attendee from the Primary meeting. This client will stop sharing audio, video, and data messages.
   * This will revert the end-user to precisely the state they were before a call to `promoteToPrimaryMeeting`
   *
   * This will have no effect if there was no previous successful call to `promoteToPrimaryMeeting`. This
   * may result in `AudioVideoObserver.audioVideoWasDemotedFromPrimaryMeeting` but there is no need to wait for that callback
   * to revert UX, etc.
   */
  demoteFromPrimaryMeeting(): void;
}
