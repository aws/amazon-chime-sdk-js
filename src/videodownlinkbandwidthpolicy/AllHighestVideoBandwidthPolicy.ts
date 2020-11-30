// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoDownlinkBandwidthPolicy from './VideoDownlinkBandwidthPolicy';

/**
 * [[AllHighestVideoBandwidthPolicy]] implements is a rudimentary policy that simply
 * always subscribes to the highest quality video stream available
 * for all non-self participants.
 */
export default class AllHighestVideoBandwidthPolicy implements VideoDownlinkBandwidthPolicy {
  private optimalReceiveSet: VideoStreamIdSet;
  private subscribedReceiveSet: VideoStreamIdSet;

  constructor(private selfAttendeeId: string) {
    this.reset();
  }

  reset(): void {
    this.optimalReceiveSet = new DefaultVideoStreamIdSet();
    this.subscribedReceiveSet = new DefaultVideoStreamIdSet();
  }

  updateIndex(videoIndex: VideoStreamIndex): void {
    this.optimalReceiveSet = this.calculateOptimalReceiveSet(videoIndex);
  }

  updateMetrics(_clientMetricReport: ClientMetricReport): void {}

  wantsResubscribe(): boolean {
    return !this.subscribedReceiveSet.equal(this.optimalReceiveSet);
  }

  chooseSubscriptions(): VideoStreamIdSet {
    this.subscribedReceiveSet = this.optimalReceiveSet.clone();
    return this.subscribedReceiveSet.clone();
  }

  private calculateOptimalReceiveSet(videoIndex: VideoStreamIndex): VideoStreamIdSet {
    return videoIndex.highestQualityStreamFromEachGroupExcludingSelf(this.selfAttendeeId);
  }
}
