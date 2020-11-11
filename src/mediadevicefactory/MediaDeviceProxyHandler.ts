// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AsyncScheduler from '../scheduler/AsyncScheduler';
import IntervalScheduler from '../scheduler/IntervalScheduler';

type ListenerFunction = (
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
any;

export default class MediaDeviceProxyHandler implements ProxyHandler<MediaDevices> {
  private static INTERVAL_MS: number = 1000;

  private scheduler: IntervalScheduler | null = null;
  private devices: MediaDeviceInfo[] | null = null;
  private deviceChangeListeners: Set<EventListenerOrEventListenerObject> = new Set();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  get = (target: MediaDevices, property: PropertyKey, receiver: any): any => {
    if (!Reflect.has(target, property)) {
      return undefined;
    }
    if (!('ondevicechange' in navigator.mediaDevices)) {
      if (property === 'addEventListener') {
        return this.patchAddEventListener(target, property, receiver);
      } else if (property === 'removeEventListener') {
        return this.patchRemoveEventListener(target, property, receiver);
      }
    }
    const value = Reflect.get(target, property, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  };

  private patchAddEventListener = (
    target: MediaDevices,
    property: PropertyKey,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiver: any
  ): ListenerFunction => {
    const value = Reflect.get(target, property, receiver);
    return (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) => {
      if (type === 'devicechange') {
        this.deviceChangeListeners.add(listener);
        if (!this.scheduler) {
          this.scheduler = new IntervalScheduler(MediaDeviceProxyHandler.INTERVAL_MS);
          this.scheduler.start(this.pollDeviceLists);
        }
      } else {
        return Reflect.apply(value, target, [type, listener, options]);
      }
    };
  };

  private patchRemoveEventListener = (
    target: MediaDevices,
    property: PropertyKey,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiver: any
  ): ListenerFunction => {
    const value = Reflect.get(target, property, receiver);
    return (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ) => {
      if (type === 'devicechange') {
        this.deviceChangeListeners.delete(listener);
        if (this.deviceChangeListeners.size === 0 && this.scheduler) {
          this.scheduler.stop();
          this.scheduler = null;
        }
      } else {
        return Reflect.apply(value, target, [type, listener, options]);
      }
    };
  };

  private pollDeviceLists = async (): Promise<void> => {
    const newDevices = await this.sortedDeviceList();
    if (this.devices) {
      const changed =
        newDevices.length !== this.devices.length ||
        newDevices.some((device: MediaDeviceInfo, index: number) => {
          return device.deviceId !== this.devices[index].deviceId;
        });
      if (changed) {
        this.handleDeviceChangeEvent();
      }
    }
    this.devices = newDevices;
  };

  private async sortedDeviceList(): Promise<MediaDeviceInfo[]> {
    // @ts-ignore
    const newDevices = await navigator.mediaDevices.enumerateDevices();
    return newDevices.sort((device1: MediaDeviceInfo, device2: MediaDeviceInfo) => {
      if (device1.deviceId < device2.deviceId) {
        return 1;
      } else if (device1.deviceId > device2.deviceId) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  private handleDeviceChangeEvent(): void {
    for (const listener of this.deviceChangeListeners) {
      new AsyncScheduler().start(() => {
        /* istanbul ignore else */
        if (this.deviceChangeListeners.has(listener)) {
          const event = new Event('devicechange');
          if (typeof listener === 'function') {
            listener(event);
          } else {
            listener.handleEvent(event);
          }
        }
      });
    }
  }
}
