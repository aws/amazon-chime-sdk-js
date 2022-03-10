// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DefaultClientMetricReport from '../clientmetricreport/DefaultClientMetricReport';
import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import DefaultVideoStreamIndex from '../videostreamindex/DefaultVideoStreamIndex';
import VideoDownlinkBandwidthPolicy from './VideoDownlinkBandwidthPolicy';

export default class NoVideoDownlinkBandwidthPolicy implements VideoDownlinkBandwidthPolicy {
  reset(): void {}
  updateIndex(_videoIndex: DefaultVideoStreamIndex): void {}
  updateMetrics(_clientMetricReport: DefaultClientMetricReport): void {}
  wantsResubscribe(): boolean {
    return false;
  }
  chooseSubscriptions(): DefaultVideoStreamIdSet {
    return new DefaultVideoStreamIdSet();
  }
}
