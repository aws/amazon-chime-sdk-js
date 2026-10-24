// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { ClientMetricReport } from 'amazon-chime-sdk-js';

/** Console diagnostics for the audio send rate and RED/FEC recovery; one instance per session. */
export default class AudioDiagnostics {
  private lastPacketsSent = 0;
  private lastTotalAudioPacketsExpected = 0;
  private lastTotalAudioPacketsLost = 0;
  private lastTotalAudioPacketsRecoveredRed = 0;
  private lastTotalAudioPacketsRecoveredFec = 0;
  private lastRedRecoveryMetricsReceived = 0;
  private lastRedRecoveryDescription = '';

  get redRecoveryDescription(): string {
    return this.lastRedRecoveryDescription;
  }

  observe(clientMetricReport: ClientMetricReport): void {
    this.logAudioStreamPPS(clientMetricReport);
    this.logRedRecoveryPercent(clientMetricReport);
  }

  private logAudioStreamPPS(clientMetricReport: ClientMetricReport): void {
    const { currentTimestampMs, previousTimestampMs } = clientMetricReport;
    const deltaTime = currentTimestampMs - previousTimestampMs;
    clientMetricReport.getRTCStatsReport().forEach(report => {
      if (report.type === 'outbound-rtp' && report.kind === 'audio') {
        // The first report has no previous timestamp, so no interval to measure over.
        if (previousTimestampMs <= 0) {
          this.lastPacketsSent = report.packetsSent;
          return;
        }
        const pps = (1000 * (report.packetsSent - this.lastPacketsSent)) / deltaTime;
        if (pps > 52 || pps < 47) {
          console.error('PPS:', pps);
        } else {
          console.debug('PPS:', pps);
        }
        this.lastPacketsSent = report.packetsSent;
      }
    });
  }

  private logRedRecoveryPercent(clientMetricReport: ClientMetricReport): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (clientMetricReport.customStatsReports as any[]).forEach(report => {
      if (report.type !== 'inbound-rtp-red' || report.kind !== 'audio') {
        return;
      }
      const deltaExpected = report.totalAudioPacketsExpected - this.lastTotalAudioPacketsExpected;
      const deltaLost = report.totalAudioPacketsLost - this.lastTotalAudioPacketsLost;
      const deltaRedRecovered =
        report.totalAudioPacketsRecoveredRed - this.lastTotalAudioPacketsRecoveredRed;
      const deltaFecRecovered =
        report.totalAudioPacketsRecoveredFec - this.lastTotalAudioPacketsRecoveredFec;
      if (this.lastRedRecoveryMetricsReceived === 0) {
        this.lastRedRecoveryMetricsReceived = report.timestamp;
      }
      const deltaTime = report.timestamp - this.lastRedRecoveryMetricsReceived;
      this.lastRedRecoveryMetricsReceived = report.timestamp;
      this.lastTotalAudioPacketsExpected = report.totalAudioPacketsExpected;
      this.lastTotalAudioPacketsLost = report.totalAudioPacketsLost;
      this.lastTotalAudioPacketsRecoveredRed = report.totalAudioPacketsRecoveredRed;
      this.lastTotalAudioPacketsRecoveredFec = report.totalAudioPacketsRecoveredFec;
      const lossPercent = deltaExpected > 0 ? (100 * deltaLost) / deltaExpected : 0;
      const redRecoveryPercent = deltaLost > 0 ? (100 * deltaRedRecovered) / deltaLost : 0;
      const fecRecoveryPercent = deltaLost > 0 ? (100 * deltaFecRecovered) / deltaLost : 0;
      this.lastRedRecoveryDescription = `loss ${lossPercent.toFixed(1)}%, RED recovered ${redRecoveryPercent.toFixed(1)}%, FEC recovered ${fecRecoveryPercent.toFixed(1)}%`;
      console.debug(
        `[AudioRed] time since last report = ${deltaTime / 1000}s, ${this.lastRedRecoveryDescription}, total expected = ${report.totalAudioPacketsExpected}, total lost = ${report.totalAudioPacketsLost}, total red recovered = ${report.totalAudioPacketsRecoveredRed}, total fec recovered = ${report.totalAudioPacketsRecoveredFec}`
      );
    });
  }
}
