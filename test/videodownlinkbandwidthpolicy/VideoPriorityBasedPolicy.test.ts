// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { VideoPriorityBasedPolicyConfig } from '../../src';
import AudioVideoTileController from '../../src/audiovideocontroller/AudioVideoController';
import NoOpAudioVideoTileController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import ClientMetricReportDirection from '../../src/clientmetricreport/ClientMetricReportDirection';
import DefaultClientMetricReport from '../../src/clientmetricreport/DefaultClientMetricReport';
import GlobalMetricReport from '../../src/clientmetricreport/GlobalMetricReport';
import StreamMetricReport from '../../src/clientmetricreport/StreamMetricReport';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import {
  SdkBitrate,
  SdkBitrateFrame,
  SdkIndexFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
} from '../../src/signalingprotocol/SignalingProtocol';
import TargetDisplaySize from '../../src/videodownlinkbandwidthpolicy/TargetDisplaySize';
import VideoDownlinkObserver from '../../src/videodownlinkbandwidthpolicy/VideoDownlinkObserver';
import VideoPreference from '../../src/videodownlinkbandwidthpolicy/VideoPreference';
import { VideoPreferences } from '../../src/videodownlinkbandwidthpolicy/VideoPreferences';
import VideoPriorityBasedPolicy from '../../src/videodownlinkbandwidthpolicy/VideoPriorityBasedPolicy';
import SimulcastVideoStreamIndex from '../../src/videostreamindex/SimulcastVideoStreamIndex';
import VideoTileController from '../../src/videotilecontroller/VideoTileController';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('VideoPriorityBasedPolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const logger = new NoOpDebugLogger();
  let policy: VideoPriorityBasedPolicy;
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

  function called(stub: sinon.SinonStub, timeout: number = 1000): Promise<void> {
    return Promise.race([
      new Promise<void>((resolve, _reject) => {
        stub.callsFake(resolve);
      }),
      timeoutPromise(timeout),
    ]);
  }

  function timeoutPromise(timeout: number): Promise<void> {
    return new Promise((_resolve, reject) => {
      setTimeout(reject, timeout);
    });
  }

  function incrementTime(addMs: number): void {
    startTime += addMs;
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

  function updateBitrateFrame(
    remoteClientCnt: number,
    lowSimulRate: number,
    highSimulRate: number
  ): SdkBitrateFrame {
    const bitrateFrame = SdkBitrateFrame.create();
    for (let i = 1; i < remoteClientCnt + 1; i++) {
      if (lowSimulRate > 0) {
        const bitrate = SdkBitrate.create();
        bitrate.sourceStreamId = 2 * i - 1;
        bitrate.avgBitrateBps = lowSimulRate * 1000;
        bitrateFrame.bitrates.push(bitrate);
      }
      if (highSimulRate > 0) {
        const bitrate2 = SdkBitrate.create();
        bitrate2.sourceStreamId = 2 * i;
        bitrate2.avgBitrateBps = highSimulRate * 1000;
        bitrateFrame.bitrates.push(bitrate2);
      }
    }
    return bitrateFrame;
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
    policy = new VideoPriorityBasedPolicy(logger);
    policy.bindToTileController(tileController);
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
      updateIndexFrame(videoStreamIndex, 6, 0, 600);
      policy.updateIndex(videoStreamIndex);
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-1', 1, TargetDisplaySize.High));
      policy.chooseRemoteVideoSources(preferences.build());
      const resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2]);
      policy.reset();
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([]);
    });
  });

  describe('worksWithoutTileController', () => {
    it('runs without tile controller', () => {
      const policy = new VideoPriorityBasedPolicy(logger);
      updateIndexFrame(videoStreamIndex, 6, 0, 600);
      policy.updateIndex(videoStreamIndex);
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-1', 1, TargetDisplaySize.High));
      policy.chooseRemoteVideoSources(preferences.build());
      const resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      const received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2]);
    });
  });

  describe('chooseRemoteVideoSources', () => {
    it('observer should get called only when added', async () => {
      class MockObserver implements VideoDownlinkObserver {
        tileWillBePausedByDownlinkPolicy = sinon.stub();
        tileWillBeUnpausedByDownlinkPolicy = sinon.stub();
      }
      const observer = new MockObserver();

      const observerCalled = called(observer.tileWillBePausedByDownlinkPolicy);
      policy.addObserver(observer);
      policy.forEachObserver((observer: VideoDownlinkObserver) => {
        observer.tileWillBePausedByDownlinkPolicy(1);
      });
      await observerCalled;

      policy.removeObserver(observer);
      policy.forEachObserver((observer: VideoDownlinkObserver) => {
        observer.tileWillBePausedByDownlinkPolicy(1);
      });
      try {
        await observerCalled;
        throw new Error('should not be called');
      } catch (error) {}

      policy.addObserver(observer);

      const obs2 = new MockObserver();
      const obs2Called = called(obs2.tileWillBePausedByDownlinkPolicy);
      policy.addObserver(obs2);
      policy.forEachObserver((observer: VideoDownlinkObserver) => {
        observer.tileWillBePausedByDownlinkPolicy(1);
        policy.removeObserver(obs2);
      });

      await observerCalled;
      try {
        await obs2Called;
      } catch (error) {}

      policy.removeObserver(observer);
    });
  });

  describe('priority on off same', () => {
    it('no priority to priority', () => {
      updateIndexFrame(videoStreamIndex, 5, 0, 600);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      // This is lower than the default kbps so it should use it due to startup period
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 2400 * 1000;
      policy.updateMetrics(metricReport);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 8]);

      // No startup period now so we should use 2400 kbps for bandwidth estimate but should not trigger resubscribe
      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 2400 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-5', 1));
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([10]);
    });

    it('priority to no priority', () => {
      updateIndexFrame(videoStreamIndex, 4, 0, 600);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 2400 * 1000;
      policy.updateMetrics(metricReport);
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-3', 1));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([6]);

      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 2400 * 1000;
      policy.updateMetrics(metricReport);
      preferences.clear();
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([]);
    });

    it('priority value comparison checker', () => {
      updateIndexFrame(videoStreamIndex, 4, 0, 600);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 2400 * 1000;
      policy.updateMetrics(metricReport);
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-3', 1));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([6]);

      incrementTime(6100);
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      preferences.clear();
      preferences.add(new VideoPreference('attendee-2', 1));
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([4]);
    });
  });

  describe('probing', () => {
    it('Probe success during priority preference', async () => {
      class MockObserver implements VideoDownlinkObserver {
        shouldResubscribeRemoteVideos = sinon.stub();
        tileWillBePausedByDownlinkPolicy = sinon.stub();
        tileWillBeUnpausedByDownlinkPolicy = sinon.stub();
      }

      const observer = new MockObserver();
      const callbackPromise = called(observer.tileWillBePausedByDownlinkPolicy);
      const callbackPromise2 = called(observer.tileWillBeUnpausedByDownlinkPolicy);

      policy.addObserver(observer);
      updateIndexFrame(videoStreamIndex, 2, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] =
        10000 * 1000;
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-2', 1, TargetDisplaySize.Low));
      preferences.add(new VideoPreference('attendee-1', 2, TargetDisplaySize.Medium));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3]);
      const tile1 = tileController.addVideoTile();
      tile1.stateRef().boundAttendeeId = 'attendee-1';
      const tile2 = tileController.addVideoTile();
      tile2.stateRef().boundAttendeeId = 'attendee-2';

      // Probe
      incrementTime(6100);
      preferences.clear();
      preferences.add(new VideoPreference('attendee-2', 1, TargetDisplaySize.High));
      preferences.add(new VideoPreference('attendee-1', 2, TargetDisplaySize.High));
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);
      tile1.stateRef().boundAttendeeId = 'attendee-1';
      tile2.stateRef().boundAttendeeId = 'attendee-2';

      incrementTime(6100);
      preferences.clear();
      preferences.add(new VideoPreference('attendee-2', 1));
      preferences.add(new VideoPreference('attendee-1', 1));
      policy.chooseRemoteVideoSources(preferences.build());
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 9000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      preferences.clear();
      preferences.add(new VideoPreference('attendee-2', 1));
      preferences.add(new VideoPreference('attendee-1', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 1200 * 1000;
      setPacketLoss(metricReport, 42, 160);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      expect(tile1.state().paused).to.equal(true);
      await callbackPromise;

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 700 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 3]);
      expect(tile1.state().paused).to.equal(true);

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
      expect(tile1.state().paused).to.equal(true);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 700 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 1100 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      const bitrates = updateBitrateFrame(2, 200, 1100);
      videoStreamIndex.integrateBitratesFrame(bitrates);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // Probe success
      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 1300 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(6000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 2700 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      expect(tile1.state().paused).to.equal(false);
      await callbackPromise2;
    });

    it('Probe fail', () => {
      updateIndexFrame(videoStreamIndex, 4, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-1', 2));
      preferences.add(new VideoPreference('attendee-2', 2));
      preferences.add(new VideoPreference('attendee-3', 2));
      preferences.add(new VideoPreference('attendee-4', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 3, 5, 7]);
      const tile1 = tileController.addVideoTile();
      tile1.stateRef().boundAttendeeId = 'attendee-1';
      const tile2 = tileController.addVideoTile();
      tile2.stateRef().boundAttendeeId = 'attendee-2';
      const tile3 = tileController.addVideoTile();
      tile3.stateRef().boundAttendeeId = 'attendee-3';
      const tile4 = tileController.addVideoTile();
      tile4.stateRef().boundAttendeeId = 'attendee-4';

      incrementTime(6100);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 2100 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 2822 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 7]);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // Start Probe
      incrementTime(6000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 8]);

      // Probe fail
      incrementTime(5000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 465 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 7]);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 405 * 1000;
      setPacketLoss(metricReport, 40, 30);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 405 * 1000;
      setPacketLoss(metricReport, 50, 40);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 405 * 1000;
      setPacketLoss(metricReport, 60, 50);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 4, 6, 7]);
      expect(tile2.state().paused).to.equal(true);
      expect(tile3.state().paused).to.equal(true);
      expect(tile4.state().paused).to.equal(true);
    });
  });

  describe('paused', () => {
    it('Tile added but not in subscribe', () => {
      const domMockBuilder = new DOMMockBuilder();
      updateIndexFrame(videoStreamIndex, 2, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] =
        10000 * 1000;
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-2', 1));
      preferences.add(new VideoPreference('attendee-1', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);
      const tile1 = tileController.addVideoTile();
      tile1.stateRef().boundAttendeeId = 'attendee-1';
      const mediaStream = new MediaStream();
      tile1.bindVideoStream('attendee-1', false, mediaStream, 2, 2, 1);
      const tile2 = tileController.addVideoTile();
      tile2.stateRef().boundAttendeeId = 'attendee-2';
      tile1.bindVideoStream('attendee-2', false, mediaStream, 2, 2, 1);

      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 2400 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      preferences.add(new VideoPreference('attendee-3', 3));
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      const tiles = tileController.getAllRemoteVideoTiles();
      for (const tile of tiles) {
        const state = tile.state();
        if (state.boundAttendeeId === 'attendee-3') {
          expect(state.paused).to.equal(true);
        } else {
          expect(state.paused).to.equal(false);
        }
      }

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 2400 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 5]);
      for (const tile of tiles) {
        const state = tile.state();
        expect(state.paused).to.equal(false);
      }
      domMockBuilder.cleanup();
    });

    it('Stream not added until enough bandwidth', () => {
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] =
        10000 * 1000;
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-1', 2));
      preferences.add(new VideoPreference('attendee-2', 2));
      preferences.add(new VideoPreference('attendee-3', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 5]);
      const tile1 = tileController.addVideoTile();
      tile1.stateRef().boundAttendeeId = 'attendee-1';
      const tile2 = tileController.addVideoTile();
      tile2.stateRef().boundAttendeeId = 'attendee-2';
      const tile3 = tileController.addVideoTile();
      tile3.stateRef().boundAttendeeId = 'attendee-3';

      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6]);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 900 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5]);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 300 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      expect(tile2.state().paused).to.equal(true);
      expect(tile3.state().paused).to.equal(true);

      incrementTime(3000);
      updateIndexFrame(videoStreamIndex, 4, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 300 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      preferences.add(new VideoPreference('attendee-4', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      let tiles = tileController.getAllRemoteVideoTiles();
      for (const tile of tiles) {
        const state = tile.state();
        if (state.boundAttendeeId === 'attendee-1') {
          expect(state.paused).to.equal(false);
        } else {
          expect(state.paused).to.equal(true);
        }
      }
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5]);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 600 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      tiles = tileController.getAllRemoteVideoTiles();
      for (const tile of tiles) {
        const state = tile.state();
        if (state.boundAttendeeId === 'attendee-1' || state.boundAttendeeId === 'attendee-2') {
          expect(state.paused).to.equal(false);
        } else {
          expect(state.paused).to.equal(true);
        }
      }

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 1200 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5, 7]);
      tiles = tileController.getAllRemoteVideoTiles();
      for (const tile of tiles) {
        const state = tile.state();
        expect(state.paused).to.equal(false);
      }
    });

    it('Video Tile cleaned up if never subscribed', () => {
      updateIndexFrame(videoStreamIndex, 2, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] =
        10000 * 1000;
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-1', 2));
      preferences.add(new VideoPreference('attendee-2', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);
      const tile1 = tileController.addVideoTile();
      tile1.stateRef().boundAttendeeId = 'attendee-1';
      const tile2 = tileController.addVideoTile();
      tile2.stateRef().boundAttendeeId = 'attendee-2';

      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 900 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3]);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 300 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      expect(tile2.state().paused).to.equal(true);

      incrementTime(3000);
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 300 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      preferences.add(new VideoPreference('attendee-3', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      const tiles = tileController.getAllRemoteVideoTiles();
      for (const tile of tiles) {
        const state = tile.state();
        if (state.boundAttendeeId === 'attendee-1') {
          expect(state.paused).to.equal(false);
        } else {
          expect(state.paused).to.equal(true);
        }
      }
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3]);
      expect(tileController.haveVideoTileForAttendeeId('attendee-3')).to.equal(true);

      incrementTime(3000);
      updateIndexFrame(videoStreamIndex, 2, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      expect(tileController.haveVideoTileForAttendeeId('attendee-3')).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 300 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      expect(tile2.state().paused).to.equal(true);

      preferences.clear();
      preferences.add(new VideoPreference('attendee-1', 2));
      preferences.add(new VideoPreference('attendee-2', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
    });

    it('Video Tile cleaned up removed from preference list', () => {
      updateIndexFrame(videoStreamIndex, 2, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] =
        10000 * 1000;
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-1', 2));
      preferences.add(new VideoPreference('attendee-2', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);
      const tile1 = tileController.addVideoTile();
      tile1.stateRef().boundAttendeeId = 'attendee-1';
      const tile2 = tileController.addVideoTile();
      tile2.stateRef().boundAttendeeId = 'attendee-2';

      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 600 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3]);

      incrementTime(3000);
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 600 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      preferences.add(new VideoPreference('attendee-3', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      const tiles = tileController.getAllRemoteVideoTiles();
      for (const tile of tiles) {
        const state = tile.state();
        if (state.boundAttendeeId === 'attendee-3') {
          expect(state.paused).to.equal(true);
        } else {
          expect(state.paused).to.equal(false);
        }
      }
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3]);
      expect(tileController.haveVideoTileForAttendeeId('attendee-3')).to.equal(true);

      incrementTime(3000);
      preferences.clear();
      preferences.add(new VideoPreference('attendee-1', 2));
      preferences.add(new VideoPreference('attendee-2', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      expect(tileController.haveVideoTileForAttendeeId('attendee-3')).to.equal(false);
    });
  });

  describe('minimizeThrashing', () => {
    it('dont change subscription with small change', () => {
      updateIndexFrame(videoStreamIndex, 4, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] =
        10000 * 1000;
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-1', 1));
      preferences.add(new VideoPreference('attendee-2', 1));
      preferences.add(new VideoPreference('attendee-3', 1));
      preferences.add(new VideoPreference('attendee-4', 1));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      const received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 3, 5, 7]);

      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      setPacketLoss(metricReport, 0, 1);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 1100 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      const bitrates = updateBitrateFrame(2, 200, 1100);
      videoStreamIndex.integrateBitratesFrame(bitrates);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
    });
  });

  describe('VideoPriorityBasedPolicyConfig', () => {
    it('unstable network with unstable preset', () => {
      const config = VideoPriorityBasedPolicyConfig.UnstableNetworkPreset;
      policy.setVideoPriorityBasedPolicyConfigs(config);
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] =
        10000 * 1000;
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-1', 2));
      preferences.add(new VideoPreference('attendee-2', 2));
      preferences.add(new VideoPreference('attendee-3', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 5]);
      const tile1 = tileController.addVideoTile();
      tile1.stateRef().boundAttendeeId = 'attendee-1';
      const tile2 = tileController.addVideoTile();
      tile2.stateRef().boundAttendeeId = 'attendee-2';
      const tile3 = tileController.addVideoTile();
      tile3.stateRef().boundAttendeeId = 'attendee-3';

      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6]);

      // bandwidth drop without packet loss will not trigger resubscribe
      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // bandwidth drops and quickly resubscribed
      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 900 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5]);

      // will not resubscribe since the delay causes times out
      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(5100);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 5]);
    });

    it('stable network with unstable preset', () => {
      const config = VideoPriorityBasedPolicyConfig.StableNetworkPreset;
      policy.setVideoPriorityBasedPolicyConfigs(config);
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] =
        10000 * 1000;
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-1', 2));
      preferences.add(new VideoPreference('attendee-2', 2));
      preferences.add(new VideoPreference('attendee-3', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 5]);
      const tile1 = tileController.addVideoTile();
      tile1.stateRef().boundAttendeeId = 'attendee-1';
      const tile2 = tileController.addVideoTile();
      tile2.stateRef().boundAttendeeId = 'attendee-2';
      const tile3 = tileController.addVideoTile();
      tile3.stateRef().boundAttendeeId = 'attendee-3';

      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6]);

      // bandwidth drops but will not resubscribe since delay causes timeout
      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 900 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(5100);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5]);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 5]);
    });
  });
});
