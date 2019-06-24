// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class ConnectionHealthData {
  connectionStartTimestampMs = 0;
  consecutiveStatsWithNoPackets = 0;
  lastPacketLossInboundTimestampMs = 0;
  lastGoodSignalTimestampMs = 0;
  lastWeakSignalTimestampMs = 0;
  lastNoSignalTimestampMs = 0;
  consecutiveMissedPongs = 0;
  packetsReceivedInLastMinute: number[] = [];
  fractionPacketsLostInboundInLastMinute: number[] = [];
  audioSpeakerDelayMs = 0;

  constructor() {
    this.connectionStartTimestampMs = Date.now();
    this.lastGoodSignalTimestampMs = Date.now();
  }
  private static isTimestampRecent(timestampMs: number, recentDurationMs: number): boolean {
    return Date.now() < timestampMs + recentDurationMs;
  }
  isConnectionStartRecent(recentDurationMs: number): boolean {
    return ConnectionHealthData.isTimestampRecent(
      this.connectionStartTimestampMs,
      recentDurationMs
    );
  }
  isLastPacketLossRecent(recentDurationMs: number): boolean {
    return ConnectionHealthData.isTimestampRecent(
      this.lastPacketLossInboundTimestampMs,
      recentDurationMs
    );
  }
  isGoodSignalRecent(recentDurationMs: number): boolean {
    return ConnectionHealthData.isTimestampRecent(this.lastGoodSignalTimestampMs, recentDurationMs);
  }
  isWeakSignalRecent(recentDurationMs: number): boolean {
    return ConnectionHealthData.isTimestampRecent(this.lastWeakSignalTimestampMs, recentDurationMs);
  }
  isNoSignalRecent(recentDurationMs: number): boolean {
    return ConnectionHealthData.isTimestampRecent(this.lastNoSignalTimestampMs, recentDurationMs);
  }
  clone(): ConnectionHealthData {
    const cloned = new ConnectionHealthData();
    cloned.connectionStartTimestampMs = this.connectionStartTimestampMs;
    cloned.consecutiveStatsWithNoPackets = this.consecutiveStatsWithNoPackets;
    cloned.lastPacketLossInboundTimestampMs = this.lastPacketLossInboundTimestampMs;
    cloned.lastGoodSignalTimestampMs = this.lastGoodSignalTimestampMs;
    cloned.lastWeakSignalTimestampMs = this.lastWeakSignalTimestampMs;
    cloned.lastNoSignalTimestampMs = this.lastNoSignalTimestampMs;
    cloned.consecutiveMissedPongs = this.consecutiveMissedPongs;
    cloned.packetsReceivedInLastMinute = this.packetsReceivedInLastMinute.slice(0);
    cloned.fractionPacketsLostInboundInLastMinute = this.fractionPacketsLostInboundInLastMinute.slice(
      0
    );
    cloned.audioSpeakerDelayMs = this.audioSpeakerDelayMs;
    return cloned;
  }
  setConsecutiveMissedPongs(pongs: number): void {
    this.consecutiveMissedPongs = pongs;
  }
  setConsecutiveStatsWithNoPackets(stats: number): void {
    this.consecutiveStatsWithNoPackets = stats;
  }
  setLastPacketLossInboundTimestampMs(timeStamp: number): void {
    this.lastPacketLossInboundTimestampMs = timeStamp;
  }
  setLastNoSignalTimestampMs(timeStamp: number): void {
    this.lastNoSignalTimestampMs = timeStamp;
  }
  setLastWeakSignalTimestampMs(timeStamp: number): void {
    this.lastWeakSignalTimestampMs = timeStamp;
  }
  setLastGoodSignalTimestampMs(timeStamp: number): void {
    this.lastGoodSignalTimestampMs = timeStamp;
  }
  setAudioSpeakerDelayMs(delayMs: number): void {
    this.audioSpeakerDelayMs = delayMs;
  }
}
