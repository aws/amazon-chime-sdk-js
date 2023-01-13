// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpDebugLogger from '../../src/logger/NoOpDebugLogger';
import MLVideoFxConfig from '../../src/mlvideofx/MLVideoFxConfig';
import MLVideoFxDriver from '../../src/mlvideofx/MLVideoFxDriver';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('MLVideoFxDriver', () => {
  const assert: Chai.AssertStatic = chai.assert;
  const expect: Chai.ExpectStatic = chai.expect;
  const logger = new NoOpDebugLogger();
  let domMockBehavior: DOMMockBehavior;
  let domMockBuilder: DOMMockBuilder;
  let driver: MLVideoFxDriver;
  const config: MLVideoFxConfig = {
    blueShiftEnabled: false,
    redShiftEnabled: false,
  };

  beforeEach(() => {
    domMockBehavior = new DOMMockBehavior();
    domMockBuilder = new DOMMockBuilder(domMockBehavior);
    driver = new MLVideoFxDriver(logger, config);
  });

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const config_construct: MLVideoFxConfig = {
        blueShiftEnabled: false,
        redShiftEnabled: false,
      };
      const driver_construct = new MLVideoFxDriver(logger, config_construct);
      assert.exists(driver_construct);
    });
  });

  describe('set blue shift', () => {
    it('Toggle blue shift on/off', () => {
      driver.setBlueShiftState(true);
      expect(driver.getEffectConfig().blueShiftEnabled).to.be.true;
      driver.setBlueShiftState(false);
      expect(driver.getEffectConfig().blueShiftEnabled).to.be.false;
    });
  });

  describe('set red shift', () => {
    it('Toggle red shift on/off', () => {
      driver.setRedShiftState(true);
      expect(driver.getEffectConfig().redShiftEnabled).to.be.true;
      driver.setRedShiftState(false);
      expect(driver.getEffectConfig().redShiftEnabled).to.be.false;
    });
  });

  describe('apply function', () => {
    it('Apply red shift', async () => {
      // create dummy 10x10 empty image
      const dummyData = new Uint8ClampedArray(10 * 10 * 4);
      const dummyInputImage = new ImageData(dummyData, 10, 10);
      driver.setRedShiftState(true);
      expect((await driver.apply(dummyInputImage)).data[0]).equal(255);
      driver.setRedShiftState(false);
    });

    it('Apply blue shift', async () => {
      // create dummy 10x10 empty image
      const dummyData = new Uint8ClampedArray(10 * 10 * 4);
      const dummyInputImage = new ImageData(dummyData, 10, 10);
      driver.setBlueShiftState(true);
      expect((await driver.apply(dummyInputImage)).data[2]).equal(255);
      driver.setBlueShiftState(false);
    });
  });

});
