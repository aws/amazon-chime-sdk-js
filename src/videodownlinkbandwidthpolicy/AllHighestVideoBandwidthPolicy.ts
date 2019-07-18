// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../videostreamindex/DefaultVideoStreamIndex';
import VideoDownlinkBandwidthPolicy from './VideoDownlinkBandwidthPolicy';

/**
 * [[AllHighestVideoBandwidthPolicy]] implements is a rudimentary policy that simply
 * always subscribes to the highest quality video stream available
 * for all non-self participants.
 */
export default class AllHighestVideoBandwidthPolicy implements VideoDownlinkBandwidthPolicy {
  private optimalReceiveSet: DefaultVideoStreamIdSet;
  private subscribedReceiveSet: DefaultVideoStreamIdSet;

  constructor(private selfAttendeeId: string) {
    this.optimalReceiveSet = new DefaultVideoStreamIdSet();
    this.subscribedReceiveSet = new DefaultVideoStreamIdSet();
  }

  updateIndex(videoIndex: DefaultVideoStreamIndex): void {
    this.optimalReceiveSet = this.calculateOptimalReceiveSet(videoIndex);
  }

  updateAvailableBandwidth(_bandwidthKbps: number): void {}

  updateCalculatedOptimalReceiveSet(): void {}

  wantsResubscribe(): boolean {
    return !this.subscribedReceiveSet.equal(this.optimalReceiveSet);
  }

  chooseSubscriptions(): DefaultVideoStreamIdSet {
    this.subscribedReceiveSet = this.optimalReceiveSet.clone();
    return this.subscribedReceiveSet.clone();
  }

  private calculateOptimalReceiveSet(videoIndex: DefaultVideoStreamIndex): DefaultVideoStreamIdSet {
    return videoIndex.highestQualityStreamFromEachGroupExcludingSelf(this.selfAttendeeId);
  }
}
