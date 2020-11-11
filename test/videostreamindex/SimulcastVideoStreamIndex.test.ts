// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import {
  SdkBitrate,
  SdkBitrateFrame,
  SdkIndexFrame,
  SdkStreamAllocation,
  SdkStreamDescriptor,
  SdkStreamMediaType,
  SdkSubscribeAckFrame,
  SdkTrackMapping,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import SimulcastVideoStreamIndex from '../../src/videostreamindex/SimulcastVideoStreamIndex';

describe('SimulcastVideoStreamIndex', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  let index: SimulcastVideoStreamIndex;
  interface DateNow {
    (): number;
  }
  let originalDateNow: DateNow;
  let startTime: number;
  const logger = new NoOpLogger(LogLevel.DEBUG);

  function mockDateNow(): number {
    return startTime;
  }

  function incrementTime(addMs: number): void {
    startTime += addMs;
  }

  beforeEach(() => {
    startTime = Date.now();
    originalDateNow = Date.now;
    Date.now = mockDateNow;
    index = new SimulcastVideoStreamIndex(logger);
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('construction', () => {
    it('can be constructed', () => {
      assert.exists(index);
    });
  });

  describe('localStreamDescriptions', () => {
    it('returns array of VideoStreamDescription for local videos', () => {
      const localDescs = index.localStreamDescriptions();
      expect(localDescs.length).to.equal(0);
    });
  });

  describe('remoteStreamDescriptions', () => {
    it('returns array of VideoStreamDescription for remote videos', () => {
      const remoteDescs = index.remoteStreamDescriptions();
      expect(remoteDescs.length).to.equal(0);
    });
  });

  describe('integrateUplinkPolicyDecision', () => {
    it('updates uplink policy decision', () => {
      const encodingParamArr: RTCRtpEncodingParameters[] = [];
      const localDescs = index.localStreamDescriptions();
      expect(localDescs.length).to.equal(0);
      const bitrateArr = [300, 0, 1500];
      for (const bitrate of bitrateArr) {
        const param: RTCRtpEncodingParameters = {
          active: bitrate === 0 ? false : true,
          maxBitrate: bitrate * 1000,
        };
        encodingParamArr.push(param);
      }
      index.integrateUplinkPolicyDecision(encodingParamArr);
      expect(index.localStreamDescriptions().length).to.equal(3);
      expect(index.localStreamDescriptions()[2].maxBitrateKbps).to.equal(1500);
      expect(index.localStreamDescriptions()[1].maxBitrateKbps).to.equal(0);
      expect(index.localStreamDescriptions()[1].disabledByUplinkPolicy).to.equal(true);

      encodingParamArr[1].maxBitrate = 700 * 1000;
      index.integrateUplinkPolicyDecision(encodingParamArr);
      expect(index.localStreamDescriptions().length).to.equal(3);
      expect(index.localStreamDescriptions()[1].maxBitrateKbps).to.equal(700);
      expect(index.localStreamDescriptions()[1].disabledByUplinkPolicy).to.equal(false);

      encodingParamArr[0].maxBitrate = 0 * 1000;
      index.integrateUplinkPolicyDecision(encodingParamArr);
      expect(index.localStreamDescriptions()[0].maxBitrateKbps).to.equal(0);

      const deletedParam = encodingParamArr.splice(1, 1);

      index.integrateUplinkPolicyDecision(encodingParamArr);
      expect(index.localStreamDescriptions().length).to.equal(2);
      encodingParamArr.splice(1, 0, deletedParam[0]);
      index.integrateUplinkPolicyDecision(encodingParamArr);
    });
  });

  describe('integrateBitratesFrame', () => {
    it('updates stream description', () => {
      const encodingParamArr: RTCRtpEncodingParameters[] = [];
      const bitrateArr = [300, 500, 1500];
      for (const bitrate of bitrateArr) {
        const param: RTCRtpEncodingParameters = {
          active: true,
          maxBitrate: bitrate,
        };
        encodingParamArr.push(param);
      }
      const streamIdTestValue = 3;
      const avgBitrateTestValue = 2000;
      const bitrateFrame = SdkBitrateFrame.create();
      const bitrate = SdkBitrate.create();
      bitrate.sourceStreamId = streamIdTestValue;
      bitrate.avgBitrateBps = avgBitrateTestValue;
      bitrateFrame.bitrates.push(bitrate);

      const localDescs = index.localStreamDescriptions();
      expect(localDescs.length).to.equal(0);

      index.integrateUplinkPolicyDecision(encodingParamArr);
      expect(index.localStreamDescriptions().length).to.equal(3);

      index.integrateBitratesFrame(bitrateFrame);
      expect(index.localStreamDescriptions().length).to.equal(3);

      index.integrateBitratesFrame(bitrateFrame);
      expect(index.localStreamDescriptions().length).to.equal(3);
    });

    it('updates stream description and marks stream as disbableByWebRTC if two consecutive bitrate message do not contain stream id', () => {
      const encodingParamArr: RTCRtpEncodingParameters[] = [];
      const bitrateArr = [300, 0, 1500];
      for (const bitrate of bitrateArr) {
        const param: RTCRtpEncodingParameters = {
          active: true,
          maxBitrate: bitrate * 1000,
        };
        encodingParamArr.push(param);
      }
      const streamIdTestValue = 3;
      const avgBitrateTestValue = 2000 * 1000;
      const bitrateFrame = SdkBitrateFrame.create();
      const bitrate = SdkBitrate.create();
      bitrate.sourceStreamId = streamIdTestValue;
      bitrate.avgBitrateBps = avgBitrateTestValue;
      bitrateFrame.bitrates.push(bitrate);

      let localDescs = index.localStreamDescriptions();
      expect(localDescs.length).to.equal(0);

      index.integrateUplinkPolicyDecision(encodingParamArr);
      localDescs = index.localStreamDescriptions();
      expect(localDescs.length).to.equal(3);
      expect(localDescs[0].maxBitrateKbps).to.equal(300);
      expect(localDescs[0].disabledByUplinkPolicy).to.equal(false);
      expect(localDescs[0].disabledByWebRTC).to.equal(false);

      expect(localDescs[1].maxBitrateKbps).to.equal(0);
      expect(localDescs[1].disabledByUplinkPolicy).to.equal(true);
      expect(localDescs[1].disabledByWebRTC).to.equal(false);

      expect(localDescs[2].maxBitrateKbps).to.equal(1500);
      expect(localDescs[2].disabledByUplinkPolicy).to.equal(false);
      expect(localDescs[2].disabledByWebRTC).to.equal(false);

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
            groupId: 1,
          }),
          new SdkStreamAllocation({
            trackLabel: '',
            streamId: 3,
            groupId: 1,
          }),
          new SdkStreamAllocation({
            trackLabel: '',
            streamId: 4,
            groupId: 2,
          }),
        ],
      });

      index.integrateSubscribeAckFrame(subackFrame);
      localDescs = index.localStreamDescriptions();
      expect(localDescs.length).to.equal(3);
      expect(localDescs[0].maxBitrateKbps).to.equal(300);
      expect(localDescs[0].disabledByUplinkPolicy).to.equal(false);
      expect(localDescs[0].disabledByWebRTC).to.equal(false);
      expect(localDescs[0].streamId).to.equal(1);

      expect(localDescs[1].maxBitrateKbps).to.equal(0);
      expect(localDescs[1].disabledByUplinkPolicy).to.equal(true);
      expect(localDescs[1].disabledByWebRTC).to.equal(false);
      expect(localDescs[1].streamId).to.equal(2);

      expect(localDescs[2].maxBitrateKbps).to.equal(1500);
      expect(localDescs[2].disabledByUplinkPolicy).to.equal(false);
      expect(localDescs[2].disabledByWebRTC).to.equal(false);
      expect(localDescs[2].streamId).to.equal(3);

      incrementTime(6100);

      index.integrateBitratesFrame(bitrateFrame);
      localDescs = index.localStreamDescriptions();
      expect(localDescs[0].disabledByUplinkPolicy).to.equal(false);
      expect(localDescs[0].disabledByWebRTC).to.equal(false);
      expect(localDescs[0].streamId).to.equal(1);

      expect(localDescs[1].disabledByUplinkPolicy).to.equal(true);
      expect(localDescs[1].disabledByWebRTC).to.equal(false);
      expect(localDescs[1].streamId).to.equal(2);

      expect(localDescs[2].disabledByUplinkPolicy).to.equal(false);
      expect(localDescs[2].disabledByWebRTC).to.equal(false);
      expect(localDescs[2].streamId).to.equal(3);

      index.integrateBitratesFrame(bitrateFrame);
      localDescs = index.localStreamDescriptions();
      expect(localDescs[0].disabledByUplinkPolicy).to.equal(false);
      expect(localDescs[0].disabledByWebRTC).to.equal(true);
      expect(localDescs[0].streamId).to.equal(1);

      expect(localDescs[1].disabledByUplinkPolicy).to.equal(true);
      expect(localDescs[1].disabledByWebRTC).to.equal(false);
      expect(localDescs[1].streamId).to.equal(2);

      expect(localDescs[2].disabledByUplinkPolicy).to.equal(false);
      expect(localDescs[2].disabledByWebRTC).to.equal(false);
      expect(localDescs[2].streamId).to.equal(3);

      index.integrateBitratesFrame(bitrateFrame);
      localDescs = index.localStreamDescriptions();
      expect(localDescs[0].disabledByUplinkPolicy).to.equal(false);
      expect(localDescs[0].disabledByWebRTC).to.equal(true);
      expect(localDescs[0].streamId).to.equal(1);

      expect(localDescs[1].disabledByUplinkPolicy).to.equal(true);
      expect(localDescs[1].disabledByWebRTC).to.equal(false);
      expect(localDescs[1].streamId).to.equal(2);

      expect(localDescs[2].disabledByUplinkPolicy).to.equal(false);
      expect(localDescs[2].disabledByWebRTC).to.equal(false);
      expect(localDescs[2].streamId).to.equal(3);
    });

    it('updates average bitrates in the IndexFrame', () => {
      index.integrateIndexFrame(
        new SdkIndexFrame({
          atCapacity: false,
          sources: [
            new SdkStreamDescriptor({ streamId: 7, groupId: 2 }),
            new SdkStreamDescriptor({ streamId: 3, groupId: 2 }),
          ],
        })
      );

      const streamIdTestValue = 3;
      const avgBitrateTestValue = 2000;
      const bitrateFrame = SdkBitrateFrame.create();
      const bitrate = SdkBitrate.create();
      bitrate.sourceStreamId = streamIdTestValue;
      bitrate.avgBitrateBps = avgBitrateTestValue;
      bitrateFrame.bitrates.push(bitrate);
      const bitrate2 = SdkBitrate.create();
      // unseen stream id
      bitrate2.sourceStreamId = 9;
      bitrate2.avgBitrateBps = avgBitrateTestValue;
      bitrateFrame.bitrates.push(bitrate2);

      index.integrateBitratesFrame(bitrateFrame);

      index.integrateBitratesFrame(bitrateFrame);
    });

    it('updates localStreamDescriptions', () => {
      const encodingParamArr: RTCRtpEncodingParameters[] = [];
      const bitrateArr = [300, 500, 1500];
      for (const bitrate of bitrateArr) {
        const param: RTCRtpEncodingParameters = {
          active: true,
          maxBitrate: bitrate,
        };
        encodingParamArr.push(param);
      }

      const localDescs = index.localStreamDescriptions();
      expect(localDescs.length).to.equal(0);

      index.integrateUplinkPolicyDecision(encodingParamArr);
      expect(index.localStreamDescriptions().length).to.equal(3);

      index.integrateIndexFrame(
        new SdkIndexFrame({
          atCapacity: false,
          sources: [
            new SdkStreamDescriptor({ streamId: 7, groupId: 2 }),
            new SdkStreamDescriptor({ streamId: 3, groupId: 2 }),
          ],
        })
      );

      const streamIdTestValue = 3;
      const avgBitrateTestValue = 2000;
      const bitrateFrame = SdkBitrateFrame.create();
      const bitrate = SdkBitrate.create();
      bitrate.sourceStreamId = streamIdTestValue;
      bitrate.avgBitrateBps = avgBitrateTestValue;
      bitrateFrame.bitrates.push(bitrate);
      const bitrate2 = SdkBitrate.create();
      // unseen stream id
      bitrate2.sourceStreamId = 9;
      bitrate2.avgBitrateBps = avgBitrateTestValue;
      bitrateFrame.bitrates.push(bitrate2);
      index.integrateBitratesFrame(bitrateFrame);
      expect(index.localStreamDescriptions().length).to.equal(3);
    });
  });

  describe('integrateIndexFrame', () => {
    it('obeys index frame', () => {
      index.integrateIndexFrame(
        new SdkIndexFrame({
          atCapacity: false,
          sources: [
            new SdkStreamDescriptor({ streamId: 7, groupId: 2 }),
            new SdkStreamDescriptor({ streamId: 3, groupId: 2 }),
          ],
        })
      );
      expect(index.allStreams().array()).to.deep.equal([3, 7]);
    });
  });

  describe('integrateSubscribeAckFrame', () => {
    const indexFrame = new SdkIndexFrame({
      sources: [
        new SdkStreamDescriptor({
          streamId: 1,
          groupId: 1,
          maxBitrateKbps: 100,
          attendeeId: '688c',
          mediaType: SdkStreamMediaType.VIDEO,
        }),
        new SdkStreamDescriptor({
          streamId: 2,
          groupId: 1,
          maxBitrateKbps: 200,
          attendeeId: '4d82',
          mediaType: SdkStreamMediaType.VIDEO,
        }),
        new SdkStreamDescriptor({
          streamId: 4,
          groupId: 399,
          maxBitrateKbps: 800,
          attendeeId: 'a0ff',
          mediaType: SdkStreamMediaType.VIDEO,
        }),
      ],
    });

    it('updates track mapping', () => {
      const subackFrame = SdkSubscribeAckFrame.create();
      subackFrame.tracks = [
        new SdkTrackMapping({ streamId: 2, trackLabel: 'b18b9db2' }),
        new SdkTrackMapping({ streamId: 4, trackLabel: '4107' }),
        new SdkTrackMapping({ streamId: 9, trackLabel: '9318' }),
      ];
      subackFrame.allocations = undefined;
      expect(index.attendeeIdForTrack('4107')).to.equal('');
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.attendeeIdForTrack('4107')).to.equal('a0ff');
    });

    it('updates localStreamDescriptions', () => {
      const encodingParamArr: RTCRtpEncodingParameters[] = [];

      const localDescs = index.localStreamDescriptions();
      expect(localDescs.length).to.equal(0);
      const bitrateArr = [300, 500, 1500];
      for (const bitrate of bitrateArr) {
        const param: RTCRtpEncodingParameters = {
          active: true,
          maxBitrate: bitrate * 1000,
        };
        encodingParamArr.push(param);
      }
      index.integrateUplinkPolicyDecision(encodingParamArr);
      expect(index.localStreamDescriptions().length).to.equal(3);

      const subackFrame = new SdkSubscribeAckFrame({
        tracks: [
          new SdkTrackMapping({ streamId: 2, trackLabel: 'b18b9db2' }),
          new SdkTrackMapping({ streamId: 4, trackLabel: '4107' }),
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
            groupId: 1,
          }),
          new SdkStreamAllocation({
            trackLabel: '',
            streamId: 2,
            groupId: 1,
          }),
          new SdkStreamAllocation({
            trackLabel: '',
            streamId: 2,
            groupId: 1,
          }),
        ],
      });

      index.integrateIndexFrame(indexFrame);
      index.integrateSubscribeAckFrame(subackFrame);
    });
  });

  describe('handle sequencing of index and subscriptions', () => {
    it('resolves track id to external user id after remote restarts video', () => {
      index.integrateIndexFrame(
        new SdkIndexFrame({
          atCapacity: false,
          sources: [
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 1,
              attendeeId: 'client1',
              externalUserId: 'client1-ext',
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 1,
              attendeeId: 'client1',
              externalUserId: 'client1-ext',
            }),
          ],
        })
      );
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [new SdkTrackMapping({ streamId: 4, trackLabel: 'track_v2' })],
        })
      );
      expect(index.externalUserIdForTrack('track_v2')).to.equal('client1-ext');

      index.integrateIndexFrame(new SdkIndexFrame({ atCapacity: false, sources: [] }));
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [],
        })
      );
      index.integrateIndexFrame(new SdkIndexFrame({ atCapacity: false, sources: [] }));

      index.integrateIndexFrame(
        new SdkIndexFrame({
          atCapacity: false,
          sources: [
            new SdkStreamDescriptor({
              streamId: 12,
              groupId: 3,
              attendeeId: 'client1p',
              externalUserId: 'client1p-ext',
            }),
            new SdkStreamDescriptor({
              streamId: 14,
              groupId: 3,
              attendeeId: 'client1p',
              externalUserId: 'client1p-ext',
            }),
          ],
        })
      );
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [new SdkTrackMapping({ streamId: 14, trackLabel: 'track_v2' })],
        })
      );

      expect(index.externalUserIdForTrack('track_v2')).to.equal('client1p-ext');
    });
  });
});
