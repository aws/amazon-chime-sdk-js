// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Attendee from '../attendee/Attendee';
import TranscriptItemType from './TranscriptItemType';

export default class TranscriptItem {
  type: TranscriptItemType;
  startTimeMs: number; // epoch time
  endTimeMs: number; // epoch time
  attendee: Attendee;
  content: string;
  vocabularyFilterMatch?: boolean;
  confidence?: number;
  stable?: boolean;
}
