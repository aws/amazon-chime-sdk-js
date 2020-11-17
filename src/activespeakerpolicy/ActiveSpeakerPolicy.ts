// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[ActiveSpeakerPolicy]] calculates a normalized score of how active a speaker is. Implementations
 * of [[ActiveSpeakerPolicy]] provide custom algorithms for calculating the score.
 */
export default interface ActiveSpeakerPolicy {
  /*
   * Return the score of the speaker. If the score is 0, this speaker is not active.
   */
  calculateScore(attendeeId: string, volume: number | null, muted: boolean | null): number;

  /*
   * Indicates whether the audio video controller is allowed to increase video send bandwidth
   * for the currently active speaker if they have an active video tile. Set this to true, if
   * your application makes the active speaker video tile larger than the other tiles.
   */
  prioritizeVideoSendBandwidthForActiveSpeaker(): boolean;
}
