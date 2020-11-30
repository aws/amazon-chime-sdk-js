// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import BaseConnectionHealthPolicy from './BaseConnectionHealthPolicy';
import ConnectionHealthData from './ConnectionHealthData';
import ConnectionHealthPolicy from './ConnectionHealthPolicy';
import ConnectionHealthPolicyConfiguration from './ConnectionHealthPolicyConfiguration';

export default class ReconnectionHealthPolicy
  extends BaseConnectionHealthPolicy
  implements ConnectionHealthPolicy {
  private static CONNECTION_UNHEALTHY_THRESHOLD: number;
  private static CONNECTION_WAIT_TIME_MS: number;
  private static MISSED_PONGS_THRESHOLD: number;
  private static MAXIMUM_AUDIO_DELAY_MS: number;
  private static MAXIMUM_AUDIO_DELAY_DATA_POINTS: number;

  private audioDelayPointsOverMaximum = 0;

  constructor(
    private logger: Logger,
    configuration: ConnectionHealthPolicyConfiguration,
    data: ConnectionHealthData
  ) {
    super(configuration, data);
    ReconnectionHealthPolicy.CONNECTION_UNHEALTHY_THRESHOLD =
      configuration.connectionUnhealthyThreshold;
    ReconnectionHealthPolicy.CONNECTION_WAIT_TIME_MS = configuration.connectionWaitTimeMs;
    ReconnectionHealthPolicy.MISSED_PONGS_THRESHOLD = configuration.missedPongsUpperThreshold;
    ReconnectionHealthPolicy.MAXIMUM_AUDIO_DELAY_MS = configuration.maximumAudioDelayMs;
    ReconnectionHealthPolicy.MAXIMUM_AUDIO_DELAY_DATA_POINTS =
      configuration.maximumAudioDelayDataPoints;
  }

  health(): number {
    const connectionStartedRecently = this.currentData.isConnectionStartRecent(
      ReconnectionHealthPolicy.CONNECTION_WAIT_TIME_MS
    );
    if (connectionStartedRecently) {
      return 1;
    }
    const noPacketsReceivedRecently =
      this.currentData.consecutiveStatsWithNoPackets >=
      ReconnectionHealthPolicy.CONNECTION_UNHEALTHY_THRESHOLD;
    const missedPongsRecently =
      this.currentData.consecutiveMissedPongs >= ReconnectionHealthPolicy.MISSED_PONGS_THRESHOLD;
    if (this.currentData.audioSpeakerDelayMs > ReconnectionHealthPolicy.MAXIMUM_AUDIO_DELAY_MS) {
      this.audioDelayPointsOverMaximum += 1;
    } else {
      this.audioDelayPointsOverMaximum = 0;
    }
    const hasBadAudioDelay =
      this.audioDelayPointsOverMaximum > ReconnectionHealthPolicy.MAXIMUM_AUDIO_DELAY_DATA_POINTS;
    if (hasBadAudioDelay) {
      this.audioDelayPointsOverMaximum = 0;
    }
    const needsReconnect = noPacketsReceivedRecently || missedPongsRecently || hasBadAudioDelay;
    if (needsReconnect) {
      this.logger.warn(
        `reconnection recommended due to: no packets received: ${noPacketsReceivedRecently}, missed pongs: ${missedPongsRecently}, bad audio delay: ${hasBadAudioDelay}`
      );
      return 0;
    }
    return 1;
  }
}
