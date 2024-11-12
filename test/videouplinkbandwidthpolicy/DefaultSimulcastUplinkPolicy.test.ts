// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import {
  SdkIndexFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import SimulcastLayers from '../../src/simulcastlayers/SimulcastLayers';
import SimulcastTransceiverController from '../../src/transceivercontroller/SimulcastTransceiverController';
import SimulcastVideoStreamIndex from '../../src/videostreamindex/SimulcastVideoStreamIndex';
import DefaultSimulcastUplinkPolicy from '../../src/videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicy';
import SimulcastUplinkObserver from '../../src/videouplinkbandwidthpolicy/SimulcastUplinkObserver';
import SimulcastUplinkPolicy from '../../src/videouplinkbandwidthpolicy/SimulcastUplinkPolicy';
import VideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';

describe('DefaultSimulcastUplinkPolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  interface DateNow {
    (): number;
  }
  let originalDateNow: DateNow;
  let startTime: number;
  const selfAttendeeId = 'self-cb7cb43b';
  let policy: VideoUplinkBandwidthPolicy;

  function mockDateNow(): number {
    return startTime;
  }

  function incrementTime(addMs: number): void {
    startTime += addMs;
  }

  function updateIndexFrame(index: SimulcastVideoStreamIndex, clientCount: number): void {
    const sources: SdkStreamDescriptor[] = [];
    for (let i = 3; i < clientCount + 3; i++) {
      const attendee = i === 0 ? selfAttendeeId : `attendee-${i}`;
      sources.push(
        new SdkStreamDescriptor({
          streamId: 2 * i - 1,
          groupId: i,
          maxBitrateKbps: 100,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
        })
      );
      sources.push(
        new SdkStreamDescriptor({
          streamId: 2 * i,
          groupId: i,
          maxBitrateKbps: 200,
          attendeeId: attendee,
          mediaType: SdkStreamMediaType.VIDEO,
        })
      );
    }
    index.integrateIndexFrame(
      new SdkIndexFrame({ sources: sources, numParticipants: clientCount })
    );
  }

  beforeEach(() => {
    startTime = Date.now();
    originalDateNow = Date.now;
    Date.now = mockDateNow;
    policy = new DefaultSimulcastUplinkPolicy(selfAttendeeId, logger);
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('constructor', () => {
    it('can be constructed', () => {
      assert.exists(policy);
    });

    it('initializes default uplink parameter', () => {
      const encodingParameter = policy.chooseEncodingParameters();
      expect(encodingParameter.has(SimulcastTransceiverController.MID_LEVEL_NAME)).to.equal(true);
      expect(encodingParameter.has(SimulcastTransceiverController.HIGH_LEVEL_NAME)).to.equal(true);
    });

    it('chooseMediaTrackConstraints', () => {
      expect(policy.chooseMediaTrackConstraints()).to.be.undefined;
    });
  });

  describe('encoding change with num clients', () => {
    it('Send single stream for p2p', () => {
      const index = new SimulcastVideoStreamIndex(logger);
      let encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      updateIndexFrame(index, 1);
      policy.updateIndex(index);
      encodingParams = policy.chooseEncodingParameters();
      let param = encodingParams.get(SimulcastTransceiverController.LOW_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(0);
      param = encodingParams.get(SimulcastTransceiverController.MID_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(1200000);
      param = encodingParams.get(SimulcastTransceiverController.HIGH_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(0);
    });

    it('encoding for 3 to 4', () => {
      const index = new SimulcastVideoStreamIndex(logger);
      let encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      updateIndexFrame(index, 14);
      policy.updateIndex(index);
      encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      updateIndexFrame(index, 3);
      policy.updateIndex(index);
      const shouldResub = policy.wantsResubscribe();
      expect(shouldResub).to.equal(true);
      encodingParams = policy.chooseEncodingParameters();
      let param = encodingParams.get(SimulcastTransceiverController.LOW_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(300000);
      param = encodingParams.get(SimulcastTransceiverController.HIGH_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(1200000);
    });

    it('encoding for 5 to 6', () => {
      const index = new SimulcastVideoStreamIndex(logger);
      updateIndexFrame(index, 6);
      policy.updateIndex(index);
      let encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      updateIndexFrame(index, 1);
      policy.updateIndex(index);
      encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      updateIndexFrame(index, 5);
      policy.updateIndex(index);
      const shouldResub = policy.wantsResubscribe();
      expect(shouldResub).to.equal(true);
      encodingParams = policy.chooseEncodingParameters();
      let param = encodingParams.get(SimulcastTransceiverController.LOW_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(200000);
      param = encodingParams.get(SimulcastTransceiverController.MID_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(600000);
    });

    it('encoding for more than 6', () => {
      const index = new SimulcastVideoStreamIndex(logger);
      let encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      updateIndexFrame(index, 1);
      policy.updateIndex(index);
      encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      updateIndexFrame(index, 8);
      policy.updateIndex(index);
      const shouldResub = policy.wantsResubscribe();
      expect(shouldResub).to.equal(true);
      encodingParams = policy.chooseEncodingParameters();
      let param = encodingParams.get(SimulcastTransceiverController.LOW_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(200000);
      param = encodingParams.get(SimulcastTransceiverController.MID_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(360000);
    });
  });

  describe('simulcast switches on and off with participants', () => {
    it('Simulcast turns on', () => {
      const index = new SimulcastVideoStreamIndex(logger);
      updateIndexFrame(index, 1);
      policy.updateIndex(index);
      let encodingParams = policy.chooseEncodingParameters();
      let param = encodingParams.get(SimulcastTransceiverController.LOW_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(0);
      param = encodingParams.get(SimulcastTransceiverController.MID_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(1200000);
      param = encodingParams.get(SimulcastTransceiverController.HIGH_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(0);
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      updateIndexFrame(index, 2);
      policy.updateIndex(index);
      let shouldResub = policy.wantsResubscribe();
      expect(shouldResub).to.equal(false);
      encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      incrementTime(6100);
      updateIndexFrame(index, 3);
      policy.updateIndex(index);
      shouldResub = policy.wantsResubscribe();
      expect(shouldResub).to.equal(true);
      encodingParams = policy.chooseEncodingParameters();
      param = encodingParams.get(SimulcastTransceiverController.LOW_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(300000);
      param = encodingParams.get(SimulcastTransceiverController.MID_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(0);
      param = encodingParams.get(SimulcastTransceiverController.HIGH_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(1200000);
    });

    it('Simulcast turns off', () => {
      const index = new SimulcastVideoStreamIndex(logger);
      updateIndexFrame(index, 3);
      policy.updateIndex(index);
      let encodingParams = policy.chooseEncodingParameters();
      let param = encodingParams.get(SimulcastTransceiverController.LOW_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(300000);
      param = encodingParams.get(SimulcastTransceiverController.MID_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(0);
      param = encodingParams.get(SimulcastTransceiverController.HIGH_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(1200000);
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      updateIndexFrame(index, 2);
      policy.updateIndex(index);
      const shouldResub = policy.wantsResubscribe();
      expect(shouldResub).to.equal(true);
      encodingParams = policy.chooseEncodingParameters();
      param = encodingParams.get(SimulcastTransceiverController.LOW_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(0);
      param = encodingParams.get(SimulcastTransceiverController.MID_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(1200000);
      param = encodingParams.get(SimulcastTransceiverController.HIGH_LEVEL_NAME);
      expect(param.maxBitrate).to.equal(0);
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

  describe('SimulcastUplinkObserver', () => {
    it('observer should get called only when added', async () => {
      let event = 0;
      let called = 0;
      class TestObserver implements SimulcastUplinkObserver {
        encodingSimulcastLayersDidChange(_simulcastLayer: SimulcastLayers): void {
          if (event !== 1 && event !== 3) {
            assert.fail();
          }
          called += 1;
        }
      }
      const observer = new TestObserver();
      (policy as SimulcastUplinkPolicy).addObserver(observer);
      event += 1;
      (policy as SimulcastUplinkPolicy).forEachObserver((observer: SimulcastUplinkObserver) => {
        observer.encodingSimulcastLayersDidChange(SimulcastLayers.High);
      });
      (policy as SimulcastUplinkPolicy).removeObserver(observer);
      event += 1;
      (policy as SimulcastUplinkPolicy).forEachObserver((observer: SimulcastUplinkObserver) => {
        observer.encodingSimulcastLayersDidChange(SimulcastLayers.High);
      });
      (policy as SimulcastUplinkPolicy).addObserver(observer);
      event += 1;
      (policy as SimulcastUplinkPolicy).forEachObserver((observer: SimulcastUplinkObserver) => {
        observer.encodingSimulcastLayersDidChange(SimulcastLayers.High);
      });
      expect(event).to.equal(3);
      expect(called).to.equal(2);
    });

    it('observer should get called only when simulcast encoding layers change', async () => {
      let called = 0;
      let oldSimulcastLayers: SimulcastLayers = null;
      class TestObserver implements SimulcastUplinkObserver {
        encodingSimulcastLayersDidChange(newSimulcastLayers: SimulcastLayers): void {
          called += 1;
          expect(oldSimulcastLayers).to.not.equal(newSimulcastLayers);
          oldSimulcastLayers = newSimulcastLayers;
        }
      }
      const observer = new TestObserver();
      (policy as SimulcastUplinkPolicy).addObserver(observer);
      const index = new SimulcastVideoStreamIndex(logger);
      // Low and high simulcast streams by default
      let encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      // Only high simulcast stream
      updateIndexFrame(index, 1);
      policy.updateIndex(index);
      encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      // Again high simulcast stream so no observer call
      updateIndexFrame(index, 2);
      policy.updateIndex(index);
      encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      // Low and high simulcast streams
      updateIndexFrame(index, 3);
      policy.updateIndex(index);
      encodingParams = policy.chooseEncodingParameters();
      index.integrateUplinkPolicyDecision(Array.from(encodingParams.values()));
      // Low and medium simulcast streams
      updateIndexFrame(index, 8);
      policy.updateIndex(index);
      encodingParams = policy.chooseEncodingParameters();
      expect(called).to.equal(4);
    });
  });
});
