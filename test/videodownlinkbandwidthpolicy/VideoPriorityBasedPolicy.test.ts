// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioVideoTileController from '../../src/audiovideocontroller/AudioVideoController';
import NoOpAudioVideoTileController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import ClientMetricReport from '../../src/clientmetricreport/ClientMetricReport';
import ClientMetricReportDirection from '../../src/clientmetricreport/ClientMetricReportDirection';
import ClientMetricReportMediaType from '../../src/clientmetricreport/ClientMetricReportMediaType';
import GlobalMetricReport from '../../src/clientmetricreport/GlobalMetricReport';
import StreamMetricReport from '../../src/clientmetricreport/StreamMetricReport';
import ContentShareConstants from '../../src/contentsharecontroller/ContentShareConstants';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import ServerSideNetworkAdaption from '../../src/signalingclient/ServerSideNetworkAdaption';
import {
  SdkBitrate,
  SdkBitrateFrame,
  SdkIndexFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
} from '../../src/signalingprotocol/SignalingProtocol';
import { wait } from '../../src/utils/Utils';
import TargetDisplaySize from '../../src/videodownlinkbandwidthpolicy/TargetDisplaySize';
import VideoDownlinkObserver from '../../src/videodownlinkbandwidthpolicy/VideoDownlinkObserver';
import VideoPreference from '../../src/videodownlinkbandwidthpolicy/VideoPreference';
import { VideoPreferences } from '../../src/videodownlinkbandwidthpolicy/VideoPreferences';
import VideoPriorityBasedPolicy from '../../src/videodownlinkbandwidthpolicy/VideoPriorityBasedPolicy';
import VideoPriorityBasedPolicyConfig from '../../src/videodownlinkbandwidthpolicy/VideoPriorityBasedPolicyConfig';
import VideoQualityAdaptationPreference from '../../src/videodownlinkbandwidthpolicy/VideoQualityAdaptationPreference';
import SimulcastVideoStreamIndex from '../../src/videostreamindex/SimulcastVideoStreamIndex';
import VideoTileController from '../../src/videotilecontroller/VideoTileController';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('VideoPriorityBasedPolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const logger = new NoOpDebugLogger();
  let policy: VideoPriorityBasedPolicy;
  let videoStreamIndex: SimulcastVideoStreamIndex;
  let audioVideoController: AudioVideoTileController;
  let tileController: VideoTileController;

  let domMockBuilder: DOMMockBuilder;
  let behavior: DOMMockBehavior;
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
    highSimulRate: number,
    contentIndex?: number
  ): void {
    const sources: SdkStreamDescriptor[] = [];
    for (let i = 1; i < remoteClientCnt + 1; i++) {
      const attendee = `attendee-${i}` + (contentIndex === i ? ContentShareConstants.Modality : '');
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

  function updateSvcIndexFrame(index: SimulcastVideoStreamIndex, remoteClientCnt: number): void {
    const sources: SdkStreamDescriptor[] = [];
    for (let i = 1; i < remoteClientCnt + 1; i++) {
      const attendee = `attendee-svc-${i}`;
      sources.push(
        // Main (S3T3) stream: 1080p@30fps 1500 kbps
        new SdkStreamDescriptor({
          streamId: 10 * i - 9,
          groupId: i,
          maxBitrateKbps: 1500,
          avgBitrateBps: 1500 * 1000,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
          width: 1920,
          height: 1080,
          framerate: 30,
        })
      );
      sources.push(
        // S1T1 stream: 270p@7fps 100 kbps
        new SdkStreamDescriptor({
          streamId: 10 * i - 8,
          groupId: i,
          maxBitrateKbps: 100,
          avgBitrateBps: 100 * 1000,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
          width: 480,
          height: 270,
          framerate: 7,
        })
      );
      sources.push(
        // S1T2 stream: 270p@15fps 150 kbps
        new SdkStreamDescriptor({
          streamId: 10 * i - 7,
          groupId: i,
          maxBitrateKbps: 150,
          avgBitrateBps: 150 * 1000,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
          width: 480,
          height: 270,
          framerate: 15,
        })
      );
      sources.push(
        // S1T3 stream: 270p@30fps 200 kbps
        new SdkStreamDescriptor({
          streamId: 10 * i - 6,
          groupId: i,
          maxBitrateKbps: 200,
          avgBitrateBps: 200 * 1000,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
          width: 480,
          height: 270,
          framerate: 30,
        })
      );
      sources.push(
        // S2T1 stream: 540p@7fps 250 kbps
        new SdkStreamDescriptor({
          streamId: 10 * i - 5,
          groupId: i,
          maxBitrateKbps: 250,
          avgBitrateBps: 250 * 1000,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
          width: 960,
          height: 540,
          framerate: 7,
        })
      );
      sources.push(
        // S2T2 stream: 540p@15fps 400 kbps
        new SdkStreamDescriptor({
          streamId: 10 * i - 4,
          groupId: i,
          maxBitrateKbps: 400,
          avgBitrateBps: 400 * 1000,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
          width: 960,
          height: 540,
          framerate: 15,
        })
      );
      sources.push(
        // S2T3 stream: 540p@30fps 650 kbps
        new SdkStreamDescriptor({
          streamId: 10 * i - 3,
          groupId: i,
          maxBitrateKbps: 650,
          avgBitrateBps: 650 * 1000,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
          width: 960,
          height: 540,
          framerate: 30,
        })
      );
      sources.push(
        // S3T1 stream: 1080p@7fps 600 kbps
        new SdkStreamDescriptor({
          streamId: 10 * i - 2,
          groupId: i,
          maxBitrateKbps: 600,
          avgBitrateBps: 600 * 1000,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
          width: 1920,
          height: 1080,
          framerate: 7,
        })
      );
      sources.push(
        // S3T2 stream: 1080p@15fps 1000 kbps
        new SdkStreamDescriptor({
          streamId: 10 * i - 1,
          groupId: i,
          maxBitrateKbps: 1000,
          avgBitrateBps: 1000 * 1000,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
          width: 1920,
          height: 1080,
          framerate: 15,
        })
      );
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
    metricReport: ClientMetricReport,
    nackCnt: number,
    packetsLost: number,
    isGoogStat: boolean = true,
    usedBandwidthKbps: number = 10
  ): void {
    metricReport.currentTimestampMs = 2000;
    metricReport.previousTimestampMs = 1000;
    const streamReport1 = new StreamMetricReport();
    streamReport1.streamId = 1;
    streamReport1.direction = ClientMetricReportDirection.DOWNSTREAM;
    streamReport1.mediaType = ClientMetricReportMediaType.VIDEO;
    if (isGoogStat) {
      streamReport1.previousMetrics['nackCount'] = 0;
      streamReport1.currentMetrics['nackCount'] = nackCnt;
    } else {
      streamReport1.previousMetrics['nackCount'] = 0;
      streamReport1.currentMetrics['nackCount'] = nackCnt;
    }
    streamReport1.previousMetrics['packetsLost'] = 0;
    streamReport1.currentMetrics['packetsLost'] = packetsLost;
    streamReport1.currentMetrics['bytesReceived'] = usedBandwidthKbps * 1000;

    metricReport.streamMetricReports[1] = streamReport1;
  }

  beforeEach(() => {
    startTime = Date.now();
    originalDateNow = Date.now;
    Date.now = mockDateNow;
    behavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(behavior);
    audioVideoController = new NoOpAudioVideoTileController();
    tileController = audioVideoController.videoTileController;
    const policyConfig = new VideoPriorityBasedPolicyConfig();
    // Most of the tests below are for the legacy path without server side network adaptation
    policyConfig.serverSideNetworkAdaption = ServerSideNetworkAdaption.None;
    policy = new VideoPriorityBasedPolicy(logger, policyConfig);
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

  describe('default preference', () => {
    it('use default preference', () => {
      updateIndexFrame(videoStreamIndex, 1, 0, 1200);
      policy.updateIndex(videoStreamIndex);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2]);

      // After startup period which is 6000 ms
      incrementTime(6100);
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);

      updateIndexFrame(videoStreamIndex, 2, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);

      updateIndexFrame(videoStreamIndex, 6, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5, 7, 9, 11]);

      updateIndexFrame(videoStreamIndex, 10, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5, 7, 9, 11, 13, 15, 17, 19]);
    });

    it('use default preference with bandwidth probing', () => {
      const config = new VideoPriorityBasedPolicyConfig();
      config.serverSideNetworkAdaption = ServerSideNetworkAdaption.BandwidthProbing;
      const policy = new VideoPriorityBasedPolicy(logger, config);

      updateIndexFrame(videoStreamIndex, 1, 0, 1200);
      policy.updateIndex(videoStreamIndex);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2]);

      // After startup period which is 6000 ms
      incrementTime(6100);
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);

      updateIndexFrame(videoStreamIndex, 2, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);

      updateIndexFrame(videoStreamIndex, 6, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5, 7, 9, 11]);

      updateIndexFrame(videoStreamIndex, 10, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5, 7, 9, 11, 13, 15, 17, 19]);
    });

    it('pause tiles if not enough bandwidth for default preference', () => {
      policy.bindToTileController(tileController);
      updateIndexFrame(videoStreamIndex, 3, 0, 1000);
      policy.updateIndex(videoStreamIndex);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);
      const tile1 = tileController.addVideoTile();
      tile1.stateRef().boundAttendeeId = 'attendee-1';
      const tile2 = tileController.addVideoTile();
      tile2.stateRef().boundAttendeeId = 'attendee-2';
      expect(tileController.getAllVideoTiles().length).to.equal(3);
      const tile3 = tileController.getAllVideoTiles()[0];
      expect(tile3.state().boundAttendeeId).to.equal('attendee-3');

      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);

      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6]);
      expect(tile1.state().paused).to.be.false;
      expect(tile2.state().paused).to.be.false;
      expect(tile3.state().paused).to.be.false;

      incrementTime(2100);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2600 * 1000;
      policy.updateMetrics(metricReport);

      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6]);
      expect(tile1.state().paused).to.be.false;
      expect(tile2.state().paused).to.be.false;
      expect(tile3.state().paused).to.be.true;
    });
  });

  describe('chooseRemoteVideoSources', () => {
    it('Can be called if videoPreferences is empty', () => {
      policy.chooseRemoteVideoSources(VideoPreferences.prepare().build());
    });

    it('Can be called if videoPreferences is undefined', () => {
      policy.chooseRemoteVideoSources(undefined);
    });

    it('Will not be mutated', () => {
      updateIndexFrame(videoStreamIndex, 2, 0, 600);
      policy.updateIndex(videoStreamIndex);
      const preferences = VideoPreferences.prepare();
      const p1 = new VideoPreference('attendee-1', 5, TargetDisplaySize.High);
      preferences.add(p1);
      const p2 = new VideoPreference('attendee-2', 5, TargetDisplaySize.High);
      preferences.add(p2);
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);

      p1.priority = 10;
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);
    });

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

    it('proactively trigger server side network adaption when video preferences are updated and video observer fully implemented bandwidth probing', async () => {
      let called = false;
      policy.setWantsResubscribeObserver(() => {
        called = true;
      });

      policy.setServerSideNetworkAdaption(ServerSideNetworkAdaption.BandwidthProbing);
      const preferences = VideoPreferences.prepare();
      const p1 = new VideoPreference('attendee-1', 5, TargetDisplaySize.High);
      preferences.add(p1);
      const p2 = new VideoPreference('attendee-2', 5, TargetDisplaySize.Medium);
      preferences.add(p2);
      const p3 = new VideoPreference('attendee-3', 5, TargetDisplaySize.Medium);
      preferences.add(p3);

      policy.chooseRemoteVideoSources(preferences.build());

      // @ts-ignore
      expect(called).to.be.true;
    });

    it('proactively trigger server side network adaption when video preferences are updated and video observer fully implemented', async () => {
      let called = false;
      policy.setWantsResubscribeObserver(() => {
        called = true;
      });

      policy.setServerSideNetworkAdaption(
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption
      );
      const preferences = VideoPreferences.prepare();
      const p1 = new VideoPreference('attendee-1', 5, TargetDisplaySize.High);
      preferences.add(p1);
      const p2 = new VideoPreference('attendee-2', 5, TargetDisplaySize.Medium);
      preferences.add(p2);
      const p3 = new VideoPreference('attendee-3', 5, TargetDisplaySize.Medium);
      preferences.add(p3);

      policy.chooseRemoteVideoSources(preferences.build());

      // @ts-ignore
      expect(called).to.be.true;
    });

    it('not trigger server side network adaption when video preferences are updated and video observer partially implemented', async () => {
      class MockObserver implements VideoDownlinkObserver {
        tileWillBePausedByDownlinkPolicy = sinon.stub();
        tileWillBeUnpausedByDownlinkPolicy = sinon.stub();
      }
      const observer = new MockObserver();
      policy.addObserver(observer);

      policy.setServerSideNetworkAdaption(ServerSideNetworkAdaption.BandwidthProbing);
      const preferences = VideoPreferences.prepare();
      const p1 = new VideoPreference('attendee-1', 5, TargetDisplaySize.High);
      preferences.add(p1);
      const p2 = new VideoPreference('attendee-2', 5, TargetDisplaySize.Medium);
      preferences.add(p2);
      const p3 = new VideoPreference('attendee-3', 5, TargetDisplaySize.Medium);
      preferences.add(p3);

      policy.chooseRemoteVideoSources(preferences.build());

      // @ts-ignore
      expect(policy.pendingActionAfterUpdatedPreferences).to.be.true;

      policy.removeObserver(observer);
    });

    it('populates stream ids using allHighestPolicy when server side video adaption is enabled', async () => {
      policy.setServerSideNetworkAdaption(
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption
      );
      const preferences = VideoPreferences.prepare();
      const p1 = new VideoPreference('attendee-1', 5, TargetDisplaySize.High);
      preferences.add(p1);
      const p2 = new VideoPreference('attendee-2', 5, TargetDisplaySize.High);
      preferences.add(p2);
      const p3 = new VideoPreference('attendee-3', 5, TargetDisplaySize.Medium);
      preferences.add(p3);
      policy.chooseRemoteVideoSources(preferences.build());

      // @ts-ignore
      expect(policy.videoPreferencesUpdated).to.be.false;

      updateIndexFrame(videoStreamIndex, 3, 0, 600);
      policy.updateIndex(videoStreamIndex);

      const resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      const received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6]);
    });

    it('Interprets default value as BandwidthProbingAndRemoteVideoQualityAdaption', async () => {
      const config = new VideoPriorityBasedPolicyConfig();
      config.serverSideNetworkAdaption = ServerSideNetworkAdaption.Default;
      const policy = new VideoPriorityBasedPolicy(logger, config);

      // @ts-ignore
      expect(policy.videoPriorityBasedPolicyConfig.serverSideNetworkAdaption).to.be.eq(
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption
      );

      updateIndexFrame(videoStreamIndex, 3, 0, 600);
      policy.updateIndex(videoStreamIndex);

      const resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      const received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6]);
    });
  });

  describe('getVideoPreferences', () => {
    it('Initially returns dummy preferences', () => {
      const mutablePreferences = VideoPreferences.prepare();
      const preferences = mutablePreferences.build();
      expect(policy.getVideoPreferences().equals(preferences)).to.be.true;
    });

    it('Will have up to date preferences', () => {
      const preferences = VideoPreferences.prepare();
      const p1 = new VideoPreference('attendee-1', 5, TargetDisplaySize.High);
      preferences.add(p1);
      const p2 = new VideoPreference('attendee-2', 5, TargetDisplaySize.High);
      preferences.add(p2);
      policy.chooseRemoteVideoSources(preferences.build());

      expect(policy.getVideoPreferences().equals(preferences.build())).to.be.true;
    });
  });

  describe('getVideoPreferences', () => {
    it('Initially returns dummy preferences', () => {
      const mutablePreferences = VideoPreferences.prepare();
      const preferences = mutablePreferences.build();
      expect(policy.getVideoPreferences().equals(preferences)).to.be.true;
    });

    it('Will have up to date preferences', () => {
      const preferences = VideoPreferences.prepare();
      const p1 = new VideoPreference('attendee-1', 5, TargetDisplaySize.High);
      preferences.add(p1);
      const p2 = new VideoPreference('attendee-2', 5, TargetDisplaySize.High);
      preferences.add(p2);
      policy.chooseRemoteVideoSources(preferences.build());

      expect(policy.getVideoPreferences().equals(preferences.build())).to.be.true;
    });
  });

  describe('priority on off same', () => {
    it('no priority to priority', () => {
      updateIndexFrame(videoStreamIndex, 5, 0, 600);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      // This is lower than the default kbps so it should use it due to startup period
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2400 * 1000;
      policy.updateMetrics(metricReport);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 8]);

      // No startup period now so we should use 2400 kbps for bandwidth estimate but should not trigger resubscribe
      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2400 * 1000;
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
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2400 * 1000;
      policy.updateMetrics(metricReport);
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-3', 1));
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([6]);

      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2400 * 1000;
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
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2400 * 1000;
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
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 10000 * 1000;
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
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 9000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      preferences.clear();
      preferences.add(new VideoPreference('attendee-2', 1));
      preferences.add(new VideoPreference('attendee-1', 2));
      policy.chooseRemoteVideoSources(preferences.build());
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 1200 * 1000;
      setPacketLoss(metricReport, 42, 160);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      expect(tile1.state().paused).to.equal(true);
      await callbackPromise;

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 700 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 3]);
      expect(tile1.state().paused).to.equal(true);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 600 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // Probe
      incrementTime(7000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);
      expect(tile1.state().paused).to.equal(true);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 700 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 750 * 1000;
      // Override with used kbps in this case and put packet loss below threshold
      setPacketLoss(metricReport, 0, 1, true, 1100);
      policy.updateMetrics(metricReport);
      const bitrates = updateBitrateFrame(2, 200, 1100);
      videoStreamIndex.integrateBitratesFrame(bitrates);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // Probe success
      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 1300 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(6000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2700 * 1000;
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
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2100 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2822 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 7]);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // Start Probe
      incrementTime(6000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 8]);

      // Probe fail
      incrementTime(5000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 465 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 7]);

      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 405 * 1000;
      setPacketLoss(metricReport, 40, 30);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
    });

    it('Probe fail with StableNetworkPreset', () => {
      updateIndexFrame(videoStreamIndex, 4, 300, 1200);
      const policyConfig = VideoPriorityBasedPolicyConfig.StableNetworkPreset;
      policyConfig.serverSideNetworkAdaption = ServerSideNetworkAdaption.None;
      policy.setVideoPriorityBasedPolicyConfigs(policyConfig);
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
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2100 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2822 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 7]);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // Start Probe
      incrementTime(6000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 8]);

      // Probe fail
      incrementTime(5000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 465 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6, 7]);

      incrementTime(6100);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 405 * 1000;
      setPacketLoss(metricReport, 40, 30);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 405 * 1000;
      setPacketLoss(metricReport, 50, 40);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 405 * 1000;
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
    it('Tile added but not in subscribe', async () => {
      const observer: VideoDownlinkObserver = {
        tileWillBePausedByDownlinkPolicy(_tileId: number) {},
        tileWillBeUnpausedByDownlinkPolicy(_tileId: number) {},
      };
      const spyPause = sinon.spy(observer, 'tileWillBePausedByDownlinkPolicy');
      const spyUnpause = sinon.spy(observer, 'tileWillBeUnpausedByDownlinkPolicy');
      policy.addObserver(observer);
      updateIndexFrame(videoStreamIndex, 2, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 10000 * 1000;
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
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2400 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      preferences.add(new VideoPreference('attendee-3', 3));
      policy.chooseRemoteVideoSources(preferences.build());
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      const tiles = tileController.getAllRemoteVideoTiles();
      let attendee3TileId;
      for (const tile of tiles) {
        const state = tile.state();
        if (state.boundAttendeeId === 'attendee-3') {
          attendee3TileId = tile.id();
          expect(state.paused).to.equal(true);
        } else {
          expect(state.paused).to.equal(false);
        }
      }
      await wait(5);
      expect(spyPause.calledOnceWith(attendee3TileId)).to.be.true;

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 2400 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
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
      await wait(5);
      expect(spyUnpause.calledOnceWith(attendee3TileId)).to.be.true;
      domMockBuilder.cleanup();
      spyPause.restore();
      spyUnpause.restore();
      policy.removeObserver(observer);
    });

    it('Stream not added until enough bandwidth', () => {
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 10000 * 1000;
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
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6]);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 900 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5]);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 300 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      expect(tile2.state().paused).to.equal(true);
      expect(tile3.state().paused).to.equal(true);

      incrementTime(3000);
      updateIndexFrame(videoStreamIndex, 4, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 300 * 1000;
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
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 600 * 1000;
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
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 1200 * 1000;
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
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 10000 * 1000;
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
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 900 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3]);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 300 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);
      expect(tile2.state().paused).to.equal(true);

      incrementTime(3000);
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 300 * 1000;
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
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 300 * 1000;
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
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 10000 * 1000;
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
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 600 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3]);

      incrementTime(3000);
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 600 * 1000;
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
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 10000 * 1000;
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
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      setPacketLoss(metricReport, 0, 0);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      setPacketLoss(metricReport, 0, 1);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(2000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 1100 * 1000;
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
    it('will not instantly drop videos caused by dip during startup period', () => {
      const policyConfig = VideoPriorityBasedPolicyConfig.StableNetworkPreset;
      policyConfig.serverSideNetworkAdaption = ServerSideNetworkAdaption.None;
      policy.setVideoPriorityBasedPolicyConfigs(policyConfig);
      updateIndexFrame(videoStreamIndex, 1, 0, 1200);
      policy.updateIndex(videoStreamIndex);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      const received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2]);

      incrementTime(2100);
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 1000 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(6100);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 300 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
    });

    it('unstable network with unstable preset', () => {
      const policyConfig = VideoPriorityBasedPolicyConfig.UnstableNetworkPreset;
      policyConfig.serverSideNetworkAdaption = ServerSideNetworkAdaption.None;
      policy.setVideoPriorityBasedPolicyConfigs(policyConfig);
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 10000 * 1000;
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
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6]);

      incrementTime(1000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // bandwidth drop without packet loss will not trigger resubscribe
      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      // bandwidth drops and quickly resubscribed
      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 900 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5]);

      // will not resubscribe since the delay causes times out
      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);

      incrementTime(5100);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 5]);
    });

    it('stable network with stable preset', () => {
      const config = VideoPriorityBasedPolicyConfig.StableNetworkPreset;
      config.serverSideNetworkAdaption = ServerSideNetworkAdaption.None;
      policy.setVideoPriorityBasedPolicyConfigs(config);
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 10000 * 1000;
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
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(false);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3600 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 6]);

      // bandwidth drops but will not resubscribe since delay causes timeout
      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 900 * 1000;
      setPacketLoss(metricReport, 30, 20);
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);

      incrementTime(8100);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 900 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1, 3, 5]);

      incrementTime(3000);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      policy.updateMetrics(metricReport);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4, 5]);
    });
  });

  describe('updateMetric', () => {
    it('can be no-op if there are no streams available to subscribe', () => {
      videoStreamIndex.integrateIndexFrame(new SdkIndexFrame());
      policy.updateIndex(videoStreamIndex);
      policy.updateMetrics(new ClientMetricReport(logger));
    });

    it('can update metrics', () => {
      updateIndexFrame(videoStreamIndex, 3, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      const metricReport = new ClientMetricReport(logger);
      const streamReport1 = new StreamMetricReport();
      streamReport1.streamId = 1;
      streamReport1.direction = ClientMetricReportDirection.DOWNSTREAM;
      streamReport1.mediaType = ClientMetricReportMediaType.VIDEO;
      streamReport1.currentMetrics['nackCount'] = 20;
      streamReport1.currentMetrics['packetsLost'] = 0;
      streamReport1.currentMetrics['framesReceived'] = 30;
      streamReport1.currentMetrics['bytesReceived'] = 20;

      metricReport.streamMetricReports[123456] = streamReport1;

      const streamReport2 = new StreamMetricReport();
      streamReport2.streamId = 2;
      streamReport2.direction = ClientMetricReportDirection.DOWNSTREAM;
      streamReport2.mediaType = ClientMetricReportMediaType.VIDEO;
      metricReport.streamMetricReports[234567] = streamReport2;

      const streamReport3 = new StreamMetricReport();
      streamReport3.streamId = 1;
      streamReport3.direction = ClientMetricReportDirection.UPSTREAM;
      streamReport3.mediaType = ClientMetricReportMediaType.VIDEO;
      streamReport3.currentMetrics['bytesSent'] = 60;
      metricReport.streamMetricReports[3123123] = streamReport3;

      policy.updateMetrics(metricReport);

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
      policy.wantsResubscribe();
      policy.chooseSubscriptions();
    });

    it('works with non goog stats', () => {
      updateIndexFrame(videoStreamIndex, 1, 0, 1200);
      policy.updateIndex(videoStreamIndex);
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2]);

      // After startup period which is 6000 ms
      incrementTime(6100);
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport = new GlobalMetricReport();
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 3000 * 1000;
      setPacketLoss(metricReport, 0, 0, false);
      policy.updateMetrics(metricReport);

      updateIndexFrame(videoStreamIndex, 2, 300, 1200);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2, 4]);
    });
  });

  describe('content share', () => {
    it('upgrades to high layer even if higher than than high target bitrate', () => {
      updateIndexFrame(videoStreamIndex, 1, 300, 2000, 1);
      policy.updateIndex(videoStreamIndex);
      const preferences = VideoPreferences.prepare();
      const p1 = new VideoPreference(
        `attendee-1${ContentShareConstants.Modality}`,
        1,
        TargetDisplaySize.High
      );
      preferences.add(p1);
      policy.chooseRemoteVideoSources(preferences.build());
      const resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      const received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2]);
    });

    it('skip upgrades to high layer if target resolution is low', () => {
      updateIndexFrame(videoStreamIndex, 1, 5, 10, 1);
      policy.updateIndex(videoStreamIndex);
      const preferences = VideoPreferences.prepare();
      const p1 = new VideoPreference(
        `attendee-1${ContentShareConstants.Modality}`,
        1,
        TargetDisplaySize.Low
      );
      preferences.add(p1);
      policy.chooseRemoteVideoSources(preferences.build());
      const resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      const received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1]);
    });

    it('consider target bitrate if target resolution is medium', () => {
      updateIndexFrame(videoStreamIndex, 1, 5, 10, 1);
      policy.updateIndex(videoStreamIndex);
      const preferences = VideoPreferences.prepare();
      const p1 = new VideoPreference(
        `attendee-1${ContentShareConstants.Modality}`,
        1,
        TargetDisplaySize.Medium
      );
      preferences.add(p1);
      policy.chooseRemoteVideoSources(preferences.build());
      let resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([2]);

      updateIndexFrame(videoStreamIndex, 1, 300, 800, 1);
      policy.updateIndex(videoStreamIndex);
      resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1]);
    });
  });

  describe('determineTargetRate', () => {
    it('caps target rate at 15000 kbps', () => {
      // @ts-ignore
      policy.startupPeriod = false;
      // @ts-ignore
      policy.downlinkStats.bandwidthEstimateKbps = 20000;
      // @ts-ignore
      expect(policy.determineTargetRate()).to.equal(15000);
    });
  });

  describe('degradation preference', () => {
    it('can choose with balanced degradation path', () => {
      updateSvcIndexFrame(videoStreamIndex, 6);
      policy.updateIndex(videoStreamIndex);
      const preferences = VideoPreferences.prepare();
      preferences.add(new VideoPreference('attendee-svc-1', 1, TargetDisplaySize.High));
      policy.chooseRemoteVideoSources(preferences.build());
      const resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1]);
      policy.reset();
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([]);
    });

    it('can choose with maintain framerate degradation path', () => {
      updateSvcIndexFrame(videoStreamIndex, 6);
      policy.updateIndex(videoStreamIndex);
      const preferences = VideoPreferences.prepare();
      preferences.add(
        new VideoPreference(
          'attendee-svc-1',
          1,
          TargetDisplaySize.High,
          VideoQualityAdaptationPreference.MaintainFramerate
        )
      );
      policy.chooseRemoteVideoSources(preferences.build());
      const resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1]);
      policy.reset();
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([]);
    });

    it('can choose with maintain resolution degradation path', () => {
      updateSvcIndexFrame(videoStreamIndex, 6);
      policy.updateIndex(videoStreamIndex);
      const preferences = VideoPreferences.prepare();
      preferences.add(
        new VideoPreference(
          'attendee-svc-1',
          1,
          TargetDisplaySize.High,
          VideoQualityAdaptationPreference.MaintainResolution
        )
      );
      policy.chooseRemoteVideoSources(preferences.build());
      const resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([1]);
      policy.reset();
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([]);
    });
  });
});
