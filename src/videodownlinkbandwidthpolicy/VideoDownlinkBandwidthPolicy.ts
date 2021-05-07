// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoDownlinkObserver from './VideoDownlinkObserver';

/**
 * [[VideoDownlinkBandwidthPolicy]] makes decisions about downlink
 * video bandwidth usage.
 */
export default interface VideoDownlinkBandwidthPolicy {
  /**
   * Reset back to initial state
   */
  reset(): void;

  /**
   * Potentially update the desired set of video streams to receive
   * based on the given [[VideoStreamIndex]].
   */
  updateIndex(videoIndex: VideoStreamIndex): void;

  /**
   * Update connection metrics
   */
  updateMetrics(clientMetricReport: ClientMetricReport): void;

  /**
   * Returns true if the policy has decided that a change to subscribed
   * set of video streams to receive would be beneficial.
   */
  wantsResubscribe(): boolean;

  /**
   * Updates the internal state with the set of streams we expect to be
   * subscribed to, and return the set.
   *
   * When a policy is passed into a meeting session, this will be called
   * once every two seconds to check if the subscriptions have changed.
   */
  chooseSubscriptions(): VideoStreamIdSet;

  /**
   * (Optional) Add VideoDownlinkObserver to observer resubscribe requests
   */
  addObserver?(observer: VideoDownlinkObserver): void;

  /**
   * (Optional) Removes the VideoDownlinkObserver.
   */
  removeObserver?(observer: VideoDownlinkObserver): void;
}
