// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export enum CheckAudioConnectivityFeedback {
  Succeeded,
  AudioInputRequestFailed,
  AudioInputPermissionDenied,
  ConnectionFailed,
  AudioNotReceived,
}

export default CheckAudioConnectivityFeedback;
