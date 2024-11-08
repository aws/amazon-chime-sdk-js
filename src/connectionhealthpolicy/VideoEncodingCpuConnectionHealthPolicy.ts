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
  private readonly highEncodeCpuMsPerFrameThreshold: number;
  private consecutiveHighEncodeCpuCnt = 0;

  constructor(configuration: ConnectionHealthPolicyConfiguration, data: ConnectionHealthData) {
    super(configuration, data, VideoEncodingConnectionHealthPolicyName.VideoEncodingCpuHealth);
    this.consecutiveHighEncodeCpuThreshold = configuration.consecutiveHighEncodeCpuThreshold;
    this.highEncodeCpuMsThreshold = configuration.highEncodeCpuMsThreshold;
    this.highEncodeCpuMsPerFrameThreshold = configuration.highEncodeCpuMsPerFrameThreshold;
  }

  health(): number {
    // Checking both per-frame and total encode time as we do not want video codec fallback in two conditions:
    // 1. High per-frame encode time with low framerate (e.g., high resolution, low framerate content share)
    // 2. High framerate with low per-frame encode time (e.g., high framerate SVC)
    const videoEncodingTimeIsHigh =
      this.currentData.videoEncodingTimeInMs >= this.highEncodeCpuMsThreshold &&
      this.currentData.videoEncodingTimePerFrameInMs >= this.highEncodeCpuMsPerFrameThreshold;
    const cpuUsageIsHigh =
      !this.currentData.isVideoEncoderHardware &&
      (videoEncodingTimeIsHigh || this.currentData.cpuLimitationDuration > 0);
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
