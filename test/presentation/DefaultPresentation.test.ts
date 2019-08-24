// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import DragType from '../../src/dragobserver/DragType';
import { DefaultPresentation } from '../../src/index';
import PresentationPolicy from '../../src/presentation/policy/PresentationPolicy';
import PresentationBoxType from '../../src/presentation/PresentationBoxType';
import PresentationContentElement from '../../src/presentation/PresentationContentElement';
import PresentationSourceElement from '../../src/presentation/PresentationSourceElement';
import PresentationViewportElement from '../../src/presentation/PresentationViewportElement';

describe('DefaultPresentation', () => {
  describe('cssPixels', () => {
    it('converts numbers into pixel strings', () => {
      chai.expect(DefaultPresentation.cssPixels(1)).to.equal('1px');
    });
  });

  describe('boxType', () => {
    it('produces letter', () => {
      chai
        .expect(DefaultPresentation.boxType(4 / 3, 3 / 2))
        .to.equal(PresentationBoxType.PILLAR_BOX);
    });

    it('produces pillar', () => {
      chai.expect(DefaultPresentation.boxType(3 / 2, 4 / 3)).to.eql(PresentationBoxType.LETTER_BOX);
    });

    it('produces none', () => {
      chai.expect(DefaultPresentation.boxType(4 / 3, 4 / 3)).to.eql(PresentationBoxType.NONE);
    });
  });

  describe('contentFocus', () => {
    it('provides center for no drag', () => {
      chai.expect(DefaultPresentation.contentFocus(Substitute.for())).to.eql([0.5, 0.5]);
    });

    it('provides center for end drag', () => {
      chai
        .expect(
          DefaultPresentation.contentFocus(Substitute.for(), {
            ...Substitute.for(),
            type: DragType.END,
          })
        )
        .to.eql([0.5, 0.5]);
    });

    it('calculates for begin', () => {
      chai
        .expect(
          DefaultPresentation.contentFocus(
            {
              dimensions: [15, 10],
              translations: [2, 2],
            },
            {
              type: DragType.BEGIN,
              coords: [3, 3],
            }
          )
        )
        .to.eql([1 / 15, 0.1]);
    });

    it('uses last for drag', () => {
      chai
        .expect(
          DefaultPresentation.contentFocus(
            {
              dimensions: [15, 10],
              translations: [2, 2],
            },
            {
              type: DragType.DRAG,
              coords: [2, 2],
              last: {
                type: DragType.BEGIN,
                coords: [5, 5],
              },
            }
          )
        )
        .to.eql([0.2, 0.3]);
    });
  });

  describe('viewportFocus', () => {
    it('provides center for no drag', () => {
      chai.expect(DefaultPresentation.viewportFocus([10, 10])).to.eql([0.5, 0.5]);
    });

    it('provides center for end drag', () => {
      chai
        .expect(
          DefaultPresentation.viewportFocus([10, 10], {
            ...Substitute.for(),
            type: DragType.END,
          })
        )
        .to.eql([0.5, 0.5]);
    });

    it('calculates for drag', () => {
      chai
        .expect(
          DefaultPresentation.viewportFocus([10, 10], {
            type: DragType.DRAG,
            coords: [2, 2],
          })
        )
        .to.eql([0.2, 0.2]);
    });
  });

  describe('present', () => {
    it('calculates and sets', () => {
      const source: SubstituteOf<PresentationSourceElement> = Substitute.for();
      source.getDimensions().returns([1, 2]);

      const viewport: SubstituteOf<PresentationViewportElement> = Substitute.for();
      viewport.getDimensions().returns([3, 4]);

      const content: SubstituteOf<PresentationContentElement> = Substitute.for();
      content.getDimensions().returns([5, 6]);
      content.getTranslations().returns([7, 8]);

      const policy: SubstituteOf<PresentationPolicy> = Substitute.for();
      policy.calculate(Arg.any(), Arg.any()).returns({
        dimensions: [10, 11],
        translations: [12, 13],
      });

      new DefaultPresentation().present(source, viewport, content, policy);

      policy.received().calculate(Arg.any(), Arg.any());
      viewport.received().setOverflow(Arg.any());
      viewport.received().setPosition(Arg.any());
      content.received().setPosition(Arg.any());
      content.received().setDimensions(Arg.any());
      content.received().setTranslations(Arg.any());
    });
  });
});
