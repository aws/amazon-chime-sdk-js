// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[SignalingClientVideoSubscriptionConfiguration]] contains a mapping of MID to parameters for customize what remote video is received and how,
 * on an individual stream level. This can be used to update remote video sessions set up through `subscribe`
 */
export default class SignalingClientVideoSubscriptionConfiguration {
  // These comments should be kept in sync with SignalingProtocol
  /**
   * Associated MID for this configuration, i.e. the key in the flat map when a list of [[SignalingClientVideoSubscriptionConfiguration]] is provided.
   *
   * See https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpTransceiver/mid for more details.
   */
  mid?: string;

  /**
   * If stream_id is not set but attendee_id is we will fill video session with
   * any of the given attendee's simulcast streams (given other constraints
   * possibly provided in the future), with preference to the highest quality.
   *
   * If stream_id and attendee_id is set, we may fallback to any video from
   * the given attendee_id if the stream is unexpectedly dropped.
   *
   * Not setting attendee_id will cause the backend to skip automated switching
   * which may lead to extended freeze times.
   */
  attendeeId?: string;

  /**
   * A target stream ID, as in the case for client-driven simulcast stream selection.
   */
  streamId?: number;
}
