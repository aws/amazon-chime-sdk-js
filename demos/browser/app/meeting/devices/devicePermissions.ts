// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type DeviceKind = 'microphone' | 'camera';

// Firefox answers `granted` after a one-time grant on an earlier visit, so getUserMedia may still prompt.
export async function permissionState(kind: DeviceKind): Promise<PermissionState | 'unknown'> {
  try {
    const status = await navigator.permissions.query({ name: kind as PermissionName });
    return status.state;
  } catch {
    return 'unknown';
  }
}
