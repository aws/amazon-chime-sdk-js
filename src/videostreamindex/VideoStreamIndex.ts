// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SdkIndexFrame, SdkSubscribeAckFrame } from '../signalingprotocol/SignalingProtocol.js';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';

/**
 * [[VideoStreamIndex]] holds the set of video streams available on the server for subscription
 */
export default interface VideoStreamIndex {
  /**
   * Saves [[SdkIndexFrame]] in [[VideoStreamIndex]]
   */
  integrateIndexFrame(indexFrame: SdkIndexFrame): void;

  /**
   * Saves [[SdkSubscribeAckFrame]] in [[VideoStreamIndex]]
   */
  integrateSubscribeAckFrame(subscribeAck: SdkSubscribeAckFrame): void;

  /**
   * Returns the set of all streams as [[VideoStreamIdSet]]
   */
  allStreams(): VideoStreamIdSet;

  /**
   * Returns the attendee ids of attendees who are publishing videos excluding self
   */
  allVideoSendingAttendeesExcludingSelf(selfAttendeeId: string): Set<string>;

  /**
   * Return a selection set of streams for subscription based on self attendee id, size infomation of tiles, bandwidth limitation
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
   * Returns attendee id for a track id
   */
  attendeeIdForTrack(trackId: string): string;

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
}
