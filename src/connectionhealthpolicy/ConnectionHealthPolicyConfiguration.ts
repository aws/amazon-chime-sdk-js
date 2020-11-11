// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class ConnectionHealthPolicyConfiguration {
  minHealth: number = 0;
  maxHealth: number = 1;
  initialHealth: number = 1;
  connectionUnhealthyThreshold = 25;
  noSignalThresholdTimeMs = 10000;
  connectionWaitTimeMs = 10000;
  zeroBarsNoSignalTimeMs = 5000;
  oneBarWeakSignalTimeMs = 5000;
  twoBarsTimeMs = 5000;
  threeBarsTimeMs = 10000;
  fourBarsTimeMs = 20000;
  fiveBarsTimeMs = 60000;
  cooldownTimeMs = 60000;
  pastSamplesToConsider = 15;
  goodSignalTimeMs = 15000;
  fractionalLoss = 0.5;
  packetsExpected = 50;
  maximumTimesToWarn = 2;
  missedPongsLowerThreshold = 1;
  missedPongsUpperThreshold = 4;
  maximumAudioDelayMs = 60000;
  maximumAudioDelayDataPoints = 10;
}
