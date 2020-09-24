// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import 'mocha';

import ResizeObserverAdapter from '../../src/resizeobserveradapter/ResizeObserverAdapter';
import ResizeObserverAdapterFactory from '../../src/resizeobserveradapter/ResizeObserverAdapterFactory';

describe('ResizeObserverAdapterFactory', () => {
  describe('create', () => {
    it('works without provider', () => {
      chai.expect(new ResizeObserverAdapterFactory().create(Substitute.for())).to.exist;
    });
  });

  describe('create', () => {
    it('works with provider', () => {
      chai.expect(
        new ResizeObserverAdapterFactory(() => Substitute.for<ResizeObserverAdapter>()).create(
          Substitute.for()
        )
      ).to.exist;
    });
  });
});
