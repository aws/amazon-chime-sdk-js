// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class ConnectionHealthData {
  connectionStartTimestampMs = 0;
  consecutiveStatsWithNoPackets = 0;
  consecutiveStatsWithNoAudioPacketsSent = 0;
  lastPacketLossInboundTimestampMs = 0;
  lastGoodSignalTimestampMs = 0;
  lastWeakSignalTimestampMs = 0;
  lastNoSignalTimestampMs = 0;
  consecutiveMissedPongs = 0;
  packetsReceivedInLastMinute: number[] = [];
  fractionPacketsLostInboundInLastMinute: number[] = [];
  audioSpeakerDelayMs = 0;
  isVideoEncoderHardware = false;
  videoEncodingTimeInMs = 0;
  cpuLimitationDuration = 0;
  videoInputFps = 0;
  videoEncodeFps = 0;

  constructor() {
    this.connectionStartTimestampMs = Date.now();
    this.lastGoodSignalTimestampMs = Date.now();
  }
  private static isTimestampRecent(timestampMs: number, recentDurationMs: number): boolean {
    return Date.now() < timestampMs + recentDurationMs;
  }

  setConnectionStartTime(): void {
    this.connectionStartTimestampMs = Date.now();
    this.lastGoodSignalTimestampMs = Date.now();
  }

  reset(): void {
    this.connectionStartTimestampMs = 0;
    this.consecutiveStatsWithNoPackets = 0;
    this.consecutiveStatsWithNoAudioPacketsSent = 0;
    this.lastPacketLossInboundTimestampMs = 0;
    this.lastGoodSignalTimestampMs = 0;
    this.lastWeakSignalTimestampMs = 0;
    this.lastNoSignalTimestampMs = 0;
    this.consecutiveMissedPongs = 0;
    this.packetsReceivedInLastMinute = [];
    this.fractionPacketsLostInboundInLastMinute = [];
    this.audioSpeakerDelayMs = 0;
    this.connectionStartTimestampMs = Date.now();
    this.lastGoodSignalTimestampMs = Date.now();
    this.isVideoEncoderHardware = false;
    this.videoEncodingTimeInMs = 0;
    this.cpuLimitationDuration = 0;
    this.videoInputFps = 0;
    this.videoEncodeFps = 0;
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
    cloned.consecutiveStatsWithNoAudioPacketsSent = this.consecutiveStatsWithNoAudioPacketsSent;
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
    cloned.isVideoEncoderHardware = this.isVideoEncoderHardware;
    cloned.videoEncodingTimeInMs = this.videoEncodingTimeInMs;
    cloned.cpuLimitationDuration = this.cpuLimitationDuration;
    cloned.videoInputFps = this.videoInputFps;
    cloned.videoEncodeFps = this.videoEncodeFps;
    return cloned;
  }
  setConsecutiveMissedPongs(pongs: number): void {
    this.consecutiveMissedPongs = pongs;
  }
  setConsecutiveStatsWithNoPackets(stats: number): void {
    this.consecutiveStatsWithNoPackets = stats;
  }
  setConsecutiveStatsWithNoAudioPacketsSent(stats: number): void {
    this.consecutiveStatsWithNoAudioPacketsSent = stats;
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
  setIsVideoEncoderHardware(isHardware: boolean): void {
    this.isVideoEncoderHardware = isHardware;
  }
  setVideoEncodingTimeInMs(stats: number): void {
    this.videoEncodingTimeInMs = stats;
  }
  setCpuLimitationDuration(stats: number): void {
    this.cpuLimitationDuration = stats;
  }
  setVideoInputFps(stats: number): void {
    this.videoInputFps = stats;
  }
  setVideoEncodeFps(stats: number): void {
    this.videoEncodeFps = stats;
  }
}
