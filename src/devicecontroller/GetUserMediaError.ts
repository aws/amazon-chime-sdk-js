// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class GetUserMediaError extends Error {
  constructor(public cause?: Error, message?: string) {
    super(message || 'Error fetching device.');
  }
}
