// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import Maybe from '../../src/maybe/Maybe';
import Some from '../../src/maybe/Some';

describe('Some', () => {
  const value = 'string';
  const subject = Some.of(value);

  describe('isNone', () => {
    it('is true', () => {
      chai.expect(subject.isNone).to.be.false;
    });
  });

  describe('isSome', () => {
    it('is false', () => {
      chai.expect(subject.isSome).to.be.true;
    });
  });

  describe('#get', () => {
    it('is value', () => {
      chai.expect(subject.get()).to.eql(value);
    });
  });

  describe('#getOrElse', () => {
    it('is value', () => {
      chai.expect(subject.getOrElse('other')).to.eql(value);
    });
  });

  describe('#flatMap', () => {
    it('is flatMapped', () => {
      chai.expect(subject.flatMap(f => Maybe.of(f))).to.eql(Some.of(value));
    });
  });

  describe('#map', () => {
    it('is mapped', () => {
      chai.expect(subject.map(f => f.toUpperCase())).to.eql(Some.of('STRING'));
    });
  });

  describe('::of', () => {
    describe('with null', () => {
      it('is thrown', () => {
        const value: string = null;
        chai
          .expect(() => {
            Some.of(value);
          })
          .to.throw();
      });
    });

    describe('without null', () => {
      it('is thrown', () => {
        const value = 'string';
        chai.expect(Some.of(value).isSome).to.be.true;
      });
    });
  });

  describe('#defaulting', () => {
    it('is value', () => {
      chai.expect(Some.of('value').defaulting('any').get()).to.eq('value');
    });
  });
});
