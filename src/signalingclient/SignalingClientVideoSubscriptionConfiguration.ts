// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[SignalingClientVideoSubscriptionConfiguration]] is an internal representation of
 * `SignalingProtocol.VideoSubscriptionConfiguration`
 */
export default class SignalingClientVideoSubscriptionConfiguration {
  mid?: string;
  attendeeId?: string;
  streamId?: number;
  groupId?: number;
  priority?: number;
  targetBitrateKbps?: number;
}
