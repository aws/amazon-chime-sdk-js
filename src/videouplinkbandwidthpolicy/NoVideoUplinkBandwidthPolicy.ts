// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoCaptureAndEncodeParameters from '../videouplinkbandwidthpolicy/VideoCaptureAndEncodeParameters';
import VideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';

export default class NoVideoUplinkBandwidthPolicy implements VideoUplinkBandwidthPolicy {
  constructor() {}
  updateIndex(_videoIndex: VideoStreamIndex): void {}
  wantsResubscribe(): boolean {
    return false;
  }
  chooseCaptureAndEncodeParameters(): VideoCaptureAndEncodeParameters {
    return new VideoCaptureAndEncodeParameters();
  }
  maxBandwidthKbps(): number {
    return 0;
  }
  setIdealMaxBandwidthKbps(_idealMaxBandwidthKbps: number): void {}
  setHasBandwidthPriority(_hasBandwidthPriority: boolean): void {}
}
