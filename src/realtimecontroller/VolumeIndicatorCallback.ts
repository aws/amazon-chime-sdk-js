// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[RealtimeVolumeIndicator]] functions that listen to changes in attendees volume.
 */

type VolumeIndicatorCallback = (
  attendeeId: string,
  volume: number | null,
  muted: boolean | null,
  signalStrength: number | null,
  externalUserId?: string
) => void;

export default VolumeIndicatorCallback;
