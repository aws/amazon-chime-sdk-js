// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoCaptureAndEncodeParameter from '../videocaptureandencodeparameter/VideoCaptureAndEncodeParameter';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import ConnectionMetrics from './ConnectionMetrics';

/**
 * A [[VideoUplinkBandwidthPolicy]] makes decisions about uplink video
 * bandwidth usage and related camera capture parameters.
 */
export default interface VideoUplinkBandwidthPolicy {
  /**
   * Potentially update the optimal capture and encode parameters
   * based on the given VideoStreamIndex.
   */
  updateIndex(videoIndex: VideoStreamIndex): void;

  /**
   * Return true if the policy has decided that a change to the
   * captured and transmitted video stream would be beneficial.
   */
  wantsResubscribe(): boolean;

  /**
   * Update the internal state with the capture and encode parameters
   * we expect to be used, and return the parameters.
   */
  chooseCaptureAndEncodeParameters(): VideoCaptureAndEncodeParameter;

  /**
   * Gets the maximum encoding bitrate kbps after bandwidth constraints are applied.
   */
  maxBandwidthKbps(): number;

  /**
   * Gets the factor by which to scale down the video during encoding.
   */
  scaleResolutionDownBy?(): number;

  /**
   * Sets ideal maximum bandwidth kbps.
   */
  setIdealMaxBandwidthKbps(maxBandwidthKbps: number): void;

  /**
   * Sets whether video uplink bandwidth is currently prioritized.
   */
  setHasBandwidthPriority(hasBandwidthPriority: boolean): void;

  /**
   * Returns the selected encoding parameter
   */
  chooseEncodingParameters(): Map<string, RTCRtpEncodingParameters>;

  /**
   * Updates VideoUplinkPolicy with connection metrics
   */
  updateConnectionMetric(metrics: ConnectionMetrics): void;

  /**
   * Returns the selected [[MediaTrackConstraints]] to update
   */
  chooseMediaTrackConstraints(): MediaTrackConstraints;
}
