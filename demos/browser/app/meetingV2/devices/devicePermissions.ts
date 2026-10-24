// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type DeviceKind = 'microphone' | 'camera';

/**
 * Whether the site already holds microphone or camera permission, from the Permissions API.
 * Browsers that remember the grant only for a visit (Firefox and Safari unless "remember" was
 * chosen) still hide device names until the page itself opens a device, so a `granted` answer
 * means a getUserMedia call will succeed without a prompt. `unknown` where the API is missing.
 */
export async function permissionState(kind: DeviceKind): Promise<PermissionState | 'unknown'> {
  try {
    const status = await navigator.permissions.query({ name: kind as PermissionName });
    return status.state;
  } catch {
    return 'unknown';
  }
}
