// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import RealtimeVolumeIndicator from './RealtimeVolumeIndicator';

/**
 * [[RealtimeState]] stores all realtime persistent state.
 */
export default class RealtimeState {
  /**
   * Stores the attendee id of the current user
   */
  localAttendeeId: string | null = null;

  /**
   * Callbacks to listen for attendee id changes
   */
  attendeeIdChangesCallbacks: ((attendeeId: string, present: boolean) => void)[] = [];

  /**
   * Stores whether the user can transition from muted to unmuted
   */
  canUnmute: boolean = true;

  /**
   * Callbacks to listen for changes to can-unmute local audio state
   */
  setCanUnmuteLocalAudioCallbacks: ((canUnmute: boolean) => void)[] = [];

  /**
   * Stores whether the user is presently muted
   */
  muted: boolean = false;

  /**
   * Callbacks to listen for local audio mutes and unmutes
   */
  muteAndUnmuteLocalAudioCallbacks: ((muted: boolean) => void)[] = [];

  /**
   * Stores the active audio input
   */
  audioInput: MediaStream | null = null;

  /**
   * Stores per-attendee id volume indicator state
   */
  volumeIndicatorState: { [key: string]: RealtimeVolumeIndicator } = {};

  /**
   * Stores per-attendee id callbacks called when volume indicators change
   */
  volumeIndicatorCallbacks: {
    [key: string]: ((
      attendeeId: string,
      volume: number | null,
      muted: boolean | null,
      signalStrength: number | null
    ) => void)[];
  } = {};

  /**
   * Stores callbacks to be called when the state of updates changes
   */
  updateStateChangeCallbacks: ((state: 'startedUpdate' | 'stoppedUpdate') => void)[] = [];

  /**
   * Callbacks to listen for changes to local signal strength
   */
  localSignalStrengthChangeCallbacks: ((signalStrength: number) => void)[] = [];

  /**
   * Callbacks to listen for fatal errors
   */
  fatalErrorCallbacks: ((error: Error) => void)[] = [];
}
