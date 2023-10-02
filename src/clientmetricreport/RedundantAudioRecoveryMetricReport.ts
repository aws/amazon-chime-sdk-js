// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[RedundantAudioRecoveryMetricReport]] will contain metrics reported
 * by the [[RedundantAudioEncoder]]
 */
export default class RedundantAudioRecoveryMetricReport {
  currentTimestampMs: number = 0;
  ssrc: number = 0;
  totalAudioPacketsLost: number = 0;
  totalAudioPacketsExpected: number = 0;
  totalAudioPacketsRecoveredRed: number = 0;
  totalAudioPacketsRecoveredFec: number = 0;
}
