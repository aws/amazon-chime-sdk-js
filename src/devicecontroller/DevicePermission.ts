// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export enum DevicePermission {
  /**
   * Permission was granted to use the device, likely by the user.
   */
  PermissionGrantedByUser = 0,
  /**
   * Permission was granted to use the device, likely by the browser.
   */
  PermissionGrantedByBrowser = 1,
  /**
   * Permission to use the device was denied, likely by the user.
   */
  PermissionDeniedByUser = 2,
  /**
   * Permission to use the device was denied, likely by the browser.
   */
  PermissionDeniedByBrowser = 3,
  /**
   * Permission was granted to use the device because it is already in use.
   */
  PermissionGrantedPreviously = 4,
}

export default DevicePermission;
