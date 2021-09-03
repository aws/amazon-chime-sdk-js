// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Attendee from '../attendee/Attendee';
import TranscriptAlternative from './TranscriptAlternative';

export default class TranscriptResult {
  resultId: string;
  channelId?: string;
  editor?: Attendee;
  isPartial: boolean;
  startTimeMs: number; // epoch time
  endTimeMs: number; // epoch time
  alternatives: TranscriptAlternative[];
}
