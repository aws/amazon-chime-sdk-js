// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultVideoCaptureAndEncodeParameter from '../videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import VideoCaptureAndEncodeParameter from '../videocaptureandencodeparameter/VideoCaptureAndEncodeParameter';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';
import ConnectionMetrics from './ConnectionMetrics';

export default class NoVideoUplinkBandwidthPolicy implements VideoUplinkBandwidthPolicy {
  constructor() {}
  updateConnectionMetric(_metrics: ConnectionMetrics): void {}
  chooseMediaTrackConstraints(): MediaTrackConstraints {
    return {};
  }
  chooseEncodingParameters(): Map<string, RTCRtpEncodingParameters> {
    return new Map<string, RTCRtpEncodingParameters>();
  }
  updateIndex(_videoIndex: VideoStreamIndex): void {}
  wantsResubscribe(): boolean {
    return false;
  }
  chooseCaptureAndEncodeParameters(): VideoCaptureAndEncodeParameter {
    return new DefaultVideoCaptureAndEncodeParameter(0, 0, 0, 0, false);
  }
  maxBandwidthKbps(): number {
    return 0;
  }
  setIdealMaxBandwidthKbps(_idealMaxBandwidthKbps: number): void {}
  setHasBandwidthPriority(_hasBandwidthPriority: boolean): void {}
}
