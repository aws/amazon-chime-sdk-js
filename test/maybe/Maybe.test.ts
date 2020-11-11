// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import Maybe from '../../src/maybe/Maybe';

describe('Maybe', () => {
  describe('::of', () => {
    describe('with null', () => {
      it('is none', () => {
        chai.expect(Maybe.of(null).isNone).to.be.true;
      });
    });

    describe('with undefined', () => {
      it('is none', () => {
        chai.expect(Maybe.of(undefined).isNone).to.be.true;
      });
    });

    describe('without null', () => {
      it('is some', () => {
        chai.expect(Maybe.of('some').isSome).to.be.true;
      });
    });
  });
});
