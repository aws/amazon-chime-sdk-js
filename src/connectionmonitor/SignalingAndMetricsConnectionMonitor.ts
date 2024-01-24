// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import AudioVideoObserver from '../audiovideoobserver/AudioVideoObserver';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import ConnectionHealthData from '../connectionhealthpolicy/ConnectionHealthData';
import PingPong from '../pingpong/PingPong';
import PingPongObserver from '../pingpongobserver/PingPongObserver';
import RealtimeController from '../realtimecontroller/RealtimeController';
import StatsCollector from '../statscollector/StatsCollector';
import { Maybe } from '../utils/Types';
import ConnectionMonitor from './ConnectionMonitor';

export default class SignalingAndMetricsConnectionMonitor
  implements ConnectionMonitor, PingPongObserver, AudioVideoObserver {
  private isActive = false;
  private hasSeenValidPacketMetricsBefore = false;
  private lastTotalPacketsReceived = 0;

  constructor(
    private audioVideoController: AudioVideoController,
    private realtimeController: RealtimeController,
    private connectionHealthData: ConnectionHealthData,
    private pingPong: PingPong,
    private statsCollector: StatsCollector
  ) {
    this.realtimeController.realtimeSubscribeToLocalSignalStrengthChange(
      (signalStrength: number) => {
        if (this.isActive) {
          this.receiveSignalStrengthChange(signalStrength);
        }
      }
    );
  }

  start(): void {
    this.isActive = true;
    this.pingPong.addObserver(this);
    this.pingPong.start();
    this.audioVideoController.addObserver(this);
  }

  stop(): void {
    this.isActive = false;
    this.pingPong.removeObserver(this);
    this.pingPong.stop();
    this.audioVideoController.removeObserver(this);
  }

  receiveSignalStrengthChange(signalStrength: number): void {
    if (signalStrength === 0) {
      this.connectionHealthData.setLastNoSignalTimestampMs(Date.now());
    } else if (signalStrength <= 0.5) {
      this.connectionHealthData.setLastWeakSignalTimestampMs(Date.now());
    } else {
      this.connectionHealthData.setLastGoodSignalTimestampMs(Date.now());
    }
    this.updateConnectionHealth();
  }

  didReceivePong(_id: number, latencyMs: number, clockSkewMs: number): void {
    this.connectionHealthData.setConsecutiveMissedPongs(0);
    this.statsCollector.logLatency('ping_pong', latencyMs);
    this.statsCollector.logLatency('ping_pong_clock_skew', clockSkewMs);
    this.updateConnectionHealth();
  }

  didMissPongs(): void {
    this.connectionHealthData.setConsecutiveMissedPongs(
      this.connectionHealthData.consecutiveMissedPongs + 1
    );
    this.updateConnectionHealth();
  }

  metricsDidReceive(clientMetricReport: ClientMetricReport): void {
    let audioPacketsReceived = 0;
    let audiofractionPacketsLostInbound = 0;
    const metricReport = clientMetricReport.getObservableMetrics();
    const potentialAudioPacketsReceived = metricReport.audioPacketsReceived;
    const potentialAudioFractionPacketsLostInbound = metricReport.audioPacketsReceivedFractionLoss;

    const audioSpeakerDelayMs = metricReport.audioSpeakerDelayMs;

    // Firefox does not presently have aggregated bandwidth estimation
    if (typeof audioSpeakerDelayMs === 'number' && !isNaN(audioSpeakerDelayMs)) {
      this.connectionHealthData.setAudioSpeakerDelayMs(audioSpeakerDelayMs);
    }

    // To get the total packets received, including RTCP, we need to sum up
    // all candidate pair metrics (in case the candidate pair changes).
    //
    // The stats collector currently doesn't account for candidate pair stats
    // so we just use the raw report for now.
    const webrtcReport = clientMetricReport.getRTCStatsReport();

    let totalPacketsReceived = 0;
    webrtcReport.forEach(stat => {
      if (stat.type === 'candidate-pair' && stat.packetsReceived) {
        totalPacketsReceived += stat.packetsReceived;
      }
    });
    const packetsReceived = totalPacketsReceived - this.lastTotalPacketsReceived;
    this.lastTotalPacketsReceived = totalPacketsReceived;
    if (
      typeof potentialAudioPacketsReceived === 'number' &&
      typeof potentialAudioFractionPacketsLostInbound === 'number'
    ) {
      audioPacketsReceived = potentialAudioPacketsReceived;
      audiofractionPacketsLostInbound = potentialAudioFractionPacketsLostInbound;
      if (audioPacketsReceived < 0 || audiofractionPacketsLostInbound < 0 || packetsReceived < 0) {
        // The stats collector or logic above may emit negative numbers on this metric after reconnect
        // which we should not use.
        return;
      }
    } else {
      return;
    }
    this.addToMinuteWindow(
      this.connectionHealthData.packetsReceivedInLastMinute,
      audioPacketsReceived
    );
    this.addToMinuteWindow(
      this.connectionHealthData.fractionPacketsLostInboundInLastMinute,
      audiofractionPacketsLostInbound
    );
    if (packetsReceived > 0) {
      this.hasSeenValidPacketMetricsBefore = true;
      this.connectionHealthData.setConsecutiveStatsWithNoPackets(0);
    } else if (this.hasSeenValidPacketMetricsBefore) {
      this.connectionHealthData.setConsecutiveStatsWithNoPackets(
        this.connectionHealthData.consecutiveStatsWithNoPackets + 1
      );
    }
    if (audioPacketsReceived === 0 || audiofractionPacketsLostInbound > 0) {
      this.connectionHealthData.setLastPacketLossInboundTimestampMs(Date.now());
    }
    if (typeof metricReport.audioPacketsSent === 'number') {
      this.updateAudioPacketsSentInConnectionHealth(metricReport.audioPacketsSent);
    }
    this.updateConnectionHealth();
  }

  private updateAudioPacketsSentInConnectionHealth(audioPacketsSent: number): void {
    if (audioPacketsSent > 0) {
      this.connectionHealthData.setConsecutiveStatsWithNoAudioPacketsSent(0);
    } else {
      this.connectionHealthData.setConsecutiveStatsWithNoAudioPacketsSent(
        this.connectionHealthData.consecutiveStatsWithNoAudioPacketsSent + 1
      );
    }
  }

  private addToMinuteWindow(array: number[], value: number): void {
    array.unshift(value);
    if (array.length > 60) {
      array.pop();
    }
  }

  private updateConnectionHealth(): void {
    this.audioVideoController.forEachObserver((observer: AudioVideoObserver) => {
      Maybe.of(observer.connectionHealthDidChange).map(f =>
        f.bind(observer)(this.connectionHealthData.clone())
      );
    });
  }
}
