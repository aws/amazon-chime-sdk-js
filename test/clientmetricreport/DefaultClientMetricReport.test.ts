// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import Direction from '../../src/clientmetricreport/ClientMetricReportDirection';
import MediaType from '../../src/clientmetricreport/ClientMetricReportMediaType';
import DefaultClientMetricReport from '../../src/clientmetricreport/DefaultClientMetricReport';
import GlobalMetricReport from '../../src/clientmetricreport/GlobalMetricReport';
import StreamMetricReport from '../../src/clientmetricreport/StreamMetricReport';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';

describe('DefaultClientMetricReport', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  let clientMetricReport: DefaultClientMetricReport;
  const selfAttendeeId = 'attendee-1';

  beforeEach(() => {
    clientMetricReport = new DefaultClientMetricReport(
      new NoOpDebugLogger(),
      new DefaultVideoStreamIndex(new NoOpDebugLogger()),
      selfAttendeeId
    );
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

    it('returns 0 if decoder calls is 0', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics['googDecodingNormal'] = 0;
      report.currentMetrics['googDecodingCTN'] = 0;
      clientMetricReport.globalMetricReport = report;
      expect(clientMetricReport.decoderLossPercent(metricName)).to.equal(0);
    });

    it('returns 0 if decoder abnormal is 0', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics['googDecodingNormal'] = 1;
      report.currentMetrics['googDecodingCTN'] = 1;
      clientMetricReport.globalMetricReport = report;
      expect(clientMetricReport.decoderLossPercent(metricName)).to.equal(0);
    });

    it('returns the loss percent', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics['googDecodingNormal'] = 1;
      report.currentMetrics['googDecodingCTN'] = 2;
      clientMetricReport.globalMetricReport = report;
      expect(clientMetricReport.decoderLossPercent(metricName)).to.equal((1 * 100) / 2);
    });

    it('returns the loss percent from the stream metric reports', () => {
      const ssrc = 1;
      const report = new StreamMetricReport();
      report.currentMetrics['googDecodingNormal'] = 1;
      report.currentMetrics['googDecodingCTN'] = 2;
      clientMetricReport.streamMetricReports[ssrc] = report;
      expect(clientMetricReport.decoderLossPercent(metricName, ssrc)).to.equal((1 * 100) / 2);
    });
  });

  describe('packetLossPercent', () => {
    const metricName = 'metric-name';

    it('returns 0 if the total number of sent/received and lost is 0', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics[metricName] = 0;
      report.currentMetrics['packetsLost'] = 0;
      clientMetricReport.globalMetricReport = report;
      expect(clientMetricReport.packetLossPercent(metricName)).to.equal(0);
    });

    it('returns 0 if the lost count is 0', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics[metricName] = 10;
      report.currentMetrics['packetsLost'] = 0;
      clientMetricReport.globalMetricReport = report;
      expect(clientMetricReport.packetLossPercent(metricName)).to.equal(0);
    });

    it('returns the loss percent', () => {
      const report = new GlobalMetricReport();
      report.currentMetrics[metricName] = 10;
      report.currentMetrics['packetsLost'] = 5;
      clientMetricReport.globalMetricReport = report;
      expect(clientMetricReport.packetLossPercent(metricName)).to.equal((5 * 100) / 15);
    });

    it('returns the loss percent from the stream metric reports', () => {
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

  describe('getObservableMetricValue', () => {
    it('returns 0 if no metric is available', () => {
      expect(clientMetricReport.getObservableMetricValue('videoUpstreamBitrate')).to.equal(0);
    });

    describe('without media', () => {
      it('returns the transformed metric from the observable metric spec', () => {
        const report = new GlobalMetricReport();
        report.currentMetrics['googAvailableSendBandwidth'] = 10;
        clientMetricReport.globalMetricReport = report;
        expect(clientMetricReport.getObservableMetricValue('availableSendBandwidth')).to.equal(
          clientMetricReport.identityValue('googAvailableSendBandwidth')
        );
      });

      it('returns the transformed metric from the observable metric spec', () => {
        const report = new GlobalMetricReport();
        report.currentMetrics['googAvailableReceiveBandwidth'] = 10;
        clientMetricReport.globalMetricReport = report;
        expect(clientMetricReport.getObservableMetricValue('availableReceiveBandwidth')).to.equal(
          clientMetricReport.identityValue('googAvailableReceiveBandwidth')
        );
      });

      it('returns the transformed metric from the global metric spec', () => {
        const report = new GlobalMetricReport();
        report.currentMetrics['googAvailableReceiveBandwidth'] = 10;
        clientMetricReport.globalMetricReport = report;

        // Force setting "source" for the test coverage in case we are adding a new metric spec with "source".
        clientMetricReport.globalMetricMap['googAvailableReceiveBandwidth']['source'] =
          'googAvailableReceiveBandwidth';
        expect(clientMetricReport.getObservableMetricValue('availableReceiveBandwidth')).to.equal(
          clientMetricReport.identityValue('googAvailableReceiveBandwidth')
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
      expect(Object.keys(metrics).length).to.equal(14);
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
      expect(Object.keys(videoStreamMetrics[selfAttendeeId][downstreamSsrc]).length).to.equal(0);
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
      expect(Object.keys(videoStreamMetrics[''][downstreamSsrc]).length).to.equal(0);
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
  });

  describe('clone', () => {
    it('clones', () => {
      clientMetricReport.globalMetricReport = new GlobalMetricReport();
      clientMetricReport.streamMetricReports = { 1: new StreamMetricReport() };
      clientMetricReport.currentTimestampMs = 100;
      clientMetricReport.previousTimestampMs = 0;
      const cloned = clientMetricReport.clone();
      expect(cloned.globalMetricReport).to.equal(clientMetricReport.globalMetricReport);
      expect(cloned.streamMetricReports).to.equal(clientMetricReport.streamMetricReports);
      expect(cloned.currentTimestampMs).to.equal(clientMetricReport.currentTimestampMs);
      expect(cloned.previousTimestampMs).to.equal(clientMetricReport.previousTimestampMs);
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
      clientMetricReport = new DefaultClientMetricReport(new NoOpDebugLogger());
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
