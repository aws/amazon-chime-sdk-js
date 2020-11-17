// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[RealtimeVolumeIndicator]] stores the current volume, mute, and
 * signal strength for an attendee.
 */
export default class RealtimeVolumeIndicator {
  volume: number | null = null;
  muted: boolean | null = null;
  signalStrength: number | null = null;
}
