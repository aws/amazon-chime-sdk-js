// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { ClientMetricReport } from 'amazon-chime-sdk-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AudioDiagnostics from './AudioDiagnostics';

function report(
  previousTimestampMs: number,
  currentTimestampMs: number,
  rtcStats: object[],
  customStatsReports: object[] = []
): ClientMetricReport {
  return {
    previousTimestampMs,
    currentTimestampMs,
    getRTCStatsReport: () => rtcStats,
    customStatsReports,
  } as unknown as ClientMetricReport;
}

function outboundAudio(packetsSent: number): object {
  return { type: 'outbound-rtp', kind: 'audio', packetsSent };
}

function redAudio(
  timestamp: number,
  expected: number,
  lost: number,
  red: number,
  fec: number
): object {
  return {
    type: 'inbound-rtp-red',
    kind: 'audio',
    timestamp,
    totalAudioPacketsExpected: expected,
    totalAudioPacketsLost: lost,
    totalAudioPacketsRecoveredRed: red,
    totalAudioPacketsRecoveredFec: fec,
  };
}

describe('AudioDiagnostics', () => {
  let debug: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs the audio send rate from the change in packets sent', () => {
    const diagnostics = new AudioDiagnostics();
    diagnostics.observe(report(0, 1_793_404_420_195, [outboundAudio(41)]));
    expect(debug).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();

    diagnostics.observe(
      report(1_793_404_420_195, 1_793_404_421_195, [
        { type: 'outbound-rtp', kind: 'video', packetsSent: 900 },
        outboundAudio(91),
      ])
    );
    expect(debug).toHaveBeenCalledWith('PPS:', 50);

    diagnostics.observe(report(1_793_404_421_195, 1_793_404_422_195, [outboundAudio(131)]));
    expect(error).toHaveBeenCalledWith('PPS:', 40);
    expect(debug).toHaveBeenCalledTimes(1);
  });

  it('describes RED and FEC recovery since the previous report', () => {
    const diagnostics = new AudioDiagnostics();
    expect(diagnostics.redRecoveryDescription).toBe('');

    diagnostics.observe(
      report(
        0,
        1000,
        [],
        [{ ...redAudio(1000, 50, 50, 50, 50), kind: 'video' }, redAudio(1000, 100, 10, 6, 2)]
      )
    );
    expect(diagnostics.redRecoveryDescription).toBe(
      'loss 10.0%, RED recovered 60.0%, FEC recovered 20.0%'
    );
    expect(debug).toHaveBeenCalledWith(
      '[AudioRed] time since last report = 0s, loss 10.0%, RED recovered 60.0%, FEC recovered 20.0%, total expected = 100, total lost = 10, total red recovered = 6, total fec recovered = 2'
    );

    diagnostics.observe(report(1000, 3000, [], [redAudio(3000, 300, 30, 16, 2)]));
    expect(diagnostics.redRecoveryDescription).toBe(
      'loss 10.0%, RED recovered 50.0%, FEC recovered 0.0%'
    );
    expect(debug).toHaveBeenLastCalledWith(
      '[AudioRed] time since last report = 2s, loss 10.0%, RED recovered 50.0%, FEC recovered 0.0%, total expected = 300, total lost = 30, total red recovered = 16, total fec recovered = 2'
    );
  });
});
