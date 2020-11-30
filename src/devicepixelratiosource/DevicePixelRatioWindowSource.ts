// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DevicePixelRatioSource from './DevicePixelRatioSource';

export default class DevicePixelRatioWindowSource implements DevicePixelRatioSource {
  devicePixelRatio(): number {
    if (typeof window === 'undefined' || !window || !window.devicePixelRatio) {
      return 1;
    }
    return window.devicePixelRatio;
  }
}
