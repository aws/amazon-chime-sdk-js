// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import DragType from '../../../src/dragobserver/DragType';
import DragAndZoomPresentationPolicy from '../../../src/presentation/policy/DragAndZoomPresentationPolicy';
import { ZoomType } from '../../../src/presentation/policy/PresentationPolicy';
import PresentationBoxType from '../../../src/presentation/PresentationBoxType';

describe('DragAndZoomPresentationPolicy', () => {
  describe('centerOrRemoveWhitespace', () => {
    it('centers when the content is smaller than the viewport', () => {
      chai.expect(DragAndZoomPresentationPolicy.centerOrRemoveWhitespaceDim(2, 0, 3)).to.equal(0.5);
    });

    it(`flushes when there's whitespace on the left`, () => {
      chai.expect(DragAndZoomPresentationPolicy.centerOrRemoveWhitespaceDim(3, 1, 2)).to.equal(0);
    });

    it(`flushes when there's whitespace on the right`, () => {
      chai.expect(DragAndZoomPresentationPolicy.centerOrRemoveWhitespaceDim(3, -2, 2)).to.equal(-1);
    });

    it(`does nothing when zoomed`, () => {
      chai.expect(DragAndZoomPresentationPolicy.centerOrRemoveWhitespaceDim(3, -1, 2)).to.equal(-1);
    });
  });

  describe('shouldScaleToFit', () => {
    it(`is true when there's a zoom reset event`, () => {
      chai.assert.isTrue(
        DragAndZoomPresentationPolicy.shouldScaleToFit([0, 0], [0, 0], {
          zoom: {
            type: ZoomType.RESET,
          },
        })
      );
    });

    it(`is true when the content width and height are smaller than viewport`, () => {
      chai.assert.isTrue(DragAndZoomPresentationPolicy.shouldScaleToFit([1, 1], [2, 2]));
    });

    it(`is false otherwise`, () => {
      chai.assert.isFalse(DragAndZoomPresentationPolicy.shouldScaleToFit([3, 2], [2, 2]));
    });
  });

  describe('calculate', () => {
    it(`returns scale to fit`, () => {
      chai
        .expect(
          new DragAndZoomPresentationPolicy().calculate(
            {
              ...Substitute.for(),
              contentPlacement: {
                dimensions: [1, 1],
                translations: [0, 0],
              },
              viewportDimensions: [3, 3],
              boxType: PresentationBoxType.NONE,
            },
            {
              zoom: {
                type: ZoomType.ZOOM,
                relativeFactor: 2,
              },
            }
          )
        )
        .to.eql({
          dimensions: [3, 3],
          translations: [0, 0],
        });
    });

    it(`returns scale to fit`, () => {
      chai
        .expect(
          new DragAndZoomPresentationPolicy().calculate(
            {
              ...Substitute.for(),
              sourceDimensions: [5, 5],
              contentPlacement: {
                dimensions: [1, 1],
                translations: [0, 0],
              },
              viewportDimensions: [3, 3],
              boxType: PresentationBoxType.NONE,
            },
            {
              zoom: {
                type: ZoomType.ZOOM,
                absoluteFactor: 2,
              },
            }
          )
        )
        .to.eql({
          dimensions: [10, 10],
          translations: [0, 0],
        });
    });

    it(`uses focus'`, () => {
      chai
        .expect(
          new DragAndZoomPresentationPolicy().calculate(
            {
              ...Substitute.for(),
              contentPlacement: {
                dimensions: [3, 3],
                translations: [0, 0],
              },
              viewportDimensions: [2, 2],
              focus: {
                normalizedContentFocus: [0.5, 0.5],
                normalizedViewportFocus: [0.5, 0.5],
              },
            },
            {
              drag: {
                type: DragType.DRAG,
                coords: [0, 0],
              },
            }
          )
        )
        .to.eql({
          dimensions: [3, 3],
          translations: [-0.5, -0.5],
        });
    });

    it(`centers and removes whitespace'`, () => {
      chai
        .expect(
          new DragAndZoomPresentationPolicy().calculate({
            ...Substitute.for(),
            contentPlacement: {
              dimensions: [3, 3],
              translations: [0, 0],
            },
            viewportDimensions: [2, 2],
          })
        )
        .to.eql({
          dimensions: [3, 3],
          translations: [0, 0],
        });
    });
  });
});
