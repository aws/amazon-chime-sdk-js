// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioProfile from '../audioprofile/AudioProfile';
import ContentShareObserver from '../contentshareobserver/ContentShareObserver';

export default interface ContentShareControllerFacade {
  /**
   * Sets the audio profile to use for content sharing. The new audio profile takes effect
   * on the next call to `startContentShare` or `startContentShareFromScreenCapture` or if
   * already started, upon the next reconnect.
   */
  setContentAudioProfile(audioProfile: AudioProfile): void;

  /**
   * Start content sharing
   */
  startContentShare(stream: MediaStream): Promise<void>;

  /**
   * Start screen sharing
   */
  startContentShareFromScreenCapture(sourceId?: string, frameRate?: number): Promise<MediaStream>;

  /**
   * Pause content sharing
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
}
