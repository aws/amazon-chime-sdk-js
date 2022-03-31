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
    let packetsReceived = 0;
    let fractionPacketsLostInbound = 0;
    const metricReport = clientMetricReport.getObservableMetrics();
    const potentialPacketsReceived = metricReport.audioPacketsReceived;
    const potentialFractionPacketsLostInbound = metricReport.audioPacketsReceivedFractionLoss;

    const audioSpeakerDelayMs = metricReport.audioSpeakerDelayMs;

    // Firefox does not presently have aggregated bandwidth estimation
    if (typeof audioSpeakerDelayMs === 'number' && !isNaN(audioSpeakerDelayMs)) {
      this.connectionHealthData.setAudioSpeakerDelayMs(audioSpeakerDelayMs);
    }

    if (
      typeof potentialPacketsReceived === 'number' &&
      typeof potentialFractionPacketsLostInbound === 'number'
    ) {
      packetsReceived = potentialPacketsReceived;
      fractionPacketsLostInbound = potentialFractionPacketsLostInbound;
      if (packetsReceived < 0 || fractionPacketsLostInbound < 0) {
        // TODO: getting negative numbers on this metric after reconnect sometimes
        // For now, just skip the metric if it looks weird.
        return;
      }
    } else {
      return;
    }
    this.addToMinuteWindow(this.connectionHealthData.packetsReceivedInLastMinute, packetsReceived);
    this.addToMinuteWindow(
      this.connectionHealthData.fractionPacketsLostInboundInLastMinute,
      fractionPacketsLostInbound
    );
    if (packetsReceived > 0) {
      this.hasSeenValidPacketMetricsBefore = true;
      this.connectionHealthData.setConsecutiveStatsWithNoPackets(0);
    } else if (this.hasSeenValidPacketMetricsBefore) {
      this.connectionHealthData.setConsecutiveStatsWithNoPackets(
        this.connectionHealthData.consecutiveStatsWithNoPackets + 1
      );
    }
    if (packetsReceived === 0 || fractionPacketsLostInbound > 0) {
      this.connectionHealthData.setLastPacketLossInboundTimestampMs(Date.now());
    }
    this.updateConnectionHealth();
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
