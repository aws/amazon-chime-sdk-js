// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import TransceiverController from '../transceivercontroller/TransceiverController';
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

  /**
   * Set a reference to the current transceiver controller.
   * This should be called whenever a transceiver controller is available when the call starts.
   * The default audio video controllers calls this at the end of connection.
   * This method should not throw.
   * @param {TransceiverController} transceiverController - The transceiver controller
   */
  setTransceiverController?(transceiverController: TransceiverController): void;

  /**
   * Update the transceiver controller that is set from setTransceiverController such as setEncodingParameters.
   * Only used when unified plan is enabled but not available for simulcast for now.
   * This method should be called when the policy needs to update the local video encoding parameters such as after
   * setHasBandwidthPriority has been called.
   * The default audio video controller calls this after a video is on/off or when an active speakers changes.
   * This method should not throw.
   */
  updateTransceiverController?(): void;
}
