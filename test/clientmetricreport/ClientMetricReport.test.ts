// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import ClientMetricReport from '../../src/clientmetricreport/ClientMetricReport';
import Direction from '../../src/clientmetricreport/ClientMetricReportDirection';
import MediaType from '../../src/clientmetricreport/ClientMetricReportMediaType';
import GlobalMetricReport from '../../src/clientmetricreport/GlobalMetricReport';
import StreamMetricReport from '../../src/clientmetricreport/StreamMetricReport';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import {
  SdkIndexFrame,
  SdkMetric,
  SdkStreamDescriptor,
  SdkStreamMediaType,
} from '../../src/signalingprotocol/SignalingProtocol';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';

describe('ClientMetricReport', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let clientMetricReport: ClientMetricReport;
  const selfAttendeeId = 'attendee-1';

  function prepareIndex(streamIds: number[]): DefaultVideoStreamIndex {
    const index: DefaultVideoStreamIndex = new DefaultVideoStreamIndex(new NoOpDebugLogger());
    const sources: SdkStreamDescriptor[] = [];
    for (const id of streamIds) {
      sources.push(
        new SdkStreamDescriptor({
          streamId: id,
          groupId: id,
          maxBitrateKbps: 100,
          mediaType: SdkStreamMediaType.VIDEO,
          attendeeId: `attendee-${id}`,
        })
      );
    }
    index.integrateIndexFrame(
      new SdkIndexFrame({
        atCapacity: false,
        sources: sources,
      })
    );
    return index;
  }

  beforeEach(() => {
    const index = prepareIndex([1, 2]);
    clientMetricReport = new ClientMetricReport(new NoOpDebugLogger(), index, selfAttendeeId);
  });

  describe('identityValue', () => {
    it('returns NaN if not passing both metric name and ssrc', () => {
      expect(isNaN(clientMetricReport.identityValue())).to.be.true;
    });

    it('returns NaN if the global metric does not exist', () => {
      expect(isNaN(clientMetricReport.identityValue('metric-name'))).to.be.true;
    });

    it('returns NaN if the stream metric does not exist', () => {
      const ssrc = 1;
      clientMetricReport.streamMetricReports[ssrc] = new StreamMetricReport();
      expect(isNaN(clientMetricReport.identityValue('metric-name', ssrc))).to.be.true;
    });

    it('returns the metric', () => {
      const metricName = 'metric-name';
      const metricValue = 99;
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics[metricName] = metricValue;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.identityValue('metric-name', ssrc)).to.equal(metricValue);
    });
  });

  describe('decoderLossPercent', () => {
    const metricName = 'this-name-is-ignored';

    it('returns 0 if received samples is 0', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics['concealedSamples'] = 0;
      report.currentMetrics['totalSamplesReceived'] = 0;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.decoderLossPercent(metricName, ssrc)).to.equal(0);
    });

    it('returns 100 if every sample was concealed', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics['concealedSamples'] = 1;
      report.currentMetrics['totalSamplesReceived'] = 1;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.decoderLossPercent(metricName, ssrc)).to.equal(100);
    });

    it('returns at most 100 if more samples were concealed than received', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics['concealedSamples'] = 960;
      report.currentMetrics['totalSamplesReceived'] = 480;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.decoderLossPercent(metricName, ssrc)).to.equal(100);
    });

    it('returns the loss percent', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics['concealedSamples'] = 1;
      report.currentMetrics['totalSamplesReceived'] = 2;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.decoderLossPercent(metricName, ssrc)).to.equal((1 * 100) / 2);
    });
  });

  describe('packetLossPercent', () => {
    const metricName = 'metric-name';

    it('returns 0 if the total number of sent/received and lost is 0', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics[metricName] = 0;
      report.currentMetrics['packetsLost'] = 0;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.packetLossPercent(metricName, ssrc)).to.equal(0);
    });

    it('returns 0 if the lost count is 0', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics[metricName] = 10;
      report.currentMetrics['packetsLost'] = 0;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.packetLossPercent(metricName, ssrc)).to.equal(0);
    });

    it('returns the loss percent', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics[metricName] = 10;
      report.currentMetrics['packetsLost'] = 5;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.packetLossPercent(metricName, ssrc)).to.equal((5 * 100) / 15);
    });
  });

  describe('countPerSecond', () => {
    const metricName = 'metric-name';

    it('returns 0 if the interval is 0', () => {
      const report = new GlobalMetricReport();
      clientMetricReport.globalMetricReport = report;
      clientMetricReport.currentTimestampMs = 0;
      clientMetricReport.previousTimestampMs = 0;
      expect(clientMetricReport.countPerSecond(metricName)).to.equal(0);
    });

    it('returns 0 if the diff is 0', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics[metricName] = 0;
      clientMetricReport.globalMetricReport = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 0;
      expect(clientMetricReport.countPerSecond(metricName)).to.equal(0);
    });

    it('returns the count per second', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics[metricName] = 1000;
      clientMetricReport.globalMetricReport = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 0;
      expect(clientMetricReport.countPerSecond(metricName)).to.equal(1000);
    });

    it('returns the count from the stream metric reports', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics[metricName] = 1000;
      clientMetricReport.streamMetricReports[ssrc] = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      expect(clientMetricReport.countPerSecond(metricName, ssrc)).to.equal(1000);
    });
  });

  describe('bitsPerSecond', () => {
    const metricName = 'metric-name';

    it('returns 0 if the interval is 0', () => {
      const report = new GlobalMetricReport();
      clientMetricReport.globalMetricReport = report;
      clientMetricReport.currentTimestampMs = 0;
      clientMetricReport.previousTimestampMs = 0;
      expect(clientMetricReport.bitsPerSecond(metricName)).to.equal(0);
    });

    it('returns 0 if the diff is 0', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics[metricName] = 0;
      clientMetricReport.globalMetricReport = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 0;
      expect(clientMetricReport.bitsPerSecond(metricName)).to.equal(0);
    });

    it('returns the count per second', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics[metricName] = 1000;
      clientMetricReport.globalMetricReport = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 0;
      expect(clientMetricReport.bitsPerSecond(metricName)).to.equal(8000);
    });

    it('returns the count from the stream metric reports', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics[metricName] = 1000;
      clientMetricReport.streamMetricReports[ssrc] = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      expect(clientMetricReport.bitsPerSecond(metricName, ssrc)).to.equal(8000);
    });
  });

  describe('secondsToMilliseconds', () => {
    const metricName = 'metric-name';

    it('returns NaN if the current metric does not exist', () => {
      const report = new GlobalMetricReport();
      clientMetricReport.globalMetricReport = report;
      expect(isNaN(clientMetricReport.secondsToMilliseconds(metricName))).to.be.true;
    });

    it('returns the converted value', () => {
      const report = new GlobalMetricReport();
      clientMetricReport.globalMetricReport = report;
      report.currentMetrics[metricName] = 1;
      expect(clientMetricReport.secondsToMilliseconds(metricName)).to.equal(1000);
    });

    it('returns the converted value from the stream metric reports', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics[metricName] = 1;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.secondsToMilliseconds(metricName, ssrc)).to.equal(1000);
    });
  });

  describe('jitterBufferMs', () => {
    const metricName = 'this-name-is-ignored';

    it('returns 0 if jitter buffer delay is 0', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics['jitterBufferDelay'] = 0;
      report.currentMetrics['jitterBufferEmittedCount'] = 1;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.jitterBufferMs(metricName, ssrc)).to.equal(0);
    });

    it('returns 0 if jitter buffer emitted count is 0', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics['jitterBufferDelay'] = 1;
      report.currentMetrics['jitterBufferEmittedCount'] = 0;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.jitterBufferMs(metricName, ssrc)).to.equal(0);
    });

    it('returns the jitter buffer ms from the stream metric reports', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics['jitterBufferDelay'] = 1;
      report.currentMetrics['jitterBufferEmittedCount'] = 2;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.jitterBufferMs(metricName, ssrc)).to.equal((1 / 2) * 1000);
    });
  });

  describe('processingDelayMs', () => {
    it('returns the processing delay per decoded frame in ms since the previous report', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.previousMetrics['totalProcessingDelay'] = 1.0;
      report.currentMetrics['totalProcessingDelay'] = 1.6;
      report.previousMetrics['framesDecoded'] = 100;
      report.currentMetrics['framesDecoded'] = 130;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.processingDelayMs('totalProcessingDelay', ssrc)).to.be.closeTo(
        20,
        1e-9
      );
    });
  });

  describe('packetSendDelayMs', () => {
    it('returns the pacer delay per sent packet in ms since the previous report', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.previousMetrics['totalPacketSendDelay'] = 0.2;
      report.currentMetrics['totalPacketSendDelay'] = 0.5;
      report.previousMetrics['packetsSent'] = 1000;
      report.currentMetrics['packetsSent'] = 1600;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.packetSendDelayMs('totalPacketSendDelay', ssrc)).to.be.closeTo(
        0.5,
        1e-9
      );
    });
  });

  describe('inter-frame delay', () => {
    const reportWith = (
      current: { [name: string]: number },
      previous: { [name: string]: number } = {}
    ): void => {
      const report = new StreamMetricReport();
      Object.assign(report.currentMetrics, current);
      Object.assign(report.previousMetrics, previous);
      clientMetricReport.streamMetricReports[1] = report;
    };

    it('returns the mean and standard deviation of the inter-frame delay in ms since the previous report', () => {
      // 15 frames 20 ms apart and 15 frames 46 ms apart
      reportWith(
        { framesDecoded: 130, totalInterFrameDelay: 10.99, totalSquaredInterFrameDelay: 1.03774 },
        { framesDecoded: 100, totalInterFrameDelay: 10, totalSquaredInterFrameDelay: 1 }
      );
      expect(clientMetricReport.interFrameDelayMs('totalInterFrameDelay', 1)).to.be.closeTo(
        33,
        1e-6
      );
      expect(
        clientMetricReport.interFrameDelayStandardDeviationMs('totalSquaredInterFrameDelay', 1)
      ).to.be.closeTo(13, 1e-6);
    });

    it('returns 0 without decoded frames, and no negative variance', () => {
      reportWith(
        { framesDecoded: 100, totalInterFrameDelay: 1, totalSquaredInterFrameDelay: 1 },
        { framesDecoded: 100 }
      );
      expect(
        clientMetricReport.interFrameDelayStandardDeviationMs('totalSquaredInterFrameDelay', 1)
      ).to.equal(0);
      reportWith({ framesDecoded: 10, totalInterFrameDelay: 1, totalSquaredInterFrameDelay: 0.01 });
      expect(
        clientMetricReport.interFrameDelayStandardDeviationMs('totalSquaredInterFrameDelay', 1)
      ).to.equal(0);
    });
  });

  describe('audio concealment and playout', () => {
    const reportWith = (
      current: { [name: string]: number },
      previous: { [name: string]: number } = {}
    ): void => {
      const report = new StreamMetricReport();
      Object.assign(report.currentMetrics, current);
      Object.assign(report.previousMetrics, previous);
      clientMetricReport.streamMetricReports[1] = report;
    };

    it('returns the audible concealed samples as a percent of the samples received', () => {
      reportWith(
        { totalSamplesReceived: 96000, concealedSamples: 1960, silentConcealedSamples: 1480 },
        { totalSamplesReceived: 48000, concealedSamples: 1000, silentConcealedSamples: 1000 }
      );
      expect(clientMetricReport.audibleConcealmentPercent('silentConcealedSamples', 1)).to.equal(1);
    });

    it('keeps the audible concealed percent between 0 and 100', () => {
      reportWith({ totalSamplesReceived: 0, concealedSamples: 10 });
      expect(clientMetricReport.audibleConcealmentPercent('silentConcealedSamples', 1)).to.equal(0);
      reportWith({ totalSamplesReceived: 480, concealedSamples: 100, silentConcealedSamples: 200 });
      expect(clientMetricReport.audibleConcealmentPercent('silentConcealedSamples', 1)).to.equal(0);
      reportWith({ totalSamplesReceived: 480, concealedSamples: 960, silentConcealedSamples: 0 });
      expect(clientMetricReport.audibleConcealmentPercent('silentConcealedSamples', 1)).to.equal(
        100
      );
    });

    it('returns time-stretched samples as a percent of the samples received', () => {
      reportWith(
        { totalSamplesReceived: 96000, removedSamplesForAcceleration: 340 },
        { totalSamplesReceived: 48000, removedSamplesForAcceleration: 100 }
      );
      expect(
        clientMetricReport.percentOfSamplesReceived('removedSamplesForAcceleration', 1)
      ).to.equal(0.5);
      reportWith({ totalSamplesReceived: 0, insertedSamplesForDeceleration: 10 });
      expect(
        clientMetricReport.percentOfSamplesReceived('insertedSamplesForDeceleration', 1)
      ).to.equal(0);
    });

    it('returns the average playout delay per sample in ms', () => {
      clientMetricReport.globalMetricReport.previousMetrics['totalPlayoutDelay'] = 100;
      clientMetricReport.globalMetricReport.currentMetrics['totalPlayoutDelay'] = 2500;
      clientMetricReport.globalMetricReport.previousMetrics['totalSamplesCount'] = 48000;
      clientMetricReport.globalMetricReport.currentMetrics['totalSamplesCount'] = 96000;
      expect(clientMetricReport.playoutDelayMs('totalPlayoutDelay')).to.be.closeTo(50, 1e-9);
      clientMetricReport.globalMetricReport.currentMetrics['totalSamplesCount'] = 48000;
      expect(clientMetricReport.playoutDelayMs('totalPlayoutDelay')).to.equal(0);
    });

    it('starts the playout delay from the first report and returns 0 without delay', () => {
      clientMetricReport.globalMetricReport.currentMetrics['totalPlayoutDelay'] = 2400;
      clientMetricReport.globalMetricReport.currentMetrics['totalSamplesCount'] = 48000;
      expect(clientMetricReport.playoutDelayMs('totalPlayoutDelay')).to.be.closeTo(50, 1e-9);
      clientMetricReport.globalMetricReport.previousMetrics['totalPlayoutDelay'] = 2400;
      clientMetricReport.globalMetricReport.previousMetrics['totalSamplesCount'] = 0;
      expect(clientMetricReport.playoutDelayMs('totalPlayoutDelay')).to.equal(0);
    });
  });

  describe('jitterBufferTargetDelayMs', () => {
    it('returns the target delay per emitted frame in ms since the previous report', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.previousMetrics['jitterBufferTargetDelay'] = 1.5;
      report.currentMetrics['jitterBufferTargetDelay'] = 4.5;
      report.previousMetrics['jitterBufferEmittedCount'] = 10;
      report.currentMetrics['jitterBufferEmittedCount'] = 40;
      report.currentMetrics['jitterBufferDelay'] = 9;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(
        clientMetricReport.jitterBufferTargetDelayMs('jitterBufferTargetDelay', ssrc)
      ).to.equal(100);
    });

    it('returns 0 if no frame was emitted since the previous report', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.previousMetrics['jitterBufferTargetDelay'] = 1.5;
      report.currentMetrics['jitterBufferTargetDelay'] = 4.5;
      report.previousMetrics['jitterBufferEmittedCount'] = 40;
      report.currentMetrics['jitterBufferEmittedCount'] = 40;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(
        clientMetricReport.jitterBufferTargetDelayMs('jitterBufferTargetDelay', ssrc)
      ).to.equal(0);
    });
  });

  describe('averageTimeSpentPerSecondInMilliseconds', () => {
    const metricName = 'metric-name';

    it('returns 0 if the interval is 0', () => {
      const report = new GlobalMetricReport();
      clientMetricReport.globalMetricReport = report;
      clientMetricReport.currentTimestampMs = 0;
      clientMetricReport.previousTimestampMs = 0;
      expect(clientMetricReport.averageTimeSpentPerSecondInMilliseconds(metricName)).to.equal(0);
    });

    it('returns 0 if the diff is 0', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics[metricName] = 0;
      clientMetricReport.globalMetricReport = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 0;
      expect(clientMetricReport.averageTimeSpentPerSecondInMilliseconds(metricName)).to.equal(0);
    });

    it('interval is 1 second if pervious timestamp is 0', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics[metricName] = 0.1;
      clientMetricReport.globalMetricReport = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 0;
      expect(clientMetricReport.averageTimeSpentPerSecondInMilliseconds(metricName)).to.equal(100);
    });

    it('returns the count from the stream metric reports', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics[metricName] = 0.1;
      clientMetricReport.streamMetricReports[ssrc] = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      expect(clientMetricReport.averageTimeSpentPerSecondInMilliseconds(metricName, ssrc)).to.equal(
        100
      );
    });
  });

  describe('isHardwareImplementation', () => {
    const metricName = 'metric-name';

    it('return 0 for software implementation FFmpeg', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentStringMetrics[metricName] = 'FFmpeg';
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.isHardwareImplementation(metricName, ssrc)).to.equal(0);
    });

    it('return 0 for software implementation OpenH264', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentStringMetrics[metricName] = 'OpenH264';
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.isHardwareImplementation(metricName, ssrc)).to.equal(0);
    });

    it('return 0 for software implementation libvpx', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentStringMetrics[metricName] = 'libvpx';
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.isHardwareImplementation(metricName, ssrc)).to.equal(0);
    });

    it('return 1 for hardware implementation with ExternalDecoder', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentStringMetrics[metricName] = 'ExternalDecoder (VDAVideoDecoder)';
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.isHardwareImplementation(metricName, ssrc)).to.equal(1);
    });

    it('return 1 for hardware implementation with ExternalEncoder', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentStringMetrics[metricName] = 'ExternalEncoder';
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.isHardwareImplementation(metricName, ssrc)).to.equal(1);
    });

    it('return 1 for hardware implementation with HardwareAccelerator', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentStringMetrics[metricName] = 'MediaFoundationVideoEncodeAccelerator';
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.isHardwareImplementation(metricName, ssrc)).to.equal(1);
    });

    it('return 0 for implementation fallback from hardware', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentStringMetrics[metricName] =
        'FFmpeg (fallback from: ExternalDecoder (VDAVideoDecoder)';
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.isHardwareImplementation(metricName, ssrc)).to.equal(0);
    });
  });

  describe('qualityLimitationReasonCode', () => {
    const metricName = 'qualityLimitationReason';

    it('returns NaN if the stream has no quality limitation reason', () => {
      const ssrc = 1;
      clientMetricReport.streamMetricReports[ssrc] = new StreamMetricReport();
      expect(clientMetricReport.qualityLimitationReasonCode(metricName, ssrc)).to.be.NaN;
    });

    it('returns the code the native client sends for each reason', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      clientMetricReport.streamMetricReports[ssrc] = report;
      const codes: [string, number][] = [
        ['none', 0],
        ['cpu', 1],
        ['bandwidth', 2],
        ['other', 3],
      ];
      for (const [reason, code] of codes) {
        report.currentStringMetrics[metricName] = reason;
        expect(clientMetricReport.qualityLimitationReasonCode(metricName, ssrc), reason).to.equal(
          code
        );
      }
    });
  });

  describe('averageCpuQualityLimitationDurationPerSecondInMilliseconds', () => {
    const metricName = 'metric-name';

    it('return 0 when interval is non-positive', () => {
      const ssrc = 1;
      clientMetricReport.currentTimestampMs = 1000;
      clientMetricReport.previousTimestampMs = 1000;
      const report = new StreamMetricReport();
      report.previousObjectMetrics[metricName] = {
        cpu: 1.0,
        other: 0.0,
      };
      report.currentObjectMetrics[metricName] = {
        cpu: 1.0,
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(
        clientMetricReport.averageCpuQualityLimitationDurationPerSecondInMilliseconds(
          metricName,
          ssrc
        )
      ).to.equal(0);
    });

    it('return 0 when there is no current value', () => {
      const ssrc = 1;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      const report = new StreamMetricReport();
      report.previousObjectMetrics[metricName] = {
        cpu: 1.0,
        other: 0.0,
      };
      report.currentObjectMetrics[metricName] = {
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(
        clientMetricReport.averageCpuQualityLimitationDurationPerSecondInMilliseconds(
          metricName,
          ssrc
        )
      ).to.equal(0);
    });

    it('derive the correct value', () => {
      const ssrc = 1;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      const report = new StreamMetricReport();
      report.previousObjectMetrics[metricName] = {
        cpu: 1.0,
        other: 0.0,
      };
      report.currentObjectMetrics[metricName] = {
        cpu: 2.0,
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(
        clientMetricReport.averageCpuQualityLimitationDurationPerSecondInMilliseconds(
          metricName,
          ssrc
        )
      ).to.equal(1000);
    });

    it('return 0 when diff is negative', () => {
      const ssrc = 1;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      const report = new StreamMetricReport();
      report.previousObjectMetrics[metricName] = {
        cpu: 1.0,
        other: 0.0,
      };
      report.currentObjectMetrics[metricName] = {
        cpu: 0.0,
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(
        clientMetricReport.averageCpuQualityLimitationDurationPerSecondInMilliseconds(
          metricName,
          ssrc
        )
      ).to.equal(0);
    });

    it('treat undefined previous value as 0', () => {
      const ssrc = 1;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      const report = new StreamMetricReport();
      report.previousObjectMetrics[metricName] = {
        other: 0.0,
      };
      report.currentObjectMetrics[metricName] = {
        cpu: 0.5,
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(
        clientMetricReport.averageCpuQualityLimitationDurationPerSecondInMilliseconds(
          metricName,
          ssrc
        )
      ).to.equal(500);
    });

    it('treat interval is 1 when previous timestamp is not positive', () => {
      const ssrc = 1;
      clientMetricReport.currentTimestampMs = 10;
      clientMetricReport.previousTimestampMs = 0;
      const report = new StreamMetricReport();
      report.previousObjectMetrics[metricName] = {
        cpu: 0.0,
        other: 0.0,
      };
      report.currentObjectMetrics[metricName] = {
        cpu: 1.0,
        other: 0.0,
      };
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(
        clientMetricReport.averageCpuQualityLimitationDurationPerSecondInMilliseconds(
          metricName,
          ssrc
        )
      ).to.equal(1000);
    });
  });

  describe('getMetricMap', () => {
    it('returns the global metric map if not passing the media type and the direction', () => {
      expect(clientMetricReport.getMetricMap()).to.equal(clientMetricReport.globalMetricMap);
    });

    it('returns audio upstream metric map', () => {
      expect(clientMetricReport.getMetricMap(MediaType.AUDIO, Direction.UPSTREAM)).to.equal(
        clientMetricReport.audioUpstreamMetricMap
      );
    });

    it('returns audio downstream metric map', () => {
      expect(clientMetricReport.getMetricMap(MediaType.AUDIO, Direction.DOWNSTREAM)).to.equal(
        clientMetricReport.audioDownstreamMetricMap
      );
    });

    it('returns video upstream metric map', () => {
      expect(clientMetricReport.getMetricMap(MediaType.VIDEO, Direction.UPSTREAM)).to.equal(
        clientMetricReport.videoUpstreamMetricMap
      );
    });

    it('returns video downstream metric map', () => {
      expect(clientMetricReport.getMetricMap(MediaType.VIDEO, Direction.DOWNSTREAM)).to.equal(
        clientMetricReport.videoDownstreamMetricMap
      );
    });
  });

  describe('transform metric fields', () => {
    it('audioUpstreamMetricMap contains audioSentTransformPps', () => {
      expect(clientMetricReport.audioUpstreamMetricMap['audioSentTransformPps']).to.not.be
        .undefined;
      expect(clientMetricReport.audioUpstreamMetricMap['audioSentTransformPps'].transform).to.equal(
        clientMetricReport.countPerSecond
      );
    });

    it('audioDownstreamMetricMap contains audioReceivedTransformPps', () => {
      expect(clientMetricReport.audioDownstreamMetricMap['audioReceivedTransformPps']).to.not.be
        .undefined;
      expect(
        clientMetricReport.audioDownstreamMetricMap['audioReceivedTransformPps'].transform
      ).to.equal(clientMetricReport.countPerSecond);
    });

    it('videoUpstreamMetricMap contains videoSentTransformPps', () => {
      expect(clientMetricReport.videoUpstreamMetricMap['videoSentTransformPps']).to.not.be
        .undefined;
      expect(clientMetricReport.videoUpstreamMetricMap['videoSentTransformPps'].transform).to.equal(
        clientMetricReport.countPerSecond
      );
    });

    it('videoDownstreamMetricMap contains videoReceivedTransformPps', () => {
      expect(clientMetricReport.videoDownstreamMetricMap['videoReceivedTransformPps']).to.not.be
        .undefined;
      expect(
        clientMetricReport.videoDownstreamMetricMap['videoReceivedTransformPps'].transform
      ).to.equal(clientMetricReport.countPerSecond);
    });

    it('videoDownstreamMetricMap contains retransmittedBytesReceived', () => {
      expect(clientMetricReport.videoDownstreamMetricMap['retransmittedBytesReceived']).to.not.be
        .undefined;
      expect(
        clientMetricReport.videoDownstreamMetricMap['retransmittedBytesReceived'].transform
      ).to.equal(clientMetricReport.bitsPerSecond);
      expect(
        clientMetricReport.videoDownstreamMetricMap['retransmittedBytesReceived'].type
      ).to.equal(SdkMetric.Type.VIDEO_RECEIVED_RETRANSMIT_BITRATE);
    });

    it('videoDownstreamMetricMap reports totalProcessingDelay and framesReceived per second', () => {
      const map = clientMetricReport.videoDownstreamMetricMap;
      expect(map['totalProcessingDelay'].transform).to.equal(clientMetricReport.processingDelayMs);
      expect(map['totalProcessingDelay'].type).to.equal(SdkMetric.Type.VIDEO_PROCESSING_TIME);
      expect(map['framesReceived'].transform).to.equal(clientMetricReport.countPerSecond);
      expect(map['framesReceived'].type).to.equal(SdkMetric.Type.VIDEO_RECEIVED_FPS);
    });

    it('videoUpstreamMetricMap reports the capture frame rate and the outbound-rtp encoder, pacer and retransmission stats', () => {
      const map = clientMetricReport.videoUpstreamMetricMap;
      expect(map['videoInputFramesPerSecond'].transform).to.equal(clientMetricReport.identityValue);
      expect(map['videoInputFramesPerSecond'].type).to.equal(SdkMetric.Type.VIDEO_INPUT_FPS);
      expect(map['framesPerSecond'].type).to.be.undefined;
      expect(map['targetBitrate'].transform).to.equal(clientMetricReport.identityValue);
      expect(map['targetBitrate'].type).to.equal(SdkMetric.Type.VIDEO_TARGET_ENCODER_BITRATE);
      expect(map['totalPacketSendDelay'].transform).to.equal(clientMetricReport.packetSendDelayMs);
      expect(map['totalPacketSendDelay'].type).to.equal(SdkMetric.Type.VIDEO_BUCKET_DELAY_MS);
      expect(map['retransmittedBytesSent'].transform).to.equal(clientMetricReport.bitsPerSecond);
      expect(map['retransmittedBytesSent'].type).to.equal(SdkMetric.Type.VIDEO_RETRANSMIT_BITRATE);
      for (const name of [
        'retransmittedBytesSent',
        'totalEncodedBytesTarget',
        'totalPacketSendDelay',
      ]) {
        expect(clientMetricReport.globalMetricMap[name], name).to.be.undefined;
      }
    });

    it('reports the tile size in device pixels, visible percent, object-fit and intrinsic layout to the backend', () => {
      const video = clientMetricReport.videoDownstreamMetricMap;
      for (const [name, type] of [
        ['videoRenderDevicePixelWidth', SdkMetric.Type.VIDEO_RENDER_DEVICE_PIXEL_WIDTH],
        ['videoRenderDevicePixelHeight', SdkMetric.Type.VIDEO_RENDER_DEVICE_PIXEL_HEIGHT],
        ['videoRenderVisiblePercent', SdkMetric.Type.VIDEO_RENDER_VISIBLE_PERCENT],
        ['videoRenderObjectFit', SdkMetric.Type.VIDEO_RENDER_OBJECT_FIT],
        ['videoRenderIntrinsicLayout', SdkMetric.Type.VIDEO_RENDER_INTRINSIC_LAYOUT],
      ] as Array<[string, SdkMetric.Type]>) {
        expect(video[name].transform, name).to.equal(clientMetricReport.identityValue);
        expect(video[name].type, name).to.equal(type);
      }
    });

    it('reports inter-frame delay, NetEq concealment and audio playout to the backend', () => {
      const video = clientMetricReport.videoDownstreamMetricMap;
      expect(video['totalInterFrameDelay'].transform).to.equal(
        clientMetricReport.interFrameDelayMs
      );
      expect(video['totalInterFrameDelay'].type).to.equal(
        SdkMetric.Type.VIDEO_INTER_FRAME_DELAY_MS
      );
      expect(video['totalSquaredInterFrameDelay'].transform).to.equal(
        clientMetricReport.interFrameDelayStandardDeviationMs
      );
      expect(video['totalSquaredInterFrameDelay'].type).to.equal(
        SdkMetric.Type.VIDEO_INTER_FRAME_DELAY_STDDEV_MS
      );
      const audio = clientMetricReport.audioDownstreamMetricMap;
      expect(audio['concealmentEvents'].transform).to.equal(clientMetricReport.countPerSecond);
      expect(audio['concealmentEvents'].type).to.equal(SdkMetric.Type.RTC_SPK_CONCEALMENT_EVENTS);
      expect(audio['silentConcealedSamples'].transform).to.equal(
        clientMetricReport.audibleConcealmentPercent
      );
      expect(audio['silentConcealedSamples'].type).to.equal(
        SdkMetric.Type.RTC_SPK_AUDIBLE_CONCEALMENT_PERCENT
      );
      expect(audio['removedSamplesForAcceleration'].transform).to.equal(
        clientMetricReport.percentOfSamplesReceived
      );
      expect(audio['removedSamplesForAcceleration'].type).to.equal(
        SdkMetric.Type.RTC_SPK_ACCELERATE_PERCENT
      );
      expect(audio['insertedSamplesForDeceleration'].transform).to.equal(
        clientMetricReport.percentOfSamplesReceived
      );
      expect(audio['insertedSamplesForDeceleration'].type).to.equal(
        SdkMetric.Type.RTC_SPK_DECELERATE_PERCENT
      );
      const global = clientMetricReport.globalMetricMap;
      expect(global['synthesizedSamplesDuration'].transform).to.equal(
        clientMetricReport.averageTimeSpentPerSecondInMilliseconds
      );
      expect(global['synthesizedSamplesDuration'].type).to.equal(
        SdkMetric.Type.AUDIO_PLAYOUT_SYNTHESIZED_MS
      );
      expect(global['synthesizedSamplesEvents'].transform).to.equal(
        clientMetricReport.countPerSecond
      );
      expect(global['synthesizedSamplesEvents'].type).to.equal(
        SdkMetric.Type.AUDIO_PLAYOUT_SYNTHESIZED_EVENTS
      );
      expect(global['totalSamplesCount'].type).to.be.undefined;
      expect(global['totalPlayoutDelay'].transform).to.equal(clientMetricReport.playoutDelayMs);
      expect(global['totalPlayoutDelay'].type).to.equal(SdkMetric.Type.AUDIO_PLAYOUT_DELAY_MS);
    });

    it('videoDownstreamMetricMap reports jitterBufferTargetDelay to the backend', () => {
      expect(
        clientMetricReport.videoDownstreamMetricMap['jitterBufferTargetDelay'].transform
      ).to.equal(clientMetricReport.jitterBufferTargetDelayMs);
      expect(clientMetricReport.videoDownstreamMetricMap['jitterBufferTargetDelay'].type).to.equal(
        SdkMetric.Type.VIDEO_TARGET_DELAY_MS
      );
    });

    it('videoUpstreamMetricMap reports qualityLimitationReason to the backend', () => {
      expect(
        clientMetricReport.videoUpstreamMetricMap['qualityLimitationReason'].transform
      ).to.equal(clientMetricReport.qualityLimitationReasonCode);
      expect(clientMetricReport.videoUpstreamMetricMap['qualityLimitationReason'].type).to.equal(
        SdkMetric.Type.VIDEO_QUALITY_REASON
      );
    });

    it('videoDownstreamMetricMap reports videoEndToEndDelayMs to the backend', () => {
      expect(
        clientMetricReport.videoDownstreamMetricMap['videoEndToEndDelayMs'].transform
      ).to.equal(clientMetricReport.identityValue);
      expect(clientMetricReport.videoDownstreamMetricMap['videoEndToEndDelayMs'].type).to.equal(
        SdkMetric.Type.VIDEO_END_TO_END_DELAY_MS
      );
    });

    it('returns countPerSecond for audioSentTransformPps', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.mediaType = MediaType.AUDIO;
      report.direction = Direction.UPSTREAM;
      report.currentMetrics['audioSentTransformPps'] = 1000;
      clientMetricReport.streamMetricReports[ssrc] = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      expect(clientMetricReport.countPerSecond('audioSentTransformPps', ssrc)).to.equal(1000);
    });

    it('returns countPerSecond for audioReceivedTransformPps', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.mediaType = MediaType.AUDIO;
      report.direction = Direction.DOWNSTREAM;
      report.currentMetrics['audioReceivedTransformPps'] = 500;
      clientMetricReport.streamMetricReports[ssrc] = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      expect(clientMetricReport.countPerSecond('audioReceivedTransformPps', ssrc)).to.equal(500);
    });

    it('returns countPerSecond for videoSentTransformPps', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.mediaType = MediaType.VIDEO;
      report.direction = Direction.UPSTREAM;
      report.currentMetrics['videoSentTransformPps'] = 300;
      clientMetricReport.streamMetricReports[ssrc] = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      expect(clientMetricReport.countPerSecond('videoSentTransformPps', ssrc)).to.equal(300);
    });

    it('returns countPerSecond for videoReceivedTransformPps', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.mediaType = MediaType.VIDEO;
      report.direction = Direction.DOWNSTREAM;
      report.currentMetrics['videoReceivedTransformPps'] = 200;
      clientMetricReport.streamMetricReports[ssrc] = report;
      clientMetricReport.currentTimestampMs = 2000;
      clientMetricReport.previousTimestampMs = 1000;
      expect(clientMetricReport.countPerSecond('videoReceivedTransformPps', ssrc)).to.equal(200);
    });
  });

  describe('getObservableMetricValue', () => {
    it('returns 0 if no metric is available', () => {
      expect(clientMetricReport.getObservableMetricValue('videoUpstreamBitrate')).to.equal(0);
    });

    describe('without media', () => {
      it('returns the transformed metric from the global metric spec', () => {
        const report = new GlobalMetricReport();
        report.currentMetrics['availableIncomingBitrate'] = 10;
        report.currentMetrics['audioLevel'] = 0.5;
        clientMetricReport.globalMetricReport = report;

        // Force setting "source" for the test coverage in case we are adding a new metric spec with "source".
        clientMetricReport.globalMetricMap['availableIncomingBitrate']['source'] =
          'availableIncomingBitrate';
        expect(clientMetricReport.getObservableMetricValue('availableIncomingBitrate')).to.equal(
          clientMetricReport.identityValue('availableIncomingBitrate')
        );

        clientMetricReport.globalMetricMap['audioLevel']['source'] = 'audioLevel';
        expect(clientMetricReport.getObservableMetricValue('audioUpstreamLevel')).to.equal(
          clientMetricReport.identityValue('audioLevel')
        );
      });
    });

    describe('with media', () => {
      it('returns the transformed metric', () => {
        const ssrc = 1;
        const report = new StreamMetricReport();
        report.mediaType = MediaType.VIDEO;
        report.direction = Direction.UPSTREAM;
        report.currentMetrics['packetsSent'] = 10;
        clientMetricReport.streamMetricReports[ssrc] = report;
        expect(clientMetricReport.getObservableMetricValue('videoPacketSentPerSecond')).to.equal(
          clientMetricReport.countPerSecond('packetsSent', ssrc)
        );
      });

      it('returns 0 if the stream metric report with the same media type and direction does not exist', () => {
        const ssrc = 1;
        const report = new StreamMetricReport();
        report.mediaType = MediaType.VIDEO;
        report.direction = Direction.DOWNSTREAM;
        report.currentMetrics['packetsSent'] = 10;
        clientMetricReport.streamMetricReports[ssrc] = report;
        expect(clientMetricReport.getObservableMetricValue('videoPacketSentPerSecond')).to.equal(
          clientMetricReport.countPerSecond('packetsSent', ssrc)
        );
      });

      it('returns the transformed metric using the source in the map', () => {
        const ssrc = 1;
        const report = new StreamMetricReport();
        report.mediaType = MediaType.AUDIO;
        report.direction = Direction.DOWNSTREAM;
        report.currentMetrics['packetsReceived'] = 10;
        report.currentMetrics['packetsLost'] = 10;
        clientMetricReport.streamMetricReports[ssrc] = report;
        expect(
          clientMetricReport.getObservableMetricValue('audioPacketsReceivedFractionLoss')
        ).to.equal(clientMetricReport.packetLossPercent('packetsReceived', ssrc));
      });

      it('returns the overriden metric using the source in the map', () => {
        const ssrc = 1;
        const report = new StreamMetricReport();
        report.mediaType = MediaType.AUDIO;
        report.direction = Direction.DOWNSTREAM;
        report.currentMetrics['packetsReceived'] = 10;
        report.currentMetrics['packetsLost'] = 10;
        clientMetricReport.streamMetricReports[ssrc] = report;
        clientMetricReport.overrideObservableMetric('audioPacketsReceivedFractionLoss', 10);
        expect(
          clientMetricReport.getObservableMetricValue('audioPacketsReceivedFractionLoss')
        ).to.equal(10);
      });
    });
  });

  describe('getObservableVideoMetricValue', () => {
    it('returns 0 if no metric is available', () => {
      const ssrc = 1;
      expect(
        clientMetricReport.getObservableVideoMetricValue('videoUpstreamBitrate', ssrc)
      ).to.equal(0);
    });

    it('returns the transformed metric', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.mediaType = MediaType.VIDEO;
      report.direction = Direction.UPSTREAM;
      report.currentMetrics['bytesSent'] = 10;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(
        clientMetricReport.getObservableVideoMetricValue('videoUpstreamBitrate', ssrc)
      ).to.equal(clientMetricReport.countPerSecond('bytesSent', ssrc));
    });

    it('returns the transformed metric using the source in the map', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.mediaType = MediaType.VIDEO;
      report.direction = Direction.DOWNSTREAM;
      report.currentMetrics['packetsReceived'] = 10;
      report.currentMetrics['packetsLost'] = 10;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(
        clientMetricReport.getObservableVideoMetricValue('videoDownstreamPacketLossPercent', ssrc)
      ).to.equal(clientMetricReport.packetLossPercent('packetsLost', ssrc));
    });
  });

  describe('getObservableMetrics', () => {
    it('returns the observable metrics as a JS object', () => {
      const metrics = clientMetricReport.getObservableMetrics();
      expect(Object.keys(metrics).length).to.equal(17);
    });
  });

  describe('getObservableVideoMetrics', () => {
    it('returns the observable video metrics as a JS object', () => {
      const upstreamSsrc = 1;
      const upstreamReport = new StreamMetricReport();
      upstreamReport.mediaType = MediaType.VIDEO;
      upstreamReport.direction = Direction.UPSTREAM;
      upstreamReport.currentMetrics['framesEncoded'] = 100;
      clientMetricReport.streamMetricReports[upstreamSsrc] = upstreamReport;
      const downstreamSsrc = 2;
      const downstreamReport = new StreamMetricReport();
      downstreamReport.mediaType = MediaType.VIDEO;
      downstreamReport.direction = Direction.DOWNSTREAM;
      downstreamReport.groupId = 1;
      clientMetricReport.streamMetricReports[downstreamSsrc] = downstreamReport;
      clientMetricReport.currentTimestampMs = 100;
      clientMetricReport.previousTimestampMs = 0;
      const audioUpstreamSsrc = 3;
      const audioUpstreamReport = new StreamMetricReport();
      audioUpstreamReport.mediaType = MediaType.AUDIO;
      audioUpstreamReport.direction = Direction.UPSTREAM;
      audioUpstreamReport.currentMetrics['packetsSent'] = 100;
      clientMetricReport.streamMetricReports[audioUpstreamSsrc] = audioUpstreamReport;
      const videoStreamMetrics = clientMetricReport.getObservableVideoMetrics();
      expect(Object.keys(videoStreamMetrics['attendee-1'][downstreamSsrc]).length).to.equal(0);
      expect(Object.keys(videoStreamMetrics[selfAttendeeId][upstreamSsrc]).length).to.equal(1);
    });

    it('returns the observable video metrics for streams with streamId', () => {
      const upstreamSsrc_1 = 11;
      const upstreamReport_1 = new StreamMetricReport();
      upstreamReport_1.mediaType = MediaType.VIDEO;
      upstreamReport_1.direction = Direction.UPSTREAM;
      upstreamReport_1.currentMetrics['framesEncoded'] = 100;
      clientMetricReport.streamMetricReports[upstreamSsrc_1] = upstreamReport_1;
      const upstreamSsrc_2 = 12;
      const upstreamReport_2 = new StreamMetricReport();
      upstreamReport_2.mediaType = MediaType.VIDEO;
      upstreamReport_2.direction = Direction.UPSTREAM;
      upstreamReport_2.currentMetrics['framesEncoded'] = 100;
      clientMetricReport.streamMetricReports[upstreamSsrc_2] = upstreamReport_2;
      const downstreamSsrc = 22;
      const downstreamReport = new StreamMetricReport();
      downstreamReport.mediaType = MediaType.VIDEO;
      downstreamReport.direction = Direction.DOWNSTREAM;
      downstreamReport.streamId = 22;
      clientMetricReport.streamMetricReports[downstreamSsrc] = downstreamReport;
      clientMetricReport.currentTimestampMs = 100;
      clientMetricReport.previousTimestampMs = 0;
      const videoStreamMetrics = clientMetricReport.getObservableVideoMetrics();
      expect(Object.keys(videoStreamMetrics[selfAttendeeId][upstreamSsrc_1]).length).to.equal(1);
      expect(Object.keys(videoStreamMetrics[selfAttendeeId][upstreamSsrc_2]).length).to.equal(1);
    });

    it('returns 0 observable video metrics if no desired report in stream metric reports', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.mediaType = MediaType.AUDIO;
      report.direction = Direction.UPSTREAM;
      report.currentMetrics['nackCount'] = 10;
      clientMetricReport.streamMetricReports[ssrc] = report;
      const videoStreamMetrics = clientMetricReport.getObservableVideoMetrics();
      expect(Object.keys(videoStreamMetrics).length).to.equal(0);
    });

    it('returns raw RTCStatsReport report', () => {
      clientMetricReport.rtcStatsReport = {} as RTCStatsReport;
      const rawMetricReport = clientMetricReport.getRTCStatsReport();
      expect(rawMetricReport).to.equal(clientMetricReport.rtcStatsReport);
    });
  });

  describe('clone', () => {
    it('clones', () => {
      const cloned = clientMetricReport.clone();
      expect(cloned.globalMetricReport).to.equal(clientMetricReport.globalMetricReport);
      expect(cloned.streamMetricReports).to.equal(clientMetricReport.streamMetricReports);
      expect(cloned.rtcStatsReport).to.equal(clientMetricReport.rtcStatsReport);
      expect(cloned.currentTimestampMs).to.equal(clientMetricReport.currentTimestampMs);
      expect(cloned.previousTimestampMs).to.equal(clientMetricReport.previousTimestampMs);
    });

    it('clones customStatsReports', () => {
      clientMetricReport.customStatsReports = [{ type: 'test', value: 123 }];
      const cloned = clientMetricReport.clone();
      expect(cloned.customStatsReports).to.equal(clientMetricReport.customStatsReports);
    });
  });

  describe('print', () => {
    it('prints without an error', () => {
      clientMetricReport.globalMetricReport = new GlobalMetricReport();
      clientMetricReport.streamMetricReports = { 1: new StreamMetricReport() };
      clientMetricReport.currentTimestampMs = 100;
      clientMetricReport.previousTimestampMs = 0;
      clientMetricReport.print();
    });
  });

  describe('removeDestroyedSsrcs', () => {
    it('removes destroyed ssrcs', () => {
      const ssrc1 = 1;
      const ssrc2 = 2;
      clientMetricReport.streamMetricReports[ssrc1] = new StreamMetricReport();
      clientMetricReport.streamMetricReports[ssrc2] = new StreamMetricReport();
      clientMetricReport.currentSsrcs[ssrc2] = 100;
      clientMetricReport.removeDestroyedSsrcs();
      expect(clientMetricReport.streamMetricReports[ssrc1]).to.equal(undefined);
    });
  });

  describe('error logging', () => {
    it('returns undefined observable video metrics if no VideoStreamIndex and selfAttendeeId defined stream metric reports', () => {
      clientMetricReport = new ClientMetricReport(new NoOpDebugLogger());
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.mediaType = MediaType.VIDEO;
      report.direction = Direction.UPSTREAM;
      report.currentMetrics['framesEncoded'] = 10;
      clientMetricReport.streamMetricReports[ssrc] = report;
      const videoStreamMetrics = clientMetricReport.getObservableVideoMetrics();
      expect(Object.keys(videoStreamMetrics).length).to.equal(0);
    });
  });
});
