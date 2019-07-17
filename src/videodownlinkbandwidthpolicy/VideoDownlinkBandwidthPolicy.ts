// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';

/**
 * [[VideoDownlinkBandwidthPolicy]] makes decisions about downlink
 * video bandwidth usage.
 */
export default interface VideoDownlinkBandwidthPolicy {
  /**
   * Potentially update the desired set of video streams to receive
   * based on the given [[VideoStreamIndex]].
   */
  updateIndex(videoIndex: VideoStreamIndex): void;

  /**
   * Update available downlink bandwidth in kbps
   */
  updateAvailableBandwidth(bandwidthKbps: number): void;

  /**
   * Triggers a round of calculation of the optimal receive set.
   */
  updateCalculatedOptimalReceiveSet(): void;

  /**
   * Returns true if the policy has decided that a change to subscribed
   * set of video streams to receive would be beneficial.
   */
  wantsResubscribe(): boolean;

  /**
   * Updates the internal state with the set of streams we expect to be
   * subscribed to, and return the set.
   */
  chooseSubscriptions(): VideoStreamIdSet;
}
