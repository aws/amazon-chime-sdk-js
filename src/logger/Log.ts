// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class Log {
  constructor(
    public sequenceNumber: number,
    public message: string,
    public timestampMs: number,
    public logLevel: string
  ) {}
}
