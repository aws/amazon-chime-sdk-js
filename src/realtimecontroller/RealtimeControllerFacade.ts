// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DataMessage from '../datamessage/DataMessage';

export default interface RealtimeControllerFacade {
  realtimeSubscribeToAttendeeIdPresence(
    callback: (
      attendeeId: string,
      present: boolean,
      externalUserId?: string,
      dropped?: boolean
    ) => void
  ): void;
  realtimeUnsubscribeToAttendeeIdPresence(
    callback: (
      attendeeId: string,
      present: boolean,
      externalUserId?: string,
      dropped?: boolean
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
  realtimeSubscribeToVolumeIndicator(
    attendeeId: string,
    callback: (
      attendeeId: string,
      volume: number | null,
      muted: boolean | null,
      signalStrength: number | null,
      externalUserId?: string
    ) => void
  ): void;
  realtimeUnsubscribeFromVolumeIndicator(attendeeId: string): void;
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
