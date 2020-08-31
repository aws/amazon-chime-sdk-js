// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export enum CheckAudioConnectivityFeedback {
  Success,
  FailureToGetAudioInput,
  AudioInputPermissionDenied,
  ConnectionFailure,
  NoAudioPresence,
}

export default CheckAudioConnectivityFeedback;
