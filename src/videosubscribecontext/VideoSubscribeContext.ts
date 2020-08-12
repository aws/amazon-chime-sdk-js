// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';

export default interface VideoSubscribeContext {
  /**
   * Returns cloned array of video subscriptions
   */
  videoSubscriptions(): number[];

  /**
   * Returns cloned [[VideoStreamIdSet]] of videos to receive
   */
  videosToReceive(): VideoStreamIdSet;
  /**
   * Returns cloned [[VideoStreamIndex]]
   */
  videoStreamIndex(): VideoStreamIndex;

  /**
   * Returns cloned [[VideoStreamIdSet]] of paused video
   */
  videosPausedSet(): VideoStreamIdSet;
  /**
   * Returns reference [[VideoStreamIdSet]] of paused videos
   */
  videosPausedSetRef(): VideoStreamIdSet;
  /**
   * Returns reference [[VideoStreamIndex]]
   */
  videoStreamIndexRef(): VideoStreamIndex;

  /**
   * Returns cloned [[VideoSubscribeContext]]
   */
  clone(): VideoSubscribeContext;

  /**
   * Updates video subscription array
   */
  updateVideoSubscriptions(videoIndices: number[]): void;

  /**
   * Updates [[VideoStreamIndex]] in the [[VideoSubscribeContext]]
   */
  updateVideoStreamIndex(videoStreamIndex: VideoStreamIndex): void;

  /**
   * Updates [[VideoStreamIdSet]] of videos to receive
   */
  updateVideosToReceive(videosToReceive: VideoStreamIdSet): void;

  /**
   * Updates [[VideoStreamIdSet]] of paused videos
   */
  updateVideoPausedSet(videoPaused: VideoStreamIdSet): void;

  /**
   * Returns whether meeting wants to receive videos
   */
  wantsReceiveVideo(): boolean;
}
