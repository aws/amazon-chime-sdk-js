// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DevicePixelRatioWindowSource from '../../src/devicepixelratiosource/DevicePixelRatioWindowSource';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DevicePixelRatioWindowSource', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  let domMockBuilder: DOMMockBuilder;
  let domMockBehavior: DOMMockBehavior;

  afterEach(() => {
    domMockBuilder.cleanup();
  });

  describe('devicePixelRatio', () => {
    it('will return 1 if devicePixelRatio does not exist in window', () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.devicePixelRatio = null;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      const source = new DevicePixelRatioWindowSource();
      expect(source.devicePixelRatio()).to.equal(1);
    });

    it("will return window's devicePixelRatio", () => {
      domMockBehavior = new DOMMockBehavior();
      domMockBehavior.devicePixelRatio = 2;
      domMockBuilder = new DOMMockBuilder(domMockBehavior);

      const source = new DevicePixelRatioWindowSource();
      expect(source.devicePixelRatio()).to.equal(2);
    });
  });
});
