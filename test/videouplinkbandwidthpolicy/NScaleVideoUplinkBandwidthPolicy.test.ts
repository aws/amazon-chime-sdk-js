// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import AudioProfile from '../../src/audioprofile/AudioProfile';
import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import DefaultBrowserBehavior from '../../src/browserbehavior/DefaultBrowserBehavior';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import VideoCodecCapability from '../../src/sdp/VideoCodecCapability';
import {
  SdkIndexFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import DefaultTransceiverController from '../../src/transceivercontroller/DefaultTransceiverController';
import DefaultVideoCaptureAndEncodeParameter from '../../src/videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import NScaleVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('NScaleVideoUplinkBandwidthPolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  const selfAttendeeId = 'self-cb7cb43b';
  const IDEAL_MAX_BANDWIDTH_KBPS = 600;
  const SCALE_RESOLUTION_DOWN_BY = 1;
  let policy: NScaleVideoUplinkBandwidthPolicy;
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder | null = null;
  let transceiverController: DefaultTransceiverController;
  let context: AudioVideoControllerState | null = null;

  class TestTransceiverController extends DefaultTransceiverController {
    setEncodingParameters(_encodingParamMap: Map<string, RTCRtpEncodingParameters>): Promise<void> {
      return;
    }
  }

  beforeEach(() => {
    policy = new NScaleVideoUplinkBandwidthPolicy(selfAttendeeId, true, new NoOpLogger());
    policy.setIdealMaxBandwidthKbps(IDEAL_MAX_BANDWIDTH_KBPS);
    domMockBehavior = new DOMMockBehavior();
    domMockBehavior.mediaStreamTrackSettings = {
      width: 960,
      height: 540,
      deviceId: '',
    };
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    const peer = new RTCPeerConnection();
    context = new AudioVideoControllerState();
    context.browserBehavior = new DefaultBrowserBehavior();
    context.audioProfile = new AudioProfile();
    transceiverController = new TestTransceiverController(
      new NoOpLogger(),
      context.browserBehavior,
      context
    );
    transceiverController.setPeer(peer);
    transceiverController.setupLocalTransceivers();
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('chooseCaptureAndEncodeParameters', () => {
    //This is for default capture of 540p
    const expectedNumParticipantsToParameters = new Map([
      [1, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false, 1)],
      [2, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false, 1)],
      [3, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 400, false, 1)],
      [4, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 400, false, 1)],
      [5, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 320, false, 1.125)],
      [6, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 274, false, 1.125)],
      [7, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 242, false, 1.125)],
      [8, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 218, false, 1.125)],
      [9, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 199, false, 1.5)],
      [10, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 184, false, 1.5)],
      [11, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 172, false, 1.5)],
      [12, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 162, false, 1.5)],
      [13, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 153, false, 2)],
      [14, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 146, false, 2)],
      [15, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 139, false, 2)],
      [16, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 134, false, 2)],
      [17, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 129, false, 3)],
      [18, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 124, false, 3)],
      [19, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 120, false, 3)],
      [20, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 117, false, 3)],
      [21, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 113, false, 3)],
      [22, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 110, false, 3)],
      [23, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 108, false, 3)],
      [24, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 105, false, 3)],
      [25, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 103, false, 3)],
      [26, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 101, false, 3)],
    ]);

    const expectedNumParticipantsToParametersFhd = new Map([
      [1, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false, 1)],
      [2, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false, 1)],
      [3, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 400, false, 1)],
      [4, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 400, false, 1)],
      [5, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 320, false, 1)],
      [6, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 274, false, 1)],
      [7, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 242, false, 1)],
      [8, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 218, false, 1)],
      [9, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 199, false, 1.125)],
      [10, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 184, false, 1.125)],
      [11, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 172, false, 1.125)],
      [12, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 162, false, 1.125)],
      [13, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 153, false, 1.5)],
      [14, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 146, false, 1.5)],
      [15, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 139, false, 1.5)],
      [16, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 134, false, 1.5)],
      [17, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 129, false, 2)],
      [18, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 124, false, 2)],
      [19, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 120, false, 2)],
      [20, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 117, false, 2)],
      [21, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 113, false, 2)],
      [22, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 110, false, 2)],
      [23, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 108, false, 2)],
      [24, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 105, false, 2)],
      [25, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 103, false, 2)],
      [26, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 101, false, 2)],
    ]);

    const expectedNumParticipantsToParametersWithNoResolutionScaling = new Map([
      [1, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false, 1)],
      [2, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false, 1)],
      [3, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 400, false, 1)],
      [4, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 400, false, 1)],
      [5, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 320, false, 1)],
      [6, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 274, false, 1)],
      [7, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 242, false, 1)],
      [8, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 218, false, 1)],
      [9, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 199, false, 1)],
      [10, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 184, false, 1)],
      [11, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 172, false, 1)],
      [12, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 162, false, 1)],
      [13, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 153, false, 1)],
      [14, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 146, false, 1)],
      [15, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 139, false, 1)],
      [16, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 134, false, 1)],
      [17, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 129, false, 1)],
      [18, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 124, false, 1)],
      [19, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 120, false, 1)],
      [20, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 117, false, 1)],
      [21, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 113, false, 1)],
      [22, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 110, false, 1)],
      [23, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 108, false, 1)],
      [24, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 105, false, 1)],
      [25, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 103, false, 1)],
      [26, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 101, false, 1)],
    ]);

    const expectedNumParticipantsToParametersWithPriority = new Map([
      [1, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false, 1)],
      [2, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false, 1)],
      [3, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false, 1)],
      [4, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false, 1)],
      [5, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [6, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [7, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [8, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [9, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [10, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [11, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [12, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [13, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [14, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [15, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [16, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [17, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [18, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [19, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [20, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [21, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [22, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [23, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [24, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [25, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
      [26, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false, 1)],
    ]);

    it('returns the expected values when no index is provided yet', () => {
      const expectedParams = new DefaultVideoCaptureAndEncodeParameter(0, 0, 0, 0, false, 1);
      transceiverController.setVideoInput(new MediaStreamTrack());
      policy.setTransceiverController(transceiverController);
      const actualParams = policy.chooseCaptureAndEncodeParameters();
      assert(
        actualParams.equal(expectedParams),
        `expected: ${JSON.stringify(expectedParams)} actual: ${JSON.stringify(actualParams)}`
      );
    });

    it('returns the correct values when the self is present in the SdkIndexFrame', () => {
      for (const entry of expectedNumParticipantsToParameters) {
        policy.setTransceiverController(transceiverController);
        transceiverController.setVideoInput(new MediaStreamTrack());
        const numParticipants = entry[0];
        const expectedParams = entry[1];
        const sources: SdkStreamDescriptor[] = [];
        for (let i = 0; i < numParticipants; i++) {
          const attendee = i === 0 ? selfAttendeeId : `attendee-${i}`;
          sources.push(
            new SdkStreamDescriptor({
              streamId: i,
              groupId: i,
              maxBitrateKbps: 100,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2,
              groupId: i,
              maxBitrateKbps: 200,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
        }
        const index = new DefaultVideoStreamIndex(logger);
        index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
        policy.updateIndex(index);
        const actualParams = policy.chooseCaptureAndEncodeParameters();
        assert(
          actualParams.equal(expectedParams),
          `numParticipants: ${numParticipants} expected: ${JSON.stringify(
            expectedParams
          )} actual: ${JSON.stringify(actualParams)}`
        );
      }
    });

    it('returns the correct values when the self is present in the SdkIndexFrame for high resolution feature', () => {
      policy.setHighResolutionFeatureEnabled(true);
      for (const entry of expectedNumParticipantsToParametersFhd) {
        policy.setTransceiverController(transceiverController);
        transceiverController.setVideoInput(new MediaStreamTrack());
        const numParticipants = entry[0];
        const expectedParams = entry[1];
        const sources: SdkStreamDescriptor[] = [];
        for (let i = 0; i < numParticipants; i++) {
          const attendee = i === 0 ? selfAttendeeId : `attendee-${i}`;
          sources.push(
            new SdkStreamDescriptor({
              streamId: i,
              groupId: i,
              maxBitrateKbps: 100,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2,
              groupId: i,
              maxBitrateKbps: 200,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
        }
        const index = new DefaultVideoStreamIndex(logger);
        index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
        policy.updateIndex(index);
        const actualParams = policy.chooseCaptureAndEncodeParameters();
        assert(
          actualParams.equal(expectedParams),
          `numParticipants: ${numParticipants} expected: ${JSON.stringify(
            expectedParams
          )} actual: ${JSON.stringify(actualParams)}`
        );
      }
    });

    it('returns the correct values when bandwidth has priority', () => {
      policy.setTransceiverController(transceiverController);
      transceiverController.setVideoInput(new MediaStreamTrack());
      policy.setHasBandwidthPriority(true);
      for (const entry of expectedNumParticipantsToParametersWithPriority) {
        const numParticipants = entry[0];
        const expectedParams = entry[1];
        const sources: SdkStreamDescriptor[] = [];
        for (let i = 0; i < numParticipants; i++) {
          const attendee = i === 0 ? selfAttendeeId : `attendee-${i}`;
          sources.push(
            new SdkStreamDescriptor({
              streamId: i,
              groupId: i,
              maxBitrateKbps: 100,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2,
              groupId: i,
              maxBitrateKbps: 200,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
        }
        const index = new DefaultVideoStreamIndex(logger);
        index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
        policy.updateIndex(index);
        const actualParams = policy.chooseCaptureAndEncodeParameters();
        assert(
          actualParams.equal(expectedParams),
          `numParticipants: ${numParticipants} expected: ${JSON.stringify(
            expectedParams
          )} actual: ${JSON.stringify(actualParams)}`
        );
      }
    });

    it('returns the correct values when the self is not present in the SdkIndexFrame', () => {
      policy.setTransceiverController(transceiverController);
      for (const entry of expectedNumParticipantsToParameters) {
        const numParticipants = entry[0];
        const expectedParams = entry[1];
        const sources: SdkStreamDescriptor[] = [];
        for (let i = 0; i < numParticipants; i++) {
          const attendee = `attendee-${i}`;
          sources.push(
            new SdkStreamDescriptor({
              streamId: i,
              groupId: i,
              maxBitrateKbps: 100,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2,
              groupId: i,
              maxBitrateKbps: 200,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
        }
        const index = new DefaultVideoStreamIndex(logger);
        index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
        policy.updateIndex(index);
        const actualParams = policy.chooseCaptureAndEncodeParameters();
        assert(
          actualParams.equal(expectedParams),
          `numParticipants: ${numParticipants} expected: ${JSON.stringify(
            expectedParams
          )} actual: ${JSON.stringify(actualParams)}`
        );
      }
    });

    it('Do not scale resolution if no transceiver controller', () => {
      for (const entry of expectedNumParticipantsToParametersWithNoResolutionScaling) {
        const numParticipants = entry[0];
        const expectedParams = entry[1];
        const sources: SdkStreamDescriptor[] = [];
        for (let i = 0; i < numParticipants; i++) {
          const attendee = i === 0 ? selfAttendeeId : `attendee-${i}`;
          sources.push(
            new SdkStreamDescriptor({
              streamId: i,
              groupId: i,
              maxBitrateKbps: 100,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2,
              groupId: i,
              maxBitrateKbps: 200,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
        }
        const index = new DefaultVideoStreamIndex(logger);
        index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
        policy.updateIndex(index);
        const actualParams = policy.chooseCaptureAndEncodeParameters();
        assert(
          actualParams.equal(expectedParams),
          `numParticipants: ${numParticipants} expected: ${JSON.stringify(
            expectedParams
          )} actual: ${JSON.stringify(actualParams)}`
        );
      }
    });

    it('Do not scale resolution if builders set to not scale in the constructor', () => {
      policy = new NScaleVideoUplinkBandwidthPolicy(selfAttendeeId, false);
      policy.setTransceiverController(transceiverController);
      policy.setIdealMaxBandwidthKbps(600);
      transceiverController.setVideoInput(new MediaStreamTrack());
      for (const entry of expectedNumParticipantsToParametersWithNoResolutionScaling) {
        const numParticipants = entry[0];
        const expectedParams = entry[1];
        const sources: SdkStreamDescriptor[] = [];
        for (let i = 0; i < numParticipants; i++) {
          const attendee = i === 0 ? selfAttendeeId : `attendee-${i}`;
          sources.push(
            new SdkStreamDescriptor({
              streamId: i,
              groupId: i,
              maxBitrateKbps: 100,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2,
              groupId: i,
              maxBitrateKbps: 200,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
        }
        const index = new DefaultVideoStreamIndex(logger);
        index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
        policy.updateIndex(index);
        const actualParams = policy.chooseCaptureAndEncodeParameters();
        assert(
          actualParams.equal(expectedParams),
          `numParticipants: ${numParticipants} expected: ${JSON.stringify(
            expectedParams
          )} actual: ${JSON.stringify(actualParams)}`
        );
      }
    });

    it('Do not scale resolution if there is no setting height info', () => {
      domMockBehavior.mediaStreamTrackSettings = {};
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      policy.setTransceiverController(transceiverController);
      transceiverController.setVideoInput(new MediaStreamTrack());
      for (const entry of expectedNumParticipantsToParametersWithNoResolutionScaling) {
        const numParticipants = entry[0];
        const expectedParams = entry[1];
        const sources: SdkStreamDescriptor[] = [];
        for (let i = 0; i < numParticipants; i++) {
          const attendee = i === 0 ? selfAttendeeId : `attendee-${i}`;
          sources.push(
            new SdkStreamDescriptor({
              streamId: i,
              groupId: i,
              maxBitrateKbps: 100,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2,
              groupId: i,
              maxBitrateKbps: 200,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
        }
        const index = new DefaultVideoStreamIndex(logger);
        index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
        policy.updateIndex(index);
        const actualParams = policy.chooseCaptureAndEncodeParameters();
        assert(
          actualParams.equal(expectedParams),
          `numParticipants: ${numParticipants} expected: ${JSON.stringify(
            expectedParams
          )} actual: ${JSON.stringify(actualParams)}`
        );
      }
    });

    it('Scale resolution with default value', () => {
      domMockBehavior.mediaStreamTrackSettings = {
        width: 540,
        height: 960,
        deviceId: '',
      };
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      policy = new NScaleVideoUplinkBandwidthPolicy(selfAttendeeId);
      policy.setIdealMaxBandwidthKbps(600);
      policy.setTransceiverController(transceiverController);
      transceiverController.setVideoInput(new MediaStreamTrack());
      for (const entry of expectedNumParticipantsToParameters) {
        const numParticipants = entry[0];
        const expectedParams = entry[1];
        const sources: SdkStreamDescriptor[] = [];
        for (let i = 0; i < numParticipants; i++) {
          const attendee = i === 0 ? selfAttendeeId : `attendee-${i}`;
          sources.push(
            new SdkStreamDescriptor({
              streamId: i,
              groupId: i,
              maxBitrateKbps: 100,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2,
              groupId: i,
              maxBitrateKbps: 200,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
        }
        const index = new DefaultVideoStreamIndex(logger);
        index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
        policy.updateIndex(index);
        const actualParams = policy.chooseCaptureAndEncodeParameters();
        assert(
          actualParams.equal(expectedParams),
          `numParticipants: ${numParticipants} expected: ${JSON.stringify(
            expectedParams
          )} actual: ${JSON.stringify(actualParams)}`
        );
      }
    });

    it('Scale resolution correctly with portrait mode', () => {
      policy = new NScaleVideoUplinkBandwidthPolicy(selfAttendeeId);
      policy.setIdealMaxBandwidthKbps(600);
      policy.setTransceiverController(transceiverController);
      transceiverController.setVideoInput(new MediaStreamTrack());
      for (const entry of expectedNumParticipantsToParameters) {
        const numParticipants = entry[0];
        const expectedParams = entry[1];
        const sources: SdkStreamDescriptor[] = [];
        for (let i = 0; i < numParticipants; i++) {
          const attendee = i === 0 ? selfAttendeeId : `attendee-${i}`;
          sources.push(
            new SdkStreamDescriptor({
              streamId: i,
              groupId: i,
              maxBitrateKbps: 100,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
          sources.push(
            new SdkStreamDescriptor({
              streamId: i * 2,
              groupId: i,
              maxBitrateKbps: 200,
              attendeeId: attendee,
              mediaType: SdkStreamMediaType.VIDEO,
            })
          );
        }
        const index = new DefaultVideoStreamIndex(logger);
        index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
        policy.updateIndex(index);
        const actualParams = policy.chooseCaptureAndEncodeParameters();
        assert(
          actualParams.equal(expectedParams),
          `numParticipants: ${numParticipants} expected: ${JSON.stringify(
            expectedParams
          )} actual: ${JSON.stringify(actualParams)}`
        );
      }
    });

    it('Scale to 360 if browser behavior returns disable 480p', () => {
      class TestBrowserBehavior extends DefaultBrowserBehavior {
        disable480pResolutionScaleDown(): boolean {
          return true;
        }
      }
      policy = new NScaleVideoUplinkBandwidthPolicy(
        selfAttendeeId,
        true,
        undefined,
        new TestBrowserBehavior()
      );
      policy.setIdealMaxBandwidthKbps(600);
      policy.setTransceiverController(transceiverController);
      transceiverController.setVideoInput(new MediaStreamTrack());
      const numParticipants = 5;
      const expectedParams = new DefaultVideoCaptureAndEncodeParameter(
        320,
        192,
        15,
        320,
        false,
        1.5
      );
      const sources: SdkStreamDescriptor[] = [];
      for (let i = 0; i < numParticipants; i++) {
        const attendee = i === 0 ? selfAttendeeId : `attendee-${i}`;
        sources.push(
          new SdkStreamDescriptor({
            streamId: i,
            groupId: i,
            maxBitrateKbps: 100,
            attendeeId: attendee,
            mediaType: SdkStreamMediaType.VIDEO,
          })
        );
      }
      const index = new DefaultVideoStreamIndex(logger);
      index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
      policy.updateIndex(index);
      const actualParams = policy.chooseCaptureAndEncodeParameters();
      assert(
        actualParams.equal(expectedParams),
        `Expected: ${JSON.stringify(expectedParams)} actual: ${JSON.stringify(actualParams)}`
      );
    });
  });

  describe('wantsResubscribe', () => {
    it('returns true if optimal parameters have changed', () => {
      const index = new DefaultVideoStreamIndex(logger);
      // transition from 4 to 5 participants (note the +1 implicit participant for self)
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 5,
              groupId: 3,
              maxBitrateKbps: 50,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy4',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy4',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );
      policy.updateIndex(index);
      policy.chooseCaptureAndEncodeParameters();
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 5,
              groupId: 3,
              maxBitrateKbps: 50,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy4',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy4',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );
      policy.updateIndex(index);
      expect(policy.wantsResubscribe()).to.be.true;
    });

    it('returns false if optimal parameters have not changed', () => {
      const index = new DefaultVideoStreamIndex(logger);
      // transition from 1 to 2 participants (note the +1 implicit participant for self)
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [],
        })
      );
      policy.updateIndex(index);
      policy.chooseCaptureAndEncodeParameters();
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );
      policy.updateIndex(index);
      expect(policy.wantsResubscribe()).to.be.false;
    });
  });

  describe('updateConnectionMeric', () => {
    it('is no-opn for NScaleUplinkPolicy', () => {
      policy.updateConnectionMetric({});
    });
  });

  describe('chooseMediaTrackConstraints', () => {
    it('returns empty MediaTrackConstraint for NScaleUplinkPolicy', () => {
      expect(JSON.stringify(policy.chooseMediaTrackConstraints())).to.equal(JSON.stringify({}));
    });
  });

  describe('chooseEncodingParameters', () => {
    it('returns empty MediaTrackConstraint for NScaleUplinkPolicy', () => {
      expect(policy.chooseEncodingParameters().size).to.equal(0);
    });
  });

  describe('updateTransceiverController', () => {
    it('calls setEncodingParameters if the transceiver controller has different maxBitrate', () => {
      transceiverController.localVideoTransceiver().sender.setParameters({
        transactionId: undefined,
        codecs: [],
        rtcp: undefined,
        encodings: [
          {
            maxBitrate: IDEAL_MAX_BANDWIDTH_KBPS * 1000 + 1,
            scaleResolutionDownBy: SCALE_RESOLUTION_DOWN_BY,
          },
        ],
        headerExtensions: undefined,
      });
      policy.setTransceiverController(transceiverController);

      const spy = sinon.spy(transceiverController, 'setEncodingParameters');
      policy.updateTransceiverController();
      expect(spy.calledOnce).to.be.true;
      spy.restore();
    });

    it('calls setEncodingParameters if the transceiver controller has different scaleResolutionDownBy', () => {
      transceiverController.localVideoTransceiver().sender.setParameters({
        transactionId: undefined,
        codecs: [],
        rtcp: undefined,
        encodings: [
          {
            maxBitrate: IDEAL_MAX_BANDWIDTH_KBPS * 1000,
            scaleResolutionDownBy: SCALE_RESOLUTION_DOWN_BY + 1,
          },
        ],
        headerExtensions: undefined,
      });
      policy.setTransceiverController(transceiverController);

      const spy = sinon.spy(transceiverController, 'setEncodingParameters');
      policy.updateTransceiverController();
      expect(spy.calledOnce).to.be.true;
      spy.restore();
    });

    it('does not call setEncodingParameters if the value does not change', () => {
      transceiverController.localVideoTransceiver().sender.setParameters({
        transactionId: undefined,
        codecs: [],
        rtcp: undefined,
        encodings: [
          {
            maxBitrate: IDEAL_MAX_BANDWIDTH_KBPS * 1000,
            scaleResolutionDownBy: SCALE_RESOLUTION_DOWN_BY,
          },
        ],
        headerExtensions: undefined,
      });
      policy.setTransceiverController(transceiverController);

      const spy = sinon.spy(transceiverController, 'setEncodingParameters');
      policy.updateTransceiverController();
      expect(spy.calledOnce).to.be.false;
      spy.restore();
    });

    it('calls setEncodingParameters if the transceiver controller has undefined encodings from transceiver controller', () => {
      transceiverController.localVideoTransceiver().sender.setParameters({
        transactionId: undefined,
        codecs: [],
        rtcp: undefined,
        encodings: undefined,
        headerExtensions: undefined,
      });
      policy.setTransceiverController(transceiverController);

      const spy = sinon.spy(transceiverController, 'setEncodingParameters');
      policy.updateTransceiverController();

      expect(spy.calledOnce).to.be.true;
      spy.restore();
    });

    it('calls setEncodingParameters if the transceiver controller has undefined parameters from transceiver controller', () => {
      transceiverController.localVideoTransceiver().sender.setParameters(undefined);

      const spy = sinon.spy(transceiverController, 'setEncodingParameters');

      policy.setTransceiverController(transceiverController);
      policy.updateTransceiverController();

      expect(spy.calledOnce).to.be.true;
      spy.restore();
    });

    it('should not call setEncodingParameters if the transceiver controller has an undefined sender', () => {
      class InvalidTransceiverController extends TestTransceiverController {
        localVideoTransceiver(): RTCRtpTransceiver {
          // @ts-ignore
          return {
            sender: undefined,
          };
        }
      }
      const invalidTransceiverController = new InvalidTransceiverController(
        new NoOpLogger(),
        context.browserBehavior,
        context
      );
      const spy = sinon.spy(invalidTransceiverController, 'setEncodingParameters');
      invalidTransceiverController.setPeer(new RTCPeerConnection());
      invalidTransceiverController.setupLocalTransceivers();
      policy.setTransceiverController(invalidTransceiverController);
      policy.updateTransceiverController();
      expect(spy.called).to.be.false;
      spy.restore();
    });

    it('returns early if there is no transceiver controller', () => {
      const spy = sinon.spy(TestTransceiverController.prototype, 'setEncodingParameters');
      policy.updateTransceiverController();
      expect(spy.notCalled).to.be.true;
      spy.restore();
    });
  });

  describe('SVC', () => {
    it('Enables SVC when SVC is enabled, using SVC codec, and there are more than 3 participants', () => {
      policy.setTransceiverController(transceiverController);
      // @ts-ignore
      policy.isUsingSVCCodec = false;
      // @ts-ignore
      policy.numParticipants = 4;
      policy.setSVCEnabled(true);
      policy.setMeetingSupportedVideoSendCodecs(
        [VideoCodecCapability.vp9Profile0()],
        [VideoCodecCapability.vp9Profile0(), VideoCodecCapability.h264ConstrainedBaselineProfile()]
      );
      // @ts-ignore
      expect(policy.optimalParameters.isSVCEncoding()).to.be.true;
    });

    it('Enables SVC when SVC is enabled, even if logger is not defined', () => {
      policy = new NScaleVideoUplinkBandwidthPolicy(selfAttendeeId, true);
      policy.setTransceiverController(transceiverController);
      // @ts-ignore
      policy.isUsingSVCCodec = false;
      // @ts-ignore
      policy.numParticipants = 4;
      policy.setSVCEnabled(true);
      policy.setMeetingSupportedVideoSendCodecs(
        [VideoCodecCapability.vp9Profile0()],
        [VideoCodecCapability.vp9Profile0(), VideoCodecCapability.h264ConstrainedBaselineProfile()]
      );
      // @ts-ignore
      expect(policy.optimalParameters.isSVCEncoding()).to.be.true;
    });

    it('Disable SVC when there is no more than 3 participants', () => {
      policy.setTransceiverController(transceiverController);
      // @ts-ignore
      policy.isUsingSVCCodec = false;
      // @ts-ignore
      policy.numParticipants = 2;
      policy.setSVCEnabled(true);
      policy.setMeetingSupportedVideoSendCodecs(undefined, [
        VideoCodecCapability.vp9Profile0(),
        VideoCodecCapability.h264ConstrainedBaselineProfile(),
      ]);
      // Test case for isUsingSVCCodec is unchanged
      policy.setMeetingSupportedVideoSendCodecs(undefined, [VideoCodecCapability.vp9Profile0()]);
      // @ts-ignore
      expect(policy.optimalParameters.isSVCEncoding()).to.be.false;
    });
  });
});
