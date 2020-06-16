// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import {
  SdkBitrateFrame,
  SdkIndexFrame,
  SdkStreamAllocation,
  SdkStreamDescriptor,
  SdkStreamMediaType,
  SdkSubscribeAckFrame,
  SdkTrackMapping,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import SimulcastTransceiverController from '../../src/transceivercontroller/SimulcastTransceiverController';
import SimulcastVideoStreamIndex from '../../src/videostreamindex/SimulcastVideoStreamIndex';
import SimulcastUplinkPolicy from '../../src/videouplinkbandwidthpolicy/SimulcastUplinkPolicy';
import VideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';

describe('SimulcastUplinkPolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  const selfAttendeeId = 'self-cb7cb43b';
  let policy: VideoUplinkBandwidthPolicy;
  const highResolution: MediaTrackConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 15 },
  };

  beforeEach(() => {
    policy = new SimulcastUplinkPolicy(selfAttendeeId, logger);
  });

  describe('constructor', () => {
    it('can be constructed', () => {
      assert.exists(policy);
    });

    it('initializes default uplink parameter', () => {
      const constraint = policy.chooseMediaTrackConstraints();
      expect(JSON.stringify(constraint.frameRate)).to.equal(
        JSON.stringify({ ideal: SimulcastUplinkPolicy.defaultMaxFrameRate })
      );
      expect(JSON.stringify(constraint.width)).to.equal(JSON.stringify({ ideal: 1280 }));
      expect(JSON.stringify(constraint.height)).to.equal(JSON.stringify({ ideal: 720 }));
      const encodingParameter = policy.chooseEncodingParameters();
      expect(encodingParameter.has(SimulcastTransceiverController.MID_LEVEL_NAME)).to.equal(true);
      expect(encodingParameter.has(SimulcastTransceiverController.HIGH_LEVEL_NAME)).to.equal(true);
    });
  });

  describe('updateConnectionMetric', () => {
    it('could change uplink encoding parameters if not recently updated', done => {
      policy.updateConnectionMetric({ uplinkKbps: NaN });
      policy.updateConnectionMetric({ uplinkKbps: 2000 });
      // 2800 * 0.65 + 2000 * 0.35 = 2520
      // @ts-ignore
      expect(policy.lastUplinkBandwidthKbps).to.equal(2520);
      let mediaConstraint = policy.chooseMediaTrackConstraints();
      let encodingParameter = policy.chooseEncodingParameters();

      expect(JSON.stringify(mediaConstraint.height)).to.equal(JSON.stringify({ ideal: 720 }));
      expect(encodingParameter.has(SimulcastTransceiverController.MID_LEVEL_NAME)).to.equal(true);
      expect(encodingParameter.has(SimulcastTransceiverController.HIGH_LEVEL_NAME)).to.equal(true);

      policy.updateConnectionMetric({
        uplinkKbps: 1400,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1400,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1400,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1400,
      });
      // @ts-ignore
      expect(policy.lastUplinkBandwidthKbps).to.equal(1430);

      policy.updateConnectionMetric({
        uplinkKbps: 1000,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1000,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1000,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1000,
      });
      // to bypass the 5 seconds cool down upon creation
      new TimeoutScheduler(5050).start(() => {
        policy.updateConnectionMetric({
          uplinkKbps: 1000,
        });
        // @ts-ignore
        expect(policy.lastUplinkBandwidthKbps).to.equal(1000);
        mediaConstraint = policy.chooseMediaTrackConstraints();
        expect(JSON.stringify(mediaConstraint.height)).to.equal(JSON.stringify({ ideal: 540 }));

        policy.updateConnectionMetric({
          uplinkKbps: 300,
        });
        policy.updateConnectionMetric({
          uplinkKbps: 300,
        });
        policy.updateConnectionMetric({
          uplinkKbps: 300,
        });
        policy.updateConnectionMetric({
          uplinkKbps: 300,
        });
        policy.updateConnectionMetric({
          uplinkKbps: 300,
        });
        mediaConstraint = policy.chooseMediaTrackConstraints();
        expect(JSON.stringify(mediaConstraint.height)).to.equal(JSON.stringify({ ideal: 720 }));
        policy.updateConnectionMetric({});
        done();
      });
    }).timeout(6000);

    it('could change camera resolution if not recently updated', done => {
      policy.updateConnectionMetric({ nackCountPerSecond: 2 });
      policy.updateConnectionMetric({ uplinkKbps: 2000 });
      // 2800 * 0.65 + 2000 * 0.35 = 2520
      // @ts-ignore
      expect(policy.lastUplinkBandwidthKbps).to.equal(1820);
      let mediaConstraint = policy.chooseMediaTrackConstraints();

      const isSame =
        JSON.stringify(mediaConstraint.width) === JSON.stringify(highResolution.width) &&
        JSON.stringify(mediaConstraint.height) === JSON.stringify(highResolution.height) &&
        JSON.stringify(mediaConstraint.frameRate) === JSON.stringify(highResolution.frameRate);
      expect(isSame).to.equal(true);

      policy.updateConnectionMetric({
        uplinkKbps: 1400,
        nackCountPerSecond: 0,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1400,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1400,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1400,
      });
      // @ts-ignore
      expect(policy.lastUplinkBandwidthKbps).to.equal(1430);

      policy.updateConnectionMetric({
        uplinkKbps: 1100,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1100,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1100,
      });
      policy.updateConnectionMetric({
        uplinkKbps: 1100,
      });
      new TimeoutScheduler(5050).start(() => {
        policy.updateConnectionMetric({
          uplinkKbps: 1100,
        });
        // @ts-ignore
        expect(policy.lastUplinkBandwidthKbps).to.equal(1100);
        mediaConstraint = policy.chooseMediaTrackConstraints();
        expect(JSON.stringify(mediaConstraint.height)).to.equal(JSON.stringify({ ideal: 720 }));
        policy.updateConnectionMetric({
          uplinkKbps: 300,
        });
        policy.updateConnectionMetric({
          uplinkKbps: 300,
        });
        policy.updateConnectionMetric({
          uplinkKbps: 300,
        });
        policy.updateConnectionMetric({
          uplinkKbps: 300,
        });
        policy.updateConnectionMetric({
          uplinkKbps: 300,
        });
        mediaConstraint = policy.chooseMediaTrackConstraints();
        expect(JSON.stringify(mediaConstraint.height)).to.equal(JSON.stringify({ ideal: 720 }));
        done();
      });
    }).timeout(6000);
  });

  describe('updateIndex', () => {
    it('could change the encoding parameters', () => {
      const index = new SimulcastVideoStreamIndex(logger);

      const param = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(param.values()));
      policy.updateIndex(index);
      const shouldResub = policy.wantsResubscribe();
      expect(shouldResub).to.equal(true);
      const mediaConstraint = policy.chooseMediaTrackConstraints();
      expect(JSON.stringify(mediaConstraint.height)).to.equal(JSON.stringify({ ideal: 720 }));
    });

    it('could change the encoding parameters', () => {
      const sources: SdkStreamDescriptor[] = [];
      const numParticipants = 4;
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
      const index = new SimulcastVideoStreamIndex(logger);
      index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
      policy.updateIndex(index);
      const shouldResub = policy.wantsResubscribe();
      expect(shouldResub).to.equal(true);
      const mediaConstraint = policy.chooseMediaTrackConstraints();
      expect(JSON.stringify(mediaConstraint.height)).to.equal(JSON.stringify({ ideal: 540 }));
    });

    it('could change the encoding parameters', () => {
      const sources: SdkStreamDescriptor[] = [];
      const numParticipants = 2;
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
      const index = new SimulcastVideoStreamIndex(logger);
      index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
      policy.updateIndex(index);
      const shouldResub = policy.wantsResubscribe();
      expect(shouldResub).to.equal(true);
      const mediaConstraint = policy.chooseMediaTrackConstraints();
      policy.chooseEncodingParameters();
      expect(JSON.stringify(mediaConstraint.height)).to.equal(JSON.stringify({ ideal: 720 }));
      expect(policy.wantsResubscribe()).to.equal(false);
    });

    it('updates encoding parameter', () => {
      const param = policy.chooseEncodingParameters();

      const sources: SdkStreamDescriptor[] = [];
      const numParticipants = 2;
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
      const index = new SimulcastVideoStreamIndex(logger);

      index.integrateUplinkPolicyDecision(Array.from(param.values()));

      index.integrateIndexFrame(new SdkIndexFrame({ sources: sources }));
      const subackFrame = new SdkSubscribeAckFrame({
        tracks: [
          new SdkTrackMapping({ streamId: 7, trackLabel: 'b18b9db2' }),
          new SdkTrackMapping({ streamId: 8, trackLabel: '4107' }),
          new SdkTrackMapping({ streamId: 9, trackLabel: '9318' }),
        ],
        allocations: [
          new SdkStreamAllocation({
            trackLabel: '',
            streamId: 1,
            groupId: 1,
          }),
          new SdkStreamAllocation({
            trackLabel: '',
            streamId: 2,
            groupId: 2,
          }),
          new SdkStreamAllocation({
            trackLabel: '',
            streamId: 3,
            groupId: 2,
          }),
        ],
      });

      index.integrateSubscribeAckFrame(subackFrame);

      policy.updateIndex(index);
      const shouldResub = policy.wantsResubscribe();
      expect(shouldResub).to.equal(true);
      const mediaConstraint = policy.chooseMediaTrackConstraints();
      policy.chooseEncodingParameters();
      expect(JSON.stringify(mediaConstraint.height)).to.equal(JSON.stringify({ ideal: 720 }));
      expect(policy.wantsResubscribe()).to.equal(false);
      policy.chooseEncodingParameters();
      index.integrateBitratesFrame(new SdkBitrateFrame({}));
      index.integrateBitratesFrame(new SdkBitrateFrame({}));
      index.integrateBitratesFrame(new SdkBitrateFrame({}));
      expect(policy.wantsResubscribe()).to.equal(true);
    });
  });

  describe('setHasBandwidthPriority', () => {
    it('is no-op', () => {
      policy.setHasBandwidthPriority(true);
    });
  });

  describe('setIdeaMaxBandwidthKbps', () => {
    it('is no-op', () => {
      policy.setIdealMaxBandwidthKbps(1000);
    });
  });

  describe('chooseCaptureAndEncodeParameters', () => {
    it('is no-op', () => {
      policy.chooseCaptureAndEncodeParameters();
    });
  });
});
