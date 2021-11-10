// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class TranscriptEntity {
  category: string;
  confidence: number;
  content: string;
  endTimeMs: number;
  startTimeMs: number;
  type?: string;
}
