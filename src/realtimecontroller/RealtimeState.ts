// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DataMessage from '../datamessage/DataMessage';
import RealtimeAttendeePositionInFrame from './RealtimeAttendeePositionInFrame';
import RealtimeVolumeIndicator from './RealtimeVolumeIndicator';
import type VolumeIndicatorCallback from './VolumeIndicatorCallback';

/**
 * [[RealtimeState]] stores all realtime persistent state.
 */
export default class RealtimeState {
  /**
   * Stores the attendee id of the current user
   */
  localAttendeeId: string | null = null;

  /**
   * Stores the external user id of the current user
   */
  localExternalUserId: string | null = null;

  /**
   * Callbacks to listen for attendee id changes
   */
  attendeeIdChangesCallbacks: ((
    attendeeId: string,
    present: boolean,
    externalUserId: string,
    dropped: boolean,
    posInFrame: RealtimeAttendeePositionInFrame | null
  ) => void)[] = [];

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
   * Stores attendee id to external user id mappings
   */
  attendeeIdToExternalUserId: { [attendeeId: string]: string } = {};

  /**
   * Stores per-attendee id callbacks called when volume indicators change
   */
  volumeIndicatorCallbacks: {
    [key: string]: VolumeIndicatorCallback[];
  } = {};

  /**
   * Callbacks to listen for changes to local signal strength
   */
  localSignalStrengthChangeCallbacks: ((signalStrength: number) => void)[] = [];

  /**
   * Callbacks to listen for fatal errors
   */
  fatalErrorCallbacks: ((error: Error) => void)[] = [];

  /**
   * Callbacks to trigger when sending message
   */
  sendDataMessageCallbacks: ((
    topic: string, // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Uint8Array | string | any,
    lifetimeMs?: number
  ) => void)[] = [];

  /**
   * Callbacks to listen for receiving message from data channel based on given topic
   */
  receiveDataMessageCallbacks: Map<string, ((dataMessage: DataMessage) => void)[]> = new Map();
}
