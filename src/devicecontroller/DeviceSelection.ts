// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class DeviceSelection {
  constraints: MediaStreamConstraints;
  stream: MediaStream;
  groupId: string = '';

  matchesConstraints(constraints: MediaStreamConstraints): boolean {
    return JSON.stringify(this.constraints) === JSON.stringify(constraints);
  }
}
