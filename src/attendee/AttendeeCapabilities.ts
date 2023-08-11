// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

type Capability = 'SendReceive' | 'Send' | 'Receive' | 'None';

/**
 * [[AttendeeCapabilities]] contains the information of an attendee's capabilities.
 */
export default class AttendeeCapabilities {
  audio: Capability;
  video: Capability;
  content: Capability;
}
