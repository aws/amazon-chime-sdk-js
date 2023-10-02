// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import RedundantAudioRecoveryMetricReport from '../clientmetricreport/RedundantAudioRecoveryMetricReport';

/**
 * Instances of [[RedundantAudioRecoveryMetricsObserver]] can be registered with a
 * [[TransceiverController]] to receive callbacks with recovery metrics
 */
export default interface RedundantAudioRecoveryMetricsObserver {
  /**
   * Called when new RED and FEC recovery metrics become available.
   */
  recoveryMetricsDidReceive(metricReport: RedundantAudioRecoveryMetricReport): void;
}
