// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ActiveSpeakerPolicy from '../activespeakerpolicy/ActiveSpeakerPolicy';

/**
 * [[ActiveSpeakerDetector]] listens to the volume indicator updates from the [[RealtimeController]]. It consults
 * the [[ActiveSpeakerPolicy]] to determine if the speaker is active or not.
 */
export default interface ActiveSpeakerDetector {
  /*
   * Starts the active speaker detector on the callback for the given policy.
   */
  subscribe(
    policy: ActiveSpeakerPolicy,
    callback: (activeSpeakers: string[]) => void,
    scoresCallback?: (scores: { [attendeeId: string]: number }) => void,
    scoresCallbackIntervalMs?: number
  ): void;

  /*
   * Stops the active speaker detector callback from being called.
   */
  unsubscribe(callback: (activeSpeakers: string[]) => void): void;
}
