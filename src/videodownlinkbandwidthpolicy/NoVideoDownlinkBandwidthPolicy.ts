// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../videostreamindex/DefaultVideoStreamIndex';
import VideoDownlinkBandwidthPolicy from './VideoDownlinkBandwidthPolicy';

export default class NoVideoDownlinkBandwidthPolicy implements VideoDownlinkBandwidthPolicy {
  updateIndex(_videoIndex: DefaultVideoStreamIndex): void {}
  updateAvailableBandwidth(_bandwidthKbps: number): void {}
  updateCalculatedOptimalReceiveSet(): void {}
  wantsResubscribe(): boolean {
    return false;
  }
  chooseSubscriptions(): DefaultVideoStreamIdSet {
    return new DefaultVideoStreamIdSet();
  }
}
