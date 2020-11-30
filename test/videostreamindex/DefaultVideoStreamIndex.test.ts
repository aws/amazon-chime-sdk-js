// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import LogLevel from '../../src/logger/LogLevel';
import NoOpLogger from '../../src/logger/NoOpLogger';
import {
  SdkBitrate,
  SdkBitrateFrame,
  SdkIndexFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
  SdkSubscribeAckFrame,
  SdkTrackMapping,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import VideoSource from '../../src/videosource/VideoSource';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';

describe('DefaultVideoStreamIndex', () => {
  let expect: Chai.ExpectStatic;
  let assert: Chai.AssertStatic;
  let index: DefaultVideoStreamIndex;
  const logger = new NoOpLogger(LogLevel.DEBUG);

  beforeEach(() => {
    expect = chai.expect;
    assert = chai.assert;
    index = new DefaultVideoStreamIndex(logger);
  });

  describe('construction', () => {
    it('can be constructed', () => {
      assert.exists(index);
    });
  });

  describe('allStreams', () => {
    it('returns correct VideoStreamIdSet', () => {
      expect(index.allStreams().array()).to.deep.equal([]);
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

  describe('highestQualityStreamFromEachGroupExcludingSelf', () => {
    it('selects highest quality streams', () => {
      expect(
        index.highestQualityStreamFromEachGroupExcludingSelf('attendee-e618d153').array()
      ).to.deep.equal([]);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: 'xyz',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );
      expect(
        index.highestQualityStreamFromEachGroupExcludingSelf('attendee-e618d153').array()
      ).to.deep.equal([1]);
    });

    it('returns highest quality streams in each group', () => {
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
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
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy1',
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
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
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
      expect(
        index.highestQualityStreamFromEachGroupExcludingSelf('attendee-e618d153').array()
      ).to.deep.equal([2, 4, 6]);
    });

    it('ignores stream of self', () => {
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: 'attendee-e618d153',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );
      expect(
        index.highestQualityStreamFromEachGroupExcludingSelf('attendee-e618d153').array()
      ).to.deep.equal([]);
    });

    it('ignores non-video stream', () => {
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: 'xyz',
              mediaType: SdkStreamMediaType.AUDIO,
            }),
          ],
        })
      );
      expect(
        index.highestQualityStreamFromEachGroupExcludingSelf('attendee-e618d153').array()
      ).to.deep.equal([]);
    });

    it('returns a sorted array', () => {
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
      expect(
        index.highestQualityStreamFromEachGroupExcludingSelf('attendee-e618d153').array()
      ).to.deep.equal([2, 4, 6]);
    });
  });

  describe('allVideoSendingSourcesExcludingSelf', () => {
    const compare = (a: VideoSource, b: VideoSource): number =>
      a.attendee.attendeeId.localeCompare(b.attendee.attendeeId);

    it('returns set of all video sources', () => {
      expect(index.allVideoSendingSourcesExcludingSelf('xy1')).to.deep.equal([]);
      index.integrateIndexFrame(new SdkIndexFrame());
      expect(index.allVideoSendingSourcesExcludingSelf('xy1')).to.deep.equal([]);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: 'xy1',
              externalUserId: 'ext#xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 1,
              maxBitrateKbps: 600,
              attendeeId: 'xy1',
              externalUserId: 'ext#xy1',
              mediaType: SdkStreamMediaType.AUDIO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy1',
              externalUserId: 'ext#xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 5,
              groupId: 2,
              maxBitrateKbps: 50,
              attendeeId: 'xy2',
              externalUserId: 'ext#xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              externalUserId: 'ext#xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: 'xy2',
              externalUserId: 'ext#xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );
      expect(index.allVideoSendingSourcesExcludingSelf('xy1').sort()).to.deep.equal(
        [{ attendee: { attendeeId: 'xy2', externalUserId: 'ext#xy2' } }].sort(compare)
      );
      expect(Array.from(index.allVideoSendingSourcesExcludingSelf('xy3')).sort()).to.deep.equal(
        [
          { attendee: { attendeeId: 'xy1', externalUserId: 'ext#xy1' } },
          { attendee: { attendeeId: 'xy2', externalUserId: 'ext#xy2' } },
        ].sort(compare)
      );
    });
  });

  describe('streamSelectionUnderBandwidthConstraint', () => {
    const WiFIDownlinkBandwidthKbps = 40000;
    const DSLDownlinkBandwidthKbps = 2000;
    const EdgeDownlinkBandwidthKbps = 240;

    beforeEach(() => {
      expect = chai.expect;
      index = new DefaultVideoStreamIndex(logger);
    });

    it('returns correct stream selection with 40 Mbps downlink bandwidth ', () => {
      const index: DefaultVideoStreamIndex = new DefaultVideoStreamIndex(logger);
      expect(
        index
          .streamSelectionUnderBandwidthConstraint(
            'attendee-e618d153',
            new Set<string>(),
            new Set<string>(),
            WiFIDownlinkBandwidthKbps
          )
          .array()
      ).to.deep.equal([]);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 7,
              groupId: 2,
              maxBitrateKbps: 600,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.AUDIO,
            }),
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
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy3',
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
              streamId: 2,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );

      const lowResTiles = ['xy1'];
      expect(
        index
          .streamSelectionUnderBandwidthConstraint(
            'attendee-e618d153',
            new Set<string>(),
            new Set<string>(lowResTiles),
            WiFIDownlinkBandwidthKbps
          )
          .array()
      ).to.deep.equal([2, 4, 6]);
      expect(
        index
          .streamSelectionUnderBandwidthConstraint(
            'xy2',
            new Set<string>(),
            new Set<string>(lowResTiles),
            WiFIDownlinkBandwidthKbps
          )
          .array()
      ).to.deep.equal([2, 4]);

      const highResTiles = ['xy5'];
      expect(
        index
          .streamSelectionUnderBandwidthConstraint(
            'attendee-e618d153',
            new Set<string>(highResTiles),
            new Set<string>(),
            WiFIDownlinkBandwidthKbps
          )
          .array()
      ).to.deep.equal([1, 4, 6]);
    });

    it('returns correct stream selection for 2000 Kbps downlink bandwidth ', () => {
      const index: DefaultVideoStreamIndex = new DefaultVideoStreamIndex(logger);
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

      const lowResTiles = ['xy1', 'xy2'];
      const highResTiles = ['xy3'];
      expect(
        index
          .streamSelectionUnderBandwidthConstraint(
            'attendee-e618d153',
            new Set<string>(highResTiles),
            new Set<string>(lowResTiles),
            DSLDownlinkBandwidthKbps
          )
          .array()
      ).to.deep.equal([1, 4, 5]);
    });

    it('returns correct stream selection with 240 Kbps downlink bandwidth', () => {
      const index: DefaultVideoStreamIndex = new DefaultVideoStreamIndex(logger);
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
              maxBitrateKbps: 100,
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
              maxBitrateKbps: 50,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );

      const lowResTiles = ['xy1'];
      const highResTiles = ['xy3', 'xy2'];
      expect(
        index
          .streamSelectionUnderBandwidthConstraint(
            'attendee-e618d153',
            new Set<string>(highResTiles),
            new Set<string>(lowResTiles),
            EdgeDownlinkBandwidthKbps
          )
          .array()
      ).to.deep.equal([1, 3, 5]);
      expect(
        index
          .streamSelectionUnderBandwidthConstraint(
            'attendee-e618d153',
            new Set<string>(highResTiles),
            new Set<string>(lowResTiles),
            180
          )
          .array()
      ).to.deep.equal([1, 3, 5]);
    });
  });

  describe('numberOfVideoPublishingParticipantsExcludingSelf', () => {
    const indexFrame = new SdkIndexFrame({
      sources: [
        new SdkStreamDescriptor({
          streamId: 1,
          groupId: 2,
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
    it('returns the correct count when the index contains the self attendee', () => {
      index.integrateIndexFrame(indexFrame);
      expect(index.numberOfVideoPublishingParticipantsExcludingSelf('4d82')).to.equal(2);
    });
    it('returns the correct count when the index does not contain the self attendee', () => {
      index.integrateIndexFrame(indexFrame);
      expect(index.numberOfVideoPublishingParticipantsExcludingSelf('attendee-A')).to.equal(3);
    });
  });

  describe('attendeeIdForTrack', () => {
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
    const subackFrame = new SdkSubscribeAckFrame({
      tracks: [
        new SdkTrackMapping({ streamId: 2, trackLabel: 'b18b9db2' }),
        new SdkTrackMapping({ streamId: 4, trackLabel: '4107' }),
        new SdkTrackMapping({ streamId: 9, trackLabel: '9318' }),
      ],
    });

    it('resolves a track id to an attendee id', () => {
      expect(index.attendeeIdForTrack('4107')).to.equal('');
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.attendeeIdForTrack('4107')).to.equal('a0ff');
    });

    it('returns empty string if index frame never integrated', () => {
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.attendeeIdForTrack('4107')).to.equal('');
    });

    it('returns empty string if subscribe ack frame never integrated', () => {
      index.integrateIndexFrame(indexFrame);
      expect(index.attendeeIdForTrack('4107')).to.equal('');
    });

    it('returns empty string on unmapped track id', () => {
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.attendeeIdForTrack('85e9')).to.equal('');
    });

    it('returns empty string on unmapped stream id', () => {
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.attendeeIdForTrack('9318')).to.equal('');
    });

    it('resolves a track id to an attendee id after updating index frame', () => {
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: '50ed1255afb4',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 5,
              groupId: 2,
              maxBitrateKbps: 50,
              attendeeId: 'f1c1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 9,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'cd3f2893',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: '688c',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.attendeeIdForTrack('9318')).to.equal('cd3f2893');
    });

    it('resolves track id to attendee id after index during subscribe', () => {
      index.integrateIndexFrame(
        new SdkIndexFrame({
          atCapacity: false,
          sources: [new SdkStreamDescriptor({ streamId: 4, groupId: 1, attendeeId: 'client1' })],
        })
      );
      index.subscribeFrameSent();
      index.integrateIndexFrame(
        new SdkIndexFrame({
          atCapacity: false,
          sources: [
            new SdkStreamDescriptor({ streamId: 2, groupId: 1, attendeeId: 'client1' }),
            new SdkStreamDescriptor({ streamId: 3, groupId: 1, attendeeId: 'client1' }),
          ],
        })
      );
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [new SdkTrackMapping({ streamId: 4, trackLabel: 'track_v2' })],
        })
      );
      expect(index.attendeeIdForTrack('track_v2')).to.equal('client1');
    });

    it('resolves track id to external user id after client reconnnect', () => {
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

    it('still finds externalAttendeeId after empty index before subscribe', () => {
      index.integrateIndexFrame(new SdkIndexFrame({ atCapacity: false, sources: [] }));
      index.integrateIndexFrame(
        new SdkIndexFrame({
          atCapacity: false,
          sources: [
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 2,
              attendeeId: 'client1',
              externalUserId: 'client1-ext',
            }),
          ],
        })
      );
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [new SdkTrackMapping({ streamId: 2, trackLabel: 'track_v2' })],
        })
      );

      expect(index.externalUserIdForTrack('track_v2')).to.equal('client1-ext');

      index.integrateIndexFrame(new SdkIndexFrame({ atCapacity: false, sources: [] }));
      index.integrateIndexFrame(
        new SdkIndexFrame({
          atCapacity: false,
          sources: [
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 2,
              attendeeId: 'client1',
              externalUserId: 'client1-ext',
            }),
          ],
        })
      );
      expect(index.attendeeIdForTrack('track_v2')).to.equal('client1');

      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [new SdkTrackMapping({ streamId: 3, trackLabel: 'track_v2' })],
        })
      );
      expect(index.attendeeIdForTrack('track_v2')).to.equal('client1');
    });

    it('ignores track mapping with empty track label or zero-valued stream id', () => {
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [
            new SdkTrackMapping({ streamId: 2, trackLabel: '' }),
            new SdkTrackMapping({ streamId: 0, trackLabel: '85e9' }),
            new SdkTrackMapping({ streamId: 9, trackLabel: '9318' }),
          ],
        })
      );
      expect(index.attendeeIdForTrack('85e9')).to.equal('');
    });
  });

  describe('externalUserIdForTrack', () => {
    const indexFrame = new SdkIndexFrame({
      sources: [
        new SdkStreamDescriptor({
          streamId: 1,
          groupId: 1,
          maxBitrateKbps: 100,
          attendeeId: '688c',
          externalUserId: '688c-ext',
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
          externalUserId: 'a0ff-ext',
          mediaType: SdkStreamMediaType.VIDEO,
        }),
      ],
    });
    const subackFrame = new SdkSubscribeAckFrame({
      tracks: [
        new SdkTrackMapping({ streamId: 2, trackLabel: 'b18b9db2' }),
        new SdkTrackMapping({ streamId: 4, trackLabel: '4107' }),
        new SdkTrackMapping({ streamId: 9, trackLabel: '9318' }),
      ],
    });

    it('resolves a track id to an attendee id', () => {
      expect(index.externalUserIdForTrack('4107')).to.equal('');
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.externalUserIdForTrack('4107')).to.equal('a0ff-ext');
    });

    it('returns empty string if externalUserId not in message', () => {
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.externalUserIdForTrack('b18b9db2')).to.equal('');
    });

    it('returns empty string if index frame never integrated', () => {
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.externalUserIdForTrack('4107')).to.equal('');
    });

    it('returns empty string if subscribe ack frame never integrated', () => {
      index.integrateIndexFrame(indexFrame);
      expect(index.externalUserIdForTrack('4107')).to.equal('');
    });

    it('returns empty string on unmapped track id', () => {
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.externalUserIdForTrack('85e9')).to.equal('');
    });

    it('returns empty string on unmapped stream id', () => {
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.externalUserIdForTrack('9318')).to.equal('');
    });

    it('resolves a track id to an externalUserId after updating index frame', () => {
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: '50ed1255afb4',
              externalUserId: '50ed1255afb4-ext',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 5,
              groupId: 2,
              maxBitrateKbps: 50,
              attendeeId: 'f1c1',
              externalUserId: 'f1c1-ext',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 9,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'cd3f2893',
              externalUserId: 'cd3f2893-ext',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: '688c',
              externalUserId: '688c-ext',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.externalUserIdForTrack('9318')).to.equal('cd3f2893-ext');
    });

    it('resolves a track id to an externalUserId after updating subscribe ack frame', () => {
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [
            new SdkTrackMapping({ streamId: 2, trackLabel: 'b18b9db2' }),
            new SdkTrackMapping({ streamId: 4, trackLabel: '85e9' }),
            new SdkTrackMapping({ streamId: 1, trackLabel: '9318' }),
          ],
        })
      );
      expect(index.externalUserIdForTrack('85e9')).to.equal('a0ff-ext');
      expect(index.externalUserIdForTrack('9318')).to.equal('688c-ext');
    });

    it('ignores track mapping with empty track label or zero-valued stream id', () => {
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [
            new SdkTrackMapping({ streamId: 2, trackLabel: '' }),
            new SdkTrackMapping({ streamId: 0, trackLabel: '85e9' }),
            new SdkTrackMapping({ streamId: 9, trackLabel: '9318' }),
          ],
        })
      );
      expect(index.externalUserIdForTrack('85e9')).to.equal('');
    });
  });

  describe('attendeeIdForStreamId', () => {
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
    const subackFrame = new SdkSubscribeAckFrame({
      tracks: [
        new SdkTrackMapping({ streamId: 2, trackLabel: 'b18b9db2' }),
        new SdkTrackMapping({ streamId: 4, trackLabel: '4107' }),
        new SdkTrackMapping({ streamId: 9, trackLabel: '4d82' }),
      ],
    });

    it('resolves a stream id to an attendee id', () => {
      expect(index.attendeeIdForStreamId(1)).to.equal('');
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.attendeeIdForStreamId(1)).to.equal('688c');
      expect(index.attendeeIdForStreamId(2)).to.equal('4d82');
    });

    it('returns empty string if stream id could not be resolved', () => {
      expect(index.attendeeIdForStreamId(1)).to.equal('');
      index.integrateIndexFrame(indexFrame);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(subackFrame);
      expect(index.attendeeIdForStreamId(3)).to.equal('');
    });
  });

  describe('streamIdForSSRC', () => {
    it('returns correct stream id', () => {
      expect(index.streamIdForSSRC(12345)).to.be.undefined;
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [
            new SdkTrackMapping({ streamId: 2, trackLabel: 'b18b9db2', ssrc: 0xdeadbeef }),
            new SdkTrackMapping({ streamId: 4, trackLabel: '85e9', ssrc: 0xdeadc0de }),
            new SdkTrackMapping({ streamId: 9, trackLabel: '9318', ssrc: 0xdead10cc }),
          ],
        })
      );
      expect(index.streamIdForSSRC(0xdeadbeef)).to.equal(2);
      expect(index.streamIdForSSRC(0xdead10cc)).to.equal(9);
    });

    it('ignores track mapping with empty track label or zero-valued stream id', () => {
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [
            new SdkTrackMapping({ streamId: 2, trackLabel: '', ssrc: 0xdeadbeef }),
            new SdkTrackMapping({ streamId: 0, trackLabel: '85e9', ssrc: 0xdeadc0de }),
            new SdkTrackMapping({ streamId: 9, trackLabel: '9318', ssrc: 0xdead10cc }),
          ],
        })
      );
      expect(index.streamIdForSSRC(0xdeadbeef)).to.undefined;
      expect(index.streamIdForSSRC(0xdeadc0de)).to.undefined;
    });
  });

  describe('streamsPausedAtSource', () => {
    const indexFrame = new SdkIndexFrame({
      sources: [
        new SdkStreamDescriptor({
          streamId: 1,
          groupId: 2,
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
      pausedAtSourceIds: [2, 4],
    });

    it('returns the set of the ids of the paused stream', () => {
      expect(index.streamsPausedAtSource().array()).to.be.deep.equal([]);
      index.integrateIndexFrame(indexFrame);
      expect(index.streamsPausedAtSource().array()).to.be.deep.equal([2, 4]);
    });
  });

  describe('localStreamDescription', () => {
    it('returns constant stream description', () => {
      const localDescriptions = index.localStreamDescriptions();
      expect(localDescriptions.length).to.equal(1);
      const description = localDescriptions[0];
      expect(description.trackLabel).to.equal('AmazonChimeExpressVideo');
      expect(description.streamId).to.equal(2);
      expect(description.groupId).to.equal(2);
    });
  });

  describe('remoteStreamDescriptions', () => {
    it('returns current remote stream info', () => {
      const remoteDescriptions = index.remoteStreamDescriptions();
      expect(remoteDescriptions.length).to.equal(0);
      const indexFrame = new SdkIndexFrame({
        sources: [
          new SdkStreamDescriptor({
            streamId: 1,
            groupId: 1,
            maxBitrateKbps: 1400,
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
      index.integrateIndexFrame(indexFrame);
      const remoteDescriptions2 = index.remoteStreamDescriptions();
      expect(remoteDescriptions2.length).to.equal(3);
    });
  });

  describe('integrateUplinkPolicyDecision', () => {
    it('updates the local stream description', () => {
      const encoding = [];
      encoding.push({
        active: true,
        maxBitrate: 1200 * 1000,
        maxFramerate: 15,
      });
      index.integrateUplinkPolicyDecision(null);
      index.integrateUplinkPolicyDecision(encoding);
      expect(index.localStreamDescriptions()[0].maxBitrateKbps).to.equal(1200);
    });
  });

  describe('integrateBitratesFrame', () => {
    it('updates the average bitrate in IndexFrame', () => {
      const bitrateFrame = SdkBitrateFrame.create();
      const bitrate = SdkBitrate.create();
      bitrate.sourceStreamId = 1;
      bitrate.avgBitrateBps = 1280 * 1000;
      bitrateFrame.bitrates.push(bitrate);
      const bitrate2 = SdkBitrate.create();
      bitrate2.sourceStreamId = 2;
      bitrate2.avgBitrateBps = 150 * 1000;
      bitrateFrame.bitrates.push(bitrate2);
      // a random extra stream id
      const bitrate3 = SdkBitrate.create();
      bitrate3.sourceStreamId = 5;
      bitrate3.avgBitrateBps = 150 * 1000;
      bitrateFrame.bitrates.push(bitrate3);

      const indexFrame = new SdkIndexFrame({
        sources: [
          new SdkStreamDescriptor({
            streamId: 1,
            groupId: 1,
            maxBitrateKbps: 1400,
            avgBitrateBps: 1111 * 1000,
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

      index.integrateBitratesFrame(bitrateFrame);
      expect(index.remoteStreamDescriptions().length).to.equal(0);
      index.integrateIndexFrame(indexFrame);
      let remoteDescriptions = index.remoteStreamDescriptions();
      expect(remoteDescriptions.length).to.equal(3);
      expect(remoteDescriptions[0].avgBitrateKbps).to.equal(1111);
      expect(remoteDescriptions[1].avgBitrateKbps).to.equal(0);
      expect(remoteDescriptions[2].avgBitrateKbps).to.equal(0);
      index.integrateBitratesFrame(bitrateFrame);
      remoteDescriptions = index.remoteStreamDescriptions();
      expect(remoteDescriptions[0].avgBitrateKbps).to.equal(1280);
      expect(remoteDescriptions[1].avgBitrateKbps).to.equal(150);
      expect(remoteDescriptions[2].avgBitrateKbps).to.equal(0);
    });
  });

  describe('groupIdForStreamId', () => {
    it('returns correct groupId if exists', () => {
      const indexFrame = new SdkIndexFrame({
        sources: [
          new SdkStreamDescriptor({
            streamId: 1,
            groupId: 1,
            maxBitrateKbps: 1400,
            avgBitrateBps: 1111 * 1000,
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
            groupId: 5,
            maxBitrateKbps: 800,
            attendeeId: 'a0ff',
            mediaType: SdkStreamMediaType.VIDEO,
          }),
        ],
      });
      index.integrateIndexFrame(indexFrame);
      expect(index.groupIdForStreamId(1)).to.equal(1);
      expect(index.groupIdForStreamId(6)).to.equal(undefined);
    });
  });

  describe('streamIdInSameGroup', () => {
    it('Basic functionality', () => {
      const indexFrame = new SdkIndexFrame({
        sources: [
          new SdkStreamDescriptor({
            streamId: 1,
            groupId: 1,
            maxBitrateKbps: 1400,
            avgBitrateBps: 1111 * 1000,
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
            groupId: 5,
            maxBitrateKbps: 800,
            attendeeId: 'a0ff',
            mediaType: SdkStreamMediaType.VIDEO,
          }),
        ],
      });
      index.integrateIndexFrame(indexFrame);
      expect(index.StreamIdsInSameGroup(1, 2)).to.equal(true);
      expect(index.StreamIdsInSameGroup(1, 4)).to.equal(false);
    });

    it('Recognizes groupId across subscribes', () => {
      let indexFrame = new SdkIndexFrame({
        sources: [
          new SdkStreamDescriptor({
            streamId: 3,
            groupId: 2,
            mediaType: SdkStreamMediaType.VIDEO,
          }),
          new SdkStreamDescriptor({
            streamId: 4,
            groupId: 2,
            mediaType: SdkStreamMediaType.VIDEO,
          }),
        ],
      });
      index.integrateIndexFrame(indexFrame);
      expect(index.StreamIdsInSameGroup(3, 4)).to.equal(true);
      index.subscribeFrameSent();
      index.integrateSubscribeAckFrame(
        new SdkSubscribeAckFrame({
          tracks: [new SdkTrackMapping({ streamId: 4, trackLabel: 'track_v2' })],
        })
      );

      indexFrame = new SdkIndexFrame({
        sources: [
          new SdkStreamDescriptor({
            streamId: 3,
            groupId: 2,
            mediaType: SdkStreamMediaType.VIDEO,
          }),
          new SdkStreamDescriptor({
            streamId: 5,
            groupId: 2,
            mediaType: SdkStreamMediaType.VIDEO,
          }),
        ],
      });
      index.integrateIndexFrame(indexFrame);
      expect(index.StreamIdsInSameGroup(3, 4)).to.equal(true);
    });
  });
});
