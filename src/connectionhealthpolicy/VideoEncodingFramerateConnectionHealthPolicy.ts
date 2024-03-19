// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BaseConnectionHealthPolicy from './BaseConnectionHealthPolicy';
import ConnectionHealthData from './ConnectionHealthData';
import ConnectionHealthPolicy from './ConnectionHealthPolicy';
import ConnectionHealthPolicyConfiguration from './ConnectionHealthPolicyConfiguration';

export default class VideoEncodingFramerateConnectionHealthPolicy
  extends BaseConnectionHealthPolicy
  implements ConnectionHealthPolicy {
  private readonly consecutiveVideoEncodingFailureThreshold: number;
  private consecutiveEncodeFailureCnt = 0;

  constructor(configuration: ConnectionHealthPolicyConfiguration, data: ConnectionHealthData) {
    super(configuration, data, 'Video Encoding framerate Health');
    this.consecutiveVideoEncodingFailureThreshold =
      configuration.consecutiveVideoEncodingFailureThreshold;
  }

  health(): number {
    const videoEncoderFailed =
      this.currentData.videoEncodeFps === 0 && this.currentData.videoInputFps > 0;
    if (videoEncoderFailed) {
      this.consecutiveEncodeFailureCnt++;
      if (this.consecutiveEncodeFailureCnt > this.consecutiveVideoEncodingFailureThreshold) {
        this.consecutiveEncodeFailureCnt = 0;
        return this.minimumHealth();
      }
    } else {
      this.consecutiveEncodeFailureCnt = 0;
    }
    return this.maximumHealth();
  }
}
