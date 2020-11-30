// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultClientMetricReport from '../../src/clientmetricreport/DefaultClientMetricReport';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import {
  SdkIndexFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import AllHighestVideoBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/AllHighestVideoBandwidthPolicy';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';

describe('AllHighestVideoBandwidthPolicy', () => {
  let expect: Chai.ExpectStatic;
  let policy: AllHighestVideoBandwidthPolicy;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  const selfAttendeeId = 'self-cb7cb43b';

  before(() => {
    expect = chai.expect;
    policy = new AllHighestVideoBandwidthPolicy(selfAttendeeId);
  });

  describe('reset', () => {
    it('can be reset', () => {
      const index = new DefaultVideoStreamIndex(logger);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 3,
              maxBitrateKbps: 400,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );
      policy.updateIndex(index);
      const resub = policy.wantsResubscribe();
      expect(resub).to.equal(true);
      let received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([3]);
      policy.reset();
      received = policy.chooseSubscriptions();
      expect(received.array()).to.deep.equal([]);
    });
  });

  describe('wantsResubscribe', () => {
    it('returns false if policy is just initialized', () => {
      expect(policy.wantsResubscribe()).to.equal(false);
    });

    it('returns true if policy is updated with index frame', () => {
      const index = new DefaultVideoStreamIndex(logger);
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
              groupId: 2,
              maxBitrateKbps: 50,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );

      policy.updateIndex(index);
      expect(policy.wantsResubscribe()).to.equal(true);
    });
  });

  describe('chooseSubscriptions', () => {
    it('returns correct indices after policy is only updated with SdkIndexFrame', () => {
      const index = new DefaultVideoStreamIndex(logger);
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
              groupId: 2,
              maxBitrateKbps: 50,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );

      policy.updateIndex(index);
      const subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([2, 4, 6]);
    });

    it('returns correct indices and bandwidth has no impact on result', () => {
      const index = new DefaultVideoStreamIndex(logger);
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
              groupId: 2,
              maxBitrateKbps: 50,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );

      const metricReport = new DefaultClientMetricReport(logger);
      metricReport.globalMetricReport.currentMetrics['googAvailableReceiveBandwidth'] = 1000;

      policy.updateIndex(index);
      policy.updateMetrics(metricReport);
      const subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([2, 4, 6]);
    });
  });
});
