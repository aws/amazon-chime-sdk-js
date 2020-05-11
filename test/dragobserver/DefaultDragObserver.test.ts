// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import DefaultDragObserver from '../../src/dragobserver/DefaultDragObserver';

describe('DefaultDragObserver', () => {
  describe('elementRelativeCoords', () => {
    it('returns a task', () => {
      chai
        .expect(
          DefaultDragObserver.elementRelativeCoords(
            {
              ...Substitute.for(),
              clientX: 5,
              clientY: 5,
            },
            {
              ...Substitute.for(),
              getBoundingClientRect(): DOMRect {
                return {
                  ...Substitute.for(),
                  left: 2,
                  top: 2,
                };
              },
            }
          )
        )
        .to.eql([3, 3]);
    });
  });

  describe('mouseDownEventListener', () => {
    it('calls the drag callback', (done: MochaDone) => {
      const rect: DOMRect = {
        ...Substitute.for(),
        left: 2,
        top: 2,
      };
      const element: SubstituteOf<HTMLElement> = Substitute.for();
      element.getBoundingClientRect().returns(rect);

      const event: MouseEvent = {
        ...Substitute.for<MouseEvent>(),
        clientX: 2,
        clientY: 2,
      };
      DefaultDragObserver.mouseDownEventListener(
        Substitute.for(),
        () => {
          done();
        },
        element
      )(event);
    });
  });

  describe('mouseMoveEventListener', () => {
    it(`doesn't call the drag callback when no mouse down`, () => {
      DefaultDragObserver.mouseMoveEventListener(
        { isMouseDown: false },
        Substitute.for,
        Substitute.for()
      )(Substitute.for());
    });

    it('calls the drag callback', (done: MochaDone) => {
      const rect: DOMRect = {
        ...Substitute.for(),
        left: 2,
        top: 2,
      };
      const element: SubstituteOf<HTMLElement> = Substitute.for();
      element.getBoundingClientRect().returns(rect);

      const event: MouseEvent = {
        ...Substitute.for<MouseEvent>(),
        clientX: 2,
        clientY: 2,
      };
      DefaultDragObserver.mouseMoveEventListener(
        {
          isMouseDown: true,
        },
        () => {
          done();
        },
        element
      )(event);
    });
  });

  describe('mouseUpEventListener', () => {
    it(`doesn't call the drag callback when no mouse down`, () => {
      DefaultDragObserver.mouseUpEventListener(
        { isMouseDown: false },
        Substitute.for,
        Substitute.for()
      )(Substitute.for());
    });

    it('calls the drag callback', (done: MochaDone) => {
      const rect: DOMRect = {
        ...Substitute.for(),
        left: 2,
        top: 2,
      };
      const element: SubstituteOf<HTMLElement> = Substitute.for();
      element.getBoundingClientRect().returns(rect);

      const event: MouseEvent = {
        ...Substitute.for<MouseEvent>(),
        clientX: 2,
        clientY: 2,
      };
      DefaultDragObserver.mouseUpEventListener(
        Substitute.for(),
        () => {
          done();
        },
        element
      )(event);
    });
  });

  describe('observe', () => {
    it('adds event listeners', () => {
      const window: SubstituteOf<Window> = Substitute.for();
      const element: SubstituteOf<HTMLElement> = Substitute.for();

      new DefaultDragObserver(window, element, () => {});

      element.received().addEventListener('mousedown', Arg.any());
      window.received().addEventListener('mousemove', Arg.any());
      window.received().addEventListener('mouseup', Arg.any());
    });
  });

  describe('unobserve', () => {
    it('adds event listeners', () => {
      const window: SubstituteOf<Window> = Substitute.for();
      const element: SubstituteOf<HTMLElement> = Substitute.for();

      new DefaultDragObserver(window, element, () => {}).unobserve();

      element.received().removeEventListener('mousedown', Arg.any());
      window.received().removeEventListener('mousemove', Arg.any());
      window.received().removeEventListener('mouseup', Arg.any());
    });
  });
});
