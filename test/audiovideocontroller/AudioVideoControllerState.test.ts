// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import EncodedTransformWorkerManager from '../../src/encodedtransformmanager/EncodedTransformWorkerManager';
import TransceiverController from '../../src/transceivercontroller/TransceiverController';
import VideoDownlinkBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/VideoDownlinkBandwidthPolicy';
import VideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';

describe('AudioVideoControllerState', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('encodedTransformWorkerManager', () => {
    it('is null by default', () => {
      const state = new AudioVideoControllerState();
      expect(state.encodedTransformWorkerManager).to.be.null;
    });

    it('can be assigned an EncodedTransformWorkerManager', () => {
      const state = new AudioVideoControllerState();
      const mockManager: EncodedTransformWorkerManager = {
        isEnabled: () => true,
        start: async () => {},
        redundantAudioEncodeTransformManager: () => undefined,
        metricsTransformManager: () => undefined,
        setupAudioSenderTransform: () => {},
        setupAudioReceiverTransform: () => {},
        setupVideoSenderTransform: () => {},
        setupVideoReceiverTransform: () => {},
        addObserver: () => {},
        removeObserver: () => {},
        stop: async () => {},
      };

      state.encodedTransformWorkerManager = mockManager;
      expect(state.encodedTransformWorkerManager).to.equal(mockManager);
    });

    it('is not reset by resetConnectionSpecificState', () => {
      const state = new AudioVideoControllerState();
      const mockManager: EncodedTransformWorkerManager = {
        isEnabled: () => true,
        start: async () => {},
        redundantAudioEncodeTransformManager: () => undefined,
        metricsTransformManager: () => undefined,
        setupAudioSenderTransform: () => {},
        setupAudioReceiverTransform: () => {},
        setupVideoSenderTransform: () => {},
        setupVideoReceiverTransform: () => {},
        addObserver: () => {},
        removeObserver: () => {},
        stop: async () => {},
      };

      state.encodedTransformWorkerManager = mockManager;

      // Initialize required properties for resetConnectionSpecificState
      state.transceiverController = ({
        reset: (): void => {},
      } as unknown) as TransceiverController;
      state.videoDownlinkBandwidthPolicy = ({
        reset: (): void => {},
      } as unknown) as VideoDownlinkBandwidthPolicy;
      state.videoUplinkBandwidthPolicy = ({
        reset: (): void => {},
      } as unknown) as VideoUplinkBandwidthPolicy;

      state.resetConnectionSpecificState();

      // encodedTransformWorkerManager should NOT be reset
      expect(state.encodedTransformWorkerManager).to.equal(mockManager);
    });
  });
});
