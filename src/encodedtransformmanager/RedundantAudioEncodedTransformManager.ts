// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import RedundantAudioRecoveryMetricReport from '../clientmetricreport/RedundantAudioRecoveryMetricReport';
import {
  COMMON_MESSAGE_TYPES,
  EncodedTransformMessage,
  TRANSFORM_NAMES,
} from '../encodedtransformworker/EncodedTransform';
import { REDUNDANT_AUDIO_MESSAGE_TYPES } from '../encodedtransformworker/RedundantAudioEncodedTransform';
import RedundantAudioRecoveryMetricsObserver from '../redundantaudiorecoverymetricsobserver/RedundantAudioRecoveryMetricsObserver';
import EncodedTransformManager from './EncodedTransformManager';

/**
 * Metrics for redundant audio encoding/decoding
 */
export interface RedundantAudioMetrics {
  totalAudioPacketsLost: number;
  totalAudioPacketsExpected: number;
  totalAudioPacketsRecoveredRed: number;
  totalAudioPacketsRecoveredFec: number;
}

/**
 * Manages redundant audio encoding transforms.
 * Handles RED configuration, metrics collection, and observer notifications.
 * Implements AudioVideoObserver to receive metrics directly.
 */
export default class RedundantAudioEncodedTransformManager
  extends EncodedTransformManager
  implements AudioVideoObserver {
  private numRedundantEncodings: number = 0;
  private redundancyEnabled: boolean = true;
  private metrics: RedundantAudioMetrics = {
    totalAudioPacketsLost: 0,
    totalAudioPacketsExpected: 0,
    totalAudioPacketsRecoveredRed: 0,
    totalAudioPacketsRecoveredFec: 0,
  };
  private observers: Set<RedundantAudioRecoveryMetricsObserver> = new Set();

  // Audio metrics history for packet loss calculation
  private audioMetricsHistory: Array<{
    timestampMs: number;
    totalPacketsSent: number;
    totalPacketsLost: number;
  }> = new Array();
  private currentNumRedundantEncodings: number = 0;
  private lastRedHolddownTimerStartTimestampMs: number = 0;
  private lastHighPacketLossEventTimestampMs: number = 0;
  private lastAudioRedTurnOffTimestampMs: number = 0;
  private readonly maxAudioMetricsHistory: number = 20;
  private readonly audioRedPacketLossShortEvalPeriodMs = 5 * 1000; // 5s
  private readonly audioRedPacketLossLongEvalPeriodMs = 15 * 1000; // 15s
  private readonly audioRedHoldDownTimeMs: number = 5 * 60 * 1000; // 5m
  private readonly redRecoveryTimeMs: number = 1 * 60 * 1000; // 1m

  /**
   * Get the transform names that this manager handles
   */
  transformNames(): string[] {
    return [TRANSFORM_NAMES.REDUNDANT_AUDIO];
  }

  /**
   * Handle RED metrics messages from the Web Worker
   */
  handleWorkerMessage(message: EncodedTransformMessage): void {
    if (message.type === COMMON_MESSAGE_TYPES.METRICS) {
      const metrics = message.message?.metrics ? JSON.parse(message.message.metrics) : null;
      const ssrc = message.message?.ssrc ? parseInt(message.message.ssrc, 10) : 0;

      if (metrics) {
        this.updateMetrics(metrics);
        this.notifyObservers(ssrc);
      }
    }
  }

  /**
   * Set audio payload types from SDP
   */
  setAudioPayloadTypes(payloadTypes: Map<string, number>): void {
    const opusPayloadType = payloadTypes.get('opus') || 0;
    const redPayloadType = payloadTypes.get('red') || 0;

    // Send configuration to worker
    const opusMessage: EncodedTransformMessage = {
      transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
      type: REDUNDANT_AUDIO_MESSAGE_TYPES.OPUS_PAYLOAD_TYPE,
      message: { payloadType: opusPayloadType.toString() },
    };
    this.postMessage(opusMessage);

    const redMessage: EncodedTransformMessage = {
      transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
      type: REDUNDANT_AUDIO_MESSAGE_TYPES.RED_PAYLOAD_TYPE,
      message: { payloadType: redPayloadType.toString() },
    };
    this.postMessage(redMessage);

    this.logger.info(
      `[AudioRed] Set payload types - Opus: ${opusPayloadType}, RED: ${redPayloadType}`
    );
  }

  /**
   * Update the number of redundant encodings based on packet loss
   */
  updateNumRedundantEncodings(packetLossPercent: number): void {
    // Calculate appropriate number of redundant encodings based on packet loss
    let newNumEncodings = 0;
    if (packetLossPercent > 10) {
      newNumEncodings = 2;
    } else if (packetLossPercent > 5) {
      newNumEncodings = 1;
    }

    if (newNumEncodings !== this.numRedundantEncodings) {
      this.numRedundantEncodings = newNumEncodings;

      const message: EncodedTransformMessage = {
        type: REDUNDANT_AUDIO_MESSAGE_TYPES.UPDATE_NUM_REDUNDANT_ENCODINGS,
        transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
        message: { numRedundantEncodings: newNumEncodings.toString() },
      };
      this.postMessage(message);

      this.logger.info(
        `[AudioRed] Updated redundant encodings to ${newNumEncodings} (packet loss: ${packetLossPercent}%)`
      );
    }
  }

  /**
   * Enable or disable redundancy
   */
  setRedundancyEnabled(enabled: boolean): void {
    if (this.redundancyEnabled === enabled) {
      return;
    }

    this.redundancyEnabled = enabled;

    const message: EncodedTransformMessage = {
      type: enabled ? REDUNDANT_AUDIO_MESSAGE_TYPES.ENABLE : REDUNDANT_AUDIO_MESSAGE_TYPES.DISABLE,
      transformName: TRANSFORM_NAMES.REDUNDANT_AUDIO,
    };
    this.postMessage(message);

    this.logger.info(`[AudioRed] Redundancy ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * AudioVideoObserver callback - receives metrics from the audio/video controller
   */
  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    const { currentTimestampMs } = clientMetricReport;
    const rtcStatsReport = clientMetricReport.getRTCStatsReport();
    let receiverReportReceptionTimestampMs: number = 0;
    let currentTotalPacketsSent: number = 0;
    let currentTotalPacketsLost: number = 0;

    rtcStatsReport.forEach(report => {
      /* istanbul ignore else */
      if (report.kind === 'audio') {
        /* istanbul ignore else */
        if (report.type === 'outbound-rtp') {
          currentTotalPacketsSent = report.packetsSent;
        } /* istanbul ignore else */ else if (report.type === 'remote-inbound-rtp') {
          // Use the timestamp that the receiver report was received on the client side to get a more accurate time
          // interval for the metrics.
          receiverReportReceptionTimestampMs = report.timestamp;
          currentTotalPacketsLost = report.packetsLost;
        }
      }
    });

    // Since the timestamp from the server side is only updated when a new receiver report is generated, only add
    // metrics with new timestamps to our metrics history.
    //
    // Also, make sure that the total packets sent is greater than the most recent value in the history before consuming
    // to avoid divide-by-zero while calculating uplink loss percent.
    if (
      this.audioMetricsHistory.length === 0 ||
      (receiverReportReceptionTimestampMs >
        this.audioMetricsHistory[this.audioMetricsHistory.length - 1].timestampMs &&
        currentTotalPacketsSent >
          this.audioMetricsHistory[this.audioMetricsHistory.length - 1].totalPacketsSent)
    ) {
      // Note that although the total packets sent is updated anytime we get the WebRTC stats, we are only adding a new
      // metric for total packets sent when we receive a new receiver report. We only care about the total packets that
      // the server was expected to receive at the time that the latest `packetsLost` metric was calculated in order to
      // do our uplink loss calculation. Therefore, we only record the total packets sent when we receive a new receiver
      // report, which will give us an estimate of the number of packets that the server was supposed to receive at the
      // time when the latest `packetsLost` metric was calculated.
      this.audioMetricsHistory.push({
        timestampMs: receiverReportReceptionTimestampMs,
        totalPacketsSent: currentTotalPacketsSent,
        totalPacketsLost: currentTotalPacketsLost,
      });
    }

    // Remove the oldest metric report from our list
    if (this.audioMetricsHistory.length > this.maxAudioMetricsHistory) {
      this.audioMetricsHistory.shift();
    }

    // As the minimum RTCP frequency is about 1 every 5 seconds,
    // we are limited to using a minimum timewindow of 5 seconds.
    // This is because the cumulative packetsLost metric remains
    // the same for 5 consecutive client metric reports.
    const lossPercent5sTimewindow = this.lossPercent(this.audioRedPacketLossShortEvalPeriodMs);
    const lossPercent15sTimewindow = this.lossPercent(this.audioRedPacketLossLongEvalPeriodMs);

    // Taking the max loss percent between a short and long time window will allow
    // us to increase the number of encodings fast but will slowly decrease the
    // number of encodings on loss recovery.
    const maxLossPercent = Math.max(lossPercent5sTimewindow, lossPercent15sTimewindow);

    const [
      newNumRedundantEncodings,
      shouldTurnOffRed,
    ] = RedundantAudioEncodedTransformManager.getNumRedundantEncodingsForPacketLoss(maxLossPercent);

    if (shouldTurnOffRed) {
      this.lastHighPacketLossEventTimestampMs = currentTimestampMs;
      /* istanbul ignore next */
      if (this.redundancyEnabled) {
        this.setRedundancyEnabled(false);
        this.lastAudioRedTurnOffTimestampMs = currentTimestampMs;
      }
      return;
    } else if (!this.redundancyEnabled) {
      const timeSinceRedOff = currentTimestampMs - this.lastAudioRedTurnOffTimestampMs;
      const timeSinceLastHighPacketLossEvent =
        currentTimestampMs - this.lastHighPacketLossEventTimestampMs;
      if (
        timeSinceRedOff >= this.audioRedPacketLossLongEvalPeriodMs &&
        timeSinceLastHighPacketLossEvent < this.redRecoveryTimeMs
      ) {
        // This is probably not a transient high packet loss spike.
        // We need to turn off RED for awhile to avoid congestion collapse.
        return;
      } else {
        // Enable red as we've completed the recovery wait time.
        this.setRedundancyEnabled(true);
        this.maybeResetHoldDownTimer(currentTimestampMs);
      }
    }

    if (this.shouldUpdateAudioRedWorkerEncodings(currentTimestampMs, newNumRedundantEncodings)) {
      this.updateNumRedundantEncodings(maxLossPercent);
    }
  }

  /**
   * Calculate packet loss percentage for a given time window
   */
  private lossPercent(timeWindowMs: number): number {
    if (this.audioMetricsHistory.length < 2) {
      return 0;
    }
    const latestReceiverReportTimestampMs: number = this.audioMetricsHistory[
      this.audioMetricsHistory.length - 1
    ].timestampMs;
    const currentTotalPacketsSent: number = this.audioMetricsHistory[
      this.audioMetricsHistory.length - 1
    ].totalPacketsSent;
    const currentTotalPacketsLost: number = this.audioMetricsHistory[
      this.audioMetricsHistory.length - 1
    ].totalPacketsLost;

    // Iterate backwards in the metrics history, from the report immediately preceeding
    // the latest one, until we find the first metric report whose timestamp differs
    // from the latest report by atleast timeWindowMs
    for (let i = this.audioMetricsHistory.length - 2; i >= 0; i--) {
      if (
        latestReceiverReportTimestampMs - this.audioMetricsHistory[i].timestampMs >=
        timeWindowMs
      ) {
        const lossDelta = currentTotalPacketsLost - this.audioMetricsHistory[i].totalPacketsLost;
        const sentDelta = currentTotalPacketsSent - this.audioMetricsHistory[i].totalPacketsSent;
        const lossPercent = 100 * (lossDelta / sentDelta);
        return Math.max(0, Math.min(lossPercent, 100));
      }
    }
    // If we are here, we don't have enough entries in history
    // to calculate the loss for the given time window
    return 0;
  }

  /**
   * Returns the number of encodings based on packetLoss value. This is used by `DefaultTransceiverController` to
   * determine when to alert the encoder to update the number of encodings. It also determines if we need to
   * turn off red in cases of very high packet loss to avoid congestion collapse.
   */
  static getNumRedundantEncodingsForPacketLoss(packetLoss: number): [number, boolean] {
    let recommendedRedundantEncodings = 0;
    let shouldTurnOffRed = false;
    if (packetLoss <= 8) {
      recommendedRedundantEncodings = 0;
    } else if (packetLoss <= 18) {
      recommendedRedundantEncodings = 1;
    } else if (packetLoss <= 75) {
      recommendedRedundantEncodings = 2;
    } else {
      recommendedRedundantEncodings = 0;
      shouldTurnOffRed = true;
    }
    return [recommendedRedundantEncodings, shouldTurnOffRed];
  }

  /**
   * Check if we should update the worker encodings.
   * If newNumRedundantEncodings is the same as the current then we don't need to send a message to the red worker.
   * If newNumRedundantEncodings is less than the current, check if we've cleared the hold down time and only
   * then allow the update to be sent to the red worker.
   */
  private shouldUpdateAudioRedWorkerEncodings(
    currentTimestampMs: number,
    newNumRedundantEncodings: number
  ): boolean {
    if (this.currentNumRedundantEncodings === newNumRedundantEncodings) {
      this.maybeResetHoldDownTimer(currentTimestampMs);
      return false;
    }
    if (
      newNumRedundantEncodings < this.currentNumRedundantEncodings &&
      currentTimestampMs - this.lastRedHolddownTimerStartTimestampMs < this.audioRedHoldDownTimeMs
    ) {
      this.logger.debug(
        `[RED] Hold-down active: ${
          (currentTimestampMs - this.lastRedHolddownTimerStartTimestampMs) / 1000
        }s / ${this.audioRedHoldDownTimeMs / 1000}s`
      );
      return false;
    }
    this.currentNumRedundantEncodings = newNumRedundantEncodings;
    this.maybeResetHoldDownTimer(currentTimestampMs);
    return true;
  }

  /**
   * Reset hold down timer if needed
   */
  private maybeResetHoldDownTimer(currentTimestampMs: number): void {
    if (this.currentNumRedundantEncodings > 0) {
      this.lastRedHolddownTimerStartTimestampMs = currentTimestampMs;
    }
  }

  /**
   * Reset transform state
   */
  reset(): void {
    this.observers.clear();
    this.audioMetricsHistory = [];
  }

  /**
   * Add an observer to receive RED recovery metrics
   */
  addObserver(observer: RedundantAudioRecoveryMetricsObserver): void {
    this.observers.add(observer);
  }

  /**
   * Remove an observer
   */
  removeObserver(observer: RedundantAudioRecoveryMetricsObserver): void {
    this.observers.delete(observer);
  }

  /**
   * Update metrics from worker message
   */
  private updateMetrics(newMetrics: RedundantAudioMetrics): void {
    this.metrics = { ...newMetrics };
  }

  /**
   * Notify all observers with updated metrics
   */
  private notifyObservers(ssrc: number): void {
    if (this.observers.size === 0) {
      return;
    }

    // Create metric report for observers
    const report = new RedundantAudioRecoveryMetricReport();
    report.currentTimestampMs = Date.now();
    report.ssrc = ssrc;
    report.totalAudioPacketsLost = this.metrics.totalAudioPacketsLost;
    report.totalAudioPacketsExpected = this.metrics.totalAudioPacketsExpected;
    report.totalAudioPacketsRecoveredRed = this.metrics.totalAudioPacketsRecoveredRed;
    report.totalAudioPacketsRecoveredFec = this.metrics.totalAudioPacketsRecoveredFec;

    for (const observer of this.observers) {
      observer.recoveryMetricsDidReceive(report);
    }
  }
}
