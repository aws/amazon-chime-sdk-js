// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioProfile from '../audioprofile/AudioProfile';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import VideoSource from '../videosource/VideoSource';

export default interface AudioVideoControllerFacade {
  addObserver(observer: AudioVideoObserver): void;
  removeObserver(observer: AudioVideoObserver): void;
  start(): void;
  stop(): void;
  getRTCPeerConnectionStats(selector?: MediaStreamTrack): Promise<RTCStatsReport>;
  /**
   * Get all the remote video sending sources.
   */
  getRemoteVideoSources(): VideoSource[];

  /**
   * Sets the audio profile to use for audio. The new audio profile takes effect
   * on the next call to `start` or if already started, upon the next reconnect.
   */
  setAudioProfile(audioProfile: AudioProfile): void;
}
