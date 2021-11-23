// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface AudioMixObserver {
  /**
   * Called when the meeting audio stream became active.
   */
  meetingAudioStreamBecameActive(activeStream: MediaStream): void;

  /**
   * Called when the meeting audio stream became inactive.
   */
  meetingAudioStreamBecameInactive(inactiveStream: MediaStream): void;
}
