// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
import VideoStreamIndex from '../../src/videostreamindex/VideoStreamIndex';
import VideoTileController from '../../src/videotilecontroller/VideoTileController';

describe('VideoAdaptiveProbePolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const logger = new NoOpDebugLogger();
  let policy: VideoAdaptiveProbePolicy;
  let videoStreamIndex: VideoStreamIndex;
  let audioVideoController: AudioVideoTileController;
  let tileController: VideoTileController;

  function prepareVideoStreamIndex(streamIndex: VideoStreamIndex): void {
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

  beforeEach(() => {
    audioVideoController = new NoOpAudioVideoTileController();
    tileController = audioVideoController.videoTileController;
    policy = new VideoAdaptiveProbePolicy(logger, tileController);
    videoStreamIndex = new SimulcastVideoStreamIndex(logger);
    prepareVideoStreamIndex(videoStreamIndex);
    policy.updateIndex(videoStreamIndex);
  });

  describe('construction', () => {
    it('can be constructed', () => {
      assert.exists(policy);
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
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      videoStreamIndex.integrateIndexFrame(new SdkIndexFrame());
      policy.updateIndex(videoStreamIndex);
      policy.updateMetrics(new DefaultClientMetricReport(logger));
    });

    it('can update metrics', () => {
      const metricReport = new DefaultClientMetricReport(logger);
      const streamReport1 = new StreamMetricReport();
      streamReport1.streamId = 1;
      streamReport1.direction = ClientMetricReportDirection.DOWNSTREAM;
      streamReport1.currentMetrics['googNacksSent'] = 20;
      streamReport1.currentMetrics['googFrameRateReceived'] = 20;
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

      policy.updateCalculatedOptimalReceiveSet();

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
      policy.updateCalculatedOptimalReceiveSet();
      policy.wantsResubscribe();
      policy.chooseSubscriptions();
    });
  });

  describe('updateCalculatedOptimalReceiveSet', () => {
    it('recalculated the optimal receive set', () => {
      policy.updateCalculatedOptimalReceiveSet();
    });
  });

  describe('wantsResubscribe', () => {
    it('returns whether resubscription is necessary', () => {
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
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
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
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
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
});
