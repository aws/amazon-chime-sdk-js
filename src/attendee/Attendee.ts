// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AttendeeCapabilities from './AttendeeCapabilities';

/**
 * [[Attendee]] contains the information of an attendee.
 */
export default class Attendee {
  /**
   * The attendee id of an attendee.
   */
  attendeeId: string;

  /**
   * The external user id of an attendee.
   */
  externalUserId: string;

  /**
   * An attendee's audio, video, and content-sharing capabilities.
   */
  capabilities?: AttendeeCapabilities;
}
