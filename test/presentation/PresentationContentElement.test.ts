// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import 'mocha';

import PresentationElementFactory from '../../src/presentation/PresentationElementFactory';

describe('PresentationContentElement', () => {
  describe('createContent', () => {
    it('can retrieve properties', () => {
      const style: SubstituteOf<CSSStyleDeclaration> = Substitute.for();
      style.position.returns('position-1');
      style.width.returns('1px');
      style.height.returns('2px');
      style.left.returns('3px');
      style.top.returns('4px');

      const element: SubstituteOf<HTMLElement> = Substitute.for();
      element.style.returns(style);

      const window: SubstituteOf<Window> = Substitute.for();
      window.getComputedStyle(Arg.any()).returns(style);

      const content = PresentationElementFactory.createContent(element, window);

      chai.expect(content.getDimensions()).to.eql([1, 2]);
      chai.expect(content.getTranslations()).to.eql([3, 4]);
      chai.expect(content.getPosition()).to.equal('position-1');
    });

    it('can set properties', () => {
      const style: SubstituteOf<CSSStyleDeclaration> = Substitute.for();
      const element: SubstituteOf<HTMLElement> = Substitute.for();
      element.style.returns(style);

      const window: SubstituteOf<Window> = Substitute.for();

      const content = PresentationElementFactory.createContent(element, window);
      content.setDimensions([1, 1]);
      content.setTranslations([2, 2]);
      content.setPosition('position-2');

      style.received().width = '1px';
      style.received().height = '1px';
      style.received().left = '2px';
      style.received().top = '2px';
      style.received().position = 'position-2';
    });
  });
});
