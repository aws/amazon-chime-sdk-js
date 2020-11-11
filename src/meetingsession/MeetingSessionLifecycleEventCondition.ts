// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MeetingSessionLifecycleEventCondition]] indicates the lifecycle event condition.
 * Add new enums to the bottom. We depend on these numbers for analytics.
 */
export enum MeetingSessionLifecycleEventCondition {
  /**
   * The session is connecting for the first time.
   */
  ConnectingNew = 0,

  /**
   * The session was connected before and is now reconnecting.
   */
  ReconnectingExisting = 1,

  /**
   * The session successfully arrived in the started state for the first time.
   */
  StartedNew = 2,

  /**
   * The session successfully arrived in the started state but was connected before.
   * This can happen, for example, when the connection type changes.
   */
  StartedExisting = 3,

  /**
   * The session successfully arrived in the started state following a reconnect.
   */
  StartedAfterReconnect = 4,

  /**
   * The session stopped cleanly, probably due to leaving the call.
   */
  StoppedCleanly = 5,

  /**
   * The session stopped due to a failure. A status code will indicate the cause of
   * the failure.
   */
  StoppedWithFailure = 6,
}

export default MeetingSessionLifecycleEventCondition;
