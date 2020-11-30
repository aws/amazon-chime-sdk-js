// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MediaDeviceFactory from './MediaDeviceFactory';
import MediaDeviceProxyHandler from './MediaDeviceProxyHandler';

export default class DefaultMediaDeviceFactory implements MediaDeviceFactory {
  private isMediaDevicesSupported: boolean;

  constructor() {
    this.isMediaDevicesSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices;
  }

  create(): MediaDevices {
    if (!this.isMediaDevicesSupported) {
      throw new Error(`navigator.mediaDevices is not supported`);
    } else {
      return new Proxy<MediaDevices>(navigator.mediaDevices, new MediaDeviceProxyHandler());
    }
  }
}
