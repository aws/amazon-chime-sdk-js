// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';

export default interface VideoSubscribeContext {
  /**
   * returns cloned array of video subscriptions
   */
  videoSubscriptions(): number[];

  /**
   * returns cloned [[VideoStreamIdSet]] of videosToReceive
   */
  videosToReceive(): VideoStreamIdSet;
  /**
   * returns cloned [[VideoStreamIndex]]
   */
  videoStreamIndex(): VideoStreamIndex;

  /**
   * returns cloned [[VideoStreamIdSet]]
   */
  videosPausedSet(): VideoStreamIdSet;
  /**
   * returns
   */
  videosPausedSetRef(): VideoStreamIdSet;
  /**
   * returns
   */
  videoStreamIndexRef(): VideoStreamIndex;

  /**
   * returns
   */
  clone(): VideoSubscribeContext;

  /**
   * returns
   */
  updateVideoSubscriptions(videoIndices: number[]): void;

  /**
   * returns
   */
  updateVideoStreamIndex(videoStreamIndex: VideoStreamIndex): void;

  /**
   * returns
   */
  updateVideosToReceive(videosToReceive: VideoStreamIdSet): void;

  /**
   * returns
   */
  updateVideoPausedSet(videoPaused: VideoStreamIdSet): void;

  /**
   * returns
   */
  wantsReceiveVideo(): boolean;
}
