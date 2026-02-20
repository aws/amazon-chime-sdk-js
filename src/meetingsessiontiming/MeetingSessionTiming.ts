// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Timing data for signaling and connection establishment.
 * All timestamps are in milliseconds since epoch (undefined if not measured).
 */
export interface MeetingSessionSignalingTiming {
  startMs?: number;
  joinSentMs?: number;
  joinAckReceivedMs?: number;
  transportConnectedMs?: number;
  createOfferMs?: number;
  setLocalDescriptionMs?: number;
  setRemoteDescriptionMs?: number;
  iceGatheringStartMs?: number;
  iceGatheringCompleteMs?: number;
  iceConnectedMs?: number;
  subscribeSentMs?: number;
  subscribeAckMs?: number;
  timedOut?: boolean;
}

/**
 * Timing data for remote audio receive path.
 */
export interface MeetingSessionRemoteAudioTiming {
  addedMs?: number;
  firstPacketReceivedMs?: number;
  firstFrameRenderedMs?: number;
  timedOut?: boolean;
  removed?: boolean;
}

/**
 * Timing data for local audio send path.
 */
export interface MeetingSessionLocalAudioTiming {
  addedMs?: number;
  firstFrameCapturedMs?: number;
  firstPacketSentMs?: number;
  timedOut?: boolean;
  removed?: boolean;
}

/**
 * Timing data for local video send path.
 */
export interface MeetingSessionLocalVideoTiming {
  addedMs?: number;
  firstFrameCapturedMs?: number;
  firstFrameSentMs?: number;
  timedOut?: boolean;
  removed?: boolean;
}

/**
 * Per-group timing data for remote video receive path.
 */
export interface MeetingSessionRemoteVideoTiming {
  groupId?: number;
  addedMs?: number;
  firstPacketReceivedMs?: number;
  firstFrameRenderedMs?: number;
  timedOut?: boolean;
  removed?: boolean;
}

/**
 * Contains all collected timing data from the timing manager.
 */
export default interface MeetingSessionTiming {
  signaling: MeetingSessionSignalingTiming[];
  remoteAudio: MeetingSessionRemoteAudioTiming[];
  localAudio: MeetingSessionLocalAudioTiming[];
  localVideo: MeetingSessionLocalVideoTiming[];
  remoteVideos: MeetingSessionRemoteVideoTiming[];
}

/**
 * Observer interface for receiving meeting session timing data.
 */
export interface MeetingSessionTimingObserver {
  onMeetingSessionTimingReady(timing: MeetingSessionTiming): void;
}
