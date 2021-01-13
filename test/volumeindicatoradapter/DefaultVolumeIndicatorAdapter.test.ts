// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpLogger from '../../src/logger/NoOpLogger';
import DefaultRealtimeController from '../../src/realtimecontroller/DefaultRealtimeController';
import RealtimeController from '../../src/realtimecontroller/RealtimeController';
import {
  SdkAudioAttendeeState,
  SdkAudioMetadataFrame,
  SdkAudioStreamIdInfo,
  SdkAudioStreamIdInfoFrame,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import DefaultVolumeIndicatorAdapter from '../../src/volumeindicatoradapter/DefaultVolumeIndicatorAdapter';
import VolumeIndicatorAdapter from '../../src/volumeindicatoradapter/VolumeIndicatorAdapter';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultVolumeIndicatorAdapter', () => {
  let expect: Chai.ExpectStatic;
  let domMockBuilder: DOMMockBuilder;
  const fooAttendee = 'foo-attendee';
  const fooExternal = 'foo-external';
  const barAttendee = 'bar-attendee';
  const barExternal = 'bar-external';
  const minVolumeDecibels = -42;
  const maxVolumeDecibels = -14;

  before(() => {
    domMockBuilder = new DOMMockBuilder();
    expect = chai.expect;
  });

  after(() => {
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const rt: RealtimeController = new DefaultRealtimeController();
      const vi: VolumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        rt,
        minVolumeDecibels,
        maxVolumeDecibels
      );
      expect(vi).to.not.equal(null);
    });
  });

  describe('stream id info frame', () => {
    it('sends mute updates only when mute state changes', () => {
      const streamInfo = SdkAudioStreamIdInfo.create();
      const streamInfoFrame = SdkAudioStreamIdInfoFrame.create();
      streamInfo.audioStreamId = 1;
      streamInfo.attendeeId = fooAttendee;
      streamInfo.externalUserId = fooExternal;
      streamInfoFrame.streams = [streamInfo];
      const rt: RealtimeController = new DefaultRealtimeController();
      let volumeUpdate = 0;
      rt.realtimeSubscribeToVolumeIndicator(
        streamInfo.attendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null,
          externalUserId: string | null
        ) => {
          if (volumeUpdate === 0) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(volume).to.be.null;
            expect(muted).to.be.false;
            expect(signalStrength).to.be.null;
            expect(externalUserId).to.equal(fooExternal);
          } else if (volumeUpdate === 1) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(volume).to.equal(0);
            expect(muted).to.be.true;
            expect(signalStrength).to.be.null;
            expect(externalUserId).to.equal(fooExternal);
          }
          volumeUpdate += 1;
        }
      );
      let attendeeIdUpdate = 0;
      rt.realtimeSubscribeToAttendeeIdPresence(
        (attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => {
          if (attendeeIdUpdate === 0) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(present).to.be.true;
            expect(externalUserId).to.equal(fooExternal);
            expect(dropped).to.be.false;
          } else if (attendeeIdUpdate === 1) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(present).to.be.false;
            expect(externalUserId).to.equal(fooExternal);
          }
          attendeeIdUpdate += 1;
        }
      );
      const vi: VolumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        rt,
        minVolumeDecibels,
        maxVolumeDecibels
      );
      expect(volumeUpdate).to.equal(0);
      expect(attendeeIdUpdate).to.equal(0);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoFrame);
      expect(volumeUpdate).to.equal(0);
      expect(attendeeIdUpdate).to.equal(1);
      delete streamInfoFrame.streams[0].attendeeId;
      streamInfoFrame.streams[0].muted = false;
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoFrame);
      expect(volumeUpdate).to.equal(1);
      streamInfoFrame.streams[0].muted = true;
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoFrame);
      expect(volumeUpdate).to.equal(2);
      delete streamInfoFrame.streams[0].muted;
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoFrame);
      expect(volumeUpdate).to.equal(2);
      expect(attendeeIdUpdate).to.equal(2);
    });

    it('presence leave event not fired when attendee already has a newer stream id', () => {
      const streamInfo1Join = SdkAudioStreamIdInfo.create();
      const streamInfo1Frame = SdkAudioStreamIdInfoFrame.create();
      const streamInfo2Join = SdkAudioStreamIdInfo.create();
      const streamInfo2Leave = SdkAudioStreamIdInfo.create();
      const streamInfo2Frame = SdkAudioStreamIdInfoFrame.create();
      streamInfo1Join.audioStreamId = 1;
      streamInfo1Join.attendeeId = fooAttendee;
      streamInfo1Join.externalUserId = fooExternal;
      streamInfo1Frame.streams = [streamInfo1Join];
      streamInfo2Join.audioStreamId = 2;
      streamInfo2Join.attendeeId = fooAttendee;
      streamInfo2Join.externalUserId = fooExternal;
      streamInfo2Leave.audioStreamId = 1;
      streamInfo2Frame.streams = [streamInfo2Join, streamInfo2Leave];
      const rt: RealtimeController = new DefaultRealtimeController();
      let attendeeIdUpdate = 0;
      rt.realtimeSubscribeToAttendeeIdPresence(
        (attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => {
          let expected = false;
          if (attendeeIdUpdate === 0) {
            expected =
              attendeeId === fooAttendee &&
              present === true &&
              externalUserId === fooExternal &&
              dropped === false;
          } else if (attendeeIdUpdate === 1) {
            expected =
              attendeeId === fooAttendee &&
              present === true &&
              externalUserId === fooExternal &&
              dropped === false;
          }
          attendeeIdUpdate += 1;
          expect(expected).to.be.true;
        }
      );
      const vi: VolumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        rt,
        minVolumeDecibels,
        maxVolumeDecibels
      );
      expect(attendeeIdUpdate).to.equal(0);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfo1Frame);
      expect(attendeeIdUpdate).to.equal(1);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfo2Frame);
      expect(attendeeIdUpdate).to.equal(2);
    });

    it('presence leave event not fired when same attendee audio stream id is seen two or more times', () => {
      const streamInfo1Join = SdkAudioStreamIdInfo.create();
      const streamInfo1Frame = SdkAudioStreamIdInfoFrame.create();
      const streamInfo2Join = SdkAudioStreamIdInfo.create();
      const streamInfo2Leave = SdkAudioStreamIdInfo.create();
      const streamInfo2Frame = SdkAudioStreamIdInfoFrame.create();
      streamInfo1Join.audioStreamId = 1;
      streamInfo1Join.attendeeId = fooAttendee;
      streamInfo1Join.externalUserId = fooExternal;
      streamInfo1Frame.streams = [streamInfo1Join];
      streamInfo2Join.audioStreamId = 2;
      streamInfo2Join.attendeeId = fooAttendee;
      streamInfo2Join.externalUserId = fooExternal;
      streamInfo2Leave.audioStreamId = 1;
      streamInfo2Frame.streams = [streamInfo2Join, streamInfo2Leave, streamInfo2Leave];
      const rt: RealtimeController = new DefaultRealtimeController();
      let attendeeIdUpdate = 0;
      rt.realtimeSubscribeToAttendeeIdPresence(
        (attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => {
          let expected = false;
          if (attendeeIdUpdate === 0) {
            expected =
              attendeeId === fooAttendee &&
              present === true &&
              externalUserId === fooExternal &&
              dropped === false;
          } else if (attendeeIdUpdate === 1) {
            expected =
              attendeeId === fooAttendee &&
              present === true &&
              externalUserId === fooExternal &&
              dropped === false;
          }
          attendeeIdUpdate += 1;
          expect(expected).to.be.true;
        }
      );
      const vi: VolumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        rt,
        minVolumeDecibels,
        maxVolumeDecibels
      );
      expect(attendeeIdUpdate).to.equal(0);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfo1Frame);
      expect(attendeeIdUpdate).to.equal(1);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfo2Frame);
      expect(attendeeIdUpdate).to.equal(2);
    });

    it('presence leave event is fired when different attendee has a newer stream id', () => {
      const streamInfo1Join = SdkAudioStreamIdInfo.create();
      const streamInfo1Frame = SdkAudioStreamIdInfoFrame.create();
      const streamInfo2Join = SdkAudioStreamIdInfo.create();
      const streamInfo2Leave = SdkAudioStreamIdInfo.create();
      const streamInfo2Frame = SdkAudioStreamIdInfoFrame.create();
      streamInfo1Join.audioStreamId = 1;
      streamInfo1Join.attendeeId = fooAttendee;
      streamInfo1Join.externalUserId = fooExternal;
      streamInfo1Frame.streams = [streamInfo1Join];
      streamInfo2Join.audioStreamId = 2;
      streamInfo2Join.attendeeId = barAttendee;
      streamInfo2Join.externalUserId = barExternal;
      streamInfo2Leave.audioStreamId = 1;
      streamInfo2Frame.streams = [streamInfo2Join, streamInfo2Leave];
      const rt: RealtimeController = new DefaultRealtimeController();
      let attendeeIdUpdate = 0;
      rt.realtimeSubscribeToAttendeeIdPresence(
        (attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => {
          let expected = false;
          if (attendeeIdUpdate === 0) {
            expected =
              attendeeId === fooAttendee &&
              present === true &&
              externalUserId === fooExternal &&
              dropped === false;
          } else if (attendeeIdUpdate === 1) {
            expected =
              attendeeId === barAttendee &&
              present === true &&
              externalUserId === barExternal &&
              dropped === false;
          } else if (attendeeIdUpdate === 2) {
            expected =
              attendeeId === fooAttendee &&
              present === false &&
              externalUserId === fooExternal &&
              dropped === false;
          }
          attendeeIdUpdate += 1;
          expect(expected).to.be.true;
        }
      );
      const vi: VolumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        rt,
        minVolumeDecibels,
        maxVolumeDecibels
      );
      expect(attendeeIdUpdate).to.equal(0);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfo1Frame);
      expect(attendeeIdUpdate).to.equal(1);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfo2Frame);
      expect(attendeeIdUpdate).to.equal(3);
    });

    it('presence leave event is fired for attendees not present on reconnects', () => {
      const streamInfoJoins = SdkAudioStreamIdInfoFrame.create();
      streamInfoJoins.streams = [];
      for (let i = 1; i <= 5; i++) {
        const streamInfo = SdkAudioStreamIdInfo.create();
        streamInfo.audioStreamId = i;
        streamInfo.attendeeId = `${fooAttendee}-${i}`;
        streamInfo.externalUserId = `${fooExternal}-${i}`;
        streamInfoJoins.streams.push(streamInfo);
      }

      let attendeeIdUpdate = 0;
      const presentAttendeeIds: Array<string> = [];
      const presentExternalUserIds: Array<string> = [];
      const realtimeController = new DefaultRealtimeController();
      realtimeController.realtimeSubscribeToAttendeeIdPresence(
        (attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => {
          if (attendeeIdUpdate === 0) {
            expect(present).to.be.true;
            expect(dropped).to.be.false;
            presentAttendeeIds.push(attendeeId);
            presentExternalUserIds.push(externalUserId);
          } else if (attendeeIdUpdate === 1) {
            expect(present).to.be.false;
            expect(dropped).to.be.false;
            expect(attendeeId).to.be.equal(`${fooAttendee}-${5}`);
            expect(externalUserId).to.be.equal(`${fooExternal}-${5}`);
            attendeeIdUpdate++;
          }
        }
      );
      const volumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        realtimeController,
        minVolumeDecibels,
        maxVolumeDecibels
      );

      expect(presentAttendeeIds).to.be.empty;
      expect(presentExternalUserIds).to.be.empty;
      volumeIndicatorAdapter.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoJoins);
      expect(presentAttendeeIds).to.have.members(
        streamInfoJoins.streams.map(stream => stream.attendeeId)
      );
      expect(presentExternalUserIds).to.have.members(
        streamInfoJoins.streams.map(stream => stream.externalUserId)
      );

      const streamInfoReconnect = SdkAudioStreamIdInfoFrame.create();
      streamInfoReconnect.streams = [];
      for (let i = 1; i <= 4; i++) {
        const streamInfo = SdkAudioStreamIdInfo.create();
        streamInfo.audioStreamId = i;
        streamInfo.attendeeId = `${fooAttendee}-${i}`;
        streamInfo.externalUserId = `${fooExternal}-${i}`;
        streamInfoReconnect.streams.push(streamInfo);
      }
      attendeeIdUpdate++;
      volumeIndicatorAdapter.onReconnect();

      volumeIndicatorAdapter.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoReconnect);
      expect(attendeeIdUpdate).to.be.equal(2);
    });

    it('presence leave event not be fired when attendee joined with different stream id on reconnects', () => {
      const streamInfoJoins = SdkAudioStreamIdInfoFrame.create();
      streamInfoJoins.streams = [];
      for (let i = 1; i <= 5; i++) {
        const streamInfo = SdkAudioStreamIdInfo.create();
        streamInfo.audioStreamId = i;
        streamInfo.attendeeId = `${fooAttendee}-${i}`;
        streamInfo.externalUserId = `${fooExternal}-${i}`;
        streamInfoJoins.streams.push(streamInfo);
      }

      let attendeeIdUpdate = 0;
      let presentAttendeeIds: Array<string> = [];
      let presentExternalUserIds: Array<string> = [];
      let droppedAttendeeId: Array<string> = [];
      const realtimeController = new DefaultRealtimeController();
      realtimeController.realtimeSubscribeToAttendeeIdPresence(
        (attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => {
          if (attendeeIdUpdate === 0) {
            expect(present).to.be.true;
            expect(dropped).to.be.false;
            presentAttendeeIds.push(attendeeId);
            presentExternalUserIds.push(externalUserId);
          } else if (attendeeIdUpdate === 1) {
            if (attendeeId === `${fooAttendee}-${5}`) {
              expect(present).to.be.false;
              expect(dropped).to.be.false;
              expect(attendeeId).to.be.equal(`${fooAttendee}-${5}`);
              expect(externalUserId).to.be.equal(`${fooExternal}-${5}`);
              droppedAttendeeId.push(attendeeId);
            } else {
              expect(present).to.be.true;
              expect(dropped).to.be.false;
              presentAttendeeIds.push(attendeeId);
              presentExternalUserIds.push(externalUserId);
            }
          }
        }
      );
      const volumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        realtimeController,
        minVolumeDecibels,
        maxVolumeDecibels
      );

      expect(presentAttendeeIds).to.be.empty;
      expect(presentExternalUserIds).to.be.empty;
      volumeIndicatorAdapter.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoJoins);
      expect(presentAttendeeIds).to.have.members(
        streamInfoJoins.streams.map(stream => stream.attendeeId)
      );
      expect(presentExternalUserIds).to.have.members(
        streamInfoJoins.streams.map(stream => stream.externalUserId)
      );
      attendeeIdUpdate++;

      presentAttendeeIds = [];
      presentExternalUserIds = [];
      droppedAttendeeId = [];
      const streamInfoReconnect = SdkAudioStreamIdInfoFrame.create();
      streamInfoReconnect.streams = [];
      for (let i = 1; i <= 4; i++) {
        const streamInfo = SdkAudioStreamIdInfo.create();
        streamInfo.audioStreamId = i + streamInfoJoins.streams.length;
        streamInfo.attendeeId = `${fooAttendee}-${i}`;
        streamInfo.externalUserId = `${fooExternal}-${i}`;
        streamInfoReconnect.streams.push(streamInfo);
      }

      volumeIndicatorAdapter.onReconnect();
      volumeIndicatorAdapter.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoReconnect);
      expect(presentAttendeeIds).to.have.members(
        streamInfoReconnect.streams.map(stream => stream.attendeeId)
      );
      expect(presentExternalUserIds).to.have.members(
        streamInfoReconnect.streams.map(stream => stream.externalUserId)
      );
      expect(droppedAttendeeId).to.have.members([`${fooAttendee}-${5}`]);
    });

    it('presence leave event not be fired for partial frames during non reconnects', () => {
      const streamInfoJoins = SdkAudioStreamIdInfoFrame.create();
      streamInfoJoins.streams = [];
      for (let i = 1; i <= 5; i++) {
        const streamInfo = SdkAudioStreamIdInfo.create();
        streamInfo.audioStreamId = i;
        streamInfo.attendeeId = `${fooAttendee}-${i}`;
        streamInfo.externalUserId = `${fooExternal}-${i}`;
        streamInfoJoins.streams.push(streamInfo);
      }

      let attendeeIdUpdate = 0;
      let presentAttendeeIds: Array<string> = [];
      let presentExternalUserIds: Array<string> = [];
      let droppedAttendeeId: Array<string> = [];
      const realtimeController = new DefaultRealtimeController();
      realtimeController.realtimeSubscribeToAttendeeIdPresence(
        (attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => {
          if (attendeeIdUpdate === 0) {
            expect(present).to.be.true;
            expect(dropped).to.be.false;
            presentAttendeeIds.push(attendeeId);
            presentExternalUserIds.push(externalUserId);
          } else if (attendeeIdUpdate === 1) {
            if (attendeeId === `${fooAttendee}-${5}`) {
              expect(present).to.be.false;
              expect(dropped).to.be.false;
              expect(attendeeId).to.be.equal(`${fooAttendee}-${5}`);
              expect(externalUserId).to.be.equal(`${fooExternal}-${5}`);
              droppedAttendeeId.push(attendeeId);
            } else {
              expect(present).to.be.true;
              expect(dropped).to.be.false;
              presentAttendeeIds.push(attendeeId);
              presentExternalUserIds.push(externalUserId);
            }
          } else if (attendeeIdUpdate === 2) {
            expect(present).to.be.true;
            expect(dropped).to.be.false;
            expect(attendeeId).to.be.equal(`${fooAttendee}-${11}`);
            expect(externalUserId).to.be.equal(`${fooExternal}-${11}`);
            presentAttendeeIds.push(attendeeId);
            presentExternalUserIds.push(externalUserId);
          }
        }
      );

      const volumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        realtimeController,
        minVolumeDecibels,
        maxVolumeDecibels
      );

      expect(presentAttendeeIds).to.be.empty;
      expect(presentExternalUserIds).to.be.empty;
      volumeIndicatorAdapter.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoJoins);
      expect(presentAttendeeIds).to.have.members(
        streamInfoJoins.streams.map(stream => stream.attendeeId)
      );
      expect(presentExternalUserIds).to.have.members(
        streamInfoJoins.streams.map(stream => stream.externalUserId)
      );
      attendeeIdUpdate++;

      presentAttendeeIds = [];
      presentExternalUserIds = [];
      droppedAttendeeId = [];
      const streamInfoReconnect = SdkAudioStreamIdInfoFrame.create();
      streamInfoReconnect.streams = [];
      for (let i = 1; i <= 4; i++) {
        const streamInfo = SdkAudioStreamIdInfo.create();
        streamInfo.audioStreamId = i + streamInfoJoins.streams.length;
        streamInfo.attendeeId = `${fooAttendee}-${i}`;
        streamInfo.externalUserId = `${fooExternal}-${i}`;
        streamInfoReconnect.streams.push(streamInfo);
      }

      volumeIndicatorAdapter.onReconnect();
      volumeIndicatorAdapter.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoReconnect);
      expect(presentAttendeeIds).to.have.members(
        streamInfoReconnect.streams.map(stream => stream.attendeeId)
      );
      expect(presentExternalUserIds).to.have.members(
        streamInfoReconnect.streams.map(stream => stream.externalUserId)
      );
      expect(droppedAttendeeId).to.have.members([`${fooAttendee}-${5}`]);
      attendeeIdUpdate++;

      presentAttendeeIds = [];
      presentExternalUserIds = [];
      const streamInfoFrameNotDuringReconnect = SdkAudioStreamIdInfoFrame.create();
      const streamInfo = SdkAudioStreamIdInfo.create();
      streamInfo.audioStreamId = 11;
      streamInfo.attendeeId = `${fooAttendee}-${11}`;
      streamInfo.externalUserId = `${fooExternal}-${11}`;
      streamInfoFrameNotDuringReconnect.streams = [streamInfo];
      volumeIndicatorAdapter.sendRealtimeUpdatesForAudioStreamIdInfo(
        streamInfoFrameNotDuringReconnect
      );
      expect(presentAttendeeIds[0]).to.be.equal(`${fooAttendee}-${11}`);
      expect(presentExternalUserIds[0]).to.be.equal(`${fooExternal}-${11}`);
    });
  });

  describe('metadata frame', () => {
    it('sends volume updates when volume changes', () => {
      const streamInfo = SdkAudioStreamIdInfo.create();
      const streamInfoFrame = SdkAudioStreamIdInfoFrame.create();
      streamInfo.audioStreamId = 1;
      streamInfo.attendeeId = fooAttendee;
      streamInfoFrame.streams = [streamInfo];
      const rt: RealtimeController = new DefaultRealtimeController();
      let volumeUpdate = 0;
      rt.realtimeSubscribeToVolumeIndicator(
        streamInfo.attendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          if (volumeUpdate === 0) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(volume).to.equal(0);
            expect(muted).to.be.false;
            expect(signalStrength).to.be.null;
          } else if (volumeUpdate === 1) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(volume).to.equal(0.5);
            expect(muted).to.be.null;
            expect(signalStrength).to.be.null;
          } else if (volumeUpdate === 2) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(volume).to.equal(1.0);
            expect(muted).to.be.null;
            expect(signalStrength).to.be.null;
          }
          volumeUpdate += 1;
        }
      );
      const vi: VolumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        rt,
        minVolumeDecibels,
        maxVolumeDecibels
      );
      expect(volumeUpdate).to.equal(0);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoFrame);
      expect(volumeUpdate).to.equal(0);
      const audioMetadataFrame = SdkAudioMetadataFrame.create();
      const audioState = SdkAudioAttendeeState.create();
      audioState.audioStreamId = streamInfo.audioStreamId;
      audioState.volume = -minVolumeDecibels;
      audioMetadataFrame.attendeeStates = [audioState];
      vi.sendRealtimeUpdatesForAudioMetadata(audioMetadataFrame);
      expect(volumeUpdate).to.equal(1);
      audioState.volume = -(minVolumeDecibels + maxVolumeDecibels) / 2;
      vi.sendRealtimeUpdatesForAudioMetadata(audioMetadataFrame);
      expect(volumeUpdate).to.equal(2);
      audioState.volume = 0;
      vi.sendRealtimeUpdatesForAudioMetadata(audioMetadataFrame);
      expect(volumeUpdate).to.equal(3);
    });

    it('sends signal strength updates when signal strength changes', () => {
      const streamInfo = SdkAudioStreamIdInfo.create();
      const streamInfoFrame = SdkAudioStreamIdInfoFrame.create();
      streamInfo.audioStreamId = 1;
      streamInfo.attendeeId = fooAttendee;
      streamInfoFrame.streams = [streamInfo];
      const rt: RealtimeController = new DefaultRealtimeController();
      let signalStrengthUpdate = 0;
      rt.realtimeSubscribeToVolumeIndicator(
        streamInfo.attendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          if (signalStrengthUpdate === 0) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(volume).to.be.null;
            expect(muted).to.be.null;
            expect(signalStrength).to.equal(0);
          } else if (signalStrengthUpdate === 1) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(volume).to.be.null;
            expect(muted).to.be.null;
            expect(signalStrength).to.equal(0.5);
          } else if (signalStrengthUpdate === 2) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(volume).to.be.null;
            expect(muted).to.be.null;
            expect(signalStrength).to.equal(1);
          }
          signalStrengthUpdate += 1;
        }
      );
      const vi: VolumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        rt,
        minVolumeDecibels,
        maxVolumeDecibels
      );
      expect(signalStrengthUpdate).to.equal(0);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoFrame);
      expect(signalStrengthUpdate).to.equal(0);
      const audioMetadataFrame = SdkAudioMetadataFrame.create();
      const audioState = SdkAudioAttendeeState.create();
      audioState.audioStreamId = streamInfo.audioStreamId;
      audioState.signalStrength = 0;
      audioMetadataFrame.attendeeStates = [audioState];
      vi.sendRealtimeUpdatesForAudioMetadata(audioMetadataFrame);
      expect(signalStrengthUpdate).to.equal(1);
      audioState.signalStrength = 1;
      vi.sendRealtimeUpdatesForAudioMetadata(audioMetadataFrame);
      expect(signalStrengthUpdate).to.equal(2);
      audioState.signalStrength = 2;
      vi.sendRealtimeUpdatesForAudioMetadata(audioMetadataFrame);
      expect(signalStrengthUpdate).to.equal(3);
    });

    it('ignores updates that do not have an attendee id mapping', () => {
      const streamInfo = SdkAudioStreamIdInfo.create();
      const streamInfoFrame = SdkAudioStreamIdInfoFrame.create();
      streamInfo.audioStreamId = 1;
      streamInfo.attendeeId = fooAttendee;
      streamInfoFrame.streams = [streamInfo];
      const rt: RealtimeController = new DefaultRealtimeController();
      let volumeIndicatorUpdate = 0;
      rt.realtimeSubscribeToVolumeIndicator(
        streamInfo.attendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          if (volumeIndicatorUpdate === 0) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(volume).to.equal(1);
            expect(muted).to.be.false;
            expect(signalStrength).to.equal(0);
          }
          volumeIndicatorUpdate += 1;
        }
      );
      const vi: VolumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        rt,
        minVolumeDecibels,
        maxVolumeDecibels
      );
      expect(volumeIndicatorUpdate).to.equal(0);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoFrame);
      expect(volumeIndicatorUpdate).to.equal(0);
      const audioMetadataFrame = SdkAudioMetadataFrame.create();
      const audioState1 = SdkAudioAttendeeState.create();
      audioState1.audioStreamId = streamInfo.audioStreamId;
      audioState1.volume = 0;
      audioState1.signalStrength = 0;
      const audioState2 = SdkAudioAttendeeState.create();
      audioState2.audioStreamId = 0xbad;
      audioState2.volume = 0;
      audioState2.signalStrength = 0;
      audioMetadataFrame.attendeeStates = [audioState1, audioState2];
      vi.sendRealtimeUpdatesForAudioMetadata(audioMetadataFrame);
      expect(volumeIndicatorUpdate).to.equal(1);
      vi.sendRealtimeUpdatesForAudioMetadata(audioMetadataFrame);
      expect(volumeIndicatorUpdate).to.equal(1);
    });

    it('assumes the implicit values when a zero stream id is sent', () => {
      const streamInfo = SdkAudioStreamIdInfo.create();
      const streamInfoFrame = SdkAudioStreamIdInfoFrame.create();
      streamInfo.audioStreamId = 1;
      streamInfo.attendeeId = fooAttendee;
      streamInfoFrame.streams = [streamInfo];
      const rt: RealtimeController = new DefaultRealtimeController();
      let volumeIndicatorUpdate = 0;
      rt.realtimeSubscribeToVolumeIndicator(
        streamInfo.attendeeId,
        (
          attendeeId: string,
          volume: number | null,
          muted: boolean | null,
          signalStrength: number | null
        ) => {
          if (volumeIndicatorUpdate === 0) {
            expect(attendeeId).to.equal(fooAttendee);
            expect(volume).to.equal(0);
            expect(muted).to.be.false;
            expect(signalStrength).to.equal(1);
          }
          volumeIndicatorUpdate += 1;
        }
      );
      const vi: VolumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        rt,
        minVolumeDecibels,
        maxVolumeDecibels
      );
      expect(volumeIndicatorUpdate).to.equal(0);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoFrame);
      expect(volumeIndicatorUpdate).to.equal(0);
      const audioMetadataFrame = SdkAudioMetadataFrame.create();
      const audioState1 = SdkAudioAttendeeState.create();
      audioState1.audioStreamId = 0;
      audioState1.volume = 0;
      audioState1.signalStrength = 0;
      audioMetadataFrame.attendeeStates = [audioState1];
      vi.sendRealtimeUpdatesForAudioMetadata(audioMetadataFrame);
      expect(volumeIndicatorUpdate).to.equal(1);
    });

    it('does not send an update if nothing has changed', () => {
      const streamInfo = SdkAudioStreamIdInfo.create();
      const streamInfoFrame = SdkAudioStreamIdInfoFrame.create();
      streamInfo.audioStreamId = 1;
      streamInfo.attendeeId = fooAttendee;
      streamInfoFrame.streams = [streamInfo];
      const rt: RealtimeController = new DefaultRealtimeController();
      let volumeIndicatorUpdate = 0;
      rt.realtimeSubscribeToVolumeIndicator(
        streamInfo.attendeeId,
        (
          _attendeeId: string,
          _volume: number | null,
          _muted: boolean | null,
          _signalStrength: number | null
        ) => {
          volumeIndicatorUpdate += 1;
        }
      );
      const vi: VolumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter(
        new NoOpLogger(),
        rt,
        minVolumeDecibels,
        maxVolumeDecibels
      );
      expect(volumeIndicatorUpdate).to.equal(0);
      vi.sendRealtimeUpdatesForAudioStreamIdInfo(streamInfoFrame);
      expect(volumeIndicatorUpdate).to.equal(0);
      const audioMetadataFrame = SdkAudioMetadataFrame.create();
      const audioState1 = SdkAudioAttendeeState.create();
      audioState1.audioStreamId = streamInfo.audioStreamId;
      audioMetadataFrame.attendeeStates = [audioState1];
      vi.sendRealtimeUpdatesForAudioMetadata(audioMetadataFrame);
      expect(volumeIndicatorUpdate).to.equal(0);
    });
  });
});
