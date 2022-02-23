// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import TranscriptAlternative from './TranscriptAlternative';
import TranscriptLanguageWithScore from './TranscriptLanguageWithScore';

export default class TranscriptResult {
  resultId: string;
  channelId?: string;
  isPartial: boolean;
  languageCode?: string;
  languageIdentifications: TranscriptLanguageWithScore[];
  startTimeMs: number; // epoch time
  endTimeMs: number; // epoch time
  alternatives: TranscriptAlternative[];
}
