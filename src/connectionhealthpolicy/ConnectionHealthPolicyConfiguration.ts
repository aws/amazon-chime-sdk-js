// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoEncodingCpuConnectionHealthPolicy from '../connectionhealthpolicy/VideoEncodingCpuConnectionHealthPolicy';
import VideoEncodingFramerateConnectionHealthPolicy from '../connectionhealthpolicy/VideoEncodingFramerateConnectionHealthPolicy';

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

  /**
   * The number of samples required to consider sending-audio to be unhealthy
   *
   * The default value is derived from the median for time taken for receiving an attendee presence message from the
   * server after joining. Attendee presence is only received when the client sends audio packets to the server, so
   * this metric is used as a proxy.
   */
  sendingAudioFailureSamplesToConsider = 2;

  /**
   * The purpose of this field is to add a wait time/delay to our evaluation of sending audio health
   * as the microphone may sometimes cause a delay in sending audio packets during the initial stages of a connection.
   */
  sendingAudioFailureInitialWaitTimeMs = 3000;

  /**
   * Policies and parameters related to video encoding health montoring
   */
  videoEncodingHealthPolicies = [
    VideoEncodingCpuConnectionHealthPolicy,
    VideoEncodingFramerateConnectionHealthPolicy,
  ];

  /**
   * Consecutive seconds of high encode CPU to trigger video codec degradation in video encoding health monitoring.
   * Increasing the value results in less sensitive video codec degradaion and vice versa.
   */
  consecutiveHighEncodeCpuThreshold = 10;

  /**
   * Encode time threshold to determine high CPU usage of software encoders in video encoding health monitoring.
   * Recuding the value results in video codec degradation due to high CPU usage software encoder to be triggered
   * at a lower CPU usage.
   */
  highEncodeCpuMsThreshold = 500;

  /**
   * Encode time per frame threshold to determine high CPU usage of software encoders in video encoding health
   * monitoring. Recuding the value results in video codec degradation due to high CPU usage software encoder to
   * be triggered at a lower CPU usage. Note that encoder counts each SVC spatial layer of a frame as an encoded
   * frame. The magnification in framerate should be considered when configuring this parameter with SVC enabled.
   */
  highEncodeCpuMsPerFrameThreshold = 15;

  /**
   * Consecutive seconds of zero encoded framerate to trigger video codec degradation in video encoding health monitoring.
   * Increasing the value results in less sensitive video codec degradaion and vice versa.
   */
  consecutiveVideoEncodingFailureThreshold = 5;
}
