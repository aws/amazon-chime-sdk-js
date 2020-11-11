// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export enum AudioLogEvent {
  DeviceChanged,
  MutedLocal,
  UnmutedLocal,
  Connected,
  ConnectFailed,
  RedmicStartLoss,
  RedmicEndLoss,
}

export default AudioLogEvent;
