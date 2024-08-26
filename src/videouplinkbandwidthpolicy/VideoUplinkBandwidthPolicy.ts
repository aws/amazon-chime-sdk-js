// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoCodecCapability from '../sdp/VideoCodecCapability';
import TransceiverController from '../transceivercontroller/TransceiverController';
import VideoCaptureAndEncodeParameter from '../videocaptureandencodeparameter/VideoCaptureAndEncodeParameter';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import ConnectionMetrics from './ConnectionMetrics';
import VideoUplinkTechnique from './VideoUplinkTechnique';

/**
 * A [[VideoUplinkBandwidthPolicy]] makes decisions about uplink video
 * bandwidth usage and related camera capture parameters.
 */
export default interface VideoUplinkBandwidthPolicy {
  /**
   * Reset back to initial state
   */
  reset?(): void;

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
   * This function is deprecated and unused, and will be removed in a future release.
   */
  chooseMediaTrackConstraints(): MediaTrackConstraints;

  /**
   * Set a reference to the current transceiver controller.
   * The audio video controller should call this method to pass down a transceiver controller to the policy
   * when the meeting starts and set it to undefined when the meeting ends.
   * If a meeting is stopped and started repeatedly, this pair of calls will be repeated to match.
   * All calls to updateTransceiverController will occur between this pair of calls.
   * This method should not throw.
   * @param {TransceiverController} transceiverController - The transceiver controller
   */
  setTransceiverController?(transceiverController: TransceiverController | undefined): void;

  /**
   * Update the transceiver controller that is set from setTransceiverController such as setEncodingParameters.
   * Only used when unified plan is enabled but not available for simulcast for now.
   * This method should be called when the policy needs to update the local video encoding parameters such as after
   * setHasBandwidthPriority has been called.
   * The default audio video controller calls this after a video is on/off or when an active speakers changes.
   * This method should not throw.
   */
  updateTransceiverController?(): void;

  /**
   * Set if high resultion feature (i.e., 1080p for camera and 4k for content) is enabled.
   */
  setHighResolutionFeatureEnabled?(enabled: boolean): void;

  /**
   * Set whether to enable scalable video coding (SVC)
   */
  setSVCEnabled?(enable: boolean): void;

  /**
   * Dependency descriptors can be used by the backend to designate spatial or temporal layers
   * on a single encoding. Along with the video layers allocation exension this will
   * result in the ability for remote attendees to subscribe to individual layers below the top.
   *
   * If the send transceiver is in a state where the layers allocation extension is not matching up with
   * the dependency descriptor extension, or we simply don't want to allow for the seperation of spatial
   * or temporal layers, we can remove the dependency descriptor from the SDP.
   */
  wantsVideoDependencyDescriptorRtpHeaderExtension?(): boolean;

  /**
   * Called when the intersection of the client's video codec send preferences
   * and the meeting's video codec receive preferences is updated.
   * @param meetingSupportedVideoSendCodecs - The intersection;
   * undefined if the intersection is empty.
   * @param videoSendCodecPreferences - The original preferences to use as a
   * fallback when the intersection is empty.
   */
  setMeetingSupportedVideoSendCodecs?(
    meetingSupportedVideoSendCodecs: VideoCodecCapability[] | undefined,
    videoSendCodecPreferences: VideoCodecCapability[]
  ): void;

  updateVideoEncodeResolution?(width: number, height: number): void;

  setVideoUplinkTechnique?(technique: VideoUplinkTechnique): void;
}
