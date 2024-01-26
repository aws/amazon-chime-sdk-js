// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import { Attendee, VideoSource } from '../../src';
import ClientMetricReport from '../../src/clientmetricreport/ClientMetricReport';
import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import {
  SdkIndexFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import AllHighestVideoBandwidthPolicy from '../../src/videodownlinkbandwidthpolicy/AllHighestVideoBandwidthPolicy';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';

beforeEach(() => {});

describe('AllHighestVideoBandwidthPolicy', () => {
  let expect: Chai.ExpectStatic;
  let policy: AllHighestVideoBandwidthPolicy;
  let index: DefaultVideoStreamIndex;
  const logger = new NoOpLogger(LogLevel.DEBUG);
  const selfAttendeeId = 'self-cb7cb43b';

  beforeEach(() => {
    expect = chai.expect;
    policy = new AllHighestVideoBandwidthPolicy(selfAttendeeId);
    index = new DefaultVideoStreamIndex(logger);

    index.integrateIndexFrame(
      new SdkIndexFrame({
        sources: [
          new SdkStreamDescriptor({
            streamId: 6,
            groupId: 2,
            maxBitrateKbps: 400,
            attendeeId: 'xy1',
            mediaType: SdkStreamMediaType.VIDEO,
          }),
          new SdkStreamDescriptor({
            streamId: 5,
            groupId: 2,
            maxBitrateKbps: 50,
            attendeeId: 'xy1',
            mediaType: SdkStreamMediaType.VIDEO,
          }),
          new SdkStreamDescriptor({
            streamId: 4,
            groupId: 399,
            maxBitrateKbps: 800,
            attendeeId: 'xy2',
            mediaType: SdkStreamMediaType.VIDEO,
          }),
          new SdkStreamDescriptor({
            streamId: 3,
            groupId: 399,
            maxBitrateKbps: 200,
            attendeeId: 'xy2',
            mediaType: SdkStreamMediaType.VIDEO,
          }),
          new SdkStreamDescriptor({
            streamId: 2,
            groupId: 1,
            maxBitrateKbps: 200,
            attendeeId: 'xy3',
            mediaType: SdkStreamMediaType.VIDEO,
          }),
          new SdkStreamDescriptor({
            streamId: 1,
            groupId: 1,
            maxBitrateKbps: 100,
            attendeeId: 'xy3',
            mediaType: SdkStreamMediaType.VIDEO,
          }),
        ],
      })
    );
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
      policy.updateIndex(index);
      expect(policy.wantsResubscribe()).to.equal(true);
    });
  });

  describe('chooseSubscriptions', () => {
    it('returns correct indices after policy is only updated with SdkIndexFrame', () => {
      policy.updateIndex(index);
      const subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([2, 4, 6]);
    });

    it('returns correct indices and bandwidth has no impact on result', () => {
      const metricReport = new ClientMetricReport(logger);
      metricReport.globalMetricReport.currentMetrics['availableIncomingBitrate'] = 1000;

      policy.updateIndex(index);
      policy.updateMetrics(metricReport);
      const subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([2, 4, 6]);
    });
  });

  describe('updateIndex', () => {
    it('always returns the chosen receive set even when the index is being updated', () => {
      const attendee1 = new Attendee();
      attendee1.attendeeId = 'xy1';

      const videoSource1 = new VideoSource();
      videoSource1.attendee = attendee1;

      const videoSources = [videoSource1];
      policy.updateIndex(index);
      policy.chooseRemoteVideoSources(videoSources);
      let subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([6]);

      index = new DefaultVideoStreamIndex(logger);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );

      policy.updateIndex(index);
      subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([6]);
    });

    it('calculates the optimal receive set from the index if the video sources are not chosen', () => {
      policy.updateIndex(index);
      let subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([2, 4, 6]);

      index = new DefaultVideoStreamIndex(logger);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );

      policy.updateIndex(index);
      subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([4, 6]);
    });
  });

  describe('chooseRemoteVideoSources', () => {
    it('sets the highest available streams for the chosen attendees', () => {
      const attendee1 = new Attendee();
      const attendee2 = new Attendee();

      attendee1.attendeeId = 'xy1';
      attendee2.attendeeId = 'xy2';

      const videoSource1 = new VideoSource();
      const videoSource2 = new VideoSource();

      videoSource1.attendee = attendee1;
      videoSource2.attendee = attendee2;

      const videoSources = [videoSource1, videoSource2];
      policy.updateIndex(index);

      policy.chooseRemoteVideoSources(videoSources);

      const subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([4, 6]);
    });

    it('returns empty subscriptions if video index is not set', () => {
      const attendee1 = new Attendee();
      attendee1.attendeeId = 'xy1';

      const videoSource1 = new VideoSource();
      videoSource1.attendee = attendee1;

      const videoSources = [videoSource1];

      const index = new DefaultVideoStreamIndex(logger);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [],
        })
      );

      policy.updateIndex(index);
      policy.chooseRemoteVideoSources(videoSources);
      const subscriptions = policy.chooseSubscriptions();

      expect(subscriptions.array()).to.deep.equal([]);
    });

    it('returns empty subscriptions if the chosen attendee is not part of the index', () => {
      const attendee1 = new Attendee();
      attendee1.attendeeId = 'unknown';

      const videoSource1 = new VideoSource();
      videoSource1.attendee = attendee1;

      const videoSources = [videoSource1];
      policy.updateIndex(index);
      policy.chooseRemoteVideoSources(videoSources);
      const subscriptions = policy.chooseSubscriptions();

      expect(subscriptions.array()).to.deep.equal([]);
    });

    it('drops streams above 15000 kbps', () => {
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 5,
              groupId: 2,
              maxBitrateKbps: 50,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 1,
              maxBitrateKbps: 20000,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );

      const attendee1 = new Attendee();
      const attendee2 = new Attendee();
      const attendee3 = new Attendee();

      attendee1.attendeeId = 'xy1';
      attendee2.attendeeId = 'xy2';
      attendee3.attendeeId = 'xy3';

      const videoSource1 = new VideoSource();
      const videoSource2 = new VideoSource();
      const videoSource3 = new VideoSource();

      videoSource1.attendee = attendee1;
      videoSource2.attendee = attendee2;
      videoSource3.attendee = attendee3;

      const videoSources = [videoSource1, videoSource2, videoSource3];
      policy.updateIndex(index);

      policy.chooseRemoteVideoSources(videoSources);

      const subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([4, 6]);
    });
  });
});
