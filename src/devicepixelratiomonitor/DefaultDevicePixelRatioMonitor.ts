// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DevicePixelRatioObserver from '../devicepixelratioobserver/DevicePixelRatioObserver';
import DevicePixelRatioSource from '../devicepixelratiosource/DevicePixelRatioSource';
import Logger from '../logger/Logger';
import DevicePixelRatioMonitor from './DevicePixelRatioMonitor';

export default class DefaultDevicePixelRatioMonitor implements DevicePixelRatioMonitor {
  private observerQueue: Set<DevicePixelRatioObserver>;

  constructor(private devicePixelRatioSource: DevicePixelRatioSource, logger: Logger) {
    this.observerQueue = new Set<DevicePixelRatioObserver>();
    if (typeof window !== 'undefined') {
      const mediaQueryList = matchMedia(
        `(resolution: ${this.devicePixelRatioSource.devicePixelRatio()}dppx)`
      );
      if (typeof mediaQueryList.addEventListener === 'function') {
        mediaQueryList.addEventListener('change', this.mediaQueryListener);
      } else if (typeof mediaQueryList.addListener === 'function') {
        mediaQueryList.addListener(this.mediaQueryListener);
      } else {
        logger.warn('ignoring DefaultDevicePixelRatioMonitor');
      }
    }
  }

  mediaQueryListener = (): void => {
    this.observerQueue.forEach(tileObserver => {
      tileObserver.devicePixelRatioChanged(this.devicePixelRatioSource.devicePixelRatio());
    });
  };

  registerObserver(observer: DevicePixelRatioObserver): void {
    this.observerQueue.add(observer);
    observer.devicePixelRatioChanged(this.devicePixelRatioSource.devicePixelRatio());
  }

  removeObserver(observer: DevicePixelRatioObserver): void {
    this.observerQueue.delete(observer);
  }
}
