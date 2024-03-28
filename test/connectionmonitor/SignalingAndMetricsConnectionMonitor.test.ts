// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import AudioVideoObserver from '../../src/audiovideoobserver/AudioVideoObserver';
import ClientMetricReport from '../../src/clientmetricreport/ClientMetricReport';
import ConnectionHealthData from '../../src/connectionhealthpolicy/ConnectionHealthData';
import SignalingAndMetricsConnectionMonitor from '../../src/connectionmonitor/SignalingAndMetricsConnectionMonitor';
import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import NoOpMediaStreamBroker from '../../src/mediastreambroker/NoOpMediaStreamBroker';
import PingPong from '../../src/pingpong/PingPong';
import PingPongObserver from '../../src/pingpongobserver/PingPongObserver';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';
import StatsCollector from '../../src/statscollector/StatsCollector';
import { Maybe } from '../../src/utils/Types';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

// eslint-disable-next-line
type RawMetrics = any;

describe('SignalingAndMetricsConnectionMonitor', () => {
  let domMockBuilder: DOMMockBuilder;
  let audioVideoController: NoOpAudioVideoController;
  let realTimeController: DefaultRealtimeController;
  let connectionHealthData: ConnectionHealthData;
  let pingPongStartCalled: boolean;
  let consecutiveMissedPongsCalled: boolean;
  let consecutiveStatsWithNoPackets: number | undefined = undefined;
  let lastPacketLossInboundTimestampMsCalled: boolean;
  let setLastNoSignalTimestampMsCalled: boolean;
  let setLastWeakSignalTimestampMsCalled: boolean;
  let setLastGoodSignalTimestampMsCalled: boolean;
  let consecutiveStatsWithNoAudioPacketsSentCalled: boolean;
  let signalStrengthCallback: (signalStrength: number) => void;

  class TestAudioVideoController extends NoOpAudioVideoController {
    private testObserverQueue: Set<AudioVideoObserver> = new Set<AudioVideoObserver>();

    addObserver(observer: AudioVideoObserver): void {
      this.testObserverQueue.add(observer);
    }

    removeObserver(observer: AudioVideoObserver): void {
      this.testObserverQueue.delete(observer);
    }

    forEachObserver(observerFunc: (observer: AudioVideoObserver) => void): void {
      for (const observer of this.testObserverQueue) {
        if (this.testObserverQueue.has(observer)) {
          observerFunc(observer);
        }
      }
    }
  }

  class TestRealtimeController extends DefaultRealtimeController {
    realtimeSubscribeToLocalSignalStrengthChange(callback: (signalStrength: number) => void): void {
      signalStrengthCallback = callback;
    }
  }

  class TestConnectionHealthData extends ConnectionHealthData {
    setConsecutiveMissedPongs(_pongs: number): void {
      consecutiveMissedPongsCalled = true;
    }
    setConsecutiveStatsWithNoPackets(count: number): void {
      super.setConsecutiveStatsWithNoPackets(count);
      consecutiveStatsWithNoPackets = count;
    }
    setLastPacketLossInboundTimestampMs(_timeStamp: number): void {
      lastPacketLossInboundTimestampMsCalled = true;
    }
    setLastNoSignalTimestampMs(_timeStamp: number): void {
      setLastNoSignalTimestampMsCalled = true;
    }
    setLastWeakSignalTimestampMs(_timeStamp: number): void {
      setLastWeakSignalTimestampMsCalled = true;
    }
    setLastGoodSignalTimestampMs(_timeStamp: number): void {
      setLastGoodSignalTimestampMsCalled = true;
    }
    setConsecutiveStatsWithNoAudioPacketsSent(_stats: number): void {
      consecutiveStatsWithNoAudioPacketsSentCalled = true;
      super.setConsecutiveStatsWithNoAudioPacketsSent(_stats);
    }
  }

  class TestPingPong implements PingPong {
    addObserver(_observer: PingPongObserver): void {}
    removeObserver(_observer: PingPongObserver): void {}
    forEachObserver(_observerFunc: (_observer: PingPongObserver) => void): void {}
    start(): void {
      pingPongStartCalled = true;
    }
    stop(): void {}
  }

  class TestClientMetricReport extends ClientMetricReport {
    audioPacketsReceived: RawMetrics = null;
    fractionLoss: RawMetrics = null;
    videoPacketSentPerSecond: RawMetrics = 1000;
    videoUpstreamBitrate: RawMetrics = 100;
    availableOutgoingBitrate: RawMetrics = 100;
    availableIncomingBitrate: RawMetrics = 100;
    videoUpstreamPacketsSent: RawMetrics = 100;
    videoUpstreamFramesEncodedPerSecond: RawMetrics = 100;
    videoUpstreamFrameHeight: RawMetrics = 100;
    videoUpstreamFrameWidth: RawMetrics = 100;
    videoDownstreamBitrate: RawMetrics = 100;
    videoDownstreamPacketLossPercent: RawMetrics = 100;
    videoDownstreamFramesDecodedPerSecond: RawMetrics = 100;
    videoDownstreamFrameHeight: RawMetrics = 100;
    videoDownstreamFrameWidth: RawMetrics = 100;
    audioPacketsSent: RawMetrics = 50;
    totalBytesReceived: number = 0;

    getObservableMetrics(): { [id: string]: number } {
      return {
        audioPacketsReceived: this.audioPacketsReceived,
        audioPacketsReceivedFractionLoss: this.fractionLoss,
        videoPacketSentPerSecond: this.videoPacketSentPerSecond,
        videoUpstreamBitrate: this.videoUpstreamBitrate,
        availableOutgoingBitrate: this.availableOutgoingBitrate,
        availableIncomingBitrate: this.availableIncomingBitrate,
        audioPacketsSent: this.audioPacketsSent,
      };
    }

    getObservableVideoMetrics(): { [id: string]: {} } {
      return {
        videoUpstreamBitrate: this.videoUpstreamPacketsSent,
        videoUpstreamPacketsSent: this.videoUpstreamPacketsSent,
        videoUpstreamFramesEncodedPerSecond: this.videoUpstreamFramesEncodedPerSecond,
        videoUpstreamFrameHeight: this.videoUpstreamFrameHeight,
        videoUpstreamFrameWidth: this.videoUpstreamFrameWidth,
      };
    }

    getRTCStatsReport(): RTCStatsReport {
      const rtcStatsReport = new Map<string, RawMetrics>([
        [
          'candidatePairId1',
          {
            type: 'candidate-pair',
            ...{
              bytesReceived: this.totalBytesReceived,
            },
          },
        ],
        [
          'candidatePairId2',
          {
            type: 'candidate-pair',
            ...{
              bytesReceived: 0,
            },
          },
        ],
      ]);

      return rtcStatsReport as RTCStatsReport;
    }
  }

  const expect: Chai.ExpectStatic = chai.expect;
  let connectionMonitor: SignalingAndMetricsConnectionMonitor;
  let testClientMetricReport: TestClientMetricReport;

  function sendClientMetricReport(clientMetricReport: ClientMetricReport): void {
    audioVideoController.forEachObserver(observer => {
      Maybe.of(observer.metricsDidReceive).map(f => f.bind(observer)(clientMetricReport));
    });
  }

  beforeEach(() => {
    domMockBuilder = new DOMMockBuilder();
    pingPongStartCalled = false;
    consecutiveMissedPongsCalled = false;
    consecutiveStatsWithNoPackets = 0;
    lastPacketLossInboundTimestampMsCalled = false;
    setLastNoSignalTimestampMsCalled = false;
    setLastWeakSignalTimestampMsCalled = false;
    setLastGoodSignalTimestampMsCalled = false;
    consecutiveStatsWithNoAudioPacketsSentCalled = false;
    audioVideoController = new TestAudioVideoController();
    realTimeController = new TestRealtimeController(new NoOpMediaStreamBroker());
    connectionHealthData = new TestConnectionHealthData();

    connectionMonitor = new SignalingAndMetricsConnectionMonitor(
      audioVideoController,
      realTimeController,
      connectionHealthData,
      new TestPingPong(),
      new StatsCollector(audioVideoController, new NoOpDebugLogger())
    );
    connectionMonitor.start();
    testClientMetricReport = new TestClientMetricReport(new NoOpDebugLogger());
  });

  afterEach(() => {
    connectionMonitor.stop();
    if (domMockBuilder) {
      domMockBuilder.cleanup();
      domMockBuilder = null;
    }
  });

  it('can receive a pong', () => {
    connectionMonitor.didReceivePong(0, 0, 0);
    expect(consecutiveMissedPongsCalled).to.equal(true);
  });

  it('can notify observers', done => {
    class TestObserver implements AudioVideoObserver {
      connectionHealthDidChange?(_connectionHealthData: ConnectionHealthData): void {
        done();
      }
    }
    audioVideoController.addObserver(new TestObserver());
    connectionMonitor.didReceivePong(0, 0, 0);
  });

  it('can miss a pong', () => {
    connectionMonitor.didMissPongs();
    expect(consecutiveMissedPongsCalled).to.equal(true);
  });

  it('can add to a minute window that is not full', () => {
    const window: number[] = [];
    const num = 1;
    connectionHealthData.packetsReceivedInLastMinute = window;
    testClientMetricReport.audioPacketsReceived = num;
    testClientMetricReport.fractionLoss = 1;
    sendClientMetricReport(testClientMetricReport);
    expect(window.length).to.equal(1);
    expect(window[0]).to.equal(1);
  });

  it('can add to a minute window that is full', () => {
    const window = new Array(60);
    let num: number;
    for (num = 0; num < 61; num++) {
      connectionHealthData.packetsReceivedInLastMinute = window;
      testClientMetricReport.audioPacketsReceived = num;
      testClientMetricReport.fractionLoss = 1;
      sendClientMetricReport(testClientMetricReport);
    }
    expect(window.length).to.equal(60);
    expect(window[59]).to.equal(1);
  });

  it('can return without changing stats when fraction loss is negative', () => {
    testClientMetricReport.audioPacketsReceived = 1;
    testClientMetricReport.fractionLoss = -1;
    sendClientMetricReport(testClientMetricReport);
    expect(consecutiveMissedPongsCalled).to.equal(false);
    expect(consecutiveStatsWithNoPackets).to.equal(0);
    expect(lastPacketLossInboundTimestampMsCalled).to.equal(false);
  });

  it('can return without changing stats when packets received is negative', () => {
    testClientMetricReport.audioPacketsReceived = -1;
    testClientMetricReport.fractionLoss = 1;
    sendClientMetricReport(testClientMetricReport);
    expect(consecutiveMissedPongsCalled).to.equal(false);
    expect(consecutiveStatsWithNoPackets).to.equal(0);
    expect(lastPacketLossInboundTimestampMsCalled).to.equal(false);
  });

  it('can return without changing stats when packets received is not a number', () => {
    testClientMetricReport.audioPacketsReceived = 'not a number';
    testClientMetricReport.fractionLoss = 1;
    sendClientMetricReport(testClientMetricReport);
    expect(consecutiveMissedPongsCalled).to.equal(false);
    expect(consecutiveStatsWithNoPackets).to.equal(0);
    expect(lastPacketLossInboundTimestampMsCalled).to.equal(false);
  });

  it('can return without changing stats when fractional packet loss is not a number', () => {
    testClientMetricReport.audioPacketsReceived = 1;
    testClientMetricReport.fractionLoss = 'not a number';
    sendClientMetricReport(testClientMetricReport);
    expect(consecutiveMissedPongsCalled).to.equal(false);
    expect(consecutiveStatsWithNoPackets).to.equal(0);
    expect(lastPacketLossInboundTimestampMsCalled).to.equal(false);
  });

  it('can return without changing stats when total bytes received is negative', () => {
    testClientMetricReport.totalBytesReceived = 4;
    testClientMetricReport.fractionLoss = 0;
    testClientMetricReport.audioPacketsReceived = 1;
    sendClientMetricReport(testClientMetricReport);
    testClientMetricReport.totalBytesReceived = 2;
    testClientMetricReport.fractionLoss = 0;
    testClientMetricReport.audioPacketsReceived = 1;
    sendClientMetricReport(testClientMetricReport);
    expect(consecutiveMissedPongsCalled).to.equal(false);
    expect(consecutiveStatsWithNoPackets).to.equal(0);
    expect(lastPacketLossInboundTimestampMsCalled).to.equal(false);
  });

  it('can reset and increment consecutive stats with no bytes when bytes received are followed by no bytes', () => {
    testClientMetricReport.totalBytesReceived = 1;
    testClientMetricReport.fractionLoss = 0;
    testClientMetricReport.audioPacketsReceived = 1;
    sendClientMetricReport(testClientMetricReport);
    expect(consecutiveStatsWithNoPackets).to.equal(0);
    testClientMetricReport.totalBytesReceived = 1;
    testClientMetricReport.fractionLoss = 0;
    testClientMetricReport.audioPacketsReceived = 0;
    sendClientMetricReport(testClientMetricReport);
    expect(consecutiveStatsWithNoPackets).to.equal(1);
    testClientMetricReport.totalBytesReceived = 1;
    testClientMetricReport.fractionLoss = 0;
    testClientMetricReport.audioPacketsReceived = 0;
    sendClientMetricReport(testClientMetricReport);
    expect(consecutiveStatsWithNoPackets).to.equal(2);
  });

  it('can set last packet loss inbound timestamp due to no packets', () => {
    testClientMetricReport.audioPacketsReceived = 0;
    testClientMetricReport.fractionLoss = 0;
    sendClientMetricReport(testClientMetricReport);
    expect(lastPacketLossInboundTimestampMsCalled).to.equal(true);
  });

  it('can set last packet loss inbound timestamp due to fractional packet loss', () => {
    testClientMetricReport.audioPacketsReceived = 1;
    testClientMetricReport.fractionLoss = 1;
    sendClientMetricReport(testClientMetricReport);
    expect(lastPacketLossInboundTimestampMsCalled).to.equal(true);
  });

  it('can set last no signal time stamp', () => {
    connectionMonitor.receiveSignalStrengthChange(0);
    expect(setLastNoSignalTimestampMsCalled).to.equal(true);
  });

  it('can set last weak signal time stamp', () => {
    connectionMonitor.receiveSignalStrengthChange(0.5);
    expect(setLastWeakSignalTimestampMsCalled).to.equal(true);
  });

  it('can set last good signal time stamp', () => {
    connectionMonitor.receiveSignalStrengthChange(1);
    expect(setLastGoodSignalTimestampMsCalled).to.equal(true);
  });

  it('can start a PingPong', () => {
    expect(pingPongStartCalled).to.equal(true);
  });

  it('can notify for local signal strength changes', () => {
    signalStrengthCallback(1);
    expect(setLastGoodSignalTimestampMsCalled).to.equal(true);
  });

  it('cannot notify for local signal strength changes if the connection monitor has stopped', () => {
    connectionMonitor.stop();
    signalStrengthCallback(1);
    expect(setLastGoodSignalTimestampMsCalled).to.equal(false);
  });

  it('can increment and reset consecutive stats with no audio packets sent', () => {
    testClientMetricReport.audioPacketsReceived = 1;
    testClientMetricReport.fractionLoss = 0;
    sendClientMetricReport(testClientMetricReport);
    expect(connectionHealthData.consecutiveStatsWithNoAudioPacketsSent).to.equal(0);

    testClientMetricReport.audioPacketsSent = 0;
    sendClientMetricReport(testClientMetricReport);
    expect(connectionHealthData.consecutiveStatsWithNoAudioPacketsSent).to.equal(1);

    testClientMetricReport.audioPacketsSent = 50;
    sendClientMetricReport(testClientMetricReport);
    expect(connectionHealthData.consecutiveStatsWithNoAudioPacketsSent).to.equal(0);
  });

  it('does not set consecutive stats with no audio packets sent when audioPacketsSent is not present', () => {
    testClientMetricReport.audioPacketsReceived = 1;
    testClientMetricReport.fractionLoss = 0;
    testClientMetricReport.audioPacketsSent = undefined;
    sendClientMetricReport(testClientMetricReport);
    expect(consecutiveStatsWithNoAudioPacketsSentCalled).to.be.false;
  });
});
