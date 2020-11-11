// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MediaDeviceFactory]] creates a proxy for MediaDevices.
 */
export default interface MediaDeviceFactory {
  /**
   * Creates a MediaDevices proxy.
   */
  create(): MediaDevices;
}
