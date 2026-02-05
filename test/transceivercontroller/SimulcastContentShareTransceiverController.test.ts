// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import SimulcastContentShareTransceiverController from '../../src/transceivercontroller/SimulcastContentShareTransceiverController';
import TransceiverController from '../../src/transceivercontroller/TransceiverController';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('SimulcastContentShareTransceiverController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  const domMockBehavior: DOMMockBehavior = new DOMMockBehavior();
  let tc: TransceiverController;
  let domMockBuilder: DOMMockBuilder;
  const context: AudioVideoControllerState = new AudioVideoControllerState();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEncodedTransformWorkerManager: any;

  function isEncodingParamsEqual(
    encoding1: RTCRtpEncodingParameters,
    encoding2: RTCRtpEncodingParameters
  ): boolean {
    if (encoding1.rid !== encoding2.rid) {
      return false;
    }
    if (encoding1.active !== encoding2.active) {
      return false;
    }
    if (encoding1.maxBitrate !== encoding2.maxBitrate) {
      return false;
    }
    if (encoding1.scaleResolutionDownBy !== encoding2.scaleResolutionDownBy) {
      return false;
    }
    if (encoding1.maxFramerate !== encoding2.maxFramerate) {
      return false;
    }
    return true;
  }

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
    tc = new SimulcastContentShareTransceiverController(
      logger,
      context.browserBehavior,
      context,
      mockEncodedTransformWorkerManager
    );
  });

  afterEach(() => {
    mockEncodedTransformWorkerManager = {
      isEnabled: sinon.stub().returns(true),
      setupAudioSenderTransform: sinon.stub(),
      setupAudioReceiverTransform: sinon.stub(),
      setupVideoSenderTransform: sinon.stub(),
      setupVideoReceiverTransform: sinon.stub(),
    };
    tc = new SimulcastContentShareTransceiverController(
      logger,
      context.browserBehavior,
      context,
      mockEncodedTransformWorkerManager
    );
    domMockBuilder.cleanup();
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

    it('is no-op if the input map has no parameter', async () => {
      const encodingParamMap = new Map<string, RTCRtpEncodingParameters>();
      const peer: RTCPeerConnection = new RTCPeerConnection();

      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const newVideoTrack = new MediaStreamTrack();
      await tc.setVideoInput(newVideoTrack);
      const videoTransceiver = peer.getTransceivers()[1];
      expect(videoTransceiver.direction).to.equal('sendrecv');
      expect(videoTransceiver.sender.track).to.equal(newVideoTrack);
      tc.setEncodingParameters(encodingParamMap);
    });

    it('can update the sender parameter with no previous encodings', async () => {
      const encodingParamMap = new Map<string, RTCRtpEncodingParameters>();
      const peer: RTCPeerConnection = new RTCPeerConnection();
      const lowEncodingParams = {
        rid: 'low',
        active: true,
        scaleResolutionDownBy: 2,
        maxBitrate: 300,
        maxFramerate: 5,
      };
      encodingParamMap.set('low', lowEncodingParams);
      const highEncodingParams = {
        rid: 'hi',
        active: true,
        scaleResolutionDownBy: 1,
        maxBitrate: 1200,
      };
      encodingParamMap.set('hi', highEncodingParams);

      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const newVideoTrack = new MediaStreamTrack();
      await tc.setVideoInput(newVideoTrack);

      const videoTransceiver = peer.getTransceivers()[1];
      expect(videoTransceiver.direction).to.equal('sendrecv');
      expect(videoTransceiver.sender.track).to.equal(newVideoTrack);
      // Set encoding to null
      // @typescript-eslint/no-object-literal-type-assertion
      await videoTransceiver.sender.setParameters({
        transactionId: undefined,
        codecs: [],
        rtcp: undefined,
        encodings: null,
        headerExtensions: undefined,
      });
      tc.setEncodingParameters(encodingParamMap);
      expect(
        isEncodingParamsEqual(
          tc.localVideoTransceiver().sender.getParameters().encodings[0],
          lowEncodingParams
        )
      ).to.be.true;
      expect(
        isEncodingParamsEqual(
          tc.localVideoTransceiver().sender.getParameters().encodings[1],
          highEncodingParams
        )
      ).to.be.true;
    });

    it('can update the sender parameter', async () => {
      const encodingParamMap = new Map<string, RTCRtpEncodingParameters>();
      const peer: RTCPeerConnection = new RTCPeerConnection();
      const lowEncodingParams = {
        rid: 'low',
        active: true,
        scaleResolutionDownBy: 2,
        maxBitrate: 300,
        maxFramerate: 5,
      };
      encodingParamMap.set('low', lowEncodingParams);
      const highEncodingParams = {
        rid: 'hi',
        active: true,
        scaleResolutionDownBy: 1,
        maxBitrate: 1200,
      };
      encodingParamMap.set('hi', highEncodingParams);

      tc.setPeer(peer);
      tc.setupLocalTransceivers();

      const newVideoTrack = new MediaStreamTrack();
      await tc.setVideoInput(newVideoTrack);

      const videoTransceiver = peer.getTransceivers()[1];
      expect(videoTransceiver.direction).to.equal('sendrecv');
      expect(videoTransceiver.sender.track).to.equal(newVideoTrack);
      tc.setEncodingParameters(encodingParamMap);
      expect(
        isEncodingParamsEqual(
          tc.localVideoTransceiver().sender.getParameters().encodings[0],
          lowEncodingParams
        )
      ).to.be.true;
      expect(
        isEncodingParamsEqual(
          tc.localVideoTransceiver().sender.getParameters().encodings[1],
          highEncodingParams
        )
      ).to.be.true;
    });
  });

  describe('encodedTransformWorkerManager integration', () => {
    it('calls setupAudioSenderTransform and setupAudioReceiverTransform when encodedTransformWorkerManager is provided and enabled', () => {
      const mockManager = {
        isEnabled: sinon.stub().returns(true),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new SimulcastContentShareTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockManager
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      expect(mockManager.setupAudioSenderTransform.calledOnce).to.be.true;
      expect(mockManager.setupAudioReceiverTransform.calledOnce).to.be.true;
    });

    it('calls setupVideoSenderTransform when encodedTransformWorkerManager is provided', () => {
      const mockManager = {
        isEnabled: sinon.stub().returns(true),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new SimulcastContentShareTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockManager
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      expect(mockManager.setupVideoSenderTransform.calledOnce).to.be.true;
    });

    it('does not call audio transform setup when encodedTransformWorkerManager is not enabled', () => {
      const mockManager = {
        isEnabled: sinon.stub().returns(false),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new SimulcastContentShareTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockManager
      );

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      expect(mockManager.setupAudioSenderTransform.called).to.be.false;
      expect(mockManager.setupAudioReceiverTransform.called).to.be.false;
    });

    it('logs warning when encodedTransformWorkerManager is not enabled', () => {
      const mockManager = {
        isEnabled: sinon.stub().returns(false),
        setupAudioSenderTransform: sinon.stub(),
        setupAudioReceiverTransform: sinon.stub(),
        setupVideoSenderTransform: sinon.stub(),
        setupVideoReceiverTransform: sinon.stub(),
      };

      const tcWithManager = new SimulcastContentShareTransceiverController(
        logger,
        context.browserBehavior,
        context,
        // @ts-ignore
        mockManager
      );

      const warnSpy = sinon.spy(tcWithManager['logger'], 'warn');

      const peer: RTCPeerConnection = new RTCPeerConnection();
      tcWithManager.setPeer(peer);
      tcWithManager.setupLocalTransceivers();

      expect(warnSpy.calledWith('Media transforms not supported, skipping audio transform setup'))
        .to.be.true;
      warnSpy.restore();
    });
  });
});
