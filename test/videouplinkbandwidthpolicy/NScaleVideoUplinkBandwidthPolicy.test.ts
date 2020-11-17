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
import NScaleVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy';

describe('NScaleVideoUplinkBandwidthPolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const assert: Chai.AssertStatic = chai.assert;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  const selfAttendeeId = 'self-cb7cb43b';
  let policy: NScaleVideoUplinkBandwidthPolicy;

  beforeEach(() => {
    policy = new NScaleVideoUplinkBandwidthPolicy(selfAttendeeId);
    policy.setIdealMaxBandwidthKbps(600);
  });

  describe('chooseCaptureAndEncodeParameters', () => {
    const expectedNumParticipantsToParameters = new Map([
      [1, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false)],
      [2, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false)],
      [3, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 400, false)],
      [4, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 400, false)],
      [5, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 320, false)],
      [6, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 274, false)],
      [7, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 242, false)],
      [8, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 218, false)],
      [9, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 199, false)],
      [10, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 184, false)],
      [11, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 172, false)],
      [12, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 162, false)],
      [13, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 153, false)],
      [14, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 146, false)],
      [15, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 139, false)],
      [16, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 134, false)],
    ]);

    const expectedNumParticipantsToParametersWithPriority = new Map([
      [1, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false)],
      [2, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false)],
      [3, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false)],
      [4, new DefaultVideoCaptureAndEncodeParameter(640, 384, 15, 600, false)],
      [5, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
      [6, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
      [7, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
      [8, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
      [9, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
      [10, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
      [11, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
      [12, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
      [13, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
      [14, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
      [15, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
      [16, new DefaultVideoCaptureAndEncodeParameter(320, 192, 15, 600, false)],
    ]);

    it('returns the correct values when the self is present in the SdkIndexFrame', () => {
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

    it('returns the correct values when bandwidth has priority', () => {
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
      for (const entry of expectedNumParticipantsToParameters) {
        const numParticipants = entry[0];
        const expectedParams = entry[1];
        const sources: SdkStreamDescriptor[] = [];
        for (let i = 0; i < numParticipants - 1; i++) {
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
});
