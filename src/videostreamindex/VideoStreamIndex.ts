// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  ISdkBitrateFrame,
  SdkIndexFrame,
  SdkSubscribeAckFrame,
} from '../signalingprotocol/SignalingProtocol.js';
import VideoSource from '../videosource/VideoSource';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamDescription from './VideoStreamDescription';

/**
 * [[VideoStreamIndex]] holds the set of video streams available on the server for subscription
 */
export default interface VideoStreamIndex {
  /**
   * Saves [[SdkIndexFrame]] in [[VideoStreamIndex]]
   */
  integrateIndexFrame(indexFrame: SdkIndexFrame): void;

  /**
   * Subscribe frame sent
   */
  subscribeFrameSent(): void;

  /**
   * Saves [[SdkSubscribeAckFrame]] in [[VideoStreamIndex]]
   */
  integrateSubscribeAckFrame(subscribeAck: SdkSubscribeAckFrame): void;

  /**
   * Saves [[SdkBitrateFrame]] in [[VideoStreamIndex]]
   */
  integrateBitratesFrame(bitrates: ISdkBitrateFrame): void;

  /**
   * Returns the set of all streams as [[VideoStreamIdSet]]
   */
  allStreams(): VideoStreamIdSet;

  /**
   * Returns an array of video sources who are sending video excluding self
   */
  allVideoSendingSourcesExcludingSelf(selfAttendeeId: string): VideoSource[];

  /**
   * Return a selection set of streams for subscription based on self attendee id, size information of tiles, bandwidth limitation
   */
  streamSelectionUnderBandwidthConstraint(
    selfAttendeeId: string,
    largeTileAttendeeIds: Set<string>,
    smallTileAttendeeIds: Set<string>,
    bandwidthKbps: number
  ): VideoStreamIdSet;

  /**
   * Returns the set of the highest quality videos for subscription
   */
  highestQualityStreamFromEachGroupExcludingSelf(selfAttendeeId: string): VideoStreamIdSet;

  /**
   * Returns the number of participants who are publishing videos excluding self
   */
  numberOfVideoPublishingParticipantsExcludingSelf(selfAttendeeId: string): number;

  /**
   * Returns the number of video participants
   */
  numberOfParticipants(): number;

  /**
   * Returns attendee id for a track id
   */
  attendeeIdForTrack(trackId: string): string;

  /**
   * Returns external user id for a track id
   */
  externalUserIdForTrack(trackId: string): string;

  /**
   * Returns attendee id for a stream id
   */
  attendeeIdForStreamId(streamId: number): string;

  /**
   * Returns group id for a stream id
   */
  groupIdForStreamId(streamId: number): number;

  /**
   * Determines if the stream ID's are from the same group (client)
   */
  StreamIdsInSameGroup(streamId1: number, streamId2: number): boolean;

  /**
   * Returns a stream id for a track id
   */
  streamIdForTrack(trackId: string): number;

  /**
   * Returns a stream id for an SSRC Id
   */
  streamIdForSSRC(ssrcId: number): number;

  /**
   * Returns the set of streams which are paused at source.
   */
  streamsPausedAtSource(): VideoStreamIdSet;

  /**
   * Updates cached local stream description array via uplink decisions, an array of [[RTCRtpEncodingParameters]]
   */
  integrateUplinkPolicyDecision(encodingParameters: RTCRtpEncodingParameters[]): void;

  /**
   * Returns the cloned array of [[VideoStreamDescription]] corresponding to local streams
   */
  localStreamDescriptions(): VideoStreamDescription[];

  /**
   * Returns the cloned array of [[VideoStreamDescription]] corresponding to remote streams
   */
  remoteStreamDescriptions(): VideoStreamDescription[];
}
