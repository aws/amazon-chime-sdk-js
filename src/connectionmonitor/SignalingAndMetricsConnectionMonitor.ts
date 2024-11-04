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
  private hasSeenValidCandidatePairMetricsBefore = false;
  private lastTotalBytesReceived = 0;

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

    // To get the total bytes received, including RTCP, we need to sum up
    // all candidate pair metrics (in case the candidate pair changes).
    //
    // The stats collector currently doesn't account for candidate pair stats
    // so we just use the raw report for now.
    const webrtcReport = clientMetricReport.getRTCStatsReport();

    let totalBytesReceived = 0;
    webrtcReport.forEach(stat => {
      if (stat.type === 'candidate-pair' && stat.bytesReceived) {
        totalBytesReceived += stat.bytesReceived;
      }
    });
    const bytesReceived = totalBytesReceived - this.lastTotalBytesReceived;
    this.lastTotalBytesReceived = totalBytesReceived;
    if (
      typeof potentialAudioPacketsReceived === 'number' &&
      typeof potentialAudioFractionPacketsLostInbound === 'number'
    ) {
      audioPacketsReceived = potentialAudioPacketsReceived;
      audiofractionPacketsLostInbound = potentialAudioFractionPacketsLostInbound;
      if (audioPacketsReceived < 0 || audiofractionPacketsLostInbound < 0 || bytesReceived < 0) {
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

    // We use candidate pair bytes received as a proxy for packets received
    // since not all versions of all browsers have 'packetsReceived' for candidate pairs
    if (bytesReceived > 0) {
      this.hasSeenValidCandidatePairMetricsBefore = true;
      this.connectionHealthData.setConsecutiveStatsWithNoPackets(0);
    } else if (this.hasSeenValidCandidatePairMetricsBefore) {
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
    this.updateVideoEncodingHealth(clientMetricReport);
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

  private updateVideoEncodingHealth(clientMetricReport: ClientMetricReport): void {
    const isLocalVideoTileStarted = this.audioVideoController.videoTileController.hasStartedLocalVideoTile();
    const ssrcs = clientMetricReport.getVideoUpstreamSsrcs();
    if (!isLocalVideoTileStarted || ssrcs.length === 0) {
      this.connectionHealthData.setIsVideoEncoderHardware(false);
      this.connectionHealthData.setVideoEncodingTimeInMs(0);
      this.connectionHealthData.setCpuLimitationDuration(0);
      this.connectionHealthData.setVideoInputFps(0);
      this.connectionHealthData.setVideoEncodeFps(0);
      return;
    }

    var isHardwareEncoder = false;
    var videoEncodingTimeInMs = 0;
    var cpuLimitationDuration = 0;
    var videoInputFps = 0;
    var videoEncodeFps = 0;
    for (const ssrc of ssrcs) {
      isHardwareEncoder ||= Boolean(clientMetricReport.getObservableVideoMetricValue(
        'videoUpstreamEncoderImplementation',
        ssrc
      ));
      videoEncodingTimeInMs += clientMetricReport.getObservableVideoMetricValue(
        'videoUpstreamTotalEncodeTimePerSecond',
        ssrc
      );
      cpuLimitationDuration += clientMetricReport.getObservableVideoMetricValue(
        'videoUpstreamCpuQualityLimitationDurationPerSecond',
        ssrc
      );
      videoInputFps += clientMetricReport.getObservableVideoMetricValue(
        'videoUpstreamFramesInputPerSecond',
        ssrc
      );
      videoEncodeFps += clientMetricReport.getObservableVideoMetricValue(
        'videoUpstreamFramesEncodedPerSecond',
        ssrc
      );
    }

    this.connectionHealthData.setIsVideoEncoderHardware(Boolean(isHardwareEncoder));
    this.connectionHealthData.setVideoEncodingTimeInMs(videoEncodingTimeInMs);
    this.connectionHealthData.setCpuLimitationDuration(cpuLimitationDuration);
    this.connectionHealthData.setVideoInputFps(videoInputFps);
    this.connectionHealthData.setVideoEncodeFps(videoEncodeFps);
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
