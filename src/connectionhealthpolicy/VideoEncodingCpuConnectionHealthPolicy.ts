// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BaseConnectionHealthPolicy from './BaseConnectionHealthPolicy';
import ConnectionHealthData from './ConnectionHealthData';
import ConnectionHealthPolicy from './ConnectionHealthPolicy';
import ConnectionHealthPolicyConfiguration from './ConnectionHealthPolicyConfiguration';
import VideoEncodingConnectionHealthPolicyName from './VideoEncodingConnectionHealthPolicyName';

export default class VideoEncodingCpuConnectionHealthPolicy
  extends BaseConnectionHealthPolicy
  implements ConnectionHealthPolicy {
  private readonly consecutiveHighEncodeCpuThreshold: number;
  private readonly highEncodeCpuMsThreshold: number;
  private consecutiveHighEncodeCpuCnt = 0;

  constructor(configuration: ConnectionHealthPolicyConfiguration, data: ConnectionHealthData) {
    super(configuration, data, VideoEncodingConnectionHealthPolicyName.VideoEncodingCpuHealth);
    this.consecutiveHighEncodeCpuThreshold = configuration.consecutiveHighEncodeCpuThreshold;
    this.highEncodeCpuMsThreshold = configuration.highEncodeCpuMsThreshold;
  }

  health(): number {
    const cpuUsageIsHigh =
      !this.currentData.isVideoEncoderHardware &&
      (this.currentData.videoEncodingTimeInMs >= this.highEncodeCpuMsThreshold ||
        this.currentData.cpuLimitationDuration > 0);
    if (cpuUsageIsHigh) {
      this.consecutiveHighEncodeCpuCnt++;
      if (this.consecutiveHighEncodeCpuCnt > this.consecutiveHighEncodeCpuThreshold) {
        this.consecutiveHighEncodeCpuCnt = 0;
        return this.minimumHealth();
      }
    } else {
      this.consecutiveHighEncodeCpuCnt = 0;
    }
    return this.maximumHealth();
  }
}
