// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'mocha';

import { Arg, Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import { ResizeObserver } from 'resize-observer';

import DefaultResizeObserverAdapter from '../../src/resizeobserveradapter/DefaultResizeObserverAdapter';

describe('DefaultResizeObserverAdapter', () => {
  describe('observe', () => {
    it('fires', () => {
      const resizeObserver: SubstituteOf<ResizeObserver> = Substitute.for();

      const observerAdapter = new DefaultResizeObserverAdapter(resizeObserver);
      observerAdapter.observe(Substitute.for());

      resizeObserver.received().observe(Arg.any());
    });
  });

  describe('unobserve', () => {
    it('fires', () => {
      const resizeObserver: SubstituteOf<ResizeObserver> = Substitute.for();

      const observerAdapter = new DefaultResizeObserverAdapter(resizeObserver);
      observerAdapter.unobserve(Substitute.for());

      resizeObserver.received().unobserve(Arg.any());
    });
  });
});
