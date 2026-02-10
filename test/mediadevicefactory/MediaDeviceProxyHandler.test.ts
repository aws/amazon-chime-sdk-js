// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import MediaDeviceProxyHandler from '../../src/mediadevicefactory/MediaDeviceProxyHandler';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';
import { createFakeTimers } from '../utils/fakeTimerHelper';

describe('MediaDeviceProxyHandler', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  let mediaDeviceWrapper: MediaDevices;
  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;
  let clock: sinon.SinonFakeTimers;

  function getMediaDeviceInfo(
    deviceId: string,
    kind: MediaDeviceKind,
    label: string
  ): MediaDeviceInfo {
    // @ts-ignore
    return {
      deviceId,
      kind,
      label,
    };
  }

  beforeEach(() => {
    clock = createFakeTimers();
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    mediaDeviceWrapper = new Proxy<MediaDevices>(
      navigator.mediaDevices,
      new MediaDeviceProxyHandler()
    );
  });

  afterEach(() => {
    clock.restore();
    if (domMockBuilder) {
      try {
        domMockBuilder.cleanup();
      } catch (e) {}
    }
  });

  describe('Using MediaDevices.ondevicechange', () => {
    it('receives a device change event', async () => {
      let callCount = 0;
      mediaDeviceWrapper.addEventListener('devicechange', () => {
        callCount += 1;
      });

      await clock.tickAsync(domMockBehavior.asyncWaitMs);
      navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      await navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      await clock.tickAsync(domMockBehavior.asyncWaitMs);
      expect(callCount).to.equal(3);
    });

    it('stops receiving a device change event', async () => {
      let callCount = 0;
      const listener = (): void => {
        callCount += 1;
      };
      mediaDeviceWrapper.addEventListener('devicechange', listener);

      await clock.tickAsync(domMockBehavior.asyncWaitMs);
      navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      mediaDeviceWrapper.removeEventListener('devicechange', listener);
      await clock.tickAsync(domMockBehavior.asyncWaitMs);
      navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
      expect(callCount).to.equal(1);
    });

    it('returns null for ondevicechange', () => {
      expect(mediaDeviceWrapper.ondevicechange).to.equal(null);
    });
  });

  describe('Not using MediaDevices.ondevicechange', () => {
    beforeEach(() => {
      domMockBehavior.mediaDeviceOnDeviceChangeSupported = false;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);
      mediaDeviceWrapper = new Proxy<MediaDevices>(
        navigator.mediaDevices,
        new MediaDeviceProxyHandler()
      );
    });

    it('does not receive an event if a device list does not change', async () => {
      let callCount = 0;
      const listener = (): void => {
        callCount += 1;
      };
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('1', 'audioinput', 'label'),
        getMediaDeviceInfo('2', 'videoinput', 'label'),
        getMediaDeviceInfo('3', 'audiooutput', 'label'),
      ];
      mediaDeviceWrapper.addEventListener('devicechange', listener);
      await clock.tickAsync(2500);
      mediaDeviceWrapper.removeEventListener('devicechange', listener);
      expect(callCount).to.equal(0);
    });

    it('receives an event if a device list changes', async () => {
      let callCount1 = 0;
      let callCount2 = 0;
      let callCount3 = 0;
      const listener1 = (): void => {
        callCount1 += 1;
      };
      const listener2 = (): void => {
        callCount2 += 1;
      };
      const listener3 = (): void => {
        callCount3 += 1;
      };
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('1', 'audioinput', 'label'),
        getMediaDeviceInfo('2', 'videoinput', 'label'),
        getMediaDeviceInfo('3', 'audiooutput', 'label'),
      ];
      mediaDeviceWrapper.addEventListener('devicechange', listener1);
      mediaDeviceWrapper.addEventListener('devicechange', listener2);
      mediaDeviceWrapper.addEventListener('devicechange', listener3);
      await clock.tickAsync(1500);

      // Only the ID changes.
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('1', 'audioinput', 'label'),
        getMediaDeviceInfo('1', 'videoinput', 'label'),
        getMediaDeviceInfo('3', 'audiooutput', 'label'),
      ];
      await clock.tickAsync(1000);
      mediaDeviceWrapper.removeEventListener('devicechange', listener1);

      // The number of devices changes.
      domMockBehavior.enumerateDeviceList = [];

      await clock.tickAsync(1000);
      mediaDeviceWrapper.removeEventListener('devicechange', listener2);
      mediaDeviceWrapper.removeEventListener('devicechange', listener3);

      // listener1 was removed before the last device change.
      expect(callCount1).to.equal(1);
      expect(callCount2).to.equal(2);
      expect(callCount3).to.equal(2);
    });

    it('handles events other than devicechange', async () => {
      let callCount = 0;
      const listener = (): void => {
        callCount += 1;
      };
      mediaDeviceWrapper.addEventListener('testevent', listener);
      mediaDeviceWrapper.dispatchEvent(new Event('testevent'));
      await clock.tickAsync(2500);
      mediaDeviceWrapper.removeEventListener('testevent', listener);
      expect(callCount).to.equal(1);
    });

    it('handles an EventListenerObject listener', async () => {
      let callCount = 0;
      const listener: EventListenerObject = {
        handleEvent: () => {
          callCount += 1;
        },
      };
      domMockBehavior.enumerateDeviceList = [
        getMediaDeviceInfo('1', 'audioinput', 'label'),
        getMediaDeviceInfo('2', 'videoinput', 'label'),
        getMediaDeviceInfo('3', 'audiooutput', 'label'),
      ];
      mediaDeviceWrapper.addEventListener('devicechange', listener);
      await clock.tickAsync(1500);
      domMockBehavior.enumerateDeviceList = [];
      await clock.tickAsync(1000);
      mediaDeviceWrapper.removeEventListener('devicechange', listener);
      expect(callCount).to.equal(1);
    });
  });

  describe('Common', () => {
    it('returns undefined if no property is found', () => {
      // @ts-ignore
      expect(mediaDeviceWrapper.test).to.be.undefined;
    });

    it('has MediaDevices methods', () => {
      expect(mediaDeviceWrapper.enumerateDevices).to.exist;
      expect(mediaDeviceWrapper.getSupportedConstraints).to.exist;
      expect(mediaDeviceWrapper.getUserMedia).to.exist;
      expect(mediaDeviceWrapper.addEventListener).to.exist;
      expect(mediaDeviceWrapper.removeEventListener).to.exist;
    });
  });
});
