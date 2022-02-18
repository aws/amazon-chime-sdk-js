// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';

/**
 * [[TransceiverController]] provides an interface for managing transceivers
 * associated with peer connection.
 */
export default interface TransceiverController {
  /**
   * Sets the peer connection.
   */
  setPeer(peer: RTCPeerConnection): void;

  /**
   * Resets the transceiver controller states.
   */
  reset(): void;

  /**
   * Indicates whether the transceiver is used.
   */
  useTransceivers(): boolean;

  /**
   *  Indicates if there is a video input attached
   */
  hasVideoInput(): boolean;

  /**
   * Returns whether the track is a video track.
   */
  trackIsVideoInput(track: MediaStreamTrack): boolean;

  /**
   * Creates audio and video transceivers.
   */
  setupLocalTransceivers(): void;

  /**
   * Sets the audio track.
   */
  setAudioInput(track: MediaStreamTrack | null): Promise<void>;

  /**
   * Replaces [[MediaStreamTrack]] on audio transceiver of sendrecv direction.
   */
  replaceAudioTrack(track: MediaStreamTrack): Promise<boolean>;

  /**
   * Sets the video track.
   */
  setVideoInput(track: MediaStreamTrack | null): Promise<void>;

  /**
   * Updates video transceivers.
   */
  updateVideoTransceivers(
    videoStreamIndex: VideoStreamIndex,
    videosToReceive: VideoStreamIdSet
  ): number[];

  /**
   * Get the associated MID for a given stream ID, either set via `updateVideoTranceivers`
   * or overriden through `setStreamIdForMid`.
   *
   * Note: According to https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpTransceiver/mid
   * `mid` may not exist yet even if the transceiver has been created:
   * "This association is established, when possible, whenever either a local or remote description is applied.
   * This field is null if neither a local or remote description has been applied,
   * or if its associated m-line is rejected by either a remote offer or any answer."
   */
  getMidForStreamId?(streamId: number): string | undefined;

  /**
   * Override or set an internal mapping of stream ID to MID.
   */
  setStreamIdForMid?(mid: string, streamId: number): void;

  /**
   * Sets video sending bitrate in Kilo-bit-per-second
   */
  setVideoSendingBitrateKbps(bitrateKbps: number): void;

  /**
   * Returns the [[RTCRtpTransceiver]] for audio
   */
  localAudioTransceiver(): RTCRtpTransceiver;

  /**
   * Returns the [[RTCRtpTransceiver]] for local camera
   */
  localVideoTransceiver(): RTCRtpTransceiver;

  /**
   * Set [[RTCRtpEncodingParameters]] on the sender of transceiver.
   * This method should be called whenever the sender's encoding parameters of the local video transceiver need to
   * be updated.
   * For example, the default NScaleVideoUplinkBandwidthPolicy calls this method whenever a video is on/off or the
   * active speaker changes.
   * This method assumes that the sender of the local video transceiver is available and the input parameters should
   * not be empty.
   * The encoding parameters for sender should be retrieved using sender.getParameters and updated using
   * sender.setParameters method.
   * @param {Map<string, RTCRtpEncodingParameters>} params - The encoding parameters. If you have multiple encoding
   * parameters for different video layers, the key should be the rid corresponding to the RTCRtpEncodingParameters.
   */
  setEncodingParameters(params: Map<string, RTCRtpEncodingParameters>): void;
}
