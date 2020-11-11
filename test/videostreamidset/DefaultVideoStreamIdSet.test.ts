// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DefaultVideoStreamIdSet from '../../src/videostreamidset/DefaultVideoStreamIdSet';

describe('DefaultVideoStreamIdSet', () => {
  let assert: Chai.AssertStatic;
  let expect: Chai.ExpectStatic;

  beforeEach(() => {
    assert = chai.assert;
    expect = chai.expect;
  });

  describe('construction', () => {
    it('can be constructed', () => {
      const testSet = new DefaultVideoStreamIdSet();
      assert.exists(testSet);
      const testSet2 = new DefaultVideoStreamIdSet([0, 1, 2]);
      assert.exists(testSet2);
    });
  });

  describe('add', () => {
    it('adds elements', () => {
      const set = new DefaultVideoStreamIdSet();
      set.add(1);
      set.add(7);
      set.add(3);
      expect(set.array()).to.deep.equal([1, 3, 7]);
    });
  });

  describe('equal', () => {
    it('returns true if two sets are equivalent', () => {
      const set = new DefaultVideoStreamIdSet();
      set.add(1);
      set.add(7);
      set.add(3);
      const other = new DefaultVideoStreamIdSet();
      other.add(3);
      other.add(1);
      other.add(7);
      expect(set.equal(other)).to.equal(true);
    });

    it('returns false if two sets are not equivalent', () => {
      const set = new DefaultVideoStreamIdSet();
      set.add(1);
      set.add(7);
      set.add(3);
      const other = new DefaultVideoStreamIdSet();
      other.add(3);
      other.add(1);
      expect(set.equal(other)).to.equal(false);
      const other2 = new DefaultVideoStreamIdSet();
      other2.add(3);
      other2.add(1);
      other2.add(90);
      expect(set.equal(other2)).to.equal(false);
    });

    it('returns true when empty equals an empty set', () => {
      const set = new DefaultVideoStreamIdSet();
      const other = new DefaultVideoStreamIdSet();
      expect(set.equal(other)).to.equal(true);
    });

    it('returns true when empty equals a null set', () => {
      const set = new DefaultVideoStreamIdSet();
      expect(set.equal(null)).to.equal(true);
    });

    it('returns true when non-empty does not equal a null set', () => {
      const set = new DefaultVideoStreamIdSet();
      set.add(7);
      expect(set.equal(null)).to.equal(false);
    });
  });

  describe('contains', () => {
    it('returns true when set contains an id', () => {
      const set = new DefaultVideoStreamIdSet();
      set.add(6);
      expect(set.contain(6)).to.equal(true);
    });

    it('returns false when set does not contain an id', () => {
      const set = new DefaultVideoStreamIdSet();
      set.add(2348934);
      expect(set.contain(123)).to.equal(false);
    });
  });

  describe('size', () => {
    it('returns size of set', () => {
      const set = new DefaultVideoStreamIdSet();
      expect(set.size()).to.equal(0);
      set.add(10);
      expect(set.size()).to.equal(1);
    });
  });

  describe('remove', () => {
    it('can remove an existing item', () => {
      const set = new DefaultVideoStreamIdSet();
      set.add(10);
      expect(set.contain(10)).to.equal(true);
      set.remove(1);
      expect(set.contain(1)).to.equal(false);
      set.remove(10);
      expect(set.contain(10)).to.equal(false);
    });
  });

  describe('empty', () => {
    it('returns true when set is empty', () => {
      const set = new DefaultVideoStreamIdSet();
      expect(set.empty()).to.equal(true);
    });

    it('returns false when not empty', () => {
      const set = new DefaultVideoStreamIdSet();
      set.add(2348934);
      expect(set.empty()).to.equal(false);
    });
  });

  describe('clone', () => {
    it('returns a distinct copy', () => {
      const set = new DefaultVideoStreamIdSet();
      set.add(1);
      set.add(11);
      const other = set.clone();
      expect(other.array()).to.deep.equal([1, 11]);
      set.add(17);
      expect(other.array()).to.deep.equal([1, 11]);
      expect(set.array()).to.deep.equal([1, 11, 17]);
    });
  });

  describe('toJSON', () => {
    it('converts current set to a sorted array', () => {
      const set = new DefaultVideoStreamIdSet();
      set.add(1);
      set.add(11);
      set.add(17);
      expect(set.toJSON()).to.deep.equal([1, 11, 17]);
    });
  });
});
