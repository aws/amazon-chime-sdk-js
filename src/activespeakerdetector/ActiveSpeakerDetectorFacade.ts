// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ActiveSpeakerPolicy from '../activespeakerpolicy/ActiveSpeakerPolicy';

/**
 * [[ActiveSpeakerDetectorFacade]] listens to the volume indicator updates from the [[RealtimeController]].
 *
 * When you are done using an `ActiveSpeakerDetectorFacade`, you should perform some
 * cleanup steps in order to avoid memory leaks:
 *
 * 1. Unsubscribe from listeners; e.g., from active speaker callbacks via
 *    {@link ActiveSpeakerDetectorFacade.unsubscribeFromActiveSpeakerDetector}.
 * 2. Drop your reference to the facade to allow it to be garbage collected.
 */
export default interface ActiveSpeakerDetectorFacade {
  /*
   * Starts the active speaker detector on the callback for the given policy.
   */
  subscribeToActiveSpeakerDetector(
    policy: ActiveSpeakerPolicy,
    callback: (activeSpeakers: string[]) => void,
    scoresCallback?: (scores: { [attendeeId: string]: number }) => void,
    scoresCallbackIntervalMs?: number
  ): void;

  /*
   * Stops the active speaker detector callback from being called. It also stops the
   * optional scores callback.
   */
  unsubscribeFromActiveSpeakerDetector(callback: (activeSpeakers: string[]) => void): void;
}
