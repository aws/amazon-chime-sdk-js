// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import Maybe from '../../src/maybe/Maybe';
import None from '../../src/maybe/None';

describe('None', () => {
  const subject = None.of();

  describe('isNone', () => {
    it('is true', () => {
      chai.expect(subject.isNone).to.be.true;
    });
  });

  describe('isSome', () => {
    it('is false', () => {
      chai.expect(subject.isSome).to.be.false;
    });
  });

  describe('#map', () => {
    it('is mapped', () => {
      chai.expect(subject.map(f => f)).to.eql(None.of());
    });
  });

  describe('#flatMap', () => {
    it('is flatMapped', () => {
      chai.expect(subject.flatMap(f => Maybe.of(f))).to.eql(None.of());
    });
  });

  describe('#get', () => {
    it('is error', () => {
      chai
        .expect(() => {
          subject.get();
        })
        .to.throw();
    });
  });

  describe('#getOrElse', () => {
    it('is value', () => {
      const value = 'foo';
      chai.expect(subject.getOrElse(value)).to.eql(value);
    });
  });

  describe('::of', () => {
    it('is none', () => {
      chai.expect(None.of().isNone).to.be.true;
    });
  });

  describe('#defaulting', () => {
    it('is default', () => {
      chai.expect(None.of().defaulting('any').get()).to.eq('any');
    });
  });
});
