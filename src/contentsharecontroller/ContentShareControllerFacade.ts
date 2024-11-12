// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioProfile from '../audioprofile/AudioProfile';
import ContentShareObserver from '../contentshareobserver/ContentShareObserver';
import VideoCodecCapability from '../sdp/VideoCodecCapability';
import ContentShareSimulcastEncodingParameters from '../videouplinkbandwidthpolicy/ContentShareSimulcastEncodingParameters';

export default interface ContentShareControllerFacade {
  /**
   * Sets the audio profile to use for content sharing. The new audio profile takes effect
   * on the next call to `startContentShare` or `startContentShareFromScreenCapture` or if
   * already started, upon the next reconnect.
   */
  setContentAudioProfile(audioProfile: AudioProfile): void;

  /**
   * Toggle simulcast for content share. This should be called before calling `startContentShare` or
   * `startContentShareFromScreenCapture`. The default encoding parameters are:
   * - High layer: 1200 kbps max bitrate
   * - Low layer: 300 kbps max bitrate, scale down resolution by 2, and 5 fps max frame rate.
   * @param enable Enable/disable simulcast
   * @param encodingParams Overide the default encoding params for either layer in max bitrate, scale resolution
   * down by, or max frame rate.
   */
  enableSimulcastForContentShare(
    enable: boolean,
    encodingParams?: ContentShareSimulcastEncodingParameters
  ): void;

  /**
   * Toggle SVC for content share. This should be called before calling `startContentShare` or
   * `startContentShareFromScreenCapture`. This will only have impact if using an SVC supporting
   * codec like VP9. It cannot be enabled at the same time as simulcast.
   *
   * @param enable Enable/disable SVC
   */
  enableSVCForContentShare(enable: boolean): void;

  /**
   * Start content sharing
   */
  startContentShare(stream: MediaStream): Promise<void>;

  /**
   * Start screen sharing
   */
  startContentShareFromScreenCapture(sourceId?: string, frameRate?: number): Promise<MediaStream>;

  /**
   * Pause content sharing. This (combined with `unpauseContentShare` is a lightweight alternative to stopping and
   * starting content share which requires use of a seperate peer connection and therefore has increased latency.
   *
   * Remote receivers will continue to subscribe to content share video but there will be nothing transmitting
   * (e.g. it may be a black frame)
   */
  pauseContentShare(): void;

  /**
   * Unpause content sharing
   */
  unpauseContentShare(): void;

  /**
   * Stop content sharing
   */
  stopContentShare(): void;

  /**
   * Add an observer
   */
  addContentShareObserver(observer: ContentShareObserver): void;

  /**
   * Remove an observer
   */
  removeContentShareObserver(observer: ContentShareObserver): void;

  /**
   * Set codec preferences for this content send stream. See `AudioVideoControllerFacade.setVideoCodecSendPreferences`
   * for more information.
   *
   * @param Array of [[VideoCodecCapability]].
   */
  setContentShareVideoCodecPreferences?(preferences: VideoCodecCapability[]): void;
}
