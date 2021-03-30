// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Destroyable from '../destroyable/Destroyable';
import DevicePixelRatioObserver from '../devicepixelratioobserver/DevicePixelRatioObserver';
import DevicePixelRatioSource from '../devicepixelratiosource/DevicePixelRatioSource';
import Logger from '../logger/Logger';
import DevicePixelRatioMonitor from './DevicePixelRatioMonitor';

export default class DefaultDevicePixelRatioMonitor
  implements DevicePixelRatioMonitor, Destroyable {
  private observerQueue = new Set<DevicePixelRatioObserver>();
  private mediaQueryList: undefined | MediaQueryList;

  constructor(private devicePixelRatioSource: DevicePixelRatioSource, logger: Logger) {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = matchMedia(
      `(resolution: ${this.devicePixelRatioSource.devicePixelRatio()}dppx)`
    );
    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', this.mediaQueryListener);
      this.mediaQueryList = mediaQueryList;
    } else if (typeof mediaQueryList.addListener === 'function') {
      mediaQueryList.addListener(this.mediaQueryListener);
      this.mediaQueryList = mediaQueryList;
    } else {
      logger.warn('ignoring DefaultDevicePixelRatioMonitor');
    }
  }

  async destroy(): Promise<void> {
    if (this.mediaQueryList) {
      if (typeof this.mediaQueryList.addEventListener === 'function') {
        this.mediaQueryList.removeEventListener('change', this.mediaQueryListener);
      } else {
        this.mediaQueryList.removeListener(this.mediaQueryListener);
      }
    }
    delete this.mediaQueryListener;
    this.observerQueue.clear();
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
