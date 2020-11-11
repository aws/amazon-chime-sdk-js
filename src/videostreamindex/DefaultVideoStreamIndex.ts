// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import {
  ISdkBitrateFrame,
  ISdkStreamDescriptor,
  SdkIndexFrame,
  SdkStreamMediaType,
  SdkSubscribeAckFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import VideoSource from '../videosource/VideoSource';
import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoStreamDescription from './VideoStreamDescription';

/**
 * [[DefaultVideoStreamIndex]] implements [[VideoStreamIndex]] to facilitate video stream subscription
 * and includes query functions for stream id and attendee id.
 */
export default class DefaultVideoStreamIndex implements VideoStreamIndex {
  protected currentIndex: SdkIndexFrame | null = null;
  protected indexForSubscribe: SdkIndexFrame | null = null;
  protected currentSubscribeAck: SdkSubscribeAckFrame | null = null;

  // These are based on the index at the time of the last Subscribe Ack
  protected subscribeTrackToStreamMap: Map<string, number> | null = null;
  protected subscribeStreamToAttendeeMap: Map<number, string> | null = null;
  protected subscribeStreamToExternalUserIdMap: Map<number, string> | null = null;
  protected subscribeSsrcToStreamMap: Map<number, number> | null = null;

  // These are based on the most up to date index
  protected streamToAttendeeMap: Map<number, string> | null = null;
  protected streamToExternalUserIdMap: Map<number, string> | null = null;

  private videoStreamDescription = new VideoStreamDescription();
  constructor(protected logger: Logger) {
    this.videoStreamDescription.trackLabel = 'AmazonChimeExpressVideo';
    this.videoStreamDescription.streamId = 2;
    this.videoStreamDescription.groupId = 2;
  }

  localStreamDescriptions(): VideoStreamDescription[] {
    // localStreamDescriptions are used to construct IndexFrame
    // old behavior for single video is to have streamId and groupId trackLabel fixed as the follows
    return [this.videoStreamDescription.clone()];
  }

  remoteStreamDescriptions(): VideoStreamDescription[] {
    if (!this.currentIndex || !this.currentIndex.sources) {
      return [];
    }
    const streamInfos: VideoStreamDescription[] = [];
    this.currentIndex.sources.forEach(source => {
      const description = new VideoStreamDescription();
      description.attendeeId = source.attendeeId;
      description.groupId = source.groupId;
      description.streamId = source.streamId;
      description.maxBitrateKbps = source.maxBitrateKbps;
      description.avgBitrateKbps = Math.floor(source.avgBitrateBps / 1000);
      streamInfos.push(description);
    });
    return streamInfos;
  }

  integrateUplinkPolicyDecision(param: RTCRtpEncodingParameters[]): void {
    if (!!param && param.length) {
      const encodingParam = param[0];
      this.videoStreamDescription.maxBitrateKbps = encodingParam.maxBitrate / 1000;
      this.videoStreamDescription.maxFrameRate = encodingParam.maxFramerate;
    }
  }

  integrateIndexFrame(indexFrame: SdkIndexFrame): void {
    this.currentIndex = indexFrame;
    this.streamToAttendeeMap = null;
    this.streamToExternalUserIdMap = null;
  }

  subscribeFrameSent(): void {
    // This is called just as a Subscribe is being sent.  Save corresponding Index
    this.indexForSubscribe = this.currentIndex;
  }

  integrateSubscribeAckFrame(subscribeAck: SdkSubscribeAckFrame): void {
    this.currentSubscribeAck = subscribeAck;

    // These are valid until the next Subscribe Ack even if the index is updated
    this.subscribeTrackToStreamMap = this.buildTrackToStreamMap(this.currentSubscribeAck);
    this.subscribeSsrcToStreamMap = this.buildSSRCToStreamMap(this.currentSubscribeAck);
    this.subscribeStreamToAttendeeMap = this.buildStreamToAttendeeMap(this.indexForSubscribe);
    this.subscribeStreamToExternalUserIdMap = this.buildStreamExternalUserIdMap(
      this.indexForSubscribe
    );
  }

  integrateBitratesFrame(bitrates: ISdkBitrateFrame): void {
    if (this.currentIndex) {
      for (const bitrate of bitrates.bitrates) {
        const source = this.currentIndex.sources.find(
          source => source.streamId === bitrate.sourceStreamId
        );
        if (source !== undefined) {
          source.avgBitrateBps = bitrate.avgBitrateBps;
        }
      }
    }
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

  allVideoSendingSourcesExcludingSelf(selfAttendeeId: string): VideoSource[] {
    const videoSources: VideoSource[] = [];
    const attendeeSet = new Set<string>();
    if (this.currentIndex) {
      if (this.currentIndex.sources && this.currentIndex.sources.length) {
        for (const stream of this.currentIndex.sources) {
          const { attendeeId, externalUserId, mediaType } = stream;
          if (attendeeId !== selfAttendeeId && mediaType === SdkStreamMediaType.VIDEO) {
            if (!attendeeSet.has(attendeeId)) {
              videoSources.push({ attendee: { attendeeId, externalUserId } });
              attendeeSet.add(attendeeId);
            }
          }
        }
      }
    }
    return videoSources;
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

  numberOfParticipants(): number {
    if (!!this.currentIndex.numParticipants) {
      return this.currentIndex.numParticipants;
    }

    return -1;
  }

  attendeeIdForTrack(trackId: string): string {
    const streamId: number = this.streamIdForTrack(trackId);
    if (streamId === undefined || !this.subscribeStreamToAttendeeMap) {
      this.logger.warn(`no attendee found for track ${trackId}`);
      return '';
    }
    const attendeeId: string = this.subscribeStreamToAttendeeMap.get(streamId);
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
    if (streamId === undefined || !this.subscribeStreamToExternalUserIdMap) {
      this.logger.warn(`no external user id found for track ${trackId}`);
      return '';
    }
    const externalUserId: string = this.subscribeStreamToExternalUserIdMap.get(streamId);
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

  groupIdForStreamId(streamId: number): number {
    for (const source of this.currentIndex.sources) {
      if (source.streamId === streamId) {
        return source.groupId;
      }
    }

    // If wasn't found in current index, then it could be in index used in last subscribe
    if (!!this.indexForSubscribe) {
      for (const source of this.indexForSubscribe.sources) {
        if (source.streamId === streamId) {
          return source.groupId;
        }
      }
    }
    return undefined;
  }

  StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean {
    if (this.groupIdForStreamId(streamId1) === this.groupIdForStreamId(streamId2)) {
      return true;
    }
    return false;
  }

  streamIdForTrack(trackId: string): number {
    if (!this.subscribeTrackToStreamMap) {
      return undefined;
    }
    return this.subscribeTrackToStreamMap.get(trackId);
  }

  streamIdForSSRC(ssrcId: number): number {
    if (!this.subscribeSsrcToStreamMap) {
      return undefined;
    }
    return this.subscribeSsrcToStreamMap.get(ssrcId);
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
    if (indexFrame) {
      for (const source of indexFrame.sources) {
        map.set(source.streamId, source.attendeeId);
      }
    }
    return map;
  }

  private buildStreamExternalUserIdMap(indexFrame: SdkIndexFrame): Map<number, string> {
    const map = new Map<number, string>();
    if (indexFrame) {
      for (const source of indexFrame.sources) {
        if (!!source.externalUserId) {
          map.set(source.streamId, source.externalUserId);
        }
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
