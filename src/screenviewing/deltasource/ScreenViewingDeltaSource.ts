// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface ScreenViewingDeltaSource {
  notShared: boolean;
  pendingDx: number;
  pendingDy: number;

  flushSyncBuffer(): void;
}
