// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { niceMax, seriesPath } from '../ui/LineChart';
import { backgroundSampleFrom, sampleFrom } from './StatsPanel';

describe('sampleFrom', () => {
  it('converts bitrates to kbps and combines streams across attendees and layers', () => {
    const sample = sampleFrom({
      getObservableMetrics: () => ({
        availableOutgoingBitrate: 1_500_000,
        availableIncomingBitrate: 3_000_000,
        currentRoundTripTimeMs: 42,
        audioPacketLossPercent: 1,
        audioPacketsReceivedFractionLoss: 2,
        audioUpstreamLevel: 0.25,
        audioSpeakerDelayMs: 80,
      }),
      getObservableVideoMetrics: () => ({
        self: {
          1: {
            videoUpstreamBitrate: 600_000,
            videoUpstreamFramesEncodedPerSecond: 15,
            videoUpstreamFramesInputPerSecond: 15,
            videoUpstreamFrameHeight: 540,
            videoUpstreamTotalEncodeTimePerSecond: 60,
            videoUpstreamCpuQualityLimitationDurationPerSecond: 250,
          },
          2: {
            videoUpstreamBitrate: 200_000,
            videoUpstreamFramesEncodedPerSecond: 5,
            videoUpstreamFrameHeight: 270,
            videoUpstreamTotalEncodeTimePerSecond: 20,
          },
        },
        bob: {
          3: {
            videoDownstreamBitrate: 900_000,
            videoDownstreamFramesDecodedPerSecond: 30,
            videoDownstreamPacketLossPercent: 4,
            videoDownstreamFrameHeight: 720,
          },
        },
        carol: {
          4: {
            videoDownstreamBitrate: 100_000,
            videoDownstreamFramesDecodedPerSecond: 10,
            videoDownstreamPacketLossPercent: 0,
          },
        },
      }),
    });
    expect(sample).toMatchObject({
      availableSendKbps: 1500,
      availableReceiveKbps: 3000,
      videoSentKbps: 800,
      videoReceivedKbps: 1000,
      roundTripMs: 42,
      audioReceivedJitterMs: undefined,
      audioSentLossPercent: 1,
      audioReceivedLossPercent: 2,
      microphoneLevelPercent: 25,
      speakerDelayMs: 80,
      videoReceivedLossPercent: 2,
      framesCapturedPerSecond: 15,
      framesSentPerSecond: 15,
      framesReceivedPerSecond: 20,
      sentHeight: 540,
      receivedHeight: 720,
      // 80 ms of encoding across both layers over their 20 frames.
      encodeMsPerFrame: 4,
      cpuLimitedPercent: 25,
    });
  });

  it('leaves video values empty when nobody is sending video', () => {
    const sample = sampleFrom({
      getObservableMetrics: () => ({ availableOutgoingBitrate: NaN }),
      getObservableVideoMetrics: () => ({}),
    });
    expect(sample.availableSendKbps).toBeUndefined();
    expect(sample.videoSentKbps).toBeUndefined();
    expect(sample.framesReceivedPerSecond).toBeUndefined();
  });
});

describe('LineChart helpers', () => {
  it('rounds the axis up to 1, 2 or 5 times a power of ten, never below the floor', () => {
    expect(niceMax(0, 100)).toBe(100);
    expect(niceMax(130, 100)).toBe(200);
    expect(niceMax(2400, 100)).toBe(5000);
    expect(niceMax(0.3, 2)).toBe(2);
  });

  it('right-aligns the newest sample and breaks the line at gaps', () => {
    expect(seriesPath([10, undefined, 20], 3, 20)).toBe('M0.0,32.0M240.0,0.0');
    expect(seriesPath([5], 3, 10)).toBe('M240.0,32.0');
  });
});

describe('backgroundSampleFrom', () => {
  it('reads the processor report, and nothing when there is none', () => {
    expect(backgroundSampleFrom(undefined)).toEqual({});
    expect(backgroundSampleFrom({ effect: 'blur' })).toEqual({});
    expect(
      backgroundSampleFrom({
        effect: 'blur',
        processor: {
          segmentationDurationMs: 7.3,
          effectRenderDurationMs: 0.2,
          framesPerSegmentation: 2,
          framesSubmitted: 13,
          framesSegmented: 6,
          estimatedCPUUsagePercentage: 2.4,
          modelType: 'selfie_multiclass',
          delegateType: 'GPU',
          errorCount: 0,
        },
      })
    ).toEqual({
      segmentationMs: 7.3,
      renderMs: 0.2,
      cpuPercent: 2.4,
      framesSubmittedPerSecond: 13,
      framesSegmentedPerSecond: 6,
      framesPerSegmentation: 2,
    });
  });
});
