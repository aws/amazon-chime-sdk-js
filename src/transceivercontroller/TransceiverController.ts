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
   * Sets video sending bitrate in Kilo-bit-per-second
   */
  setVideoSendingBitrateKbps(bitrateKbps: number, scaleResolutionDownBy?: number): void;

  /**
   * Returns the [[RTCRtpTransceiver]] for audio
   */
  localAudioTransceiver(): RTCRtpTransceiver;

  /**
   * Returns the [[RTCRtpTransceiver]] for local camera
   */
  localVideoTransceiver(): RTCRtpTransceiver;

  /**
   * Set [[RTCRtpEncodingParameters]] on the sender of transceiver
   */
  setEncodingParameters(params: Map<string, RTCRtpEncodingParameters>): void;
}
