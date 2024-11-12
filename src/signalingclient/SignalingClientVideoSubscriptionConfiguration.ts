// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoQualityAdaptationPreference from '../videodownlinkbandwidthpolicy/VideoQualityAdaptationPreference';

/**
 * [[SignalingClientVideoSubscriptionConfiguration]] is an internal representation of
 * `SignalingProtocol.videoSubscriptionConfiguration`
 */
export default class SignalingClientVideoSubscriptionConfiguration {
  mid?: string;
  attendeeId?: string;
  streamId?: number;
  groupId?: number;
  priority?: number;
  targetBitrateKbps?: number;
  qualityAdaptationPreference?: VideoQualityAdaptationPreference;

  equals(other: this): boolean {
    return (
      other !== undefined &&
      this.mid === other.mid &&
      this.attendeeId === other.attendeeId &&
      this.streamId === other.streamId &&
      this.groupId === other.groupId &&
      this.priority === other.priority &&
      this.targetBitrateKbps === other.targetBitrateKbps &&
      this.qualityAdaptationPreference === other.qualityAdaptationPreference
    );
  }
}
