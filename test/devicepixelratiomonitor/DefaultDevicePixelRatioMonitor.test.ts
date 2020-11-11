// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultDevicePixelRatioMonitor from '../../src/devicepixelratiomonitor/DefaultDevicePixelRatioMonitor';
import DevicePixelRatioObserver from '../../src/devicepixelratioobserver/DevicePixelRatioObserver';
import DevicePixelRatioSource from '../../src/devicepixelratiosource/DevicePixelRatioSource';
import DevicePixelRatioWindowSource from '../../src/devicepixelratiosource/DevicePixelRatioWindowSource';
import NoOpLogger from '../../src/logger/NoOpLogger';
import TimeoutScheduler from '../../src/scheduler/TimeoutScheduler';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultDevicePixelRatioMonitor', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpLogger();

  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
  });

  afterEach(() => {
    if (domMockBuilder) {
      domMockBuilder.cleanup();
    }
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const monitor = new DefaultDevicePixelRatioMonitor(
        new DevicePixelRatioWindowSource(),
        logger
      );
      assert.exists(monitor);
    });

    it('can be constructed when both addEventListener and addListener do not exist on MediaQueryList', () => {
      delete MediaQueryList.prototype.addEventListener;
      delete MediaQueryList.prototype.addListener;

      const monitor = new DefaultDevicePixelRatioMonitor(
        new DevicePixelRatioWindowSource(),
        logger
      );
      assert.exists(monitor);
    });

    it('can be constructed when windows is not defined', () => {
      domMockBuilder.cleanup();
      const monitor = new DefaultDevicePixelRatioMonitor(
        new DevicePixelRatioWindowSource(),
        logger
      );
      assert.exists(monitor);
    });
  });

  describe('registerObserver', () => {
    it('can register an observer and call devicePixelRatioChanged two times', done => {
      let called = 0;
      const standardRatio = 1;
      const retinaRatio = 2;

      class TestDevicePixelRatioWindowSource implements DevicePixelRatioSource {
        devicePixelRatio(): number {
          if (called === 0) {
            return standardRatio;
          } else if (called === 1) {
            return retinaRatio;
          }
        }
      }

      class TestDevicePixelRatioObserver implements DevicePixelRatioObserver {
        devicePixelRatioChanged(newDevicePixelRatio: number): void {
          if (called === 0) {
            expect(newDevicePixelRatio).to.equal(standardRatio);
          } else if (called === 1) {
            expect(newDevicePixelRatio).to.equal(retinaRatio);
            done();
          }
          called += 1;
        }
      }

      const monitor = new DefaultDevicePixelRatioMonitor(
        new TestDevicePixelRatioWindowSource(),
        logger
      );
      monitor.registerObserver(new TestDevicePixelRatioObserver());
    });

    it('can use addListener if MediaQueryList does not support addEventListener', done => {
      delete MediaQueryList.prototype.addEventListener;

      let called = 0;
      const standardRatio = 1;
      const retinaRatio = 2;

      class TestDevicePixelRatioWindowSource implements DevicePixelRatioSource {
        devicePixelRatio(): number {
          if (called === 0) {
            return standardRatio;
          } else if (called === 1) {
            return retinaRatio;
          }
        }
      }

      class TestDevicePixelRatioObserver implements DevicePixelRatioObserver {
        devicePixelRatioChanged(newDevicePixelRatio: number): void {
          if (called === 0) {
            expect(newDevicePixelRatio).to.equal(standardRatio);
          } else if (called === 1) {
            expect(newDevicePixelRatio).to.equal(retinaRatio);
            done();
          }
          called += 1;
        }
      }

      const monitor = new DefaultDevicePixelRatioMonitor(
        new TestDevicePixelRatioWindowSource(),
        logger
      );
      monitor.registerObserver(new TestDevicePixelRatioObserver());
    });
  });

  describe('removeObserver', () => {
    it("should not call devicePixelRatioChanged if it's removing an observer", done => {
      let called = 0;

      class TestDevicePixelRatioObserver implements DevicePixelRatioObserver {
        devicePixelRatioChanged(_newDevicePixelRatio: number): void {
          if (called === 1) {
            done(new Error('Should not be called twice.'));
          }
          called += 1;
        }
      }

      const monitor = new DefaultDevicePixelRatioMonitor(
        new DevicePixelRatioWindowSource(),
        logger
      );
      const observer = new TestDevicePixelRatioObserver();
      monitor.registerObserver(observer);
      monitor.removeObserver(observer);

      new TimeoutScheduler(domMockBehavior.asyncWaitMs * 2).start(() => {
        done();
      });
    });
  });
});
