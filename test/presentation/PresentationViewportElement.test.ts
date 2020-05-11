// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'mocha';

import { Arg, Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import PresentationElementFactory from '../../src/presentation/PresentationElementFactory';

describe('PresentationViewportElement', () => {
  describe('createViewport', () => {
    it('can retrieve properties', () => {
      const element: SubstituteOf<HTMLElement> = Substitute.for();

      const style: SubstituteOf<CSSStyleDeclaration> = Substitute.for();
      style.width.returns('1px');
      style.height.returns('2px');

      const window: SubstituteOf<Window> = Substitute.for();
      window.getComputedStyle(Arg.any()).returns(style);

      const viewport = PresentationElementFactory.createViewport(element, window);

      chai.expect(viewport.getDimensions()).to.eql([1, 2]);
    });

    it('can set properties', () => {
      const style: SubstituteOf<CSSStyleDeclaration> = Substitute.for();
      const element: SubstituteOf<HTMLElement> = Substitute.for();
      element.style.returns(style);

      const window: SubstituteOf<Window> = Substitute.for();

      const viewport = PresentationElementFactory.createViewport(element, window);
      viewport.setOverflow('overflow');
      viewport.setPosition('position');

      style.received().overflow = 'overflow';
      style.received().position = 'position';
    });
  });
});
