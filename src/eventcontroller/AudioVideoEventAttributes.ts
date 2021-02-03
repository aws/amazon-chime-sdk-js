// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[AudioVideoEventAttributes]] describes an audio-video event.
 */
export default interface AudioVideoEventAttributes {
  maxVideoTileCount?: number;
  meetingDurationMs?: number;
  meetingErrorMessage?: string;
  meetingStatus?: string;
  poorConnectionCount?: number;
  retryCount?: number;
  signalingOpenDurationMs?: number;
  iceGatheringDurationMs?: number;
  selfAttendeePresentDurationMs?: number;
}
