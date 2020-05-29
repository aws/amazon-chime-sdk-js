// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import {
  ISdkStreamDescriptor,
  SdkIndexFrame,
  SdkStreamMediaType,
  SdkSubscribeAckFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';

/**
 * [[DefaultVideoStreamIndex]] implements [[VideoStreamIndex]] to facilitate video stream subscription
 * and includes query functions for stream id and attendee id.
 */
export default class DefaultVideoStreamIndex implements VideoStreamIndex {
  private currentIndex: SdkIndexFrame | null = null;
  private currentSubscribeAck: SdkSubscribeAckFrame | null = null;
  private trackToStreamMap: Map<string, number> | null = null;
  private streamToAttendeeMap: Map<number, string> | null = null;
  private streamToExternalUserIdMap: Map<number, string> | null = null;
  private ssrcToStreamMap: Map<number, number> | null = null;

  constructor(private logger: Logger) {}

  integrateIndexFrame(indexFrame: SdkIndexFrame): void {
    this.currentIndex = indexFrame;
    this.streamToAttendeeMap = null;
    this.streamToExternalUserIdMap = null;
    this.ssrcToStreamMap = null;
  }

  integrateSubscribeAckFrame(subscribeAck: SdkSubscribeAckFrame): void {
    this.currentSubscribeAck = subscribeAck;
    this.trackToStreamMap = null;
  }

  allStreams(): DefaultVideoStreamIdSet {
    const set = new DefaultVideoStreamIdSet();
    if (this.currentIndex) {
      for (const source of this.currentIndex.sources) {
        set.add(source.streamId);
      }
    }
    return set;
  }

  allVideoSendingAttendeesExcludingSelf(selfAttendeeId: string): Set<string> {
    const attendees = new Set<string>();
    if (this.currentIndex) {
      if (this.currentIndex.sources.length) {
        for (const stream of this.currentIndex.sources) {
          if (
            stream.attendeeId !== selfAttendeeId &&
            stream.mediaType === SdkStreamMediaType.VIDEO
          ) {
            attendees.add(stream.attendeeId);
          }
        }
      }
    }

    return attendees;
  }

  streamSelectionUnderBandwidthConstraint(
    selfAttendeeId: string,
    largeTileAttendeeIds: Set<string>,
    smallTileAttendeeIds: Set<string>,
    bandwidthKbps: number
  ): DefaultVideoStreamIdSet {
    const newAttendees = new Set<string>();
    if (this.currentIndex) {
      for (const stream of this.currentIndex.sources) {
        if (stream.attendeeId === selfAttendeeId || stream.mediaType !== SdkStreamMediaType.VIDEO) {
          continue;
        }
        if (
          !largeTileAttendeeIds.has(stream.attendeeId) &&
          !smallTileAttendeeIds.has(stream.attendeeId)
        ) {
          newAttendees.add(stream.attendeeId);
        }
      }
    }

    const attendeeToStreamDescriptorMap = this.buildAttendeeToSortedStreamDescriptorMapExcludingSelf(
      selfAttendeeId
    );
    const selectionMap = new Map<string, ISdkStreamDescriptor>();

    let usage = 0;
    attendeeToStreamDescriptorMap.forEach((streams: ISdkStreamDescriptor[], attendeeId: string) => {
      selectionMap.set(attendeeId, streams[0]);
      usage += streams[0].maxBitrateKbps;
    });

    usage = this.trySelectHighBitrateForAttendees(
      attendeeToStreamDescriptorMap,
      largeTileAttendeeIds,
      usage,
      bandwidthKbps,
      selectionMap
    );
    this.trySelectHighBitrateForAttendees(
      attendeeToStreamDescriptorMap,
      newAttendees,
      usage,
      bandwidthKbps,
      selectionMap
    );

    const streamSelectionSet = new DefaultVideoStreamIdSet();
    for (const source of selectionMap.values()) {
      streamSelectionSet.add(source.streamId);
    }

    return streamSelectionSet;
  }

  highestQualityStreamFromEachGroupExcludingSelf(selfAttendeeId: string): DefaultVideoStreamIdSet {
    const set = new DefaultVideoStreamIdSet();
    if (this.currentIndex) {
      const maxes = new Map<number, ISdkStreamDescriptor>();
      for (const source of this.currentIndex.sources) {
        if (source.attendeeId === selfAttendeeId || source.mediaType !== SdkStreamMediaType.VIDEO) {
          continue;
        }
        if (
          !maxes.has(source.groupId) ||
          source.maxBitrateKbps > maxes.get(source.groupId).maxBitrateKbps
        ) {
          maxes.set(source.groupId, source);
        }
      }
      for (const source of maxes.values()) {
        set.add(source.streamId);
      }
    }
    return set;
  }

  numberOfVideoPublishingParticipantsExcludingSelf(selfAttendeeId: string): number {
    return this.highestQualityStreamFromEachGroupExcludingSelf(selfAttendeeId).array().length;
  }

  attendeeIdForTrack(trackId: string): string {
    const streamId: number = this.streamIdForTrack(trackId);
    if (streamId === undefined) {
      this.logger.warn(`track ${trackId} does not correspond to a known stream`);
      return '';
    }
    if (!this.streamToAttendeeMap) {
      if (this.currentIndex) {
        this.streamToAttendeeMap = this.buildStreamToAttendeeMap(this.currentIndex);
      } else {
        return '';
      }
    }
    const attendeeId: string = this.streamToAttendeeMap.get(streamId);
    if (!attendeeId) {
      this.logger.info(
        `track ${trackId} (stream ${streamId}) does not correspond to a known attendee`
      );
      return '';
    }
    return attendeeId;
  }

  externalUserIdForTrack(trackId: string): string {
    const streamId: number = this.streamIdForTrack(trackId);
    if (streamId === undefined) {
      this.logger.warn(`track ${trackId} does not correspond to a known stream`);
      return '';
    }
    if (!this.streamToExternalUserIdMap) {
      if (this.currentIndex) {
        this.streamToExternalUserIdMap = this.buildStreamExternalUserIdMap(this.currentIndex);
      } else {
        return '';
      }
    }
    const externalUserId: string = this.streamToExternalUserIdMap.get(streamId);
    if (!externalUserId) {
      this.logger.info(
        `track ${trackId} (stream ${streamId}) does not correspond to a known externalUserId`
      );
      return '';
    }
    return externalUserId;
  }

  attendeeIdForStreamId(streamId: number): string {
    if (!this.streamToAttendeeMap) {
      if (this.currentIndex) {
        this.streamToAttendeeMap = this.buildStreamToAttendeeMap(this.currentIndex);
      } else {
        return '';
      }
    }
    const attendeeId: string = this.streamToAttendeeMap.get(streamId);
    if (!attendeeId) {
      this.logger.info(`stream ${streamId}) does not correspond to a known attendee`);
      return '';
    }
    return attendeeId;
  }

  streamIdForTrack(trackId: string): number {
    if (!this.trackToStreamMap) {
      if (this.currentSubscribeAck) {
        this.trackToStreamMap = this.buildTrackToStreamMap(this.currentSubscribeAck);
      } else {
        return undefined;
      }
    }
    return this.trackToStreamMap.get(trackId);
  }

  streamIdForSSRC(ssrcId: number): number {
    if (!this.ssrcToStreamMap) {
      if (this.currentSubscribeAck) {
        this.ssrcToStreamMap = this.buildSSRCToStreamMap(this.currentSubscribeAck);
      } else {
        return undefined;
      }
    }
    return this.ssrcToStreamMap.get(ssrcId);
  }

  streamsPausedAtSource(): DefaultVideoStreamIdSet {
    const paused = new DefaultVideoStreamIdSet();
    if (this.currentIndex) {
      for (const streamId of this.currentIndex.pausedAtSourceIds) {
        paused.add(streamId);
      }
    }
    return paused;
  }

  private buildTrackToStreamMap(subscribeAck: SdkSubscribeAckFrame): Map<string, number> {
    const map = new Map<string, number>();
    this.logger.debug(() => `trackMap ${JSON.stringify(subscribeAck.tracks)}`);
    for (const trackMapping of subscribeAck.tracks) {
      if (trackMapping.trackLabel.length > 0 && trackMapping.streamId > 0) {
        map.set(trackMapping.trackLabel, trackMapping.streamId);
      }
    }
    return map;
  }

  private buildSSRCToStreamMap(subscribeAck: SdkSubscribeAckFrame): Map<number, number> {
    const map = new Map<number, number>();
    this.logger.debug(() => `ssrcMap ${JSON.stringify(subscribeAck.tracks)}`);
    for (const trackMapping of subscribeAck.tracks) {
      if (trackMapping.trackLabel.length > 0 && trackMapping.streamId > 0) {
        map.set(trackMapping.ssrc, trackMapping.streamId);
      }
    }
    return map;
  }

  private buildStreamToAttendeeMap(indexFrame: SdkIndexFrame): Map<number, string> {
    const map = new Map<number, string>();
    for (const source of indexFrame.sources) {
      map.set(source.streamId, source.attendeeId);
    }
    return map;
  }

  private buildStreamExternalUserIdMap(indexFrame: SdkIndexFrame): Map<number, string> {
    const map = new Map<number, string>();
    for (const source of indexFrame.sources) {
      if (!!source.externalUserId) {
        map.set(source.streamId, source.externalUserId);
      }
    }
    return map;
  }

  private trySelectHighBitrateForAttendees(
    attendeeToStreamDescriptorMap: Map<string, ISdkStreamDescriptor[]>,
    highAttendees: Set<string>,
    currentUsage: number,
    bandwidthKbps: number,
    currentSelectionRef: Map<string, ISdkStreamDescriptor>
  ): number {
    for (const attendeeId of highAttendees) {
      if (currentUsage >= bandwidthKbps) {
        break;
      }
      if (attendeeToStreamDescriptorMap.has(attendeeId)) {
        const streams = attendeeToStreamDescriptorMap.get(attendeeId);
        for (const l of streams.reverse()) {
          if (
            currentUsage - currentSelectionRef.get(attendeeId).maxBitrateKbps + l.maxBitrateKbps <
            bandwidthKbps
          ) {
            currentUsage =
              currentUsage - currentSelectionRef.get(attendeeId).maxBitrateKbps + l.maxBitrateKbps;
            currentSelectionRef.set(attendeeId, l);
            break;
          }
        }
      }
    }

    return currentUsage;
  }

  private buildAttendeeToSortedStreamDescriptorMapExcludingSelf(
    selfAttendeeId: string
  ): Map<string, ISdkStreamDescriptor[]> {
    const attendeeToStreamDescriptorMap = new Map<string, ISdkStreamDescriptor[]>();
    if (this.currentIndex) {
      for (const source of this.currentIndex.sources) {
        if (source.attendeeId === selfAttendeeId || source.mediaType !== SdkStreamMediaType.VIDEO) {
          continue;
        }
        if (attendeeToStreamDescriptorMap.has(source.attendeeId)) {
          attendeeToStreamDescriptorMap.get(source.attendeeId).push(source);
        } else {
          attendeeToStreamDescriptorMap.set(source.attendeeId, [source]);
        }
      }
    }

    attendeeToStreamDescriptorMap.forEach(
      (streams: ISdkStreamDescriptor[], _attendeeId: string) => {
        streams.sort((stream1, stream2) => {
          if (stream1.maxBitrateKbps > stream2.maxBitrateKbps) {
            return 1;
          } else if (stream1.maxBitrateKbps < stream2.maxBitrateKbps) {
            return -1;
          } else {
            return 0;
          }
        });
      }
    );

    return attendeeToStreamDescriptorMap;
  }
}
