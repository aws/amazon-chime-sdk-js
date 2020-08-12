// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoSubscribeContext from './VideoSubscribeContext';

export default class DefaultVideoSubscribeContext implements VideoSubscribeContext {
  private _videoSubscriptions: number[] = [];
  private _videoStreamIndex: VideoStreamIndex | null = null;
  private _videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet();
  private _videosPaused: VideoStreamIdSet = new DefaultVideoStreamIdSet();

  constructor() {}

  videoSubscriptions(): number[] {
    return this._videoSubscriptions;
  }

  videoStreamIndex(): VideoStreamIndex {
    return this._videoStreamIndex;
  }

  videosToReceive(): VideoStreamIdSet {
    return this._videosToReceive.clone();
  }

  videosPausedSet(): VideoStreamIdSet {
    return this._videosPaused.clone();
  }

  updateVideoSubscriptions(videoIndices: number[]): void {
    this._videoSubscriptions = videoIndices;
  }

  updateVideoStreamIndex(videoStreamIndex: VideoStreamIndex): void {
    this._videoStreamIndex = videoStreamIndex;
  }

  updateVideosToReceive(videosToReceive: VideoStreamIdSet): void {
    this._videosToReceive = videosToReceive;
  }

  updateVideoPausedSet(videoPaused: VideoStreamIdSet): void {
    this._videosPaused = videoPaused;
  }

  wantsReceiveVideo(): boolean {
    return !!this._videosToReceive && !this._videosToReceive.empty();
  }

  videoStreamIndexRef(): VideoStreamIndex {
    return this._videoStreamIndex;
  }

  videosPausedSetRef(): VideoStreamIdSet {
    return this._videosPaused;
  }

  clone(): VideoSubscribeContext {
    const newContext = new DefaultVideoSubscribeContext();
    newContext.updateVideoStreamIndex(this._videoStreamIndex);
    newContext.updateVideoSubscriptions(this._videoSubscriptions);
    newContext.updateVideosToReceive(this._videosToReceive.clone());
    return newContext;
  }
}
