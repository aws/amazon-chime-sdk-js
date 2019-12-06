// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BaseConnectionHealthPolicy from './BaseConnectionHealthPolicy';
import ConnectionHealthData from './ConnectionHealthData';
import ConnectionHealthPolicy from './ConnectionHealthPolicy';
import ConnectionHealthPolicyConfiguration from './ConnectionHealthPolicyConfiguration';

/** @internal */
export default class SignalStrengthBarsConnectionHealthPolicy extends BaseConnectionHealthPolicy
  implements ConnectionHealthPolicy {
  private static CONNECTION_UNHEALTHY_THRESHOLD: number;
  private static ZERO_BARS_NO_SIGNAL_TIME_MS: number;
  private static ONE_BAR_WEAK_SIGNAL_TIME_MS: number;
  private static TWO_BARS_TIME_MS: number;
  private static THREE_BARS_TIME_MS: number;
  private static FOUR_BARS_TIME_MS: number;
  private static FIVE_BARS_TIME_MS: number;
  private static MISSED_PONGS_LOWER_THRESHOLD: number;
  private static MISSED_PONGS_UPPER_THRESHOLD: number;

  constructor(configuration: ConnectionHealthPolicyConfiguration, data: ConnectionHealthData) {
    super(configuration, data);
    SignalStrengthBarsConnectionHealthPolicy.CONNECTION_UNHEALTHY_THRESHOLD =
      configuration.connectionUnhealthyThreshold;
    SignalStrengthBarsConnectionHealthPolicy.ZERO_BARS_NO_SIGNAL_TIME_MS =
      configuration.zeroBarsNoSignalTimeMs;
    SignalStrengthBarsConnectionHealthPolicy.ONE_BAR_WEAK_SIGNAL_TIME_MS =
      configuration.oneBarWeakSignalTimeMs;
    SignalStrengthBarsConnectionHealthPolicy.TWO_BARS_TIME_MS = configuration.twoBarsTimeMs;
    SignalStrengthBarsConnectionHealthPolicy.THREE_BARS_TIME_MS = configuration.threeBarsTimeMs;
    SignalStrengthBarsConnectionHealthPolicy.FOUR_BARS_TIME_MS = configuration.fourBarsTimeMs;
    SignalStrengthBarsConnectionHealthPolicy.FIVE_BARS_TIME_MS = configuration.fiveBarsTimeMs;
    SignalStrengthBarsConnectionHealthPolicy.MISSED_PONGS_LOWER_THRESHOLD =
      configuration.missedPongsLowerThreshold;
    SignalStrengthBarsConnectionHealthPolicy.MISSED_PONGS_UPPER_THRESHOLD =
      configuration.missedPongsUpperThreshold;
  }

  maximumHealth(): number {
    return 5;
  }

  health(): number {
    if (
      this.currentData.consecutiveStatsWithNoPackets >=
        SignalStrengthBarsConnectionHealthPolicy.CONNECTION_UNHEALTHY_THRESHOLD ||
      this.currentData.isNoSignalRecent(
        SignalStrengthBarsConnectionHealthPolicy.ZERO_BARS_NO_SIGNAL_TIME_MS
      ) ||
      this.currentData.consecutiveMissedPongs >=
        SignalStrengthBarsConnectionHealthPolicy.MISSED_PONGS_UPPER_THRESHOLD
    ) {
      return 0;
    } else if (
      this.currentData.isWeakSignalRecent(
        SignalStrengthBarsConnectionHealthPolicy.ONE_BAR_WEAK_SIGNAL_TIME_MS
      ) ||
      this.currentData.isLastPacketLossRecent(
        SignalStrengthBarsConnectionHealthPolicy.TWO_BARS_TIME_MS
      ) ||
      this.currentData.consecutiveMissedPongs >=
        SignalStrengthBarsConnectionHealthPolicy.MISSED_PONGS_LOWER_THRESHOLD
    ) {
      return 1;
    } else if (
      this.currentData.isLastPacketLossRecent(
        SignalStrengthBarsConnectionHealthPolicy.THREE_BARS_TIME_MS
      )
    ) {
      return 2;
    } else if (
      this.currentData.isLastPacketLossRecent(
        SignalStrengthBarsConnectionHealthPolicy.FOUR_BARS_TIME_MS
      )
    ) {
      return 3;
    } else if (
      this.currentData.isLastPacketLossRecent(
        SignalStrengthBarsConnectionHealthPolicy.FIVE_BARS_TIME_MS
      )
    ) {
      return 4;
    }
    return 5;
  }
}
