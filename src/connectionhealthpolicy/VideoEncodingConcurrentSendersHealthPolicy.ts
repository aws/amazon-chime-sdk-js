// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BaseConnectionHealthPolicy from './BaseConnectionHealthPolicy';
import ConnectionHealthData from './ConnectionHealthData';
import ConnectionHealthPolicy from './ConnectionHealthPolicy';
import ConnectionHealthPolicyConfiguration from './ConnectionHealthPolicyConfiguration';
import VideoEncodingConnectionHealthPolicyName from './VideoEncodingConnectionHealthPolicyName';

export default class VideoEncodingConcurrentSendersHealthPolicy
  extends BaseConnectionHealthPolicy
  implements ConnectionHealthPolicy
{
  private readonly concurrentVideoSendersThreshold: number;

  constructor(configuration: ConnectionHealthPolicyConfiguration, data: ConnectionHealthData) {
    super(
      configuration,
      data,
      VideoEncodingConnectionHealthPolicyName.VideoConcurrentSendersHealth
    );
    this.concurrentVideoSendersThreshold = configuration.concurrentVideoSendersThreshold;
  }

  health(): number {
    if (this.currentData.isContentShare) {
      // Do not degrade content share as the number of content share senders is limited
      return this.maximumHealth();
    }
    if (this.currentData.numberOfPublishedVideoSources > this.concurrentVideoSendersThreshold) {
      return this.minimumHealth();
    }
    return this.maximumHealth();
  }
}
