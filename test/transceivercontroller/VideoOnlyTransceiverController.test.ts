// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import TransceiverController from '../../src/transceivercontroller/TransceiverController';
import VideoOnlyTransceiverController from '../../src/transceivercontroller/VideoOnlyTransceiverController';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('VideoOnlyTransceiverController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  const domMockBehavior: DOMMockBehavior = new DOMMockBehavior();
  let tc: TransceiverController;
  let domMockBuilder: DOMMockBuilder;
  const context: AudioVideoControllerState = new AudioVideoControllerState();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEncodedTransformWorkerManager: any;

  beforeEach(() => {
    domMockBehavior.browserName = 'firefox';
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    context.browserBehavior = new DefaultBrowserBehavior();
    context.audioProfile = new AudioProfile();
    mockEncodedTransformWorkerManager = {
      isEnabled: sinon.stub().returns(true),
      setupAudioSenderTransform: sinon.stub(),
      setupAudioReceiverTransform: sinon.stub(),
      setupVideoSenderTransform: sinon.stub(),
      setupVideoReceiverTransform: sinon.stub(),
    };
    tc = new VideoOnlyTransceiverController(
      logger,
      context.browserBehavior,
      context,
      mockEncodedTransformWorkerManager
    );
  });

  afterEach(() => {
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

    it('can only set up video transceiver idempotently', () => {
      tc = new VideoOnlyTransceiverController(logger, context.browserBehavior, context);
      const peer: RTCPeerConnection = new RTCPeerConnection();
      tc.setPeer(peer);
      tc.setupLocalTransceivers();
      let transceivers = peer.getTransceivers();
      expect(transceivers.length).to.equal(1);
      let videoTransceiver = transceivers[0];
      expect(videoTransceiver.direction).to.equal('inactive');
      expect(videoTransceiver.receiver.track.kind).to.equal('video');
      expect(videoTransceiver.sender.track.kind).to.equal('video');

      tc.setupLocalTransceivers();
      transceivers = peer.getTransceivers();
      expect(transceivers.length).to.equal(1);
      videoTransceiver = transceivers[0];
      expect(videoTransceiver.direction).to.equal('inactive');
      expect(videoTransceiver.receiver.track.kind).to.equal('video');
      expect(videoTransceiver.sender.track.kind).to.equal('video');
    });
  });

  describe('encodedTransformWorkerManager integration', () => {
    it('can be constructed with encodedTransformWorkerManager', () => {
      const mockManager = {
        isEnabled: sinon.stub().returns(true),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new VideoOnlyTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockManager
      );

      expect(tcWithManager).to.not.equal(null);
    });

    it('does not call audio transform setup methods since VideoOnlyTransceiverController only creates video transceiver', () => {
      const mockManager = {
        isEnabled: sinon.stub().returns(true),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new VideoOnlyTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockManager
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      // VideoOnlyTransceiverController overrides setupLocalTransceivers and does not call
      // any encoded transform setup methods - it only creates the video transceiver
      expect(mockManager.setupAudioSenderTransform.called).to.be.false;
      expect(mockManager.setupAudioReceiverTransform.called).to.be.false;
    });

    it('does not call video transform setup methods in overridden setupLocalTransceivers', () => {
      const mockManager = {
        isEnabled: sinon.stub().returns(true),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new VideoOnlyTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockManager
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      // VideoOnlyTransceiverController overrides setupLocalTransceivers completely
      // and does not call any encoded transform setup methods
      expect(mockManager.setupVideoSenderTransform.called).to.be.false;
    });

    it('can be constructed without encodedTransformWorkerManager', () => {
      const tcWithoutManager = new VideoOnlyTransceiverController(
        logger,
        context.browserBehavior,
        context
      );

      expect(tcWithoutManager).to.not.equal(null);

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithoutManager.setPeer(peer);
      tcWithoutManager.setupLocalTransceivers();

      const transceivers = peer.getTransceivers();
      expect(transceivers.length).to.equal(1);
      expect(transceivers[0].receiver.track.kind).to.equal('video');
    });
  });
});
