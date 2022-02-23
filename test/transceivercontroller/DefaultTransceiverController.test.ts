// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

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
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import TransceiverController from '../../src/transceivercontroller/TransceiverController';
import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIdSet from '../../src/videostreamidset/VideoStreamIdSet';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultTransceiverController', () => {
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
    tc = new DefaultTransceiverController(logger, browser);
  });

  afterEach(() => {
    tc = new DefaultTransceiverController(logger, browser);
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

    it('will track the mapping of stream id to mid', () => {
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
});
