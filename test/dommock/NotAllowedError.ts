// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class NotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotAllowedError';
  }
}
