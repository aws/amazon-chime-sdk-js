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
  protected indexForLastRemoteVideoUpdate: SdkIndexFrame | null = null;
  protected currentSubscribeAck: SdkSubscribeAckFrame | null = null;

  // These are based on the index at the time of the last Subscribe Ack
  protected subscribeTrackToStreamMap: Map<string, number> | null = null;
  protected subscribeStreamToAttendeeMap: Map<number, string> | null = null;
  protected subscribeStreamToExternalUserIdMap: Map<number, string> | null = null;
  protected subscribeSsrcToStreamMap: Map<number, number> | null = null;
  protected subscribeSsrcToGroupMap: Map<number, number> | null = null;

  // These are based on the most up to date index
  protected streamToAttendeeMap: Map<number, string> | null = null;
  protected groupIdToAttendeeMap: Map<number, string> | null = null;
  protected streamToExternalUserIdMap: Map<number, string> | null = null;

  private videoStreamDescription = new VideoStreamDescription();
  private sendVideoStreamId: number = 0;
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

  convertBpsToKbps(avgBitrateBps: number): number {
    if (avgBitrateBps > 0 && avgBitrateBps < 1000) {
      return 1;
    } else {
      return Math.trunc(avgBitrateBps / 1000);
    }
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
      description.avgBitrateKbps = this.convertBpsToKbps(source.avgBitrateBps);
      description.width = source.width;
      description.height = source.height;
      description.maxFrameRate = source.framerate;
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

    if (!indexFrame) {
      return;
    }

    // In the Amazon Chime SDKs, we assume a one to one mapping of group ID to profile ID when creating
    // video tiles (multiple video sources are supported through applying a `Modality` to a given profile/session token)
    //
    // We enforce this here to mitigate any possible duplicate group IDs left from a reconnection where the previous
    // signal channel hasn't been timed out yet.  To guarantee we receive the latest stream we use the highest group ID
    // since they are monotonically increasing.
    const attendeeIdToMainGroupIdMap = new Map<string, number>();
    // Improve performance by not filtering sources unless
    // we know the list will actually change
    let attendeeWithMultipleGroupIdsExists = false;
    for (const source of indexFrame.sources) {
      if (!attendeeIdToMainGroupIdMap.has(source.attendeeId)) {
        // We haven't see this attendee ID so just keep track of it
        attendeeIdToMainGroupIdMap.set(source.attendeeId, source.groupId);
        continue;
      }

      // Otherwise see if we should use the group ID corresponding to this source (we prefer the highest for each attendee)
      const currentGroupId = attendeeIdToMainGroupIdMap.get(source.attendeeId);
      if (currentGroupId < source.groupId) {
        this.logger.warn(
          `Old group ID ${currentGroupId} found for attendee ID ${source.attendeeId}, replacing with newer group ID ${source.groupId}`
        );
        attendeeIdToMainGroupIdMap.set(source.attendeeId, source.groupId);
      }
      attendeeWithMultipleGroupIdsExists = true;
    }
    if (attendeeWithMultipleGroupIdsExists) {
      // Only use the sources corresponding to the main group IDs for the given attendee ID
      this.currentIndex.sources = this.currentIndex.sources.filter(
        source => attendeeIdToMainGroupIdMap.get(source.attendeeId) === source.groupId
      );
    }

    // Null out cached maps, these will be recreated on demand
    this.streamToAttendeeMap = null;
    this.groupIdToAttendeeMap = null;
    this.streamToExternalUserIdMap = null;
  }

  subscribeFrameSent(): void {
    // This is called just as a Subscribe is being sent.  Save corresponding Index
    this.indexForSubscribe = this.currentIndex;
  }

  remoteVideoUpdateSent(): void {
    this.indexForLastRemoteVideoUpdate = this.currentIndex;
  }

  integrateSubscribeAckFrame(subscribeAck: SdkSubscribeAckFrame): void {
    this.currentSubscribeAck = subscribeAck;

    // These are valid until the next Subscribe Ack even if the index is updated
    this.subscribeTrackToStreamMap = this.buildTrackToStreamMap(this.currentSubscribeAck);
    this.subscribeSsrcToStreamMap = this.buildSSRCToStreamMap(this.currentSubscribeAck);
    this.subscribeSsrcToGroupMap = this.buildSSRCToGroupMap(this.currentSubscribeAck);
    this.subscribeStreamToAttendeeMap = this.buildStreamToAttendeeMap(this.indexForSubscribe);
    this.subscribeStreamToExternalUserIdMap = this.buildStreamExternalUserIdMap(
      this.indexForSubscribe
    );

    this.sendVideoStreamId = 0;
    if (
      subscribeAck.allocations &&
      subscribeAck.allocations !== undefined &&
      subscribeAck.allocations.length > 0
    ) {
      this.sendVideoStreamId = subscribeAck.allocations[0].streamId;
    }
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
      this.logger.info(`stream ID ${streamId} does not correspond to a known attendee`);
      return '';
    }
    return attendeeId;
  }

  attendeeIdForGroupId(groupId: number): string {
    if (!this.groupIdToAttendeeMap) {
      if (this.currentIndex) {
        this.groupIdToAttendeeMap = this.buildGroupIdToAttendeeMap(this.currentIndex);
      } else {
        return '';
      }
    }
    const attendeeId: string = this.groupIdToAttendeeMap.get(groupId);
    if (!attendeeId) {
      this.logger.info(`group ID ${groupId} does not correspond to a known attendee`);
      return '';
    }
    return attendeeId;
  }

  groupIdForStreamId(streamId: number): number {
    if (!this.currentIndex || !this.currentIndex.sources) {
      return undefined;
    }

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

    // Lastly check if it can be found in the index last used for remote video update
    if (!!this.indexForLastRemoteVideoUpdate) {
      for (const source of this.indexForLastRemoteVideoUpdate.sources) {
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

  overrideStreamIdMappings(previous: number, current: number): void {
    if (this.subscribeTrackToStreamMap) {
      for (const [track, streamId] of this.subscribeTrackToStreamMap.entries()) {
        if (previous === streamId) {
          this.subscribeTrackToStreamMap.set(track, current);
          break;
        }
      }
    }

    if (this.subscribeSsrcToStreamMap) {
      for (const [ssrc, streamId] of this.subscribeSsrcToStreamMap.entries()) {
        if (previous === streamId) {
          this.subscribeSsrcToStreamMap.set(ssrc, current);
          break;
        }
      }
    }
  }

  groupIdForSSRC(ssrcId: number): number {
    if (!this.subscribeSsrcToGroupMap) {
      return undefined;
    }
    return this.subscribeSsrcToGroupMap.get(ssrcId);
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

  sendVideoStreamIdFromRid(_rid: string): number {
    return this.sendVideoStreamId;
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

  private buildSSRCToGroupMap(subscribeAck: SdkSubscribeAckFrame): Map<number, number> {
    const map = new Map<number, number>();
    for (const trackMapping of subscribeAck.tracks) {
      if (trackMapping.trackLabel.length > 0 && trackMapping.streamId > 0) {
        map.set(trackMapping.ssrc, this.groupIdForStreamId(trackMapping.streamId));
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

  private buildGroupIdToAttendeeMap(indexFrame: SdkIndexFrame): Map<number, string> {
    const map = new Map<number, string>();
    for (const source of indexFrame.sources) {
      map.set(source.groupId, source.attendeeId);
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
