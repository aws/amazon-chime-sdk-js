// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoTileController from '../../src/audiovideocontroller/AudioVideoController';
import NoOpAudioVideoTileController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import ClientMetricReportDirection from '../../src/clientmetricreport/ClientMetricReportDirection';
import DefaultClientMetricReport from '../../src/clientmetricreport/DefaultClientMetricReport';
import GlobalMetricReport from '../../src/clientmetricreport/GlobalMetricReport';
import StreamMetricReport from '../../src/clientmetricreport/StreamMetricReport';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import {
  SdkIndexFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
} from '../../src/signalingprotocol/SignalingProtocol';
import VideoAdaptiveProbePolicy from '../../src/videodownlinkbandwidthpolicy/VideoAdaptiveProbePolicy';
import SimulcastVideoStreamIndex from '../../src/videostreamindex/SimulcastVideoStreamIndex';
import VideoTileController from '../../src/videotilecontroller/VideoTileController';

describe('VideoAdaptiveProbePolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const logger = new NoOpDebugLogger();
  let policy: VideoAdaptiveProbePolicy;
  let videoStreamIndex: SimulcastVideoStreamIndex;
  let audioVideoController: AudioVideoTileController;
  let tileController: VideoTileController;
  interface DateNow {
    (): number;
  }
  let originalDateNow: DateNow;
  let startTime: number;

  function mockDateNow(): number {
    return startTime;
  }

  function incrementTime(addMs: number): void {
    startTime += addMs;
  }

  function prepareVideoStreamIndex(streamIndex: SimulcastVideoStreamIndex): void {
    const sources: SdkStreamDescriptor[] = [];
    const numParticipants = 2;
    for (let i = 0; i < numParticipants; i++) {
      const attendee = `attendee-${i}`;
      sources.push(
        new SdkStreamDescriptor({
          streamId: i * 2,
          groupId: i,
          maxBitrateKbps: 300,
          avgBitrateBps: 500 * 1000,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
        })
      );
      sources.push(
        new SdkStreamDescriptor({
          streamId: i * 2 + 1,
          groupId: i,
          maxBitrateKbps: 500,
          avgBitrateBps: 500 * 1000,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
        })
      );
    }
    sources.push(
      new SdkStreamDescriptor({
        streamId: 11,
        groupId: 100,
        maxBitrateKbps: 1400,
        avgBitrateBps: 300 * 1000,
        attendeeId: 'attendee1#content',
        mediaType: SdkStreamMediaType.VIDEO,
      })
    );

    sources.push(
      new SdkStreamDescriptor({
        streamId: 22,
        groupId: 200,
        maxBitrateKbps: 99,
        avgBitrateBps: 1400 * 1000,
        attendeeId: 'attendee2#content',
        mediaType: SdkStreamMediaType.VIDEO,
      })
    );
    streamIndex.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
  }

  function updateIndexFrame(
    index: SimulcastVideoStreamIndex,
    remoteClientCnt: number,
    lowSimulRate: number,
    highSimulRate: number
  ): void {
    const sources: SdkStreamDescriptor[] = [];
    for (let i = 1; i < remoteClientCnt + 1; i++) {
      const attendee = `attendee-${i}`;
      if (lowSimulRate > 0) {
        sources.push(
          new SdkStreamDescriptor({
            streamId: 2 * i - 1,
            groupId: i,
            maxBitrateKbps: lowSimulRate,
            avgBitrateBps: lowSimulRate * 1000,
            attendeeId: attendee,
            mediaType: SdkStreamMediaType.VIDEO,
          })
        );
      }
      if (highSimulRate > 0) {
        sources.push(
          new SdkStreamDescriptor({
            streamId: 2 * i,
            groupId: i,
            maxBitrateKbps: highSimulRate,
            avgBitrateBps: highSimulRate * 1000,
            attendeeId: attendee,
            mediaType: SdkStreamMediaType.VIDEO,
          })
        );
      }
    }
    index.integrateIndexFrame(
      new SdkIndexFrame({ sources: sources, numParticipants: remoteClientCnt })
    );
  }

  function setPacketLoss(
    metricReport: DefaultClientMetricReport,
    nackCnt: number,
    packetsLost: number
  ): void {
    metricReport.currentTimestampMs = 2000;
    metricReport.previousTimestampMs = 1000;
    const streamReport1 = new StreamMetricReport();
    streamReport1.streamId = 1;
    streamReport1.direction = ClientMetricReportDirection.DOWNSTREAM;
    streamReport1.previousMetrics['googNacksSent'] = 0;
    streamReport1.previousMetrics['packetsLost'] = 0;
    streamReport1.currentMetrics['googNacksSent'] = nackCnt;
    streamReport1.currentMetrics['packetsLost'] = packetsLost;
    streamReport1.currentMetrics['googFrameRateReceived'] = 15;
    streamReport1.currentMetrics['bytesReceived'] = 200;

    metricReport.streamMetricReports[1] = streamReport1;
  }

  beforeEach(() => {
    startTime = Date.now();
    originalDateNow = Date.now;
    Date.now = mockDateNow;
    audioVideoController = new NoOpAudioVideoTileController();
    tileController = audioVideoController.videoTileController;
    policy = new VideoAdaptiveProbePolicy(logger, tileController);
    videoStreamIndex = new SimulcastVideoStreamIndex(logger);
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('construction', () => {
    it('can be constructed', () => {
      assert.exists(policy);
    });
  });

  describe('reset', () => {
    it('can be reset', () => {
      prepareVideoStreamIndex(videoStreamIndex);
      policy.updateIndex(videoStreamIndex);
      const resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 11, 22]);
      policy.reset();
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([]);
    });
  });

  describe('updateIndex', () => {
    it('can update VideoStreamIndex', () => {
      videoStreamIndex = new SimulcastVideoStreamIndex(logger);
      policy.updateIndex(videoStreamIndex);
      // @ts-ignore
      expect(policy.videoIndex).to.deep.equal(videoStreamIndex);
    });
  });

  describe('updateMetric', () => {
    it('can be no-op if there are no streams available to subscribe', () => {
      videoStreamIndex.integrateIndexFrame(new SdkIndexFrame());
      policy.updateIndex(videoStreamIndex);
      policy.updateMetrics(new DefaultClientMetricReport(logger));
    });

    it('can update metrics', () => {
      prepareVideoStreamIndex(videoStreamIndex);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      const streamReport1 = new StreamMetricReport();
      streamReport1.streamId = 1;
      streamReport1.direction = ClientMetricReportDirection.DOWNSTREAM;
      streamReport1.currentMetrics['googNacksSent'] = 20;
      streamReport1.currentMetrics['packetsLost'] = 0;
      streamReport1.currentMetrics['googFrameRateReceived'] = 30;
      streamReport1.currentMetrics['bytesReceived'] = 20;

      metricReport.streamMetricReports[123456] = streamReport1;

      policy.updateMetrics(metricReport);

      const streamReport2 = new StreamMetricReport();
      streamReport2.streamId = 2;
      streamReport2.direction = ClientMetricReportDirection.DOWNSTREAM;
      streamReport2.currentMetrics['googNacksSent'] = 20;
      streamReport2.currentMetrics['packetsLost'] = 0;
      metricReport.streamMetricReports[234567] = streamReport2;

      const streamReport3 = new StreamMetricReport();
      streamReport3.streamId = 1;
      streamReport3.direction = ClientMetricReportDirection.UPSTREAM;
      streamReport3.currentMetrics['googNacksSent'] = 20;
      streamReport3.currentMetrics['packetsLost'] = 0;
      metricReport.streamMetricReports[3123123] = streamReport3;

      videoStreamIndex.integrateIndexFrame(
        new SdkIndexFrame({
          atCapacity: false,
          sources: [
            new SdkStreamDescriptor({ streamId: 7, groupId: 2 }),
            new SdkStreamDescriptor({ streamId: 3, groupId: 2 }),
          ],
        })
      );

      policy.updateIndex(videoStreamIndex);
      policy.updateMetrics(metricReport);
      policy.wantsResubscribe();
      policy.chooseSubscriptions();
    });
  });

  describe('wantsResubscribe', () => {
    it('returns whether resubscription is necessary', () => {
      prepareVideoStreamIndex(videoStreamIndex);
      policy.updateIndex(videoStreamIndex);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 11, 22]);

      videoStreamIndex.integrateIndexFrame(new SdkIndexFrame());
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([]);
    });
  });

  describe('chooseSubscriptions', () => {
    it('will keep updating during start-up period', done => {
      prepareVideoStreamIndex(videoStreamIndex);
      policy.updateIndex(videoStreamIndex);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      const received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 11, 22]);

      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableSendBandwidth'] = 4000 * 1000;
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 4000 * 1000;
      policy.updateMetrics(metricReport);
      policy.wantsResubscribe();
      // get out of start up
      // @ts-ignore
      policy.STARTUP_PERIOD_MS = 5;
      metricReport.globalMetricReport.currentMetrics['googAvailableSendBandwidth'] = 8000 * 1000;
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 8000 * 1000;
      new TimeoutScheduler(20).start(() => {
        policy.updateMetrics(metricReport);

        videoStreamIndex.integrateIndexFrame(new SdkIndexFrame());
        policy.updateIndex(videoStreamIndex);
        resub = policy.wantsResubscribe();
        expect(resub).to.equal(true);
        done();
      });
    });

    it('will not change resubscription if start-up period elapses and available streams are the same', () => {
      prepareVideoStreamIndex(videoStreamIndex);
      policy.updateIndex(videoStreamIndex);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      const received = policy.chooseSubscriptions();
      expect(received.array().length).to.equal(4);
      // expect(received.array()).to.deep.equal([0, 2]);
      // @ts-ignore
      policy.MAX_HOLD_MS_BEFORE_PROBE = 100;
      // @ts-ignore
      policy.MIN_TIME_BETWEEN_SUBSCRIBE = 20;
      // @ts-ignore
      policy.MIN_TIME_BETWEEN_PROBE = 20;
      // @ts-ignore
      policy.STARTUP_PERIOD_MS = 5;
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableSendBandwidth'] = 4000 * 1000;
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 4000 * 1000;

      const streamReport1 = new StreamMetricReport();
      streamReport1.streamId = 0;
      streamReport1.direction = ClientMetricReportDirection.DOWNSTREAM;
      streamReport1.currentMetrics['googNacksSent'] = 10;
      streamReport1.currentMetrics['googFrameRateReceived'] = 20;
      streamReport1.currentMetrics['packetsLost'] = 0;
      streamReport1.currentMetrics['googFrameRateReceived'] = 30;
      streamReport1.currentMetrics['bytesReceived'] = 500 * 1000;

      metricReport.streamMetricReports[123456] = streamReport1;
      const streamReport2 = new StreamMetricReport();
      streamReport2.streamId = 2;
      streamReport2.direction = ClientMetricReportDirection.DOWNSTREAM;
      streamReport2.currentMetrics['googNacksSent'] = 10;
      streamReport2.currentMetrics['packetsLost'] = 0;
      streamReport2.currentMetrics['bytesReceived'] = 500 * 1000;
      metricReport.streamMetricReports[234567] = streamReport2;

      policy.updateMetrics(metricReport);

      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableSendBandwidth'] = 1000 * 1000;
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 1000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();

      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableSendBandwidth'] = 5000 * 1000;
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 5000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      {
        const sources: SdkStreamDescriptor[] = [];
        const numParticipants = 6;
        for (let i = 0; i < numParticipants; i++) {
          const attendee = `attendee-${i}`;
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2,
              groupId: i,
              maxBitrateKbps: 1000,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2 + 1,
              groupId: i,
              maxBitrateKbps: 1000,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
        }

        videoStreamIndex.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
        policy.updateIndex(videoStreamIndex);
        resub = policy.wantsResubscribe();
      }

      {
        metricReport.globalMetricReport = new GlobalMetricReport();
        metricReport.globalMetricReport.currentMetrics['googAvailableSendBandwidth'] = 5000 * 1000;
        metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 0;
        policy.updateMetrics(metricReport);
        policy.wantsResubscribe();

        metricReport.globalMetricReport.currentMetrics['googAvailableSendBandwidth'] = 5000 * 1000;
        metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] =
          5000 * 1000;

        const sources: SdkStreamDescriptor[] = [];
        const numParticipants = 6;
        for (let i = 0; i < numParticipants; i++) {
          const attendee = `attendee-${i}`;
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2,
              groupId: i,
              maxBitrateKbps: 400,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2 + 1,
              groupId: i,
              maxBitrateKbps: 1000,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
        }
        policy.updateMetrics(metricReport);
        policy.wantsResubscribe();
      }
    });
  });

  describe('probing', () => {
    it('Probe success', () => {
      updateIndexFrame(videoStreamIndex, 6, 0, 600);
      policy.updateIndex(videoStreamIndex);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 8]);

      incrementTime(6100);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 8, 10, 12]);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 600 * 1000;
      setPacketLoss(metricReport, 42, 160);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2]);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 600 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // Probe
      incrementTime(7000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 700 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // Probe success
      incrementTime(2000);
      updateIndexFrame(videoStreamIndex, 6, 0, 600);
      policy.updateIndex(videoStreamIndex);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 1300 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
    });

    it('Probe fail', () => {
      updateIndexFrame(videoStreamIndex, 6, 0, 600);
      policy.updateIndex(videoStreamIndex);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 8]);

      incrementTime(6100);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 8, 10, 12]);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 600 * 1000;
      setPacketLoss(metricReport, 42, 160);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2]);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 600 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // Probe
      incrementTime(7000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);

      // Probe fail
      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 400 * 1000;
      setPacketLoss(metricReport, 10, 10);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2]);
    });
  });
});
