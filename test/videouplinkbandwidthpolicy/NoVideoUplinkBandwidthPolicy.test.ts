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
import DefaultVideoCaptureAndEncodeParameter from '../../src/videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import NoVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NoVideoUplinkBandwidthPolicy';

describe('NoVideoUplinkBandwidthPolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  let policy: NoVideoUplinkBandwidthPolicy;

  before(() => {
    policy = new NoVideoUplinkBandwidthPolicy();
    policy.setIdealMaxBandwidthKbps(600);
    policy.setHasBandwidthPriority(false);
  });

  describe('chooseCaptureAndEncodeParameters', () => {
    const expectedNumParticipantsToParameters = new Map([
      [1, new DefaultVideoCaptureAndEncodeParameter(640, 512, 15, 600, false)],
      [2, new DefaultVideoCaptureAndEncodeParameter(640, 512, 15, 600, false)],
      [3, new DefaultVideoCaptureAndEncodeParameter(640, 512, 15, 400, false)],
      [4, new DefaultVideoCaptureAndEncodeParameter(640, 512, 15, 400, false)],
    ]);

    it('returns the initial value 0 although the self is present in the SdkIndexFrame', () => {
      for (const entry of expectedNumParticipantsToParameters) {
        const numParticipants = entry[0];
        const sources: SdkStreamDescriptor[] = [];
        for (let i = 0; i < numParticipants; i++) {
          const attendee = i === 0 ? 'self-attendee-id' : `attendee-${i}`;
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
        const params = policy.chooseCaptureAndEncodeParameters();
        expect(params.captureWidth()).to.equal(0);
        expect(params.captureHeight()).to.equal(0);
        expect(params.captureFrameRate()).to.equal(0);
        expect(params.encodeBitrates()[0]).to.equal(0);
      }
    });
  });

  describe('maxBandwidthKbps', () => {
    it('returns 0', () => {
      expect(policy.maxBandwidthKbps()).to.equal(0);
    });
  });

  describe('wantsResubscribe', () => {
    it('returns false although optimal parameters have changed', () => {
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
      expect(policy.wantsResubscribe()).to.be.false;
    });
  });

  describe('updateConnectionMetric', () => {
    it('is no-op', () => {
      policy.updateConnectionMetric({});
    });
  });

  describe('chooseMediaTrackConstraints', () => {
    it('is no-op', () => {
      policy.chooseMediaTrackConstraints();
    });
  });

  describe('chooseEncodingParameters', () => {
    it('is no-op', () => {
      policy.chooseEncodingParameters();
    });
  });
});
