// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class Message {
  constructor(
    public readonly type: string, // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    public readonly headers: any,
    public readonly payload: string
  ) {}
}
