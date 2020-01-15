// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../videostreamindex/DefaultVideoStreamIndex';
import VideoSubscribeContext from './VideoSubscribeContext';

export default class DefaultVideoSubscribeContext implements VideoSubscribeContext {
  private _videoSubscriptions: number[] = [];
  private _videoStreamIndex: DefaultVideoStreamIndex | null = null;
  private _videosToReceive: DefaultVideoStreamIdSet = new DefaultVideoStreamIdSet();
  private _videosPaused: DefaultVideoStreamIdSet = new DefaultVideoStreamIdSet();

  constructor() {}

  videoSubscriptions(): number[] {
    return this._videoSubscriptions;
  }

  videoStreamIndex(): DefaultVideoStreamIndex {
    return this._videoStreamIndex;
  }

  videosToReceive(): DefaultVideoStreamIdSet {
    return this._videosToReceive.clone();
  }

  videosPausedSet(): DefaultVideoStreamIdSet {
    return this._videosPaused.clone();
  }

  updateVideoSubscriptions(videoIndices: number[]): void {
    this._videoSubscriptions = videoIndices;
  }

  updateVideoStreamIndex(videoStreamIndex: DefaultVideoStreamIndex): void {
    this._videoStreamIndex = videoStreamIndex;
  }

  updateVideosToReceive(videosToReceive: DefaultVideoStreamIdSet): void {
    this._videosToReceive = videosToReceive.clone();
  }

  updateVideoPausedSet(videoPaused: DefaultVideoStreamIdSet): void {
    this._videosPaused = videoPaused;
  }

  wantsReceiveVideo(): boolean {
    return !!this._videosToReceive && !this._videosToReceive.empty();
  }

  videoStreamIndexRef(): DefaultVideoStreamIndex {
    return this._videoStreamIndex;
  }

  videosPausedSetRef(): DefaultVideoStreamIdSet {
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
