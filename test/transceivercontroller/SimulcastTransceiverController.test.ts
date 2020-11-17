// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import BrowserBehavior from '../../src/browserbehavior/BrowserBehavior';
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
import SimulcastTransceiverController from '../../src/transceivercontroller/SimulcastTransceiverController';
import TransceiverController from '../../src/transceivercontroller/TransceiverController';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIdSet from '../../src/videostreamidset/VideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('SimulcastTransceiverController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  const domMockBehavior: DOMMockBehavior = new DOMMockBehavior();
  let tc: TransceiverController;
  let domMockBuilder: DOMMockBuilder;
  let browser: BrowserBehavior;

  beforeEach(() => {
    domMockBehavior.browserName = 'firefox';
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    browser = new DefaultBrowserBehavior();
    tc = new SimulcastTransceiverController(logger, browser);
  });

  afterEach(() => {
    tc = new SimulcastTransceiverController(logger, browser);
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

  describe('setVideoSendingBitrateKbps', () => {
    it('is no-op', () => {
      tc.setVideoSendingBitrateKbps(0);
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

    function prepareSimulcastIndex(
      streamIds: { groupId: number; streamId: number }[]
    ): DefaultVideoStreamIndex {
      const index: DefaultVideoStreamIndex = new DefaultVideoStreamIndex(logger);
      const sources: SdkStreamDescriptor[] = [];
      for (const id of streamIds) {
        sources.push(
          new SdkStreamDescriptor({
            streamId: id.streamId,
            groupId: id.groupId,
            maxBitrateKbps: 100,
            mediaType: SdkStreamMediaType.VIDEO,
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

    function setTransceiverStreamId(
      videoStreamIndex: DefaultVideoStreamIndex,
      videoStreamIds: VideoStreamIdSet
    ): void {
      const streamIds = videoStreamIds.array();
      const transceivers: RTCRtpTransceiver[] = peer.getTransceivers();
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
        const groupId = videoStreamIndex.groupIdForStreamId(streamId);
        (transceiver as Writable<RTCRtpTransceiver>).mid = groupId.toString();
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
      setTransceiverStreamId(videoStreamIndex, videosToReceive);

      videosToReceive = new DefaultVideoStreamIdSet([7]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 7, 0]);
      verifyTransceiverDirections(['recvonly', 'inactive']);
    });

    it('with two subscriptions, unsubscribes from both, then resubscribes to both', () => {
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
      setTransceiverStreamId(videoStreamIndex, videosToReceive);

      videosToReceive = new DefaultVideoStreamIdSet([7]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 7, 0]);
      verifyTransceiverDirections(['recvonly', 'inactive']);
      subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 7, trackLabel: 'v_7' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      setTransceiverStreamId(videoStreamIndex, videosToReceive);

      videosToReceive = new DefaultVideoStreamIdSet([]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 0, 0]);
      verifyTransceiverDirections(['inactive', 'inactive']);
      subackFrame = new SdkSubscribeAckFrame({
        tracks: [],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      setTransceiverStreamId(videoStreamIndex, videosToReceive);

      videosToReceive = new DefaultVideoStreamIdSet([7]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 7, 0]);
      verifyTransceiverDirections(['recvonly', 'inactive']);
      subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 7, trackLabel: 'v_7' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      setTransceiverStreamId(videoStreamIndex, videosToReceive);
      videosToReceive = new DefaultVideoStreamIdSet([7, 8]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 7, 8]);
      verifyTransceiverDirections(['recvonly', 'recvonly']);
    });

    it('will reuse transceiver for same group', () => {
      const videoStreamIndex = prepareSimulcastIndex([
        { groupId: 1, streamId: 1 },
        { groupId: 1, streamId: 2 },
        { groupId: 2, streamId: 3 },
        { groupId: 2, streamId: 4 },
      ]);
      let videosToReceive: VideoStreamIdSet = new DefaultVideoStreamIdSet([2, 4]);
      let videoSubscriptions: number[] = tc.updateVideoTransceivers(
        videoStreamIndex,
        videosToReceive
      );
      expect(videoSubscriptions).to.deep.equal([0, 2, 4]);
      verifyTransceiverDirections(['recvonly', 'recvonly']);
      let subackFrame = new SdkSubscribeAckFrame({
        tracks: [
          new SdkTrackMapping({ streamId: 2, trackLabel: 'v_1' }),
          new SdkTrackMapping({ streamId: 4, trackLabel: 'v_2' }),
        ],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      setTransceiverStreamId(videoStreamIndex, videosToReceive);

      videosToReceive = new DefaultVideoStreamIdSet([3]);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, 0, 3]);
      verifyTransceiverDirections(['inactive', 'recvonly']);
      subackFrame = new SdkSubscribeAckFrame({
        tracks: [new SdkTrackMapping({ streamId: 3, trackLabel: 'v_2' })],
      });
      videoStreamIndex.integrateSubscribeAckFrame(subackFrame);
      setTransceiverStreamId(videoStreamIndex, videosToReceive);

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
      setTransceiverStreamId(videoStreamIndex, videosToReceive);

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
      setTransceiverStreamId(videoStreamIndex, videosToReceive);
      videoSubscriptions = tc.updateVideoTransceivers(videoStreamIndex, videosToReceive);
      expect(videoSubscriptions).to.deep.equal([0, streamId, 8]);
      verifyTransceiverDirections(['recvonly', 'recvonly']);
    });
  });

  describe('setEncodingParameters', () => {
    it('is no-op if local transceivers are not set up', async () => {
      const encoding: RTCRtpEncodingParameters = {
        active: true,
        scaleResolutionDownBy: 1,
        maxBitrate: 1400,
      };
      const encodingParamMap = new Map<string, RTCRtpEncodingParameters>();
      encodingParamMap.set('low', encoding);
      await tc.setEncodingParameters(encodingParamMap);
      expect(tc.localVideoTransceiver()).to.be.null;
    });

    it('is no-op if local video transceiver is inactive', async () => {
      const encoding: RTCRtpEncodingParameters = {
        active: true,
        scaleResolutionDownBy: 1,
        maxBitrate: 1400,
      };
      const encodingParamMap = new Map<string, RTCRtpEncodingParameters>();
      encodingParamMap.set('low', encoding);
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();
      await tc.setEncodingParameters(encodingParamMap);
      expect(tc.localVideoTransceiver().direction).to.equal('inactive');
    });

    it('is no-op if the input map has no parameter', done => {
      const encodingParamMap = new Map<string, RTCRtpEncodingParameters>();
      const peer: RTCPeerConnection = new RTCPeerConnection();

      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const newVideoTrack = new MediaStreamTrack();
      tc.setVideoInput(newVideoTrack);
      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(() => {
        const videoTransceiver = peer.getTransceivers()[1];
        expect(videoTransceiver.direction).to.equal('sendrecv');
        expect(videoTransceiver.sender.track).to.equal(newVideoTrack);
        tc.setEncodingParameters(encodingParamMap);
      });

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 30).start(() => {
        done();
      });
    });

    it('can update the sender parameter', done => {
      const encodingParamMap = new Map<string, RTCRtpEncodingParameters>();
      const peer: RTCPeerConnection = new RTCPeerConnection();
      const encoding: RTCRtpEncodingParameters = {
        rid: 'low',
        active: true,
        scaleResolutionDownBy: 1,
        maxBitrate: 1400,
      };
      encodingParamMap.set('low', encoding);
      const encoding2 = { ...encoding };
      encoding2.rid = 'mid';
      encoding2.maxBitrate = 888;
      encodingParamMap.set('mid', encoding2);
      const encoding3 = { ...encoding };
      encoding3.rid = 'hi';
      encodingParamMap.set('hi', encoding3);

      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const newVideoTrack = new MediaStreamTrack();
      tc.setVideoInput(newVideoTrack);

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(() => {
        const videoTransceiver = peer.getTransceivers()[1];
        expect(videoTransceiver.direction).to.equal('sendrecv');
        expect(videoTransceiver.sender.track).to.equal(newVideoTrack);
        // @typescript-eslint/no-object-literal-type-assertion
        videoTransceiver.sender.setParameters({
          transactionId: undefined,
          codecs: [],
          rtcp: undefined,
          encodings: null,
          headerExtensions: undefined,
        });
        tc.setEncodingParameters(encodingParamMap);
      });

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 30).start(() => {
        expect(tc.localVideoTransceiver().sender.getParameters().encodings[1].maxBitrate).to.equal(
          888
        );
        done();
      });
    });

    it('can update the sender parameter', done => {
      const encodingParamMap = new Map<string, RTCRtpEncodingParameters>();
      const peer: RTCPeerConnection = new RTCPeerConnection();
      const encoding: RTCRtpEncodingParameters = {
        rid: 'low',
        active: true,
        scaleResolutionDownBy: 1,
        maxBitrate: 1400,
      };
      encodingParamMap.set('low', encoding);
      const encoding2 = { ...encoding };
      encoding2.rid = 'mid';
      encoding2.maxBitrate = 888;
      encodingParamMap.set('mid', encoding2);
      const encoding3 = { ...encoding };
      encoding3.rid = 'hi';
      encodingParamMap.set('hi', encoding3);

      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const newVideoTrack = new MediaStreamTrack();
      tc.setVideoInput(newVideoTrack);

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 10).start(() => {
        const videoTransceiver = peer.getTransceivers()[1];
        expect(videoTransceiver.direction).to.equal('sendrecv');
        expect(videoTransceiver.sender.track).to.equal(newVideoTrack);
        tc.setEncodingParameters(encodingParamMap);
      });

      new TimeoutScheduler(domMockBehavior.asyncWaitMs + 30).start(() => {
        expect(tc.localVideoTransceiver().sender.getParameters().encodings[1].maxBitrate).to.equal(
          888
        );
        done();
      });
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

  describe('replaceAudioTrackForSender', () => {
    it('returns false if input sender is null', async () => {
      const audioTrack = new MediaStreamTrack();
      const success = await SimulcastTransceiverController.replaceAudioTrackForSender(
        null,
        audioTrack
      );
      expect(success).to.be.false;
    });

    it('returns true if audio track is replaced', async () => {
      const sender = new RTCRtpSender();
      const audioTrack = new MediaStreamTrack();
      const success = await SimulcastTransceiverController.replaceAudioTrackForSender(
        sender,
        audioTrack
      );
      expect(success).to.be.true;
      expect(sender.track).to.equal(audioTrack);
    });
  });
});
