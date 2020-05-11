// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import ScaleToFitPresentationPolicy from '../../../src/presentation/policy/ScaleToFitPresentationPolicy';
import PresentationBoxType from '../../../src/presentation/PresentationBoxType';

describe('ScaleToFitPresentationPolicy', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  it('fills window if no scale', () => {
    const placement = new ScaleToFitPresentationPolicy().calculate({
      ...Substitute.for(),
      boxType: PresentationBoxType.NONE,
      viewportDimensions: [200, 400],
    });
    expect(placement.dimensions).to.eql([200, 400]);
    expect(placement.translations).to.eql([0, 0]);
  });

  it('works for letterbox', () => {
    const placement = new ScaleToFitPresentationPolicy().calculate({
      ...Substitute.for(),
      sourceAspectRatio: 1,
      boxType: PresentationBoxType.LETTER_BOX,
      viewportDimensions: [100, 200],
    });
    expect(placement.dimensions).to.eql([100, 100]);
    expect(placement.translations).to.eql([0, 50]);
  });

  it('works for pillarbox', () => {
    const placement = new ScaleToFitPresentationPolicy().calculate({
      ...Substitute.for(),
      sourceAspectRatio: 1,
      boxType: PresentationBoxType.PILLAR_BOX,
      viewportDimensions: [200, 100],
    });
    expect(placement.dimensions).to.eql([100, 100]);
    expect(placement.translations).to.eql([50, 0]);
  });
});
