// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LogLevel from './LogLevel';

export default interface S3LoggerOptions {

  /**
   * Level of logging. Check [[LogLevel]] for more information.
   * Default value is `LogLevel.DEBUG`.
   */
  logLevel?: LogLevel;

  /**
   * Pre-signed S3 URL for uploading logs. If not provided, S3Logger will attempt
   * to obtain one from the ingestion service using the meeting configuration.
   */
  presignedUrl?: string;

  /**
   * Meeting ID for log organization and pre-signed URL generation.
   */
  meetingId?: string;

  /**
   * Attendee ID for log organization and pre-signed URL generation.
   */
  attendeeId?: string;

  /**
   * Join token for authentication when requesting pre-signed URLs.
   */
  joinToken?: string;

  /**
  //  * Maximum number of log entries to store before triggering upload.
   * Default: 500 for desktop, 150 for mobile.
   */
  maxEntries?: number;

  /**
   * Maximum size in bytes before triggering upload.
   * Default: 1MB for desktop, 256KB for mobile.
   */
  maxBytes?: number;

  /**
   * Flush interval in milliseconds for periodic uploads.
   * Default: 120000ms (2 minutes) for desktop, 90000ms (1.5 minutes) for mobile.
   */
  flushInterval?: number;

  /**
   * Whether to enable log redaction for sensitive information.
   * Default: true.
   */
  enableRedaction?: boolean;

  /**
   * Custom redaction patterns to apply in addition to default patterns.
   */
  customRedactionPatterns?: RegExp[];

  
  metadata?: Record<string, string>;

}
