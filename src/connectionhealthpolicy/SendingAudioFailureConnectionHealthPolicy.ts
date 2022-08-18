// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import BaseConnectionHealthPolicy from './BaseConnectionHealthPolicy';
import ConnectionHealthData from './ConnectionHealthData';
import ConnectionHealthPolicy from './ConnectionHealthPolicy';
import ConnectionHealthPolicyConfiguration from './ConnectionHealthPolicyConfiguration';

export default class SendingAudioFailureConnectionHealthPolicy
  extends BaseConnectionHealthPolicy
  implements ConnectionHealthPolicy {
  private readonly sendingAudioFailureSamplesToConsider: number;
  private readonly sendingAudioFailureInitialWaitTimeMs: number;
  private readonly coolDownTimeMs: number;
  private readonly maximumTimesToWarn: number;
  private warnCount: number;
  private lastWarnTimestampMs: number;

  constructor(
    private logger: Logger,
    configuration: ConnectionHealthPolicyConfiguration,
    data: ConnectionHealthData
  ) {
    super(configuration, data, 'Sending Audio Health');
    this.sendingAudioFailureSamplesToConsider =
      configuration.sendingAudioFailureSamplesToConsider > 0
        ? configuration.sendingAudioFailureSamplesToConsider
        : 1;
    this.sendingAudioFailureInitialWaitTimeMs = configuration.sendingAudioFailureInitialWaitTimeMs;
    this.maximumTimesToWarn = configuration.maximumTimesToWarn;
    this.coolDownTimeMs = configuration.cooldownTimeMs;
    this.lastWarnTimestampMs = 0;
    this.warnCount = 0;
  }

  private isSendingAudioUnhealthy(): boolean {
    const hasEnoughTimeElapsedToEvaluateStatus = !this.currentData.isConnectionStartRecent(
      this.sendingAudioFailureInitialWaitTimeMs
    );
    const areAudioPacketsNotBeingSent =
      this.currentData.consecutiveStatsWithNoAudioPacketsSent >=
      this.sendingAudioFailureSamplesToConsider;
    return hasEnoughTimeElapsedToEvaluateStatus && areAudioPacketsNotBeingSent;
  }

  health(): number {
    if (this.isSendingAudioUnhealthy()) {
      const didWarnRecently = Date.now() - this.lastWarnTimestampMs < this.coolDownTimeMs;
      if (this.currentHealth > this.minimumHealth() && !didWarnRecently) {
        this.logger.warn(
          `Sending Audio is unhealthy for ${this.sendingAudioFailureSamplesToConsider} seconds consecutively.`
        );
        this.warnCount++;
        if (this.warnCount > this.maximumTimesToWarn) {
          this.logger.warn(
            'SendingAudioFailure health policy maximum warnings breached. Falling back to reporting healthy.'
          );
          return this.maximumHealth();
        }
        this.lastWarnTimestampMs = Date.now();
        return this.minimumHealth();
      } else {
        return this.currentHealth;
      }
    }
    return this.maximumHealth();
  }
}
