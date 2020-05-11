// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'mocha';

import { Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import PresentationElementFactory from '../../src/presentation/PresentationElementFactory';
import ScreenViewingImageDimensions from '../../src/screenviewing/messagehandler/ScreenViewingImageDimensions';

describe('PresentationSourceElement', () => {
  describe('createSource', () => {
    it('can retrieve properties', () => {
      const imageDimensions: SubstituteOf<ScreenViewingImageDimensions> = Substitute.for();
      imageDimensions.imageWidthPixels.returns(1);
      imageDimensions.imageHeightPixels.returns(2);

      const source = PresentationElementFactory.createSource(imageDimensions);

      chai.expect(source.getDimensions()).to.eql([1, 2]);
    });
  });
});
