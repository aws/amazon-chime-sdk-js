// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import TranscriptionStatusType from './TranscriptionStatusType';

export default class TranscriptionStatus {
  type: TranscriptionStatusType;
  eventTimeMs: number; // epoch time
  transcriptionRegion: string;
  transcriptionConfiguration: string;
  message?: string;
}
