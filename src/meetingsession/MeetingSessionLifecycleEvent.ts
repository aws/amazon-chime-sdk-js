// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MeetingSessionLifecycleEvent]] indicates the lifecycle status.
 * Add new enums to the bottom. We depend on these numbers for analytics.
 */
export enum MeetingSessionLifecycleEvent {
  /**
   * The session is connecting, either to start a new call, or reconnect to an existing one.
   */
  Connecting = 0,

  /**
   * The session successfully arrived in the started state either for the first time or
   * due to a change in connection type.
   */
  Started = 1,

  /**
   * The session came to a stop, either from leaving or due to a failure.
   */
  Stopped = 2,
}

export default MeetingSessionLifecycleEvent;
