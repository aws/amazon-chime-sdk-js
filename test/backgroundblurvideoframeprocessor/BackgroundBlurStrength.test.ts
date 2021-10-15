// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import BlurStrength, {
  BlurStrengthMapper,
} from '../../src/backgroundblurvideoframeprocessor/BackgroundBlurStrength';

describe('BackgroundBlurStrength', () => {
  let expect: Chai.ExpectStatic;

  before(() => {
    expect = chai.expect;
  });

  it('blur strength amount', () => {
    expect(() => BlurStrengthMapper.getBlurAmount(null, { height: 1 })).to.throw();
    expect(() => BlurStrengthMapper.getBlurAmount(0, { height: 1 })).to.throw();

    // 360P
    expect(BlurStrengthMapper.getBlurAmount(BlurStrength.LOW, { height: 360 })).to.be.equal(5);
    expect(BlurStrengthMapper.getBlurAmount(BlurStrength.MEDIUM, { height: 360 })).to.be.equal(10);
    expect(BlurStrengthMapper.getBlurAmount(BlurStrength.HIGH, { height: 360 })).to.be.equal(20);
    expect(BlurStrengthMapper.getBlurAmount(25, { height: 360 })).to.be.equal(17);

    // 540P
    expect(BlurStrengthMapper.getBlurAmount(BlurStrength.LOW, { height: 540 })).to.be.equal(7);
    expect(BlurStrengthMapper.getBlurAmount(BlurStrength.MEDIUM, { height: 540 })).to.be.equal(15);
    expect(BlurStrengthMapper.getBlurAmount(BlurStrength.HIGH, { height: 540 })).to.be.equal(30);
    expect(BlurStrengthMapper.getBlurAmount(25, { height: 540 })).to.be.equal(25);

    // 720P
    expect(BlurStrengthMapper.getBlurAmount(BlurStrength.LOW, { height: 720 })).to.be.equal(9);
    expect(BlurStrengthMapper.getBlurAmount(BlurStrength.MEDIUM, { height: 720 })).to.be.equal(20);
    expect(BlurStrengthMapper.getBlurAmount(BlurStrength.HIGH, { height: 720 })).to.be.equal(40);
    expect(BlurStrengthMapper.getBlurAmount(25, { height: 720 })).to.be.equal(33);
  });
});
