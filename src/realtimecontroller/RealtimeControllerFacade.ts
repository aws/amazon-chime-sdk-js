// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DataMessage from '../datamessage/DataMessage';
import RealtimeAttendeePositionInFrame from './RealtimeAttendeePositionInFrame';
import type VolumeIndicatorCallback from './VolumeIndicatorCallback';

export default interface RealtimeControllerFacade {
  realtimeSubscribeToAttendeeIdPresence(
    callback: (
      attendeeId: string,
      present: boolean,
      externalUserId?: string,
      dropped?: boolean,
      posInFrame?: RealtimeAttendeePositionInFrame | null
    ) => void
  ): void;
  realtimeUnsubscribeToAttendeeIdPresence(
    callback: (
      attendeeId: string,
      present: boolean,
      externalUserId?: string,
      dropped?: boolean,
      posInFrame?: RealtimeAttendeePositionInFrame | null
    ) => void
  ): void;
  realtimeSetCanUnmuteLocalAudio(canUnmute: boolean): void;
  realtimeSubscribeToSetCanUnmuteLocalAudio(callback: (canUnmute: boolean) => void): void;
  realtimeUnsubscribeToSetCanUnmuteLocalAudio(callback: (canUnmute: boolean) => void): void;
  realtimeCanUnmuteLocalAudio(): boolean;
  realtimeMuteLocalAudio(): void;
  realtimeUnmuteLocalAudio(): boolean;
  realtimeSubscribeToMuteAndUnmuteLocalAudio(callback: (muted: boolean) => void): void;
  realtimeUnsubscribeToMuteAndUnmuteLocalAudio(callback: (muted: boolean) => void): void;
  realtimeIsLocalAudioMuted(): boolean;
  realtimeSubscribeToVolumeIndicator(attendeeId: string, callback: VolumeIndicatorCallback): void;
  realtimeUnsubscribeFromVolumeIndicator(
    attendeeId: string,
    callback?: VolumeIndicatorCallback
  ): void;
  realtimeSubscribeToLocalSignalStrengthChange(callback: (signalStrength: number) => void): void;
  realtimeUnsubscribeToLocalSignalStrengthChange(callback: (signalStrength: number) => void): void;
  realtimeSendDataMessage(
    topic: string,
    data: Uint8Array | string | any, // eslint-disable-line @typescript-eslint/no-explicit-any
    lifetimeMs?: number
  ): void;
  realtimeSubscribeToReceiveDataMessage(
    topic: string,
    callback: (dataMessage: DataMessage) => void
  ): void;
  realtimeUnsubscribeFromReceiveDataMessage(topic: string): void;
  realtimeSubscribeToFatalError(callback: (error: Error) => void): void;
  realtimeUnsubscribeToFatalError(callback: (error: Error) => void): void;
}
