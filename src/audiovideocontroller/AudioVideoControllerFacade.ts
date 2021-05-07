// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioProfile from '../audioprofile/AudioProfile';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import VideoSource from '../videosource/VideoSource';

export default interface AudioVideoControllerFacade {
  addObserver(observer: AudioVideoObserver): void;
  removeObserver(observer: AudioVideoObserver): void;

  /**
   * Start the meeting session. By default this will connect and begin sending
   * and receiving audio, depending on the implementation.
   *
   * This method also allows you to provide options for how connection occurs.
   *
   * The only supported option is `signalingOnly`. Specifying this option will
   * cause the controller to only connect the meeting signaling channel. This
   * can be performed relatively early in the join lifecycle (_e.g._, prior to
   * choosing audio devices), which can improve join latency.
   *
   * Your code is responsible for calling `start` again without `signalingOnly`
   * to complete connection.
   *
   * @param options Passing `signalingOnly: true` will cause only the initial signaling connection to occur.
   */
  start(options?: { signalingOnly?: boolean }): void;
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
