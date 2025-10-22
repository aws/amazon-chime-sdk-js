// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoControllerState from '../audiovideocontroller/AudioVideoControllerState';

/**
 * [[AudioVideoEventAttributes]] describes an audio-video event.
 */
export default interface AudioVideoEventAttributes {
  attendeePresenceDurationMs?: number;
  iceGatheringDurationMs?: number;
  maxVideoTileCount?: number;
  meetingDurationMs?: number;
  meetingErrorMessage?: string;
  meetingStartDurationMs?: number;
  meetingStatus?: string;
  poorConnectionCount?: number;
  retryCount?: number;
  signalingOpenDurationMs?: number;
}

/**
 * Helper function to generate AudioVideoEventAttributes from AudioVideoControllerState.
 */
export function audioVideoEventAttributesFromState(
  state: AudioVideoControllerState
): AudioVideoEventAttributes {
  const attributes: AudioVideoEventAttributes = {};

  if (state.startTimeMs !== null) {
    attributes.meetingDurationMs = Math.round(Date.now() - state.startTimeMs);
  }
  if (state.signalingOpenDurationMs !== null) {
    attributes.signalingOpenDurationMs = state.signalingOpenDurationMs;
  }
  if (state.iceGatheringDurationMs !== null) {
    attributes.iceGatheringDurationMs = state.iceGatheringDurationMs;
  }
  if (state.attendeePresenceDurationMs !== null) {
    attributes.attendeePresenceDurationMs = state.attendeePresenceDurationMs;
  }
  if (state.meetingStartDurationMs !== null) {
    attributes.meetingStartDurationMs = state.meetingStartDurationMs;
  }
  if (state.maxVideoTileCount !== undefined) {
    attributes.maxVideoTileCount = state.maxVideoTileCount;
  }
  if (state.poorConnectionCount !== undefined) {
    attributes.poorConnectionCount = state.poorConnectionCount;
  }
  if (state.retryCount !== undefined) {
    attributes.retryCount = state.retryCount;
  }

  return attributes;
}
