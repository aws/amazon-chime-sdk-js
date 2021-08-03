// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

enum TranscriptionStatusType {
  STARTED = 'started',
  INTERRUPTED = 'interrupted',
  RESUMED = 'resumed',
  STOPPED = 'stopped',
  FAILED = 'failed',
}

export default TranscriptionStatusType;
