// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import {
  AudioVideoControllerState,
  ClientMetricReport,
  NoOpAudioVideoController,
  RedundantAudioEncoder,
  RedundantAudioRecoveryMetricReport,
  RedundantAudioRecoveryMetricsObserver,
} from '../../src';
import AudioProfile from '../../src/audioprofile/AudioProfile';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import {
  SdkIndexFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
  SdkSubscribeAckFrame,
  SdkTrackMapping,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIdSet from '../../src/videostreamidset/VideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

/**
 * Calls the DefaultTransceiverControllers metricsDidReceive observer method
 * based on the input parameters. This is used to unit test dynamic updates
 * to the number of redundant encodings based on the uplink packet loss
 *
 * @param tc The DefaultTransceiverController whose metricsDidReceive method we need to call.
 * @param startTimestampSecond Timestamp in seconds of the first metric report being sent out.
 *                             This will be converted to milliseconds in the report. This is also
 *                             used to derive mock packets sent metric in the report.
 * @param numMetricReports Number of times we want to call the metricsDidReceive method with a new metric report
 *                         Each metric reports currentTimestampMs will monotonically increase by 1000ms.
 *                         Each metric reports packetsSent will monotonically increased by 50.
 * @param totalPacketsLost The total packets lost metric to write to the metric report block
 *                         This value will be added to ALL metric reports if specified.
 */
function sendMetricReports(
  tc: DefaultTransceiverController,
  startTimestampSecond: number,
  numMetricReports: number,
  totalPacketsLost: number
): void {
  const logger = new NoOpLogger(LogLevel.DEBUG);
  for (let i = startTimestampSecond; i < startTimestampSecond + numMetricReports; i++) {
    const clientMetricReport = new ClientMetricReport(logger);
    clientMetricReport.currentTimestampMs = i * 1000;
    // @ts-ignore
    clientMetricReport.rtcStatsReport = [
      {
        kind: 'audio',
        type: 'outbound-rtp',
        packetsSent: i * 50,
      },
      {
        kind: 'audio',
        type: 'remote-inbound-rtp',
        packetsLost: totalPacketsLost,
      },
    ] as RTCStatsReport;
    tc.metricsDidReceive(clientMetricReport);
  }
}

describe('DefaultTransceiverController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  const domMockBehavior: DOMMockBehavior = new DOMMockBehavior();
  let tc: DefaultTransceiverController;
  let domMockBuilder: DOMMockBuilder;
  const context: AudioVideoControllerState = new AudioVideoControllerState();

  beforeEach(() => {
    domMockBehavior.browserName = 'chrome';
    domMockBuilder = new DOMMockBuilder(domMockBehavior);

    // Wrap the mock worker to initialize the RED worker since the worker code at the URL is not actually executed.
    const prevWorker = global.Worker;
    global.Worker = class MockRedWorker extends prevWorker {
      constructor(stringUrl: string) {
        super(stringUrl);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        self.postMessage = (message: any): void => {
          const msgEvent = new MessageEvent('message', { data: message });
          this.onmessage(msgEvent);
        };

        RedundantAudioEncoder.initializeWorker();
      }
    };

    context.browserBehavior = new DefaultBrowserBehavior();
    context.audioProfile = new AudioProfile();
    context.audioVideoController = new NoOpAudioVideoController();
    tc = new DefaultTransceiverController(logger, context.browserBehavior, context);

    // Enable logging for the RED worker since the worker code at the URL is not actually executed.
    if (tc['logger'].getLogLevel() === LogLevel.DEBUG) RedundantAudioEncoder.shouldLogDebug = true;
  });

  afterEach(() => {
    RedundantAudioEncoder.shouldLogDebug = false;
    delete self.onmessage;
    delete self.postMessage;
    // @ts-ignore
    delete self.onrtctransform;
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      expect(tc).to.not.equal(null);
    });
  });

  describe('useTransceivers', () => {
    it('can set peer connection and reset', () => {
      expect(tc.useTransceivers()).to.equal(false);

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      expect(tc.useTransceivers()).to.equal(true);

      tc.reset();
      expect(tc.useTransceivers()).to.equal(false);
    });
  });

  describe('setupLocalTransceivers', () => {
    it('can not set up transceivers if peer connection is not set', () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setupLocalTransceivers();
      expect(peer.getTransceivers().length).to.equal(0);
    });

    it('can set up transceivers with audio redundancy disabled', () => {
      context.audioProfile = new AudioProfile(
        /* audioBitrateBps */ null,
        /* enableAudioRedundancy */ false
      );
      tc = new DefaultTransceiverController(logger, context.browserBehavior, context);

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);

      expect(peer.getTransceivers().length).to.equal(0);
      tc.setupLocalTransceivers();
      expect(peer.getTransceivers().length).to.equal(2);
    });

    it('can set up transceivers once', () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      expect(peer.getTransceivers().length).to.equal(0);
      tc.setupLocalTransceivers();

      const transceivers = peer.getTransceivers();
      expect(transceivers.length).to.equal(2);

      const audioTransceiver = transceivers[0];
      expect(audioTransceiver.direction).to.equal('inactive');
      expect(audioTransceiver.receiver.track.kind).to.equal('audio');
      expect(audioTransceiver.sender.track.kind).to.equal('audio');

      const videoTransceiver = transceivers[1];
      expect(videoTransceiver.direction).to.equal('inactive');
      expect(videoTransceiver.receiver.track.kind).to.equal('video');
      expect(videoTransceiver.sender.track.kind).to.equal('video');

      tc.setupLocalTransceivers();
      expect(peer.getTransceivers()[0]).to.equal(audioTransceiver);
      expect(peer.getTransceivers()[1]).to.equal(videoTransceiver);
      expect(tc.localAudioTransceiver()).to.equal(peer.getTransceivers()[0]);
      expect(tc.localVideoTransceiver()).to.equal(peer.getTransceivers()[1]);
    });

    it('throws if worker creation fails', () => {
      // Wrap the mock worker to initialize the RED worker since the worker code at the URL is not actually executed.
      const prevWorker = global.Worker;
      global.Worker = class FailingRedWorker extends prevWorker {
        constructor(stringUrl: string) {
          super(stringUrl);
          throw new Error('bogus fail red worker');
        }
      };
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      expect(peer.getTransceivers().length).to.equal(0);
      expect(() => {
        tc.setupLocalTransceivers();
      }).to.throw('bogus fail red worker');
    });

    it('sets up the RED worker with RTCRtpScriptTransform', () => {
      // @ts-ignore
      const peer: RTCPeerConnection = new RTCPeerConnection({ encodedInsertableStreams: true });
      tc.setPeer(peer);

      const logSpy = sinon.spy(tc['logger'], 'debug');
      tc.setupLocalTransceivers();
      expect(logSpy.calledWith('[AudioRed] Setting up sender RED transform')).to.be.true;
      // The `rtctransform` event is defined since `RTCRtpScriptTransform` is supported.
      // @ts-ignore
      expect(self.onrtctransform).to.not.be.undefined;

      logSpy.restore();
    });

    it('sets up the RED worker with insertable streams when RTCRtpScriptTransform is not supported', () => {
      // @ts-ignore
      const RTCRtpScriptTransformer = window.RTCRtpScriptTransformer;
      // @ts-ignore
      const RTCTransformEvent = window.RTCTransformEvent;
      // @ts-ignore
      const RTCRtpScriptTransform = window.RTCRtpScriptTransform;
      // @ts-ignore
      delete window.RTCRtpScriptTransformer;
      // @ts-ignore
      delete window.RTCTransformEvent;
      // @ts-ignore
      delete window.RTCRtpScriptTransform;

      // @ts-ignore
      const peer: RTCPeerConnection = new RTCPeerConnection({ encodedInsertableStreams: true });
      tc.setPeer(peer);

      const logSpy = sinon.spy(tc['logger'], 'debug');
      tc.setupLocalTransceivers();
      expect(logSpy.calledWith('[AudioRed] Setting up sender RED transform')).to.be.true;
      // The `rtctransform` event is not defined since `RTCRtpScriptTransform` is not supported.
      // @ts-ignore
      expect(self.onrtctransform).to.be.undefined;

      logSpy.restore();
      // @ts-ignore
      window.RTCRtpScriptTransformer = RTCRtpScriptTransformer;
      // @ts-ignore
      window.RTCTransformEvent = RTCTransformEvent;
      // @ts-ignore
      window.RTCRtpScriptTransform = RTCRtpScriptTransform;
    });

    it('does not set up the RED worker when insertable streams are not supported and throws an exception', () => {
      // @ts-ignore
      const RTCRtpScriptTransformer = window.RTCRtpScriptTransformer;
      // @ts-ignore
      const RTCTransformEvent = window.RTCTransformEvent;
      // @ts-ignore
      const RTCRtpScriptTransform = window.RTCRtpScriptTransform;
      // @ts-ignore
      const receiverCreateEncodedStreams = RTCRtpReceiver.prototype.createEncodedStreams;
      // @ts-ignore
      const senderCreateEncodedStreams = RTCRtpSender.prototype.createEncodedStreams;
      // @ts-ignore
      delete window.RTCRtpScriptTransformer;
      // @ts-ignore
      delete window.RTCTransformEvent;
      // @ts-ignore
      delete window.RTCRtpScriptTransform;
      // @ts-ignore
      delete RTCRtpReceiver.prototype.createEncodedStreams;
      // @ts-ignore
      delete RTCRtpSender.prototype.createEncodedStreams;

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);

      const logSpy = sinon.spy(tc['logger'], 'debug');
      expect(() => {
        tc.setupLocalTransceivers();
      }).to.throw(
        '[AudioRed] Encoded insertable streams not supported. Recreating peer connection with audio redundancy disabled.'
      );
      expect(logSpy.calledWith('[AudioRed] Setting up sender RED transform')).to.be.false;

      // setupLocalTransceivers will force redundancy to be false before throwing the exception.
      // The peer connection is then recreated by setting encodedInsertableStreams to false.
      expect(tc['meetingSessionContext'].audioProfile.hasRedundancyEnabled()).to.be.false;

      logSpy.restore();
      // @ts-ignore
      window.RTCRtpScriptTransformer = RTCRtpScriptTransformer;
      // @ts-ignore
      window.RTCTransformEvent = RTCTransformEvent;
      // @ts-ignore
      window.RTCRtpScriptTransform = RTCRtpScriptTransform;
      // @ts-ignore
      RTCRtpReceiver.prototype.createEncodedStreams = receiverCreateEncodedStreams;
      // @ts-ignore
      RTCRtpSender.prototype.createEncodedStreams = senderCreateEncodedStreams;
    });

    it('can set up the RED worker without debug logging', () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);

      // Disable RED worker debug logging.
      tc['logger'] = new NoOpLogger(LogLevel.INFO);
      RedundantAudioEncoder.shouldLogDebug = false;

      const logSpy = sinon.spy(tc['logger'], 'debug');
      tc.setupLocalTransceivers();
      expect(logSpy.calledWith('[AudioRed] Setting up sender RED transform')).to.be.false;
      // The `rtctransform` event is defined since `RTCRtpScriptTransform` is supported.
      // @ts-ignore
      expect(self.onrtctransform).to.not.be.undefined;

      logSpy.restore();
    });
  });

  describe('hasVideoInput', () => {
    it('return false if video input doesnt exist', () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();
      expect(tc.hasVideoInput()).to.equal(false);
    });

    it('return true if video input exists', done => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();
      const newVideoTrack = new MediaStreamTrack();
      tc.setVideoInput(newVideoTrack);

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(() => {
        expect(tc.hasVideoInput()).to.equal(true);
        done();
      });
    });
  });

  describe('trackIsVideoInput', () => {
    it('can check whether the given track is a video input', () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const audioTrack = peer.getTransceivers()[0].receiver.track;
      expect(tc.trackIsVideoInput(audioTrack)).to.equal(false);

      const videoTrack = peer.getTransceivers()[1].receiver.track;
      expect(tc.trackIsVideoInput(videoTrack)).to.equal(true);
    });

    it('can not check if it has reset transceivers', () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const videoTrack = peer.getTransceivers()[1].receiver.track;
      tc.reset();

      expect(tc.trackIsVideoInput(videoTrack)).to.equal(false);
    });
  });

  describe('setAudioInput', () => {
    it('can set the audio track to null', done => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();
      tc.setAudioInput(null);

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(() => {
        const audioTransceiver = peer.getTransceivers()[0];
        expect(audioTransceiver.sender.track).to.equal(null);
        done();
      });
    });

    it('can set the audio track', done => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const newAudioTrack = new MediaStreamTrack();
      tc.setAudioInput(newAudioTrack);

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(() => {
        const audioTransceiver = peer.getTransceivers()[0];
        expect(audioTransceiver.direction).to.equal('sendrecv');
        expect(audioTransceiver.sender.track).to.equal(newAudioTrack);
        done();
      });
    });

    it('can not set the audio track if transceivers have not been set up', done => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);

      const newAudioTrack = new MediaStreamTrack();
      tc.setAudioInput(newAudioTrack);

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(() => {
        const audioTransceiver = peer.getTransceivers()[0];
        expect(audioTransceiver).to.be.undefined;
        done();
      });
    });
  });

  describe('setVideoInput', () => {
    it('can set the video track to null', done => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();
      tc.setVideoInput(null);

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(() => {
        const videoTransceiver = peer.getTransceivers()[1];
        expect(videoTransceiver.sender.track).to.equal(null);
        done();
      });
    });

    it('can set the video track', done => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const newVideoTrack = new MediaStreamTrack();
      tc.setVideoInput(newVideoTrack);

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(() => {
        const videoTransceiver = peer.getTransceivers()[1];
        expect(videoTransceiver.direction).to.equal('sendrecv');
        expect(videoTransceiver.sender.track).to.equal(newVideoTrack);
        done();
      });
    });

    it('can not set the video track if transceivers have not been set up', done => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);

      const newVideoTrack = new MediaStreamTrack();
      tc.setVideoInput(newVideoTrack);

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(() => {
        const videoTransceiver = peer.getTransceivers()[1];
        expect(videoTransceiver).to.be.undefined;
        done();
      });
    });
  });

  describe('updateVideoTransceivers', () => {
    let peer: RTCPeerConnection;

    function prepareIndex(streamIds: number[]): DefaultVideoStreamIndex {
      const index: DefaultVideoStreamIndex = new DefaultVideoStreamIndex(logger);
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

    type Writable<T> = {
      -readonly [K in keyof T]: T[K];
    };

    function configureTransceivers(
      videoStreamIds: VideoStreamIdSet,
      hasStop: boolean = true
    ): void {
      const streamIds = videoStreamIds.array();
      const transceivers: RTCRtpTransceiver[] = peer.getTransceivers();

      for (const transceiver of transceivers.values()) {
        if (hasStop) {
          transceiver.stop = () => {
            transceiver.direction = 'inactive';
          };
        }
      }

      let transStartIndex = 0;
      // Look for first recvonly transceiver
      for (const [index, transceiver] of transceivers.entries()) {
        if (transceiver.direction === 'recvonly') {
          transStartIndex = index;
          break;
        }
      }
      for (const [index, streamId] of streamIds.entries()) {
        const transceiver = transceivers[transStartIndex + index];
        (transceiver as Writable<RTCRtpTransceiver>).mid = streamId.toString();
      }
    }

    function verifyTransceiverDirections(directions: string[]): void {
      const transceivers: RTCRtpTransceiver[] = peer.getTransceivers();
      const actualDirections = transceivers.map(transceiver => transceiver.direction);
      expect(actualDirections).deep.equal(directions);
    }

    beforeEach(() => {
      peer = new RTCPeerConnection();
      tc.setPeer(peer);
    });

    it('cannot update video transceivers if it has reset transceivers', () => {
      tc.reset();

      const videoStreamIndex = prepareIndex([7]);
      const videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet();
      const videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );

      expect(videoSubscriptions).to.deep.equal([]);
      expect(peer.getTransceivers().length).to.equal(0);
    });

    it('includes a zero for a potential local video', () => {
      const videoStreamIndex = prepareIndex([7]);
      const videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet();
      const videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );

      expect(videoSubscriptions).to.deep.equal([0]);
      expect(peer.getTransceivers().length).to.equal(0);
    });

    it('creates a transceiver to subscribe to one remote video', () => {
      const videoStreamIndex = prepareIndex([7]);
      const videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([7]);
      const videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      expect(videoSubscriptions).to.deep.equal([0, 7]);
      verifyTransceiverDirections(['recvonly']);
    });

    it('when unsubscribing from a remote video, marks the transceiver inactive and leaves a zero in the video subscriptions slot', () => {
      const videoStreamIndex = prepareIndex([7]);
      let videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([7]);
      let videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      expect(videoSubscriptions).to.deep.equal([0, 7]);
      verifyTransceiverDirections(['recvonly']);

      videosToReceive = new DefaultVideoStreamIdSet();
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 0]);
      verifyTransceiverDirections(['inactive']);
    });

    it('with two subscriptions, unsubscribes from the last', () => {
      const videoStreamIndex = prepareIndex([7, 8]);
      let videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([7, 8]);
      let videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );

      expect(videoSubscriptions).to.deep.equal([0, 7, 8]);
      verifyTransceiverDirections(['recvonly', 'recvonly']);
      const subackFrame = new SdkSubscribeAckFrame({
        tracks: [
          new SdkTrackMapping({ streamId: 7, trackLabel: 'v_7' }),
          new SdkTrackMapping({ streamId: 8, trackLabel: 'v_8' }),
        ],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive);

      videosToReceive = new DefaultVideoStreamIdSet([7]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 7, 0]);
      verifyTransceiverDirections(['recvonly', 'inactive']);
    });

    it('with two subscriptions, unsubscribes from both, then resubscribes to both without stop', () => {
      const videoStreamIndex = prepareIndex([7, 8]);
      let videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([7, 8]);
      let videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      expect(videoSubscriptions).to.deep.equal([0, 7, 8]);
      verifyTransceiverDirections(['recvonly', 'recvonly']);
      let subackFrame = new SdkSubscribeAckFrame({
        tracks: [
          new SdkTrackMapping({ streamId: 7, trackLabel: 'v_7' }),
          new SdkTrackMapping({ streamId: 8, trackLabel: 'v_8' }),
        ],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive, false);

      videosToReceive = new DefaultVideoStreamIdSet([7]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 7, 0]);
      verifyTransceiverDirections(['recvonly', 'inactive']);
      subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 7, trackLabel: 'v_7' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive, false);

      videosToReceive = new DefaultVideoStreamIdSet([]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 0, 0]);
      verifyTransceiverDirections(['inactive', 'inactive']);
      subackFrame = new SdkSubscribeAckFrame({
        tracks: [],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive, false);

      videosToReceive = new DefaultVideoStreamIdSet([7]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 7, 0]);
      verifyTransceiverDirections(['recvonly', 'inactive']);
      subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 7, trackLabel: 'v_7' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive, false);

      videosToReceive = new DefaultVideoStreamIdSet([7, 8]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 7, 8]);
      verifyTransceiverDirections(['recvonly', 'recvonly']);
    });

    it('with two subscriptions, unsubscribes from both, then resubscribes to both with stop', () => {
      const videoStreamIndex = prepareIndex([7, 8]);
      let videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([7, 8]);
      let videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      expect(videoSubscriptions).to.deep.equal([0, 7, 8]);
      verifyTransceiverDirections(['recvonly', 'recvonly']);
      let subackFrame = new SdkSubscribeAckFrame({
        tracks: [
          new SdkTrackMapping({ streamId: 7, trackLabel: 'v_7' }),
          new SdkTrackMapping({ streamId: 8, trackLabel: 'v_8' }),
        ],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive, true);

      videosToReceive = new DefaultVideoStreamIdSet([7]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 7, 0]);
      verifyTransceiverDirections(['recvonly', 'inactive']);
      subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 7, trackLabel: 'v_7' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive, true);

      videosToReceive = new DefaultVideoStreamIdSet([]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 0, 0]);
      verifyTransceiverDirections(['inactive', 'inactive']);
      subackFrame = new SdkSubscribeAckFrame({
        tracks: [],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive, true);

      videosToReceive = new DefaultVideoStreamIdSet([7]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 0, 0, 7]);
      verifyTransceiverDirections(['inactive', 'inactive', 'recvonly']);
      subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 7, trackLabel: 'v_7' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive, true);

      videosToReceive = new DefaultVideoStreamIdSet([7, 8]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 0, 0, 7, 8]);
      verifyTransceiverDirections(['inactive', 'inactive', 'recvonly', 'recvonly']);
    });

    it('will track the mapping of stream id and group id to mid', () => {
      const videoStreamIndex = prepareIndex([1, 4]);
      const videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([1]);
      const videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      expect(videoSubscriptions).to.deep.equal([0, 1]);
      const subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 1, trackLabel: 'v_1' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive);

      expect(tc.getMidForStreamId(1)).to.equal('1');
      expect(tc.getMidForGroupId(3)).to.equal(undefined);
      expect(tc.getMidForGroupId(1)).to.equal('1');
    });

    it('will allow overriding the mapping of stream id to mid', () => {
      const videoStreamIndex = prepareIndex([1, 4]);
      const videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([1]);
      const videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      expect(videoSubscriptions).to.deep.equal([0, 1]);
      const subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 1, trackLabel: 'v_1' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive);

      expect(tc.getMidForStreamId(1)).to.equal('1');

      tc.setStreamIdForMid('1', 2);
      expect(tc.getMidForStreamId(2)).to.equal('1');
      expect(tc.getMidForStreamId(1)).to.equal(undefined);
    });

    it('will not reuse transceiver when unsubscribe from one and subscribe to another', () => {
      const videoStreamIndex = prepareIndex([1, 4]);
      let videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([1]);
      let videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      expect(videoSubscriptions).to.deep.equal([0, 1]);
      verifyTransceiverDirections(['recvonly']);
      const subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 1, trackLabel: 'v_1' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive);

      videosToReceive = new DefaultVideoStreamIdSet([4]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 0, 4]);
      verifyTransceiverDirections(['inactive', 'recvonly']);
    });

    it('will not reuse transceiver when index removes one and adds one', () => {
      let videoStreamIndex = prepareIndex([1]);
      let videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([1]);
      let videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      expect(videoSubscriptions).to.deep.equal([0, 1]);
      verifyTransceiverDirections(['recvonly']);
      const subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 1, trackLabel: 'v_1' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive);

      videoStreamIndex = prepareIndex([4]);
      videosToReceive = new DefaultVideoStreamIdSet([4]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 0, 4]);
      verifyTransceiverDirections(['inactive', 'recvonly']);
    });

    it('will use local transceivers', () => {
      tc.setupLocalTransceivers();

      const videoStreamIndex = prepareIndex([7, 8]);
      const videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([7, 8]);
      let videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      const subackFrame = new SdkSubscribeAckFrame({
        tracks: [
          new SdkTrackMapping({ streamId: 7, trackLabel: 'v_7' }),
          new SdkTrackMapping({ streamId: 8, trackLabel: 'v_8' }),
        ],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 7, 8]);
      verifyTransceiverDirections(['inactive', 'inactive', 'recvonly', 'recvonly']);
    });

    it('will use a transceiver\'s mid prefixed with "v_" to get the streamId for the track', () => {
      const streamId = 4;
      const videoStreamIndex = prepareIndex([streamId, 8]);
      const videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([streamId, 8]);
      let videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      const subackFrame = new SdkSubscribeAckFrame({
        tracks: [
          new SdkTrackMapping({ streamId: 2, trackLabel: 'b18b9db2' }),
          new SdkTrackMapping({ streamId: streamId, trackLabel: 'v_4' }),
          new SdkTrackMapping({ streamId: 8, trackLabel: 'v_8' }),
        ],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, streamId, 8]);
      verifyTransceiverDirections(['recvonly', 'recvonly']);
    });

    it('will override stream ids via setStreamId', async () => {
      const videoStreamIndex = prepareIndex([1, 4]);
      let videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([1]);
      let videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      expect(videoSubscriptions).to.deep.equal([0, 1]);
      verifyTransceiverDirections(['recvonly']);
      const subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 1, trackLabel: 'v_1' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      configureTransceivers(videosToReceive);

      videosToReceive = new DefaultVideoStreamIdSet([4]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 0, 4]);
      verifyTransceiverDirections(['inactive', 'recvonly']);

      const mid = tc.getMidForStreamId(1);
      tc.setStreamIdForMid('otherMid', 2);
      expect(tc.getMidForStreamId(1)).to.be.equal(mid);
      tc.setStreamIdForMid(mid, 3);
      expect(tc.getMidForStreamId(3)).to.be.equal(mid);
    });
  });

  describe('setVideoSendingBitrateKbps', () => {
    it('will not set bitrate if transceiver is not set up', () => {
      tc.setVideoSendingBitrateKbps(100);
    });

    it('will not set bitrate if input is not positive', async () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const newVideoTrack = new MediaStreamTrack();
      await tc.setVideoInput(newVideoTrack);

      const videoTransceiver = peer.getTransceivers()[1];
      expect(videoTransceiver.direction).to.equal('sendrecv');
      expect(videoTransceiver.sender.track).to.equal(newVideoTrack);

      let parameter = {
        degradationPreference: null,
        transactionId: '',
      } as RTCRtpSendParameters;
      await videoTransceiver.sender.setParameters(parameter);
      tc.setVideoSendingBitrateKbps(100);
      parameter = peer.getTransceivers()[1].sender.getParameters();
      expect(parameter.encodings[0].maxBitrate).to.equal(100 * 1000);

      tc.setVideoSendingBitrateKbps(0);
      parameter = peer.getTransceivers()[1].sender.getParameters();
      expect(parameter.encodings[0].maxBitrate).to.equal(100 * 1000);
    });

    it('sets bitrate on RTCRtpSender correctly', async () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const newVideoTrack = new MediaStreamTrack();
      await tc.setVideoInput(newVideoTrack);

      const videoTransceiver = peer.getTransceivers()[1];
      expect(videoTransceiver.direction).to.equal('sendrecv');
      expect(videoTransceiver.sender.track).to.equal(newVideoTrack);

      let parameter = {
        degradationPreference: null,
        transactionId: '',
      } as RTCRtpSendParameters;
      await videoTransceiver.sender.setParameters(parameter);
      tc.setVideoSendingBitrateKbps(100);
      parameter = peer.getTransceivers()[1].sender.getParameters();
      expect(parameter.encodings[0].maxBitrate).to.equal(100 * 1000);

      tc.setVideoSendingBitrateKbps(200);
      parameter = peer.getTransceivers()[1].sender.getParameters();
      expect(parameter.encodings[0].maxBitrate).to.equal(200 * 1000);
    });
  });

  describe('replaceAudioTrack', () => {
    it('returns false if transceiver is not set up or audio transceiver is not sending', async () => {
      const newAudioTrack = new MediaStreamTrack();
      let success = await tc.replaceAudioTrack(newAudioTrack);
      expect(success).to.be.false;

      // set up local transceivers
      success = true;
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();
      success = await tc.replaceAudioTrack(newAudioTrack);
      expect(success).to.be.false;

      // set audio input to activate transceiver
      tc.setAudioInput(newAudioTrack);

      const newAudioTrack2 = new MediaStreamTrack();
      success = await tc.replaceAudioTrack(newAudioTrack2);
      expect(success).to.be.true;
      const audioTransceiver = peer.getTransceivers()[0];
      expect(audioTransceiver.sender.track).to.equal(newAudioTrack2);
    });
  });

  describe('setEncodingParameters', () => {
    let getParamSpy: sinon.SinonSpy;
    let setParamSpy: sinon.SinonSpy;
    let peer: RTCPeerConnection;
    beforeEach(() => {
      peer = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();
      getParamSpy = sinon.spy(peer.getTransceivers()[1].sender, 'getParameters');
      setParamSpy = sinon.spy(peer.getTransceivers()[1].sender, 'setParameters');
    });
    afterEach(() => {
      getParamSpy.restore();
      setParamSpy.restore();
    });

    it('is no-op if local transceivers are not set up', async () => {
      tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          scaleResolutionDownBy: 1,
          maxBitrate: 1_400_000,
        })
      );
    });

    it('is no-op if local video transceiver is inactive', async () => {
      await tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          scaleResolutionDownBy: 1,
          maxBitrate: 1_400_000,
        })
      );
      expect(tc.localVideoTransceiver().direction).to.equal('inactive');
      expect(getParamSpy.notCalled).to.be.true;
    });

    it('Do not set encoding parameters if input params is empty', async () => {
      const newVideoTrack = new MediaStreamTrack();
      await tc.setVideoInput(newVideoTrack);

      tc.setEncodingParameters(new Map<string, RTCRtpEncodingParameters>());

      expect(getParamSpy.notCalled).to.be.true;
      expect(setParamSpy.notCalled).to.be.true;
    });

    it('Set encoding parameters', async () => {
      const newVideoTrack = new MediaStreamTrack();
      await tc.setVideoInput(newVideoTrack);

      const localSender = tc.localVideoTransceiver().sender;
      await tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          scaleResolutionDownBy: 1,
          maxBitrate: 1_400_000,
        })
      );

      expect(setParamSpy.calledOnce).to.be.true;
      const params = localSender.getParameters();
      expect(params.encodings.length).to.be.equal(1);
      expect(params.encodings[0].maxBitrate).to.be.equal(1_400_000);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(1);
    });

    it('Can update encoding parameters', async () => {
      const newVideoTrack = new MediaStreamTrack();
      await tc.setVideoInput(newVideoTrack);

      const localSender = tc.localVideoTransceiver().sender;
      await tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          scaleResolutionDownBy: 1,
          maxBitrate: 1_400_000,
        })
      );

      expect(setParamSpy.calledOnce).to.be.true;
      let params = localSender.getParameters();
      expect(params.encodings.length).to.be.equal(1);
      expect(params.encodings[0].maxBitrate).to.be.equal(1_400_000);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(1);

      await tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          scaleResolutionDownBy: 2,
          maxBitrate: 600_000,
        })
      );
      expect(setParamSpy.calledTwice).to.be.true;
      params = localSender.getParameters();
      expect(params.encodings.length).to.be.equal(1);
      expect(params.encodings[0].maxBitrate).to.be.equal(600_000);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(2);
    });

    it('Only set encoding parameters with the same rid', async () => {
      const newVideoTrack = new MediaStreamTrack();
      await tc.setVideoInput(newVideoTrack);

      const localSender = peer.getTransceivers()[1].sender;
      await tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          rid: 'video',
          scaleResolutionDownBy: 1,
          maxBitrate: 1_400_000,
        })
      );

      expect(setParamSpy.calledOnce).to.be.true;
      let params = localSender.getParameters();
      expect(params.encodings.length).to.be.equal(1);
      expect(params.encodings[0].maxBitrate).to.be.equal(1_400_000);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(1);

      await tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          rid: 'video2',
          scaleResolutionDownBy: 2,
          maxBitrate: 600_000,
        })
      );
      expect(setParamSpy.calledTwice).to.be.true;
      params = localSender.getParameters();
      expect(params.encodings.length).to.be.equal(1);
      expect(params.encodings[0].maxBitrate).to.be.equal(1_400_000);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(1);
    });

    it('Does not set codecPayloadType', async () => {
      const newVideoTrack = new MediaStreamTrack();
      await tc.setVideoInput(newVideoTrack);

      const localSender = peer.getTransceivers()[1].sender;
      await tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          rid: 'video',
          codecPayloadType: 1,
          scaleResolutionDownBy: 1,
          maxBitrate: 1_400_000,
        })
      );

      expect(setParamSpy.calledOnce).to.be.true;
      let params = localSender.getParameters();
      expect(params.encodings.length).to.be.equal(1);
      expect(params.encodings[0].maxBitrate).to.be.equal(1_400_000);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(1);

      await tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          rid: 'video',
          codecPayloadType: 2,
          scaleResolutionDownBy: 2,
          maxBitrate: 600_000,
        })
      );
      expect(setParamSpy.calledTwice).to.be.true;
      params = localSender.getParameters();
      expect(params.encodings.length).to.be.equal(1);
      expect(params.encodings[0].maxBitrate).to.be.equal(600_000);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(2);
      expect(params.encodings[0].codecPayloadType).to.be.equal(1);
    });
  });

  describe('setAudioPayloadTypes', () => {
    it('can set the RED and Opus payload types', () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);

      const logSpy = sinon.spy(tc['logger'], 'debug');
      tc.setupLocalTransceivers();
      tc.setAudioPayloadTypes(
        new Map([
          ['red', 63],
          ['opus', 111],
        ])
      );
      expect(logSpy.calledWith('[AudioRed] red payload type set to 63')).to.be.true;
      expect(logSpy.calledWith('[AudioRed] opus payload type set to 111')).to.be.true;
      logSpy.restore();
    });

    it('does not set the RED and Opus payload types if the RED worker does not exist', () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);

      const logSpy = sinon.spy(tc['logger'], 'debug');
      tc.setAudioPayloadTypes(
        new Map([
          ['red', 63],
          ['opus', 111],
        ])
      );
      expect(logSpy.calledWith('[AudioRed] red payload type set to 63')).to.be.false;
      expect(logSpy.calledWith('[AudioRed] opus payload type set to 111')).to.be.false;
      logSpy.restore();
    });
  });

  describe('RedundantAudioEncoderStats', () => {
    it('is sent to observers', done => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);

      class TestObserver implements RedundantAudioRecoveryMetricsObserver {
        recoveryMetricsDidReceive(metricReport: RedundantAudioRecoveryMetricReport): void {
          expect(metricReport.currentTimestampMs).to.equal(1000);
          expect(metricReport.ssrc).to.equal(12345);
          expect(metricReport.totalAudioPacketsExpected).to.equal(10);
          expect(metricReport.totalAudioPacketsLost).to.equal(20);
          expect(metricReport.totalAudioPacketsRecoveredRed).to.equal(30);
          expect(metricReport.totalAudioPacketsRecoveredFec).to.equal(40);
          done();
        }
      }

      tc.addRedundantAudioRecoveryMetricsObserver(new TestObserver());
      const redMetricReport = new RedundantAudioRecoveryMetricReport();
      redMetricReport.currentTimestampMs = 1000;
      redMetricReport.ssrc = 12345;
      redMetricReport.totalAudioPacketsExpected = 10;
      redMetricReport.totalAudioPacketsLost = 20;
      redMetricReport.totalAudioPacketsRecoveredRed = 30;
      redMetricReport.totalAudioPacketsRecoveredFec = 40;
      tc['forEachRedMetricsObserver'](redMetricReport);
    });
  });

  describe('metricsDidReceive', () => {
    it('adds metrics to history', () => {
      // send 5 metric reports
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 0,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 0
      );
      expect(tc['audioMetricsHistory'].length).to.equal(5);
      expect(tc['audioMetricsHistory'][0].timestampMs).to.equal(0);
      expect(tc['audioMetricsHistory'][4].timestampMs).to.equal(4000);
      expect(tc['audioMetricsHistory'][0].totalPacketsSent).to.equal(0);
      expect(tc['audioMetricsHistory'][4].totalPacketsSent).to.equal(200);
      expect(tc['currentNumRedundantEncodings']).to.equal(0);
    });

    it('does not add metric to history if packetsSent <= latest packetsSent in history', () => {
      // send 5 metric reports
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 0,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 0
      );
      // Send a metric report with same packetsSent as latest metric report in history
      const clientMetricReport = new ClientMetricReport(logger);
      clientMetricReport.currentTimestampMs = 5000;
      // @ts-ignore
      clientMetricReport.rtcStatsReport = [
        {
          kind: 'audio',
          type: 'outbound-rtp',
          packetsSent: 200,
        },
        {
          kind: 'audio',
          type: 'remote-inbound-rtp',
          packetsLost: 0,
        },
      ] as RTCStatsReport;
      tc.metricsDidReceive(clientMetricReport);

      expect(tc['audioMetricsHistory'].length).to.equal(5);
      expect(tc['audioMetricsHistory'][0].timestampMs).to.equal(0);
      expect(tc['audioMetricsHistory'][4].timestampMs).to.equal(4000);
      expect(tc['audioMetricsHistory'][0].totalPacketsSent).to.equal(0);
      expect(tc['audioMetricsHistory'][4].totalPacketsSent).to.equal(200);
      expect(tc['currentNumRedundantEncodings']).to.equal(0);
    });

    it('removes oldest metric in history once list size is > maxAudioMetricsHistory', () => {
      // Send 21 metric reports
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 0,
        /*numMetricReports*/ 21,
        /*totalPacketsLost*/ 0
      );
      const maxAudioMetricsHistory = tc['maxAudioMetricsHistory'];
      expect(tc['audioMetricsHistory'].length).to.equal(maxAudioMetricsHistory);
      // Metric Report with timestamp 0 should now be removed from the list
      expect(tc['audioMetricsHistory'][0].timestampMs).to.equal(1000);
      expect(tc['audioMetricsHistory'][maxAudioMetricsHistory - 1].timestampMs).to.equal(20000);
      expect(tc['audioMetricsHistory'][0].totalPacketsSent).to.equal(50);
      expect(tc['audioMetricsHistory'][maxAudioMetricsHistory - 1].totalPacketsSent).to.equal(1000);
      expect(tc['currentNumRedundantEncodings']).to.equal(0);
    });

    it('updates currentNumRedundantEncodings to 1 when loss is 10%', () => {
      // Send 6 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 0,
        /*numMetricReports*/ 6,
        /*totalPacketsLost*/ 0
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(0);

      // Send 5 metric reports with about 10% loss
      // 5 packets lost every second for 5s plus additional 5 packets = 30 packets lost
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 6,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 30
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
    });

    it('updates currentNumRedundantEncodings to 2 when loss is 20%', () => {
      // Send 6 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 0,
        /*numMetricReports*/ 6,
        /*totalPacketsLost*/ 0
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(0);

      // Send 5 metric reports with about 20% loss
      // 10 packets lost every second for 5s plus additional 10 packets = 60 packets lost
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 6,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 60
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(2);
    });

    it('drops currentNumRedundantEncodings to 0 only after hold down time', () => {
      // Send 6 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 0,
        /*numMetricReports*/ 6,
        /*totalPacketsLost*/ 0
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(0);

      // Send 5 metric reports with about 30% loss
      // 15 packets lost every second for 5s plus additional 15 packets = 90 packets lost
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 6,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 90
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(2);

      // Send 30 metric reports with no loss
      // totalPacketsLost stays at 90 as the metric in the report is cumulative
      // and there is no more loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 11,
        /*numMetricReports*/ 30,
        /*totalPacketsLost*/ 90
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(2);

      // Send 270 metric reports with no loss to take it over 5m hold down time
      // totalPacketsLost stays at 90 as the metric in the report is cumulative
      // and there is no more loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 41,
        /*numMetricReports*/ 270,
        /*totalPacketsLost*/ 90
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(0);
    });

    it('does not drop currentNumRedundantEncodings if we are close to hold down time ending and again see loss', () => {
      // Send 6 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 0,
        /*numMetricReports*/ 6,
        /*totalPacketsLost*/ 0
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(0);

      // Send 5 metric reports with about 30% loss
      // 15 packets lost every second for 5s plus additional 15 packets = 90 packets lost
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 6,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 90
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(2);

      // Send 30 metric reports with no loss
      // totalPacketsLost stays at 90 as the metric in the report is cumulative
      // and there is no more loss.
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 11,
        /*numMetricReports*/ 30,
        /*totalPacketsLost*/ 90
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(2);

      // Send 250 metric reports with no loss to take it close to 5m hold down time
      // This along with the previous 30 metric report, covers 4m40s of no loss
      // totalPacketsLost stays at 90 as the metric in the report is cumulative
      // and there is no more loss.
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 41,
        /*numMetricReports*/ 250,
        /*totalPacketsLost*/ 90
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(2);

      // Send 5 metric reports with about 30% loss
      // 15 packets lost every second for 5s plus additional 15 packets = 90 packets lost
      // Adding to the previous loss of 90 packets gets us the value of 180
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 291,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 180
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(2);

      // We need to get to 311 index to cover 5m hold down time.
      // Also send 30 more metric reports to go 30s over hold down time.
      // Since we saw loss in the previous batch of reports, hold down time
      // should reset and we should still be at 2 encodings after these reports.
      // totalPacketsLost stays at 180 as the metric in the report is cumulative
      // and there is no more loss.
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 296,
        /*numMetricReports*/ 45,
        /*totalPacketsLost*/ 180
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(2);
    });

    it('should quickly turn red back on after transient high packet loss', () => {
      // Send 6 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 0,
        /*numMetricReports*/ 6,
        /*totalPacketsLost*/ 0
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(0);
      expect(tc['audioRedEnabled']).to.equal(true);

      // Send 5 metric reports with about 10% loss
      // 5 packets lost every second for 5s plus additional 5 packets = 30 packets lost
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 6,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 30
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
      expect(tc['audioRedEnabled']).to.equal(true);

      // Send 5 metric reports with about 80% loss
      // 40 packets lost every second for 5s plus additional 40 packets = 240 packets lost
      // Add this value to previous total packet loss value 30
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 11,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 270
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
      expect(tc['audioRedEnabled']).to.equal(false);

      // Send 5 metric reports with about 10% loss
      // 5 packets lost every second for 5s plus additional 5 packets = 30 packets lost
      // Add this value to previous total packet loss value of 270
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 16,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 300
      );
      // This is 2 because the 15s window loss at this moment is still > 20%
      expect(tc['currentNumRedundantEncodings']).to.equal(2);
      expect(tc['audioRedEnabled']).to.equal(true);
      expect(tc['lastRedHolddownTimerStartTimestampMs']).to.equal(20000);

      // Send 5 minutes worth of metric reports with 0 loss
      // We should still be at 2 encodings due to hold down timer.
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 21,
        /*numMetricReports*/ 300,
        /*totalPacketsLost*/ 300
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(2);
      expect(tc['audioRedEnabled']).to.equal(true);

      // Send 5 more metric reports with 0 loss
      // to take it over the hold down time.
      // This should bring the encodings back down to 0.
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 321,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 300
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(0);
      expect(tc['audioRedEnabled']).to.equal(true);
    });

    it('should keep red turned off for extended high packet loss events', () => {
      // Send 6 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 0,
        /*numMetricReports*/ 6,
        /*totalPacketsLost*/ 0
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(0);
      expect(tc['audioRedEnabled']).to.equal(true);

      // Send 5 metric reports with about 10% loss
      // 5 packets lost every second for 5s plus additional 5 packets = 30 packets lost
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 6,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 30
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
      expect(tc['audioRedEnabled']).to.equal(true);

      // Send 5 metric reports with about 80% loss
      // 40 packets lost every second for 5s plus additional 40 packets = 240 packets lost
      // Add this value to previous total packet loss value of 30
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 11,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 270
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
      expect(tc['audioRedEnabled']).to.equal(false);
      expect(tc['lastHighPacketLossEventTimestampMs']).to.equal(15000);

      // Send 5 metric reports with about 80% loss
      // 40 packets lost every second for 5s plus additional 40 packets = 240 packets lost
      // Add this value to previous total packet loss value of 270
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 16,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 510
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
      expect(tc['audioRedEnabled']).to.equal(false);
      expect(tc['lastHighPacketLossEventTimestampMs']).to.equal(20000);

      // Send 5 metric reports with about 80% loss
      // 40 packets lost every second for 5s plus additional 40 packets = 240 packets lost
      // Add this value to previous total packet loss value 0f 510
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 21,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 750
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
      expect(tc['audioRedEnabled']).to.equal(false);
      expect(tc['lastHighPacketLossEventTimestampMs']).to.equal(25000);

      // Send 20 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 26,
        /*numMetricReports*/ 20,
        /*totalPacketsLost*/ 750
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
      expect(tc['audioRedEnabled']).to.equal(false);

      // Send 20 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 46,
        /*numMetricReports*/ 20,
        /*totalPacketsLost*/ 750
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
      expect(tc['audioRedEnabled']).to.equal(false);

      // Send 15 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 66,
        /*numMetricReports*/ 15,
        /*totalPacketsLost*/ 750
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
      expect(tc['audioRedEnabled']).to.equal(false);

      // Send 5 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 81,
        /*numMetricReports*/ 5,
        /*totalPacketsLost*/ 750
      );
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
      expect(tc['audioRedEnabled']).to.equal(true);
      expect(tc['lastRedHolddownTimerStartTimestampMs']).to.equal(85000);

      // Send 240 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 86,
        /*numMetricReports*/ 240,
        /*totalPacketsLost*/ 750
      );
      // Redundant encodings remains at 1 as hold down timer
      // resets when red is enabled again
      expect(tc['currentNumRedundantEncodings']).to.equal(1);
      expect(tc['audioRedEnabled']).to.equal(true);

      // Send 65 metric reports with no loss
      sendMetricReports(
        tc,
        /*startTimestampSecond*/ 326,
        /*numMetricReports*/ 65,
        /*totalPacketsLost*/ 750
      );
      // Redundant encodings should come back down to 0
      // as we have completed the hold down time
      expect(tc['currentNumRedundantEncodings']).to.equal(0);
      expect(tc['audioRedEnabled']).to.equal(true);
    });
  });
});
