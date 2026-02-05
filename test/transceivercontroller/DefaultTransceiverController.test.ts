// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import { AudioVideoControllerState, NoOpAudioVideoController } from '../../src';
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

describe('DefaultTransceiverController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  const domMockBehavior: DOMMockBehavior = new DOMMockBehavior();
  let tc: DefaultTransceiverController;
  let domMockBuilder: DOMMockBuilder;
  const context: AudioVideoControllerState = new AudioVideoControllerState();

  beforeEach(() => {
    domMockBehavior.browserName = 'chrome116';
    domMockBuilder = new DOMMockBuilder(domMockBehavior);

    context.browserBehavior = new DefaultBrowserBehavior();
    context.audioProfile = new AudioProfile();
    context.audioVideoController = new NoOpAudioVideoController();
    tc = new DefaultTransceiverController(logger, context.browserBehavior, context);
  });

  afterEach(() => {
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

    it('can set up transceivers without the meeting session context', () => {
      tc = new DefaultTransceiverController(logger, context.browserBehavior);
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();
      expect(peer.getTransceivers().length).to.equal(2);

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
          // @ts-ignore
          scalabilityMode: 'L1T1',
        })
      );

      expect(setParamSpy.calledOnce).to.be.true;
      let params = localSender.getParameters();
      expect(params.encodings.length).to.be.equal(1);
      expect(params.encodings[0].maxBitrate).to.be.equal(1_400_000);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(1);
      // @ts-ignore
      expect(params.encodings[0].scalabilityMode).to.be.equal('L1T1');

      await tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          scaleResolutionDownBy: 2,
          maxBitrate: 600_000,
          // @ts-ignore
          scalabilityMode: 'L1T3',
        })
      );
      expect(setParamSpy.calledTwice).to.be.true;
      params = localSender.getParameters();
      expect(params.encodings.length).to.be.equal(1);
      expect(params.encodings[0].maxBitrate).to.be.equal(600_000);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(2);
      // @ts-ignore
      expect(params.encodings[0].scalabilityMode).to.be.equal('L1T3');
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
        } as RTCRtpEncodingParameters)
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
        } as RTCRtpEncodingParameters)
      );
      expect(setParamSpy.calledTwice).to.be.true;
      params = localSender.getParameters();
      expect(params.encodings.length).to.be.equal(1);
      expect(params.encodings[0].maxBitrate).to.be.equal(600_000);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((params.encodings[0] as any).codecPayloadType).to.be.equal(1);
    });

    it('Can update all mutable encoding parameters', async () => {
      const newVideoTrack = new MediaStreamTrack();
      await tc.setVideoInput(newVideoTrack);

      const localSender = tc.localVideoTransceiver().sender;

      // Set all mutable encoding parameters
      await tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          active: true,
          maxBitrate: 1_400_000,
          maxFramerate: 30,
          scaleResolutionDownBy: 1,
          priority: 'high',
          networkPriority: 'high',
        })
      );

      expect(setParamSpy.calledOnce).to.be.true;
      let params = localSender.getParameters();
      expect(params.encodings.length).to.be.equal(1);
      expect(params.encodings[0].active).to.be.equal(true);
      expect(params.encodings[0].maxBitrate).to.be.equal(1_400_000);
      expect(params.encodings[0].maxFramerate).to.be.equal(30);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(1);
      expect(params.encodings[0].priority).to.be.equal('high');
      expect(params.encodings[0].networkPriority).to.be.equal('high');

      // Update all parameters to different values
      await tc.setEncodingParameters(
        new Map<string, RTCRtpEncodingParameters>().set('video', {
          active: false,
          maxBitrate: 600_000,
          maxFramerate: 15,
          scaleResolutionDownBy: 2,
          priority: 'low',
          networkPriority: 'low',
        })
      );

      expect(setParamSpy.calledTwice).to.be.true;
      params = localSender.getParameters();
      expect(params.encodings[0].active).to.be.equal(false);
      expect(params.encodings[0].maxBitrate).to.be.equal(600_000);
      expect(params.encodings[0].maxFramerate).to.be.equal(15);
      expect(params.encodings[0].scaleResolutionDownBy).to.be.equal(2);
      expect(params.encodings[0].priority).to.be.equal('low');
      expect(params.encodings[0].networkPriority).to.be.equal('low');
    });
  });

  describe('handleTrack event listener', () => {
    it('adds track event listener when setPeer is called', () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      const addEventListenerSpy = sinon.spy(peer, 'addEventListener');

      tc.setPeer(peer);

      expect(addEventListenerSpy.calledWith('track')).to.be.true;
      addEventListenerSpy.restore();
    });

    it('removes track event listener when reset is called', () => {
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);

      const removeEventListenerSpy = sinon.spy(peer, 'removeEventListener');
      tc.reset();

      expect(removeEventListenerSpy.calledWith('track')).to.be.true;
      removeEventListenerSpy.restore();
    });

    it('does not throw when reset is called without peer', () => {
      expect(() => tc.reset()).to.not.throw();
    });
  });

  describe('encodedTransformWorkerManager integration', () => {
    it('calls setupAudioSenderTransform when encodedTransformWorkerManager is provided and enabled', () => {
      const mockEncodedTransformWorkerManager = {
        isEnabled: sinon.stub().returns(true),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new DefaultTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockEncodedTransformWorkerManager
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      expect(mockEncodedTransformWorkerManager.setupAudioSenderTransform.calledOnce).to.be.true;
      expect(mockEncodedTransformWorkerManager.setupAudioReceiverTransform.calledOnce).to.be.true;
    });

    it('calls setupVideoSenderTransform when encodedTransformWorkerManager is provided', () => {
      const mockEncodedTransformWorkerManager = {
        isEnabled: sinon.stub().returns(true),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new DefaultTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockEncodedTransformWorkerManager
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      expect(mockEncodedTransformWorkerManager.setupVideoSenderTransform.calledOnce).to.be.true;
    });

    it('does not call transform setup when encodedTransformWorkerManager is not enabled', () => {
      const mockEncodedTransformWorkerManager = {
        isEnabled: sinon.stub().returns(false),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new DefaultTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockEncodedTransformWorkerManager
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      expect(mockEncodedTransformWorkerManager.setupAudioSenderTransform.called).to.be.false;
      expect(mockEncodedTransformWorkerManager.setupAudioReceiverTransform.called).to.be.false;
    });

    it('calls setupVideoReceiverTransform on track event when transform not already set', () => {
      const mockEncodedTransformWorkerManager = {
        isEnabled: sinon.stub().returns(true),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new DefaultTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockEncodedTransformWorkerManager
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      // Simulate a track event with a video track
      const videoTrack = new MediaStreamTrack();
      // @ts-ignore
      videoTrack.kind = 'video';
      const mockReceiver = {
        track: videoTrack,
        transform: undefined as unknown,
      };
      // Create a mock track event object (RTCTrackEvent constructor not available in test env)
      const trackEvent = {
        type: 'track',
        track: videoTrack,
        receiver: mockReceiver,
        transceiver: peer.getTransceivers()[0],
        streams: [],
      } as unknown as RTCTrackEvent;

      // Trigger the track event handler
      tcWithManager['handleTrack'](trackEvent);

      expect(mockEncodedTransformWorkerManager.setupVideoReceiverTransform.calledWith(mockReceiver))
        .to.be.true;
    });

    it('does not call setupVideoReceiverTransform when transform is already set', () => {
      const mockEncodedTransformWorkerManager = {
        isEnabled: sinon.stub().returns(true),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new DefaultTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockEncodedTransformWorkerManager
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      // Reset the stub to clear calls from setupLocalTransceivers
      mockEncodedTransformWorkerManager.setupVideoReceiverTransform.resetHistory();

      // Simulate a track event with a video track that already has transform set
      const videoTrack = new MediaStreamTrack();
      // @ts-ignore
      videoTrack.kind = 'video';
      const mockReceiver = {
        track: videoTrack,
        transform: {}, // Transform already set
      };
      // Create a mock track event object (RTCTrackEvent constructor not available in test env)
      const trackEvent = {
        type: 'track',
        track: videoTrack,
        receiver: mockReceiver,
        transceiver: peer.getTransceivers()[0],
        streams: [],
      } as unknown as RTCTrackEvent;

      // Trigger the track event handler
      tcWithManager['handleTrack'](trackEvent);

      expect(mockEncodedTransformWorkerManager.setupVideoReceiverTransform.called).to.be.false;
    });

    it('does not call setupVideoReceiverTransform for audio tracks', () => {
      const mockEncodedTransformWorkerManager = {
        isEnabled: sinon.stub().returns(true),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new DefaultTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockEncodedTransformWorkerManager
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      // Reset the stub to clear calls from setupLocalTransceivers
      mockEncodedTransformWorkerManager.setupVideoReceiverTransform.resetHistory();

      // Simulate a track event with an audio track (not video)
      const audioTrack = new MediaStreamTrack();
      // @ts-ignore
      audioTrack.kind = 'audio';
      const mockReceiver = {
        track: audioTrack,
        transform: undefined as unknown,
      };
      const trackEvent = {
        type: 'track',
        track: audioTrack,
        receiver: mockReceiver,
        transceiver: peer.getTransceivers()[0],
        streams: [],
      } as unknown as RTCTrackEvent;

      tcWithManager['handleTrack'](trackEvent);

      expect(mockEncodedTransformWorkerManager.setupVideoReceiverTransform.called).to.be.false;
    });

    it('does not call setupVideoReceiverTransform when encodedTransformWorkerManager is undefined', () => {
      // Create controller without encodedTransformWorkerManager (undefined)
      const tcWithoutManager = new DefaultTransceiverController(
        logger,
        context.browserBehavior,
        context,
        undefined
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithoutManager.setPeer(peer);
      tcWithoutManager.setupLocalTransceivers();

      // Simulate a track event with a video track and no transform set
      const videoTrack = new MediaStreamTrack();
      // @ts-ignore
      videoTrack.kind = 'video';
      const mockReceiver = {
        track: videoTrack,
        transform: undefined as unknown,
      };
      const trackEvent = {
        type: 'track',
        track: videoTrack,
        receiver: mockReceiver,
        transceiver: peer.getTransceivers()[0],
        streams: [],
      } as unknown as RTCTrackEvent;

      // Should not throw when encodedTransformWorkerManager is undefined
      tcWithoutManager['handleTrack'](trackEvent);
    });
  });

  describe('deprecated methods', () => {
    it('setAudioPayloadTypes logs error when called', () => {
      const errorSpy = sinon.spy(tc['logger'], 'error');
      tc.setAudioPayloadTypes(
        new Map([
          ['red', 63],
          ['opus', 111],
        ])
      );
      expect(
        errorSpy.calledWith(
          'setAudioPayloadTypes is deprecated. Access encodedTransformWorkerManager directly via meeting session context.'
        )
      ).to.be.true;
      errorSpy.restore();
    });

    it('addRedundantAudioRecoveryMetricsObserver logs error when called', () => {
      const errorSpy = sinon.spy(tc['logger'], 'error');
      const mockObserver = { recoveryMetricsDidReceive: sinon.stub() };
      // @ts-ignore
      tc.addRedundantAudioRecoveryMetricsObserver(mockObserver);
      expect(
        errorSpy.calledWith(
          'addRedundantAudioRecoveryMetricsObserver is deprecated. Access encodedTransformWorkerManager directly via meeting session context.'
        )
      ).to.be.true;
      errorSpy.restore();
    });

    it('removeRedundantAudioRecoveryMetricsObserver logs error when called', () => {
      const errorSpy = sinon.spy(tc['logger'], 'error');
      const mockObserver = { recoveryMetricsDidReceive: sinon.stub() };
      // @ts-ignore
      tc.removeRedundantAudioRecoveryMetricsObserver(mockObserver);
      expect(
        errorSpy.calledWith(
          'removeRedundantAudioRecoveryMetricsObserver is deprecated. Access encodedTransformWorkerManager directly via meeting session context.'
        )
      ).to.be.true;
      errorSpy.restore();
    });
  });
});
